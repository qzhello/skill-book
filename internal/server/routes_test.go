package server

import (
	"encoding/json"
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

// newSrv 构造一个空库 server，并把 HOME 指向临时目录隔离文件副作用。
func newSrv(t *testing.T) *Server {
	t.Helper()
	t.Setenv("HOME", t.TempDir())
	t.Setenv("ANTHROPIC_API_KEY", "")
	t.Setenv("OPENAI_API_KEY", "")
	st, err := store.Open(":memory:")
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { st.Close() })
	return New(st, []scanner.Root{})
}

func do(t *testing.T, srv *Server, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, r)
	return rec
}

func TestGetConfigHidesKey(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodGet, "/api/config", "")
	if rec.Code != 200 {
		t.Fatalf("code = %d body %s", rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "apiKey") || strings.Contains(rec.Body.String(), "secret") {
		t.Fatalf("response leaked key material: %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "\"hasKey\":false") {
		t.Fatalf("expected hasKey:false, got %s", rec.Body.String())
	}
}

func TestPutConfigThenGetHasKey(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPut, "/api/config",
		`{"provider":"openai","baseURL":"https://x/v1","apiKey":"sk-1","model":"m"}`)
	if rec.Code != 200 {
		t.Fatalf("put code = %d %s", rec.Code, rec.Body.String())
	}
	rec = do(t, srv, http.MethodGet, "/api/config", "")
	if !strings.Contains(rec.Body.String(), "\"hasKey\":true") {
		t.Fatalf("expected hasKey:true, got %s", rec.Body.String())
	}

	// 二次 PUT 空 apiKey 应保留原 key。
	rec = do(t, srv, http.MethodPut, "/api/config",
		`{"provider":"openai","baseURL":"https://y/v1","apiKey":"","model":"m2"}`)
	if rec.Code != 200 {
		t.Fatalf("put2 code = %d", rec.Code)
	}
	rec = do(t, srv, http.MethodGet, "/api/config", "")
	if !strings.Contains(rec.Body.String(), "\"hasKey\":true") {
		t.Fatalf("key should be preserved on empty apiKey, got %s", rec.Body.String())
	}
}

func TestAIRoutes501WhenUnconfigured(t *testing.T) {
	srv := newSrv(t)
	for _, tc := range []struct{ method, path, body string }{
		{http.MethodPost, "/api/ai/test", ""},
		{http.MethodPost, "/api/ai/optimize", `{"content":"x"}`},
		{http.MethodPost, "/api/ai/create", `{"name":"a","brief":"b","recipe":"blank"}`},
	} {
		rec := do(t, srv, tc.method, tc.path, tc.body)
		if rec.Code != http.StatusNotImplemented {
			t.Fatalf("%s expected 501, got %d %s", tc.path, rec.Code, rec.Body.String())
		}
		if !strings.Contains(rec.Body.String(), "AI 未配置") {
			t.Fatalf("%s expected 'AI 未配置', got %s", tc.path, rec.Body.String())
		}
	}
}

func TestRecipesIncludesBlank(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodGet, "/api/recipes", "")
	if rec.Code != 200 {
		t.Fatalf("code = %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "blank") {
		t.Fatalf("expected blank recipe, got %s", rec.Body.String())
	}
}

func TestNewSkillCreatesAndIndexes(t *testing.T) {
	srv := newSrv(t)
	content := "---\nname: my-skill\ndescription: D\n---\nbody"
	payload, _ := json.Marshal(map[string]string{"name": "my-skill", "content": content})
	rec := do(t, srv, http.MethodPost, "/api/skills/new", string(payload))
	if rec.Code != 200 {
		t.Fatalf("code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct{ ID string }
	json.Unmarshal(rec.Body.Bytes(), &out)
	if out.ID == "" {
		t.Fatalf("expected id, got %s", rec.Body.String())
	}

	// 文件确实写到了 HOME/.claude/skills/my-skill/SKILL.md。
	home, _ := os.UserHomeDir()
	fp := filepath.Join(home, ".claude", "skills", "my-skill", "SKILL.md")
	if _, err := os.Stat(fp); err != nil {
		t.Fatalf("file not written: %v", err)
	}

	// 已存在 → 409。
	rec = do(t, srv, http.MethodPost, "/api/skills/new", string(payload))
	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", rec.Code)
	}
}

func TestNewSkillRejectsBadName(t *testing.T) {
	srv := newSrv(t)
	for _, name := range []string{"Bad Name", "-leading", "UPPER", "has/slash", ""} {
		payload, _ := json.Marshal(map[string]string{"name": name, "content": "x"})
		rec := do(t, srv, http.MethodPost, "/api/skills/new", string(payload))
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("name %q expected 400, got %d", name, rec.Code)
		}
	}
}

func TestRevealRejectsUnknownPath(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/reveal", `{"path":"/etc/passwd"}`)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for unknown path, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestRevealKnownPathPassesWhitelist(t *testing.T) {
	srv := newSrv(t)
	// 入库一条 skill，其 file_path 即白名单。
	sk := model.Skill{
		Source: model.SourceUser, Dir: "/tmp/known", FilePath: "/tmp/known/SKILL.md",
		Name: "known", Body: "x", BodyHash: model.HashBody("x"),
	}
	if err := srv.st.Upsert(sk); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	rec := do(t, srv, http.MethodPost, "/api/reveal", `{"path":"/tmp/known/SKILL.md"}`)
	// 白名单通过后：macOS 会尝试 open（可能失败但非 403）；非 macOS 返回 501。
	if rec.Code == http.StatusForbidden {
		t.Fatalf("known path should pass whitelist, got 403: %s", rec.Body.String())
	}
}
