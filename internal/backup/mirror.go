package backup

import (
	"os"
	"path/filepath"
	"strings"
)

// mirrorDir 把 src 镜像到 dst：先清空 dst，再递归拷贝 src 下内容。
//
//   - 跳过 .git 目录与符号链接（防越权、防把仓库元数据带进来）。
//   - src 不存在视为空集：dst 被清空且不报错（删除同步语义）。
//   - 普通文件 0644、目录 0755。
func mirrorDir(src, dst string) error {
	if err := os.RemoveAll(dst); err != nil {
		return err
	}
	info, err := os.Stat(src)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // 源不存在 → 目标保持清空
		}
		return err
	}
	if !info.IsDir() {
		return nil
	}
	return copyTree(src, dst)
}

// copyTree 递归拷贝 src→dst，跳过 .git 与符号链接/特殊文件。
//
// 安全：入口用 Lstat 校验 src 自身必须是真实目录（非符号链接）。
// 否则恶意备份仓库可在子目录处放置指向外部的符号链接，恢复时被跟随、
// 把 WorkDir 之外的文件系统内容读出并写回本地。子项里的符号链接由
// 下方 e.Type().IsRegular() 过滤跳过。
func copyTree(src, dst string) error {
	if fi, err := os.Lstat(src); err != nil || fi.Mode()&os.ModeSymlink != 0 || !fi.IsDir() {
		return nil // 不存在 / 是符号链接 / 非目录 → 跳过，防越权
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	for _, e := range entries {
		if e.Name() == ".git" {
			continue
		}
		sp := filepath.Join(src, e.Name())
		dp := filepath.Join(dst, e.Name())
		if e.IsDir() {
			if err := copyTree(sp, dp); err != nil {
				return err
			}
			continue
		}
		if !e.Type().IsRegular() {
			continue // 跳过符号链接等特殊文件
		}
		data, err := os.ReadFile(sp)
		if err != nil {
			return err
		}
		if err := os.WriteFile(dp, data, 0o644); err != nil {
			return err
		}
	}
	return nil
}

// withinDir 报告 target 是否落在 base 目录内（防路径逃逸）。
// 先 Clean 规范化两端，避免 `.`/冗余分隔符导致的非预期相对路径。
func withinDir(base, target string) bool {
	rel, err := filepath.Rel(filepath.Clean(base), filepath.Clean(target))
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}
