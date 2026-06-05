// Package optimizer 管理可编辑的 AI 优化评审规则文件。
// 规则内置默认（default.md），首次加载落盘到 ~/.skillbook/optimizer.md，平台可改。
package optimizer

import (
	_ "embed"
	"os"
	"path/filepath"
)

//go:embed default.md
var defaultRules string

// DefaultRules 返回内置默认规则内容。
func DefaultRules() string { return defaultRules }

// Path 返回优化规则文件的固定绝对路径：<UserHomeDir>/.skillbook/optimizer.md。
// 路径固定，不接受外部传入，避免路径穿越。
func Path() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "optimizer.md"), nil
}

// Load 读取规则文件内容。
// 文件不存在时，先把内置默认规则落盘，再返回默认内容。
func Load() (string, error) {
	path, err := Path()
	if err != nil {
		return "", err
	}
	raw, err := os.ReadFile(path)
	if err == nil {
		return string(raw), nil
	}
	if !os.IsNotExist(err) {
		return "", err
	}
	// 不存在：落盘默认内容后返回。
	if err := Save(defaultRules); err != nil {
		return "", err
	}
	return defaultRules, nil
}

// Save 把规则内容写入 ~/.skillbook/optimizer.md（0644），必要时创建目录。
func Save(content string) error {
	path, err := Path()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(content), 0o644)
}
