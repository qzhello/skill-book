package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

func TestScanThenList(t *testing.T) {
	root := t.TempDir()
	dir := filepath.Join(root, "alpha")
	os.MkdirAll(dir, 0o755)
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("---\nname: alpha\ndescription: A\n---\nbody"), 0o644)

	st, _ := store.Open(":memory:")
	srv := New(st, []scanner.Root{{Path: root, Source: model.SourceUser}})

	// scan
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/scan", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "\"count\":1") {
		t.Fatalf("scan resp: %d %s", rec.Code, rec.Body.String())
	}
	// list
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/skills", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "alpha") {
		t.Fatalf("list resp: %d %s", rec.Code, rec.Body.String())
	}
}
