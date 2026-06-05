package backup

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestMirrorCopiesTree(t *testing.T) {
	src := t.TempDir()
	dst := filepath.Join(t.TempDir(), "out")
	write(t, filepath.Join(src, "a", "SKILL.md"), "hello")
	write(t, filepath.Join(src, "a", "ref", "x.md"), "x")

	if err := mirrorDir(src, dst); err != nil {
		t.Fatalf("mirror: %v", err)
	}
	if b, _ := os.ReadFile(filepath.Join(dst, "a", "SKILL.md")); string(b) != "hello" {
		t.Fatalf("SKILL.md not mirrored: %q", b)
	}
	if b, _ := os.ReadFile(filepath.Join(dst, "a", "ref", "x.md")); string(b) != "x" {
		t.Fatalf("nested file not mirrored: %q", b)
	}
}

func TestMirrorDeletesStale(t *testing.T) {
	src := t.TempDir()
	dst := filepath.Join(t.TempDir(), "out")
	write(t, filepath.Join(dst, "old", "gone.md"), "stale") // 预存陈旧文件
	write(t, filepath.Join(src, "new.md"), "fresh")

	if err := mirrorDir(src, dst); err != nil {
		t.Fatalf("mirror: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "old", "gone.md")); !os.IsNotExist(err) {
		t.Fatalf("stale file should be removed")
	}
	if _, err := os.Stat(filepath.Join(dst, "new.md")); err != nil {
		t.Fatalf("new file missing: %v", err)
	}
}

func TestMirrorSkipsGitAndSymlink(t *testing.T) {
	src := t.TempDir()
	dst := filepath.Join(t.TempDir(), "out")
	write(t, filepath.Join(src, ".git", "HEAD"), "ref: x")
	write(t, filepath.Join(src, "keep.md"), "k")
	if runtime.GOOS != "windows" {
		if err := os.Symlink("/etc/hosts", filepath.Join(src, "evil")); err != nil {
			t.Fatal(err)
		}
	}

	if err := mirrorDir(src, dst); err != nil {
		t.Fatalf("mirror: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, ".git")); !os.IsNotExist(err) {
		t.Fatalf(".git should be skipped")
	}
	if _, err := os.Lstat(filepath.Join(dst, "evil")); !os.IsNotExist(err) {
		t.Fatalf("symlink should be skipped")
	}
	if _, err := os.Stat(filepath.Join(dst, "keep.md")); err != nil {
		t.Fatalf("regular file missing: %v", err)
	}
}

func TestMirrorSrcMissingClearsDst(t *testing.T) {
	dst := filepath.Join(t.TempDir(), "out")
	write(t, filepath.Join(dst, "stale.md"), "old")
	missing := filepath.Join(t.TempDir(), "nope")

	if err := mirrorDir(missing, dst); err != nil {
		t.Fatalf("mirror missing src should not error: %v", err)
	}
	if _, err := os.Stat(dst); !os.IsNotExist(err) {
		t.Fatalf("dst should be cleared when src missing")
	}
}

// F-1 回归：copyTree 不得跟随“源根本身是符号链接”的情况（防恶意备份越权）。
func TestCopyTreeRejectsSymlinkRoot(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlink semantics differ on windows")
	}
	external := t.TempDir() // 模拟 WorkDir 之外的敏感目录
	write(t, filepath.Join(external, "secret.md"), "TOP SECRET")

	work := t.TempDir()
	linkSub := filepath.Join(work, "claude")
	if err := os.Symlink(external, linkSub); err != nil { // 备份仓库里的恶意软链接子目录
		t.Fatal(err)
	}
	dst := filepath.Join(t.TempDir(), "localskills")

	if err := copyTree(linkSub, dst); err != nil {
		t.Fatalf("copyTree: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "secret.md")); !os.IsNotExist(err) {
		t.Fatalf("符号链接根被跟随，外部文件被复制出来 —— 越权未防住")
	}
}

func TestWithinDir(t *testing.T) {
	base := "/a/b"
	if !withinDir(base, "/a/b/c") {
		t.Error("child should be within")
	}
	if withinDir(base, "/a/x") {
		t.Error("sibling should not be within")
	}
}
