package editor

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"skillbook/internal/gitsync"
)

// Editor 把编辑写回磁盘并提交到 repoRoot 的 git 仓库。
type Editor struct{ repoRoot string }

func New(repoRoot string) *Editor { return &Editor{repoRoot: repoRoot} }

// Save 校验路径在 repoRoot 内，写入内容并自动 commit。
//
// 路径越界防护：filepath.Abs 不解析符号链接，可被 symlink 绕过。
// 因此对 repoRoot 和目标文件的父目录调用 filepath.EvalSymlinks 解析真实
// 路径（文件本身可能尚不存在，故解析父目录再拼接 basename），再做 Rel/`..` 检查。
func (e *Editor) Save(filePath, content string) error {
	absRoot, err := filepath.Abs(e.repoRoot)
	if err != nil {
		return err
	}
	absFile, err := filepath.Abs(filePath)
	if err != nil {
		return err
	}

	// 解析 repoRoot 的真实路径（消除符号链接）。
	realRoot, err := filepath.EvalSymlinks(absRoot)
	if err != nil {
		return err
	}
	// 解析目标文件父目录的真实路径，再拼接 basename。
	realParent, err := filepath.EvalSymlinks(filepath.Dir(absFile))
	if err != nil {
		return fmt.Errorf("refuse to write outside repo: %s", filePath)
	}
	realFile := filepath.Join(realParent, filepath.Base(absFile))

	rel, err := filepath.Rel(realRoot, realFile)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return fmt.Errorf("refuse to write outside repo: %s", filePath)
	}
	absFile = realFile
	if err := os.WriteFile(absFile, []byte(content), 0o644); err != nil {
		return err
	}
	msg := "edit: " + filepath.Base(filepath.Dir(absFile))
	return gitsync.CommitFile(absRoot, absFile, msg)
}
