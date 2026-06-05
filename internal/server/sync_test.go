package server

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"skillbook/internal/model"
)

// mkSkill 在 base 下建一个 skill 目录与 SKILL.md，并入库，返回其 ID。
func mkSkill(t *testing.T, srv *Server, base, name, body string, plat model.Platform) string {
	t.Helper()
	dir := filepath.Join(base, name)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	fp := filepath.Join(dir, "SKILL.md")
	if err := os.WriteFile(fp, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	sk := model.Skill{Source: model.SourceUser, Platform: plat, Dir: dir, FilePath: fp,
		Name: name, Body: body, BodyHash: model.HashBody(body)}
	if err := srv.st.Upsert(sk); err != nil {
		t.Fatal(err)
	}
	return sk.ID()
}

func TestSyncOverwritesTargetAndBacksUp(t *testing.T) {
	srv := newSrv(t)
	base := t.TempDir()
	fromID := mkSkill(t, srv, filepath.Join(base, "claude"), "foo", "AUTHORITATIVE", model.PlatformClaude)
	toID := mkSkill(t, srv, filepath.Join(base, "codex"), "foo", "OLD CONTENT", model.PlatformCodex)

	rec := do(t, srv, http.MethodPost, "/api/skills/sync",
		`{"fromId":"`+fromID+`","toIds":["`+toID+`"]}`)
	if rec.Code != 200 {
		t.Fatalf("sync code=%d body=%s", rec.Code, rec.Body.String())
	}
	var res struct {
		Synced int      `json:"synced"`
		Failed []string `json:"failed"`
	}
	json.Unmarshal(rec.Body.Bytes(), &res)
	if res.Synced != 1 || len(res.Failed) != 0 {
		t.Fatalf("unexpected result: %+v", res)
	}

	to, _ := srv.st.Get(toID)
	if to == nil {
		t.Fatal("target gone")
	}
	got, _ := os.ReadFile(to.FilePath)
	if string(got) != "AUTHORITATIVE" {
		t.Fatalf("target not synced: %q", got)
	}
	bak, err := os.ReadFile(to.FilePath + ".bak")
	if err != nil || string(bak) != "OLD CONTENT" {
		t.Fatalf("expected .bak with old content, got %q err %v", bak, err)
	}
	// 源不被改动
	from, _ := srv.st.Get(fromID)
	fromBody, _ := os.ReadFile(from.FilePath)
	if string(fromBody) != "AUTHORITATIVE" {
		t.Fatalf("source must not change: %q", fromBody)
	}
}

func TestSyncRejectsMissingSource(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/skills/sync", `{"fromId":"nope","toIds":["x"]}`)
	if rec.Code != 404 {
		t.Fatalf("expected 404 for missing source, got %d", rec.Code)
	}
}

func TestSyncRejectsNoTargets(t *testing.T) {
	srv := newSrv(t)
	id := mkSkill(t, srv, t.TempDir(), "foo", "x", model.PlatformClaude)
	rec := do(t, srv, http.MethodPost, "/api/skills/sync", `{"fromId":"`+id+`","toIds":[]}`)
	if rec.Code != 400 {
		t.Fatalf("expected 400 for no targets, got %d", rec.Code)
	}
}
