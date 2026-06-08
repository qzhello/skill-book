package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"skillbook/internal/backup"
	"skillbook/internal/trash"
)

// backupOpTimeout 限制一次网络操作时长。
const backupOpTimeout = 120 * time.Second

// backupService 返回注入的服务，或按 HOME 构造默认服务。
func (s *Server) backupService() (*backup.Service, error) {
	if s.backupSvc != nil {
		return s.backupSvc, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	return backup.DefaultService(home), nil
}

// handleGetBackupConfig 返回备份配置（secret 不回显，只给布尔位）。
func (s *Server) handleGetBackupConfig(w http.ResponseWriter, _ *http.Request) {
	cfg := backup.Load()
	writeJSON(w, http.StatusOK, map[string]any{
		"endpoint":  cfg.Endpoint,
		"region":    cfg.Region,
		"bucket":    cfg.Bucket,
		"prefix":    cfg.EffectivePrefix(),
		"accessKey": cfg.AccessKey,
		// 设计要求 UseSSL 默认 true（安全优先），但 Go bool 零值为 false。
		// 在边界处兜底：尚未配置时报 true，让新用户表单默认 HTTPS；
		// 一旦用户保存（Configured()==true），表达式退化为 cfg.UseSSL，原样返回其选择。
		"useSSL":    cfg.UseSSL || !cfg.Configured(),
		"keepCount": cfg.EffectiveKeepCount(),
		"hasSecret": cfg.SecretKey != "",
	})
}

// handlePutBackupConfig 保存 S3 配置。secretKey 为空表示保留已存值。
func (s *Server) handlePutBackupConfig(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Endpoint  string `json:"endpoint"`
		Region    string `json:"region"`
		Bucket    string `json:"bucket"`
		Prefix    string `json:"prefix"`
		AccessKey string `json:"accessKey"`
		SecretKey string `json:"secretKey"`
		UseSSL    bool   `json:"useSSL"`
		KeepCount int    `json:"keepCount"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	endpoint := strings.TrimSpace(body.Endpoint)
	bucket := strings.TrimSpace(body.Bucket)
	accessKey := strings.TrimSpace(body.AccessKey)
	if endpoint == "" || bucket == "" || accessKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Endpoint、Bucket、Access Key 不能为空"})
		return
	}
	cfg := backup.Load()
	cfg.Endpoint = endpoint
	cfg.Region = strings.TrimSpace(body.Region)
	cfg.Bucket = bucket
	cfg.Prefix = strings.TrimSpace(body.Prefix)
	cfg.AccessKey = accessKey
	cfg.UseSSL = body.UseSSL
	cfg.KeepCount = body.KeepCount
	if sk := strings.TrimSpace(body.SecretKey); sk != "" {
		cfg.SecretKey = sk // 仅在显式提供时更新
	}
	if err := backup.Save(cfg); err != nil {
		log.Printf("backup: save config failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存配置失败，请重试"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// handleBackupTest 测试 S3 连接（探测桶可达）。
func (s *Server) handleBackupTest(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先填写并保存 S3 配置"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	// 用 List 探测（含连通性 + 凭据 + 桶权限）。
	if _, err := svc.List(ctx, cfg); err != nil {
		log.Printf("backup: test failed: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "连接失败，请检查 Endpoint / Bucket / 凭据 / 网络"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleBackupStatus 返回配置态、最近备份时间、归档数与范围。
func (s *Server) handleBackupStatus(w http.ResponseWriter, r *http.Request) {
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	writeJSON(w, http.StatusOK, svc.Status(ctx, backup.Load()))
}

// handleBackupList 返回历史归档列表。
func (s *Server) handleBackupList(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先填写并保存 S3 配置"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	list, err := svc.List(ctx, cfg)
	if err != nil {
		log.Printf("backup: list failed: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "获取备份列表失败，请检查配置与网络"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"archives": list})
}

// handleBackupPush 执行一次备份（打包 + 上传 + 清理）。
func (s *Server) handleBackupPush(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先在设置里填写并保存 S3 配置"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), backupOpTimeout)
	defer cancel()
	res, err := svc.Push(ctx, cfg)
	if err != nil {
		log.Printf("backup: push failed: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "备份失败，请检查 S3 配置、权限与网络"})
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// handleBackupRestore 恢复指定历史归档（旧目录移废纸篓）。
func (s *Server) handleBackupRestore(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先在设置里填写并保存 S3 配置"})
		return
	}
	if !trash.Supported() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "当前平台不支持安全恢复（需要废纸篓）"})
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Name) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请指定要恢复的备份"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), backupOpTimeout)
	defer cancel()
	res, err := svc.Restore(ctx, cfg, strings.TrimSpace(body.Name), trash.ToTrash)
	if err != nil {
		log.Printf("backup: restore failed: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "恢复失败，请检查备份名、S3 配置与网络"})
		return
	}
	writeJSON(w, http.StatusOK, res)
}
