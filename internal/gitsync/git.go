package gitsync

import (
	"os/exec"
	"path/filepath"
)

// CommitFile 在 file 所在的 git 工作树内 `git add <file>` 并提交。
//
// 安全约束：绝不自动 `git init`。若 file 所在目录不在任何 git 工作树内，
// 直接返回 nil（跳过提交），避免在用户真实文件系统（如 ~/.claude/skills）
// 意外创建 git 仓库。文件无变化时 commit 会非零退出，已忽略。
func CommitFile(repoDir, file, message string) error {
	dir := filepath.Dir(file)
	// 检测 file 所在目录是否已在某个 git 工作树内。
	if err := run(dir, "rev-parse", "--is-inside-work-tree"); err != nil {
		// 不在 git 工作树内：跳过提交，不报错、不 init。
		return nil
	}
	if err := run(dir, "add", file); err != nil {
		return err
	}
	// 允许“无变更”导致的非零退出
	_ = run(dir, "commit", "-m", message)
	return nil
}

func run(dir string, args ...string) error {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	return cmd.Run()
}
