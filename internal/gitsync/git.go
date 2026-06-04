package gitsync

import (
	"os/exec"
)

// CommitFile 在 repoDir 内 `git add <file>` 并提交。
// 若 repoDir 非 git 仓库则先 init。文件无变化时 commit 会非零退出，调用方可忽略。
func CommitFile(repoDir, file, message string) error {
	if err := run(repoDir, "rev-parse", "--is-inside-work-tree"); err != nil {
		if err := run(repoDir, "init"); err != nil {
			return err
		}
	}
	if err := run(repoDir, "add", file); err != nil {
		return err
	}
	// 允许“无变更”导致的非零退出
	_ = run(repoDir, "commit", "-m", message)
	return nil
}

func run(dir string, args ...string) error {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	return cmd.Run()
}
