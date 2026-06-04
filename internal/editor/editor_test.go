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

func TestSave_RejectsPathOutsideRepo(t *testing.T) {
	repo := t.TempDir()
	ed := New(repo)
	if err := ed.Save("/etc/passwd", "x"); err == nil {
		t.Fatal("expected rejection of path outside repo")
	}
}
