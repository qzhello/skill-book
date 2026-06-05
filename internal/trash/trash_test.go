package trash

import (
	"os"
	"path/filepath"
	"testing"
)

func TestToTrash_MovesAndHandlesCollision(t *testing.T) {
	if !Supported() {
		t.Skip("仅 macOS 支持移到废纸篓")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)

	mkDir := func(parent, name string) string {
		d := filepath.Join(parent, name)
		if err := os.MkdirAll(d, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(d, "SKILL.md"), []byte("x"), 0o644); err != nil {
			t.Fatal(err)
		}
		return d
	}

	work := t.TempDir()
	src1 := mkDir(work, "mover")
	dest1, err := ToTrash(src1)
	if err != nil {
		t.Fatalf("first trash: %v", err)
	}
	if filepath.Base(dest1) != "mover" {
		t.Fatalf("want dest base 'mover', got %q", dest1)
	}
	if _, err := os.Stat(src1); !os.IsNotExist(err) {
		t.Fatalf("src should be gone after move")
	}
	if _, err := os.Stat(filepath.Join(dest1, "SKILL.md")); err != nil {
		t.Fatalf("contents not moved: %v", err)
	}

	// 同名再次移动 → 应落到 "mover 2"。
	src2 := mkDir(work, "mover")
	dest2, err := ToTrash(src2)
	if err != nil {
		t.Fatalf("second trash: %v", err)
	}
	if filepath.Base(dest2) != "mover 2" {
		t.Fatalf("want collision suffix 'mover 2', got %q", filepath.Base(dest2))
	}
}
