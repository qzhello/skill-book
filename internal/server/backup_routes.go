package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"skillbook/internal/backup"
	"skillbook/internal/githubsrc"
	"skillbook/internal/trash"
)

// backupOpTimeout 限制一次 push/restore 的网络操作时长。
const backupOpTimeout = 120 * time.Second

// branchRe 限定分支名字符集（字母数字、点、下划线、连字符、斜杠），
// 该值会持久化并拼入 git refspec，必须校验以防注入非法 ref。
var branchRe = regexp.MustCompile(`^[A-Za-z0-9._/-]+$`)

// backupService 返回注入的服务，或按 HOME 构造默认服务。
func (s *Server) backupService() (*backup.Service, error) {
	if s.backupSvc != nil {
		return s.backupSvc, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	return backup.DefaultService(home, nil), nil
}

// handleGetBackupConfig 返回备份配置（token 不回显，只给布尔位）。
func (s *Server) handleGetBackupConfig(w http.ResponseWriter, _ *http.Request) {
	cfg := backup.Load()
	writeJSON(w, http.StatusOK, map[string]any{
		"repoURL":  cfg.RepoURL,
		"branch":   cfg.EffectiveBranch(),
		"hasToken": cfg.Token != "",
	})
}

// handlePutBackupConfig 保存备份配置。token 为空表示保留已存；
// repoURL 必须是 github.com 仓库地址。
func (s *Server) handlePutBackupConfig(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RepoURL string `json:"repoURL"`
		Branch  string `json:"branch"`
		Token   string `json:"token"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	repoURL := strings.TrimSpace(body.RepoURL)
	if repoURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "仓库地址不能为空"})
		return
	}
	// 仅允许 github.com 仓库（owner/repo 形态），复用导入解析器做白名单校验。
	if _, _, _, _, err := githubsrc.ParseURL(strings.TrimSuffix(repoURL, ".git")); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "仅支持 https://github.com/owner/repo 形式的仓库地址"})
		return
	}

	branch := strings.TrimSpace(body.Branch)
	if branch != "" && (!branchRe.MatchString(branch) || strings.HasPrefix(branch, "/") || strings.Contains(branch, "..")) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "分支名只能包含字母、数字、. _ - /，且不能以 / 开头或含 .."})
		return
	}

	cfg := backup.Load()
	cfg.RepoURL = repoURL
	cfg.Branch = branch
	if t := strings.TrimSpace(body.Token); t != "" {
		cfg.Token = t // 仅在显式提供时更新，避免覆盖成空
	}
	if err := backup.Save(cfg); err != nil {
		log.Printf("backup: save config failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存配置失败，请重试"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// handleBackupStatus 返回上次备份时间、仓库地址与备份范围。
func (s *Server) handleBackupStatus(w http.ResponseWriter, r *http.Request) {
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err); writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	writeJSON(w, http.StatusOK, svc.Status(r.Context(), backup.Load()))
}

// handleBackupPush 执行一次备份（镜像 + 提交 + 推送）。
func (s *Server) handleBackupPush(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先在设置里填写备份仓库地址与 token"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err); writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), backupOpTimeout)
	defer cancel()
	res, err := svc.Push(ctx, cfg)
	if err != nil {
		// 不回显底层 git 错误（可能含仓库地址），仅给通用提示。
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "备份失败，请检查仓库地址、token 权限与网络"})
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// handleBackupRestore 从远程拉取并覆盖回本地（旧目录移废纸篓）。
func (s *Server) handleBackupRestore(w http.ResponseWriter, r *http.Request) {
	cfg := backup.Load()
	if !cfg.Configured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请先在设置里填写备份仓库地址与 token"})
		return
	}
	if !trash.Supported() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "当前平台不支持安全恢复（需要废纸篓）"})
		return
	}
	svc, err := s.backupService()
	if err != nil {
		log.Printf("backup: %v", err); writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "内部错误，请重试"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), backupOpTimeout)
	defer cancel()
	res, err := svc.Restore(ctx, cfg, trash.ToTrash)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "恢复失败，请检查仓库地址、token 权限与网络"})
		return
	}
	writeJSON(w, http.StatusOK, res)
}
