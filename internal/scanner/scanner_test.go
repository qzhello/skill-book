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
