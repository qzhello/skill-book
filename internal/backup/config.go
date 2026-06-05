// Package backup 把用户级 skill 目录备份到用户自己的 GitHub 仓库并支持恢复。
//
// 安全主线：写权限凭据（token）仅持久化在 ~/.skillbook/backup.json（0600），
// 绝不写入 git remote URL / .git/config / 日志 / 备份内容；git 认证通过
// credential helper 读取进程环境变量完成（见 service.go）。
package backup

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// DefaultBranch 是未显式配置分支时使用的默认分支。
const DefaultBranch = "main"

// Config 是备份配置，持久化在 ~/.skillbook/backup.json。
type Config struct {
	RepoURL string `json:"repoURL"` // 形如 https://github.com/owner/repo(.git)
	Token   string `json:"token"`   // GitHub PAT，仅本机明文存储（0600）
	Branch  string `json:"branch"`  // 目标分支，空则用 DefaultBranch
}

// Path 返回 ~/.skillbook/backup.json 的绝对路径。
func Path() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "backup.json"), nil
}

// Load 读取备份配置；文件不存在或损坏时返回空配置，不报错。
func Load() Config {
	path, err := Path()
	if err != nil {
		return Config{}
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return Config{}
	}
	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return Config{}
	}
	return cfg
}

// Save 把备份配置写入 ~/.skillbook/backup.json，权限 0600。
func Save(cfg Config) error {
	path, err := Path()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	// 原子写：先写同目录临时文件（0600），再 rename，避免崩溃留下损坏 JSON 导致 token 丢失。
	tmp, err := os.CreateTemp(filepath.Dir(path), ".backup-*.json")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName) // rename 成功后这是 no-op
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

// Configured 报告是否已具备最小可用配置（仓库地址 + token）。
func (c Config) Configured() bool {
	return c.RepoURL != "" && c.Token != ""
}

// EffectiveBranch 返回目标分支，空则回落到 DefaultBranch。
func (c Config) EffectiveBranch() string {
	if c.Branch == "" {
		return DefaultBranch
	}
	return c.Branch
}
