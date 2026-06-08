package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"skillbook/internal/githubsrc"
	"skillbook/internal/model"
)

// syncConfigPath 返回全局同步配置文件路径 ~/.skillbook/sync.json。
func syncConfigPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".skillbook", "sync.json")
}

type syncConfig struct {
	IntervalMin int `json:"interval_min"` // 自动检测周期（分钟）；0 = 关闭
}

func loadSyncConfig() syncConfig {
	var c syncConfig
	if data, err := os.ReadFile(syncConfigPath()); err == nil {
		_ = json.Unmarshal(data, &c)
	}
	if c.IntervalMin < 0 {
		c.IntervalMin = 0
	}
	return c
}

func saveSyncConfig(c syncConfig) error {
	p := syncConfigPath()
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	data, _ := json.MarshalIndent(c, "", "  ")
	return os.WriteFile(p, data, 0o600)
}

// handleGetSyncConfig 返回全局自动检测周期。
func (s *Server) handleGetSyncConfig(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, loadSyncConfig())
}

// handlePutSyncConfig 保存全局自动检测周期（分钟，0=关闭）。
func (s *Server) handlePutSyncConfig(w http.ResponseWriter, r *http.Request) {
	var body syncConfig
	if !readJSONBody(w, r, &body) {
		return
	}
	if body.IntervalMin < 0 {
		body.IntervalMin = 0
	}
	if err := saveSyncConfig(body); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, body)
}

// checkOneSource 抓取上游并与本地对比，更新该来源的 has_update 标记。
func (s *Server) checkOneSource(ctx context.Context, skillID string) {
	src, found, err := s.st.GetSource(skillID)
	if err != nil || !found || src.SourceKind != "github_repo" || src.SourceURL == "" {
		return
	}
	sk, err := s.st.Get(skillID)
	if err != nil || sk == nil {
		return
	}
	owner, repo, _, _, perr := githubsrc.ParseURL(src.SourceURL)
	if perr != nil {
		return
	}
	token := src.Token
	rawURL := s.upstreamSkillURL(owner, repo, src.SourceRef, src.SourceSubpath, token)
	remote, ferr := fetchRaw(ctx, rawURL, token)
	if ferr != nil {
		// 抓取失败：保持原标记不误报，但记日志便于排查（如私有仓库 404）。
		log.Printf("autocheck: skill %s 抓取上游失败: %s", skillID, fetchFailMessage(rawURL, ferr, token != ""))
		return
	}
	hasUpdate := model.HashBody(remote) != model.HashBody(sk.Body)
	_ = s.st.SetSourceUpdateFlag(skillID, hasUpdate, time.Now().Unix())
}

// runAutoCheckOnce 对所有开启自动检测的 github 来源各检查一次。
func (s *Server) runAutoCheckOnce(ctx context.Context) {
	srcs, err := s.st.AutoCheckSources()
	if err != nil || len(srcs) == 0 {
		return
	}
	for _, src := range srcs {
		s.checkOneSource(ctx, src.SkillID)
	}
}

// StartAutoCheck 启动后台周期检测：按 sync.json 的周期定时跑；周期为 0 时空转等待。
func (s *Server) StartAutoCheck() {
	go func() {
		// 启动后稍等，避免和首次扫描争抢。
		time.Sleep(20 * time.Second)
		for {
			cfg := loadSyncConfig()
			if cfg.IntervalMin <= 0 {
				time.Sleep(time.Minute) // 关闭：每分钟回看一次配置是否被开启
				continue
			}
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			s.runAutoCheckOnce(ctx)
			cancel()
			log.Printf("auto-check: 已检查来源更新（周期 %d 分钟）", cfg.IntervalMin)
			time.Sleep(time.Duration(cfg.IntervalMin) * time.Minute)
		}
	}()
}
