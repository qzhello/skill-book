package server

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"skillbook/internal/model"
)

func TestRevealAllowsNonSkillMdInsideSkillDir(t *testing.T) {
	srv := newSrv(t)
	// 造一个 skill：目录内除 SKILL.md 外再放一个 ref.md
	base := t.TempDir()
	mkSkill(t, srv, base, "x", "---\nname: x\n---\n", model.PlatformClaude)
	dir := filepath.Join(base, "x")
	os.WriteFile(filepath.Join(dir, "ref.md"), []byte("hi"), 0o644)
	// 注入假 reveal，避免真起 Finder
	var revealed string
	revealFn = func(p string) error { revealed = p; return nil }
	defer func() { revealFn = nil }()

	rec := do(t, srv, http.MethodPost, "/api/reveal", `{"path":"`+filepath.Join(dir, "ref.md")+`"}`)
	if rec.Code != 200 {
		t.Fatalf("reveal non-SKILL.md inside dir: code=%d body=%s", rec.Code, rec.Body.String())
	}
	if revealed != filepath.Join(dir, "ref.md") {
		t.Fatalf("revealFn not called with the file, got %q", revealed)
	}
}

func TestRevealRejectsPathOutsideAnySkill(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/reveal", `{"path":"/etc/hosts"}`)
	if rec.Code != 403 {
		t.Fatalf("expected 403 for outside path, got %d", rec.Code)
	}
}
