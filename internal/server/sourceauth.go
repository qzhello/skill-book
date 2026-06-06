package server

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// 来源访问令牌：用于读取私有 github 仓库的 SKILL.md（Contents API + token）。
//
// 安全主线：令牌仅以 0600 权限明文存储于 ~/.skillbook/source.json，绝不回显、
// 不写入日志、不入备份内容；仅在向 api.github.com 发请求时放进 Authorization 头。
type sourceAuthConfig struct {
	Token string `json:"token"`
}

// sourceAuthPath 返回 ~/.skillbook/source.json 的绝对路径。
func sourceAuthPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "source.json"), nil
}

// loadSourceToken 读取已配置的来源访问令牌；不存在/损坏时返回空串。
func loadSourceToken() string {
	path, err := sourceAuthPath()
	if err != nil {
		return ""
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	var cfg sourceAuthConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return ""
	}
	return strings.TrimSpace(cfg.Token)
}

// saveSourceToken 原子写入令牌（0600）。token 为空表示清除（删除文件）。
func saveSourceToken(token string) error {
	path, err := sourceAuthPath()
	if err != nil {
		return err
	}
	token = strings.TrimSpace(token)
	if token == "" {
		if rerr := os.Remove(path); rerr != nil && !os.IsNotExist(rerr) {
			return rerr
		}
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(sourceAuthConfig{Token: token}, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".source-*.json")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return err
	}
	if _, err := tmp.Write(raw); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}

// handleGetSourceAuth 返回是否已配置来源令牌（不回显令牌本身）。
func (s *Server) handleGetSourceAuth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"hasToken": loadSourceToken() != ""})
}

// handlePutSourceAuth 保存/清除来源令牌。
//   - token 非空：保存。
//   - clear=true：清除。
//   - token 为空且未 clear：保持原值不变（避免保存其他设置时误清空）。
func (s *Server) handlePutSourceAuth(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
		Clear bool   `json:"clear"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	if body.Clear {
		if err := saveSourceToken(""); err != nil {
			log.Printf("sourceauth: clear failed: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "清除令牌失败，请重试"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "cleared"})
		return
	}
	if strings.TrimSpace(body.Token) == "" {
		writeJSON(w, http.StatusOK, map[string]string{"status": "unchanged"})
		return
	}
	if err := saveSourceToken(body.Token); err != nil {
		log.Printf("sourceauth: save failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存令牌失败，请重试"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}
