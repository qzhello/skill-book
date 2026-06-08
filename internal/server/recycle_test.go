package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"skillbook/internal/model"
)

func TestTrashThenListRestore(t *testing.T) {
	srv := newSrv(t) // newSrv 已把 HOME 指向临时目录
	base := t.TempDir()
	mkSkill(t, srv, base, "sk", "x", model.PlatformClaude)
	dir := filepath.Join(base, "sk")

	// 删除 → 进回收站
	rec := do(t, srv, http.MethodPost, "/api/skills/trash", `{"dirs":["`+dir+`"]}`)
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"trashed"`) {
		t.Fatalf("trash code=%d body=%s", rec.Code, rec.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "SKILL.md")); err == nil {
		t.Fatalf("source should be moved out")
	}
	// 列表应有一项
	rec = do(t, srv, http.MethodGet, "/api/trash", "")
	if !strings.Contains(rec.Body.String(), filepath.Base(dir)) {
		t.Fatalf("trash list missing item: %s", rec.Body.String())
	}
	// 取 id
	id := firstTrashID(t, srv)
	// 恢复 → 回原位
	rec = do(t, srv, http.MethodPost, "/api/trash/restore", `{"id":"`+id+`"}`)
	if rec.Code != 200 {
		t.Fatalf("restore code=%d body=%s", rec.Code, rec.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "SKILL.md")); err != nil {
		t.Fatalf("file not restored to origPath")
	}
}

func TestRestoreConflictFails(t *testing.T) {
	srv := newSrv(t)
	base := t.TempDir()
	mkSkill(t, srv, base, "sk", "x", model.PlatformClaude)
	dir := filepath.Join(base, "sk")
	do(t, srv, http.MethodPost, "/api/skills/trash", `{"dirs":["`+dir+`"]}`)
	// 原位置又被重新占用
	os.MkdirAll(dir, 0o755)
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("new"), 0o644)
	id := firstTrashID(t, srv)
	rec := do(t, srv, http.MethodPost, "/api/trash/restore", `{"id":"`+id+`"}`)
	if rec.Code == 200 {
		t.Fatalf("restore into occupied path should fail")
	}
}

// firstTrashID 读回收站清单取第一个 id。
func firstTrashID(t *testing.T, srv *Server) string {
	t.Helper()
	items, err := loadRecycle()
	if err != nil || len(items) == 0 {
		t.Fatalf("no recycle items: %v", err)
	}
	return items[0].ID
}
