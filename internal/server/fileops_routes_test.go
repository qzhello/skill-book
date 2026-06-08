package server

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"skillbook/internal/model"
	"skillbook/internal/trash"
)

func setupFileopsSkill(t *testing.T, srv *Server) (id, dir string) {
	base := t.TempDir()
	id = mkSkill(t, srv, base, "sk", "x", model.PlatformClaude)
	dir = filepath.Join(base, "sk")
	return
}

func TestNewFileAndDir(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupFileopsSkill(t, srv)
	rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"notes.md"}`)
	if rec.Code != 200 {
		t.Fatalf("new file code=%d body=%s", rec.Code, rec.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "notes.md")); err != nil {
		t.Fatalf("file not created: %v", err)
	}
	rec = do(t, srv, http.MethodPost, "/api/dir/new", `{"dir":"`+dir+`","name":"refs"}`)
	if rec.Code != 200 {
		t.Fatalf("new dir code=%d", rec.Code)
	}
	if fi, err := os.Stat(filepath.Join(dir, "refs")); err != nil || !fi.IsDir() {
		t.Fatalf("dir not created")
	}
}

func TestNewFileRejectsBadName(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupFileopsSkill(t, srv)
	for _, n := range []string{"", "../evil", "a/b", ".hidden"} {
		rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"`+n+`"}`)
		if rec.Code == 200 {
			t.Fatalf("name %q should be rejected", n)
		}
	}
}

func TestNewFileRejectsOutsideDir(t *testing.T) {
	srv := newSrv(t)
	setupFileopsSkill(t, srv)
	rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"/tmp","name":"x.md"}`)
	if rec.Code != 403 {
		t.Fatalf("expected 403 for dir outside any skill, got %d", rec.Code)
	}
}

func TestNewFileConflict(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupFileopsSkill(t, srv)
	do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"dup.md"}`)
	rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"dup.md"}`)
	if rec.Code != 409 {
		t.Fatalf("expected 409 on existing, got %d", rec.Code)
	}
}

func TestRenameFile(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupFileopsSkill(t, srv)
	os.WriteFile(filepath.Join(dir, "old.md"), []byte("y"), 0o644)
	rec := do(t, srv, http.MethodPost, "/api/file/rename",
		`{"path":"`+filepath.Join(dir, "old.md")+`","newName":"new.md"}`)
	if rec.Code != 200 {
		t.Fatalf("rename code=%d body=%s", rec.Code, rec.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "new.md")); err != nil {
		t.Fatalf("renamed file missing")
	}
}

func TestDeleteFileGoesToTrash(t *testing.T) {
	if !skillbookTrashSupported() {
		t.Skip("trash not supported on this OS")
	}
	srv := newSrv(t)
	_, dir := setupFileopsSkill(t, srv)
	os.WriteFile(filepath.Join(dir, "junk.md"), []byte("z"), 0o644)
	rec := do(t, srv, http.MethodPost, "/api/file/delete",
		`{"path":"`+filepath.Join(dir, "junk.md")+`"}`)
	if rec.Code != 200 {
		t.Fatalf("delete code=%d body=%s", rec.Code, rec.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "junk.md")); err == nil {
		t.Fatalf("file should be gone from skill dir")
	}
}

func skillbookTrashSupported() bool { return trash.Supported() }
