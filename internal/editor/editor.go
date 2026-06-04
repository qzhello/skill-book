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
func (e *Editor) Save(filePath, content string) error {
	absRoot, err := filepath.Abs(e.repoRoot)
	if err != nil {
		return err
	}
	absFile, err := filepath.Abs(filePath)
	if err != nil {
		return err
	}
	rel, err := filepath.Rel(absRoot, absFile)
	if err != nil || strings.HasPrefix(rel, "..") {
		return fmt.Errorf("refuse to write outside repo: %s", filePath)
	}
	if err := os.WriteFile(absFile, []byte(content), 0o644); err != nil {
		return err
	}
	msg := "edit: " + filepath.Base(filepath.Dir(absFile))
	return gitsync.CommitFile(absRoot, absFile, msg)
}
