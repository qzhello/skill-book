package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

func TestNormalizeGitURL(t *testing.T) {
	cases := map[string]string{
		"git@github.com:owner/repo.git":       "https://github.com/owner/repo",
		"git@github.com:owner/repo":           "https://github.com/owner/repo",
		"https://github.com/owner/repo.git":   "https://github.com/owner/repo",
		"https://github.com/owner/repo":       "https://github.com/owner/repo",
		"ssh://git@github.com/owner/repo.git": "https://github.com/owner/repo",
		"https://gitlab.com/owner/repo.git":   "https://gitlab.com/owner/repo",
	}
	for in, want := range cases {
		if got := normalizeGitURL(in); got != want {
			t.Errorf("normalizeGitURL(%q)=%q want %q", in, got, want)
		}
	}
}

// setupSkill 在一个临时根下创建一个 skill 目录并 scan 入库，返回 srv 与 skill id。
func setupSkill(t *testing.T) (*Server, string, string) {
	t.Helper()
	root := t.TempDir()
	dir := filepath.Join(root, "alpha")
	os.MkdirAll(dir, 0o755)
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("---\nname: alpha\ndescription: A\n---\nbody"), 0o644)
	st, _ := store.Open(":memory:")
	srv := New(st, []scanner.Root{{Path: root, Source: model.SourceUser}})
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/scan", nil))
	id := model.Skill{Source: model.SourceUser, Dir: dir}.ID()
	return srv, id, dir
}

func TestGetSourceNotFoundSkill(t *testing.T) {
	srv, _, _ := setupSkill(t)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/skills/deadbeef/source", nil))
	if rec.Code != 404 {
		t.Fatalf("want 404, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestGetSourceUnknownWhenNoGit(t *testing.T) {
	srv, id, _ := setupSkill(t)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/skills/"+id+"/source", nil))
	if rec.Code != 200 {
		t.Fatalf("code %d %s", rec.Code, rec.Body.String())
	}
	b := rec.Body.String()
	if !strings.Contains(b, `"source_kind":"unknown"`) || !strings.Contains(b, `"inferred":false`) {
		t.Fatalf("expected unknown/inferred:false, got %s", b)
	}
}

func TestPutGetClearSource(t *testing.T) {
	srv, id, _ := setupSkill(t)
	// PUT save
	rec := httptest.NewRecorder()
	body := `{"source_url":"https://github.com/o/r","source_kind":"github_repo","source_ref":"main","source_note":"n","sync_policy":"check_only"}`
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/skills/"+id+"/source", strings.NewReader(body)))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"status":"saved"`) {
		t.Fatalf("put save: %d %s", rec.Code, rec.Body.String())
	}
	// GET persisted
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/skills/"+id+"/source", nil))
	b := rec.Body.String()
	if !strings.Contains(b, `"source_url":"https://github.com/o/r"`) || !strings.Contains(b, `"inferred":false`) {
		t.Fatalf("get persisted: %s", b)
	}
	// listed in /api/sources
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/sources", nil))
	if !strings.Contains(rec.Body.String(), id) {
		t.Fatalf("expected id in linked: %s", rec.Body.String())
	}
	// PUT empty url → cleared
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/skills/"+id+"/source", strings.NewReader(`{"source_url":""}`)))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"status":"cleared"`) {
		t.Fatalf("clear: %d %s", rec.Code, rec.Body.String())
	}
	// now not linked
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/sources", nil))
	if strings.Contains(rec.Body.String(), id) {
		t.Fatalf("should be cleared from linked: %s", rec.Body.String())
	}
}

func TestPutSourceRejectsBadEnum(t *testing.T) {
	srv, id, _ := setupSkill(t)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/skills/"+id+"/source",
		strings.NewReader(`{"source_url":"https://x","sync_policy":"weird"}`)))
	if rec.Code != 400 {
		t.Fatalf("want 400 for bad sync_policy, got %d %s", rec.Code, rec.Body.String())
	}
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/skills/"+id+"/source",
		strings.NewReader(`{"source_url":"https://x","source_kind":"bogus"}`)))
	if rec.Code != 400 {
		t.Fatalf("want 400 for bad source_kind, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestInferSourceInGitRepo(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git not available")
	}
	repo := t.TempDir()
	run := func(args ...string) {
		cmd := exec.Command("git", append([]string{"-C", repo}, args...)...)
		cmd.Env = append(os.Environ(), "GIT_CONFIG_GLOBAL=/dev/null", "GIT_CONFIG_SYSTEM=/dev/null")
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
	}
	run("init")
	run("remote", "add", "origin", "git@github.com:owner/repo.git")
	skillDir := filepath.Join(repo, "skills", "foo")
	os.MkdirAll(skillDir, 0o755)

	kind, url, subpath, ok := inferSource(skillDir)
	if !ok {
		t.Fatal("expected ok=true")
	}
	if kind != "github_repo" {
		t.Errorf("kind=%q", kind)
	}
	if url != "https://github.com/owner/repo" {
		t.Errorf("url=%q", url)
	}
	if subpath != filepath.Join("skills", "foo") {
		t.Errorf("subpath=%q", subpath)
	}
}

func TestInferSourceNoGit(t *testing.T) {
	dir := t.TempDir()
	if _, _, _, ok := inferSource(dir); ok {
		t.Fatal("expected ok=false outside git repo")
	}
}

func TestPutSourceTokenHiddenOnGet(t *testing.T) {
	srv := newSrv(t)
	id := mkSkill(t, srv, t.TempDir(), "s1", "x", model.PlatformClaude)

	rec := do(t, srv, http.MethodPut, "/api/skills/"+id+"/source",
		`{"source_url":"https://github.com/o/r","source_kind":"github_repo","token":"ghp_secret_aaa"}`)
	if rec.Code != 200 {
		t.Fatalf("put source code=%d body=%s", rec.Code, rec.Body.String())
	}
	rec = do(t, srv, http.MethodGet, "/api/skills/"+id+"/source", "")
	body := rec.Body.String()
	if strings.Contains(body, "ghp_secret_aaa") {
		t.Fatalf("token leaked in GET: %s", body)
	}
	if !strings.Contains(body, `"has_token":true`) {
		t.Fatalf("expected has_token:true, got %s", body)
	}
	// 再次保存且 token 留空 → 应保留原 token
	do(t, srv, http.MethodPut, "/api/skills/"+id+"/source",
		`{"source_url":"https://github.com/o/r","source_kind":"github_repo","token":""}`)
	src, _, _ := srv.st.GetSource(id)
	if src.Token != "ghp_secret_aaa" {
		t.Fatalf("blank token should keep stored value, got %q", src.Token)
	}
}
