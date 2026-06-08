package scanner

import (
	"os"
	"path/filepath"
	"testing"

	"skillbook/internal/model"
)

func writeSkill(t *testing.T, root, name, fm string) {
	t.Helper()
	dir := filepath.Join(root, name)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(fm), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestScanRoots_FindsSkillsWithSource(t *testing.T) {
	root := t.TempDir()
	writeSkill(t, root, "alpha", "---\nname: alpha\ndescription: A\n---\nbody")
	writeSkill(t, root, "beta", "---\nname: beta\ndescription: B\n---\nbody")

	got, err := ScanRoots([]Root{{Path: root, Source: model.SourceUser}})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 {
		t.Fatalf("want 2, got %d", len(got))
	}
	for _, s := range got {
		if s.Source != model.SourceUser {
			t.Fatalf("bad source %q", s.Source)
		}
		if s.Name == "" || s.FilePath == "" {
			t.Fatalf("missing fields: %+v", s)
		}
	}
}

func TestScanRoots_NameFallsBackToDir(t *testing.T) {
	root := t.TempDir()
	writeSkill(t, root, "no-name", "---\ndescription: only desc\n---\nbody")
	got, err := ScanRoots([]Root{{Path: root, Source: model.SourcePlugin}})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Name != "no-name" {
		t.Fatalf("want fallback name 'no-name', got %+v", got)
	}
}

func TestDiscoverPlatformIDs_ScansDotToolSkills(t *testing.T) {
	home := t.TempDir()
	// 形如 .<工具>/skills 的目录应被发现
	for _, tool := range []string{".claude", ".codex", ".agents"} {
		if err := os.MkdirAll(filepath.Join(home, tool, "skills"), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	// 噪声：点目录但无 skills 子目录 → 忽略
	if err := os.MkdirAll(filepath.Join(home, ".config", "foo"), 0o755); err != nil {
		t.Fatal(err)
	}
	// 噪声：非点目录即便有 skills → 忽略
	if err := os.MkdirAll(filepath.Join(home, "projects", "skills"), 0o755); err != nil {
		t.Fatal(err)
	}

	got := DiscoverPlatformIDs(home)
	want := []string{"agents", "claude", "codex"} // 字母序、去点
	if len(got) != len(want) {
		t.Fatalf("want %v, got %v", want, got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("want %v, got %v", want, got)
		}
	}
}

func TestDefaultRoots_DiscoversUserAndProject(t *testing.T) {
	home := t.TempDir()
	cwd := t.TempDir()
	if err := os.MkdirAll(filepath.Join(home, ".cursor", "skills"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(cwd, ".claude", "skills"), 0o755); err != nil {
		t.Fatal(err)
	}
	roots := DefaultRoots(home, cwd)
	var sawUserCursor, sawProjectClaude bool
	for _, r := range roots {
		if r.Source == model.SourceUser && r.Platform == "cursor" {
			sawUserCursor = true
		}
		if r.Source == model.SourceProject && r.Platform == "claude" {
			sawProjectClaude = true
		}
	}
	if !sawUserCursor || !sawProjectClaude {
		t.Fatalf("want user .cursor + project .claude discovered, got %+v", roots)
	}
}

func TestDiscoverPlatformIDsExcludesTrashAndSkillbook(t *testing.T) {
	base := t.TempDir()
	for _, d := range []string{".claude", ".Trash", ".skillbook"} {
		if err := os.MkdirAll(filepath.Join(base, d, "skills"), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	ids := DiscoverPlatformIDs(base)
	for _, id := range ids {
		if id == "Trash" || id == "skillbook" {
			t.Fatalf("should not discover %q as a platform; got %v", id, ids)
		}
	}
	found := false
	for _, id := range ids {
		if id == "claude" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected claude in %v", ids)
	}
}
