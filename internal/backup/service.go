package backup

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"skillbook/internal/scanner"
)

// Service 负责把若干源目录打包成归档并上传 / 列出 / 恢复。
type Service struct {
	Srcs     []SrcDir                           // 备份范围
	NewStore func(Config) (ArchiveStore, error) // 对象存储工厂；nil 时用 newS3Store
}

// PushResult 概述一次备份结果。
type PushResult struct {
	Archive   string `json:"archive"`
	FileCount int    `json:"fileCount"`
	Removed   int    `json:"removed"`
}

// RestoreResult 概述一次恢复结果。
type RestoreResult struct {
	Restored int    `json:"restored"`
	Message  string `json:"message"`
}

// Status 概述备份状态。
type Status struct {
	Configured bool     `json:"configured"`
	LastBackup int64    `json:"lastBackup"`
	Count      int      `json:"count"`
	Scope      []string `json:"scope"`
}

// DefaultService 构造默认服务：备份范围为用户级各平台目录（~/.<工具>/skills）。
func DefaultService(home string) *Service {
	srcs := []SrcDir{}
	for _, id := range scanner.DiscoverPlatformIDs(home) {
		srcs = append(srcs, SrcDir{Sub: id, Path: filepath.Join(home, "."+id, "skills")})
	}
	if len(srcs) == 0 {
		srcs = []SrcDir{{Sub: "claude", Path: filepath.Join(home, ".claude", "skills")}}
	}
	return &Service{Srcs: srcs}
}

// ScopePaths 返回备份范围内的源目录路径（供前端展示）。
func (s *Service) ScopePaths() []string {
	out := make([]string, 0, len(s.Srcs))
	for _, d := range s.Srcs {
		out = append(out, d.Path)
	}
	return out
}

// store 返回对象存储实现。
func (s *Service) store(cfg Config) (ArchiveStore, error) {
	if s.NewStore != nil {
		return s.NewStore(cfg)
	}
	return newS3Store(cfg)
}

// Push 打包源目录、上传归档，并按保留数清理最旧的历史归档。
func (s *Service) Push(ctx context.Context, cfg Config) (PushResult, error) {
	st, err := s.store(cfg)
	if err != nil {
		return PushResult{}, err
	}
	now := time.Now().UTC()
	data, man, err := packArchive(s.Srcs, now)
	if err != nil {
		return PushResult{}, err
	}
	key := archiveKey(cfg, now)
	meta := map[string]string{
		"filecount": fmt.Sprintf("%d", man.TotalFiles),
		"created":   man.CreatedAt,
	}
	if err := st.Put(ctx, key, data, meta); err != nil {
		return PushResult{}, err
	}
	removed := 0
	if list, err := st.List(ctx); err == nil {
		keep := cfg.EffectiveKeepCount()
		for i := keep; i < len(list); i++ { // list 已按时间倒序，尾部是最旧
			if derr := st.Delete(ctx, list[i].Key); derr == nil {
				removed++
			}
		}
	}
	return PushResult{Archive: archiveBaseName(key, cfg), FileCount: man.TotalFiles, Removed: removed}, nil
}

// List 返回历史归档（按时间倒序）。
func (s *Service) List(ctx context.Context, cfg Config) ([]ArchiveInfo, error) {
	st, err := s.store(cfg)
	if err != nil {
		return nil, err
	}
	return st.List(ctx)
}

// Restore 下载指定归档并解包恢复到各平台目标（旧目录先移废纸篓）。
func (s *Service) Restore(ctx context.Context, cfg Config, name string, trashFn func(string) (string, error)) (RestoreResult, error) {
	if !validArchiveName(name) {
		return RestoreResult{}, fmt.Errorf("非法归档名: %q", name)
	}
	st, err := s.store(cfg)
	if err != nil {
		return RestoreResult{}, err
	}
	data, err := st.Get(ctx, cfg.EffectivePrefix()+name)
	if err != nil {
		return RestoreResult{}, err
	}
	dsts := map[string]string{}
	for _, d := range s.Srcs {
		dsts[d.Sub] = d.Path
	}
	n, err := unpackArchive(data, dsts, trashFn)
	if err != nil {
		return RestoreResult{}, err
	}
	return RestoreResult{Restored: n, Message: fmt.Sprintf("已恢复 %d 个目录", n)}, nil
}

// Status 汇总配置态、最近备份时间与归档数量。
func (s *Service) Status(ctx context.Context, cfg Config) Status {
	st := Status{Configured: cfg.Configured(), Scope: s.ScopePaths()}
	if !st.Configured {
		return st
	}
	store, err := s.store(cfg)
	if err != nil {
		return st
	}
	if list, err := store.List(ctx); err == nil {
		st.Count = len(list)
		if len(list) > 0 {
			st.LastBackup = list[0].Time
		}
	}
	return st
}

// archiveBaseName 把完整 key 去掉前缀，返回展示用文件名。
func archiveBaseName(key string, cfg Config) string {
	p := cfg.EffectivePrefix()
	if len(key) > len(p) && key[:len(p)] == p {
		return key[len(p):]
	}
	return key
}
