// Package backup 把用户级 skill 目录打包成 tar.gz 归档，备份到用户自己的 S3
// （兼容 AWS S3 / Cloudflare R2 / MinIO / 阿里云 OSS）并支持列出与恢复历史版本。
//
// 安全主线：S3 SecretKey 仅持久化在 ~/.skillbook/backup.json（0600），
// 绝不回显给前端、不写入日志、不进入备份内容。
package backup

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

const (
	// DefaultPrefix 是未配置 key 前缀时使用的默认值。
	DefaultPrefix = "skillbook/"
	// DefaultKeepCount 是未配置保留数时保留的历史归档个数。
	DefaultKeepCount = 20
)

// Config 是 S3 备份配置，持久化在 ~/.skillbook/backup.json。
type Config struct {
	Endpoint  string `json:"endpoint"`  // 如 s3.amazonaws.com / R2 / MinIO / OSS 地址（不含协议）
	Region    string `json:"region"`    // 如 us-east-1；部分兼容服务可留空
	Bucket    string `json:"bucket"`
	Prefix    string `json:"prefix"`    // key 前缀，默认 skillbook/
	AccessKey string `json:"accessKey"`
	SecretKey string `json:"secretKey"` // 仅本机明文存储（0600），GET 永不回显
	UseSSL    bool   `json:"useSSL"`    // 是否用 HTTPS
	KeepCount int    `json:"keepCount"` // 历史归档保留数，默认 20
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
// 旧版 git 字段（repoURL/token/branch）会被忽略，新字段取零值（表现为未配置）。
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

// Save 把备份配置原子写入 ~/.skillbook/backup.json，权限 0600。
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
	tmp, err := os.CreateTemp(filepath.Dir(path), ".backup-*.json")
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

// Configured 报告是否已具备最小可用配置。
func (c Config) Configured() bool {
	return c.Endpoint != "" && c.Bucket != "" && c.AccessKey != "" && c.SecretKey != ""
}

// EffectivePrefix 返回 key 前缀，空则用默认值，并保证以 / 结尾。
func (c Config) EffectivePrefix() string {
	p := strings.TrimSpace(c.Prefix)
	if p == "" {
		p = DefaultPrefix
	}
	if !strings.HasSuffix(p, "/") {
		p += "/"
	}
	return p
}

// EffectiveKeepCount 返回历史归档保留数，<=0 时回落默认值。
func (c Config) EffectiveKeepCount() int {
	if c.KeepCount <= 0 {
		return DefaultKeepCount
	}
	return c.KeepCount
}
