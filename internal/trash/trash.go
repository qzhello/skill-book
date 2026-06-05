// Package trash 把目录移动到系统废纸篓（仅 macOS ~/.Trash），可恢复。
package trash

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// Supported 报告当前平台是否支持移到废纸篓。
func Supported() bool { return runtime.GOOS == "darwin" }

// ToTrash 把 src 目录移动到 ~/.Trash 下。
// 若同名已存在，依次尝试 "<base> 2"、"<base> 3"…，仍冲突则追加时间戳。
// 返回最终落地的绝对路径。
func ToTrash(src string) (string, error) {
	if !Supported() {
		return "", fmt.Errorf("仅 macOS 支持移到废纸篓")
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	trashDir := filepath.Join(home, ".Trash")
	if err := os.MkdirAll(trashDir, 0o700); err != nil {
		return "", err
	}

	base := filepath.Base(src)
	dest := filepath.Join(trashDir, base)
	if _, err := os.Lstat(dest); err == nil {
		dest = uniqueDest(trashDir, base)
	}

	if err := os.Rename(src, dest); err != nil {
		return "", err
	}
	return dest, nil
}

// uniqueDest 为 base 找一个在 trashDir 内不存在的目标名。
func uniqueDest(trashDir, base string) string {
	for n := 2; n < 1000; n++ {
		cand := filepath.Join(trashDir, fmt.Sprintf("%s %d", base, n))
		if _, err := os.Lstat(cand); os.IsNotExist(err) {
			return cand
		}
	}
	// 极端兜底：追加时间戳。
	return filepath.Join(trashDir, fmt.Sprintf("%s %d", base, time.Now().UnixNano()))
}
