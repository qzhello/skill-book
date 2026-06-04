package editor

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestSave_WritesFileAndCommits(t *testing.T) {
	repo := t.TempDir()
	// 配置最小 git 身份，避免 commit 失败
	for _, a := range [][]string{{"init"}, {"config", "user.email", "t@t"}, {"config", "user.name", "t"}} {
		c := exec.Command("git", a...)
		c.Dir = repo
		if err := c.Run(); err != nil {
			t.Fatal(err)
		}
	}
	skillDir := filepath.Join(repo, "skills", "foo")
	if err := os.MkdirAll(skillDir, 0o755); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(skillDir, "SKILL.md")
	if err := os.WriteFile(file, []byte("old"), 0o644); err != nil {
		t.Fatal(err)
	}

	ed := New(repo)
	if err := ed.Save(file, "new content"); err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(file)
	if string(got) != "new content" {
		t.Fatalf("file not written: %q", got)
	}
	// 应有一次提交
	c := exec.Command("git", "log", "--oneline")
	c.Dir = repo
	out, err := c.Output()
	if err != nil || len(out) == 0 {
		t.Fatalf("expected a commit, err=%v out=%q", err, out)
	}
}

func TestSave_NoGitRepo_SkipsCommitGracefully(t *testing.T) {
	// 非 git 目录：Save 应成功写文件，且不报错、不产生 .git 目录。
	repo := t.TempDir()
	skillDir := filepath.Join(repo, "skills", "foo")
	if err := os.MkdirAll(skillDir, 0o755); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(skillDir, "SKILL.md")

	ed := New(repo)
	if err := ed.Save(file, "new content"); err != nil {
		t.Fatalf("expected success in non-git dir, got %v", err)
	}
	got, _ := os.ReadFile(file)
	if string(got) != "new content" {
		t.Fatalf("file not written: %q", got)
	}
	if _, err := os.Stat(filepath.Join(repo, ".git")); !os.IsNotExist(err) {
		t.Fatalf("expected no .git dir to be created, stat err=%v", err)
	}
}

func TestSave_RejectsPathOutsideRepo(t *testing.T) {
	repo := t.TempDir()
	ed := New(repo)
	if err := ed.Save("/etc/passwd", "x"); err == nil {
		t.Fatal("expected rejection of path outside repo")
	}
}

func TestSave_RejectsSymlinkEscape(t *testing.T) {
	// repo 内建一个指向 repo 外目录的符号链接，尝试经由该链接写入 repo 外路径，应被拒绝。
	repo := t.TempDir()
	outside := t.TempDir()

	link := filepath.Join(repo, "escape")
	if err := os.Symlink(outside, link); err != nil {
		t.Skipf("symlink unsupported in this environment: %v", err)
	}

	// 经由符号链接构造的路径：repo/escape/evil.md -> outside/evil.md
	target := filepath.Join(link, "evil.md")

	ed := New(repo)
	if err := ed.Save(target, "pwned"); err == nil {
		t.Fatal("expected rejection of symlink escape")
	}
	// 外部文件不应被创建。
	if _, err := os.Stat(filepath.Join(outside, "evil.md")); !os.IsNotExist(err) {
		t.Fatalf("outside file should not exist, stat err=%v", err)
	}
}
