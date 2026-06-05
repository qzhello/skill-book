package server

import (
	"context"
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

// makeLocalRepo 在临时目录建一个含 SKILL.md 的本地 git 仓库并提交，返回仓库路径。
// 用于在不联网下测试 import 的 clone+拷贝+落库逻辑（通过 file:// 克隆）。
func makeLocalRepo(t *testing.T, subdir, body string) string {
	t.Helper()
	repo := t.TempDir()
	run := func(args ...string) {
		cmd := exec.Command("git", args...)
		cmd.Dir = repo
		cmd.Env = append(os.Environ(),
			"GIT_AUTHOR_NAME=t", "GIT_AUTHOR_EMAIL=t@t",
			"GIT_COMMITTER_NAME=t", "GIT_COMMITTER_EMAIL=t@t")
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
	}
	run("init", "-q")
	dir := repo
	if subdir != "" {
		dir = filepath.Join(repo, subdir)
		os.MkdirAll(dir, 0o755)
	}
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(body), 0o644)
	run("add", "-A")
	run("commit", "-q", "-m", "init")
	return repo
}

// localCloneFn 用本地 `git clone <repo> <dest>` 替换真实 github clone。
func localCloneFn(repoPath string) func(ctx context.Context, cloneURL, ref, destDir string) error {
	return func(ctx context.Context, cloneURL, ref, destDir string) error {
		args := []string{"clone", "--depth", "1"}
		if ref != "" {
			args = append(args, "--branch", ref)
		}
		args = append(args, repoPath, destDir)
		cmd := exec.CommandContext(ctx, "git", args...)
		return cmd.Run()
	}
}

func newImportServer(t *testing.T, repoPath string) *Server {
	t.Helper()
	st, err := store.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	srv := New(st, []scanner.Root{})
	srv.cloneFn = localCloneFn(repoPath)
	return srv
}

func TestImportRepoRoot(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	body := "---\nname: alpha\ndescription: A\n---\nhello"
	repo := makeLocalRepo(t, "", body)
	srv := newImportServer(t, repo)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/owner/repo","name":"alpha"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"name":"alpha"`) {
		t.Fatalf("body %s", rec.Body.String())
	}

	// 落盘校验。
	dest := filepath.Join(home, ".claude", "skills", "alpha", "SKILL.md")
	got, err := os.ReadFile(dest)
	if err != nil || string(got) != body {
		t.Fatalf("dest content mismatch: %v %q", err, got)
	}

	// 来源记录校验。
	id := model.Skill{Source: model.SourceUser, Dir: filepath.Join(home, ".claude", "skills", "alpha")}.ID()
	src, found, err := srv.st.GetSource(id)
	if err != nil || !found {
		t.Fatalf("source not stored: %v found=%v", err, found)
	}
	if src.SourceKind != "github_repo" || src.SourceURL != "https://github.com/owner/repo" ||
		src.SyncPolicy != "check_only" || src.SourceRev == "" {
		t.Fatalf("unexpected source %+v", *src)
	}
}

func TestImportSubpathAndNameDefault(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	body := "---\nname: nested\ndescription: B\n---\nx"
	repo := makeLocalRepo(t, "pkg/mine", body)
	srv := newImportServer(t, repo)

	rec := httptest.NewRecorder()
	// 无 name → 取 subpath 基名 "mine"。
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/o/r/tree/main/pkg/mine"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"name":"mine"`) {
		t.Fatalf("expected name mine, got %s", rec.Body.String())
	}
	dest := filepath.Join(home, ".claude", "skills", "mine", "SKILL.md")
	if got, _ := os.ReadFile(dest); string(got) != body {
		t.Fatalf("content %q", got)
	}
}

func TestImportRejectsNonGitHub(t *testing.T) {
	srv := newImportServer(t, t.TempDir())
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://gitlab.com/o/r"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 400 {
		t.Fatalf("want 400, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestImportConflict(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	// 预先创建目标目录触发 409。
	os.MkdirAll(filepath.Join(home, ".claude", "skills", "dup"), 0o755)
	repo := makeLocalRepo(t, "", "---\nname: dup\n---\nx")
	srv := newImportServer(t, repo)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/o/r","name":"dup"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 409 {
		t.Fatalf("want 409, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestImportMissingSkillMD(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	// 仓库里 SKILL.md 在别处，目标 subpath 下没有。
	repo := makeLocalRepo(t, "other", "---\nname: x\n---\nx")
	srv := newImportServer(t, repo)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/o/r/tree/main/empty","name":"empty"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 422 {
		t.Fatalf("want 422, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestImportInvalidName(t *testing.T) {
	srv := newImportServer(t, t.TempDir())
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/o/r","name":"Bad Name"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 400 {
		t.Fatalf("want 400, got %d %s", rec.Code, rec.Body.String())
	}
}

// importedServer 导入一个 skill 并返回 srv + id，供 check/apply 测试复用。
func importedServer(t *testing.T, body string) (*Server, string, string) {
	t.Helper()
	home := t.TempDir()
	t.Setenv("HOME", home)
	repo := makeLocalRepo(t, "", body)
	srv := newImportServer(t, repo)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/import",
		strings.NewReader(`{"url":"https://github.com/owner/repo","name":"alpha"}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("import failed: %d %s", rec.Code, rec.Body.String())
	}
	dir := filepath.Join(home, ".claude", "skills", "alpha")
	id := model.Skill{Source: model.SourceUser, Dir: dir}.ID()
	return srv, id, dir
}

func TestSourceCheckHasUpdate(t *testing.T) {
	local := "---\nname: alpha\ndescription: A\n---\nold"
	srv, id, _ := importedServer(t, local)

	remote := "---\nname: alpha\ndescription: A\n---\nNEW CONTENT"
	raw := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(remote))
	}))
	defer raw.Close()
	srv.rawBaseOverride = raw.URL

	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/skills/"+id+"/source/check", nil))
	if rec.Code != 200 {
		t.Fatalf("code %d %s", rec.Code, rec.Body.String())
	}
	b := rec.Body.String()
	if !strings.Contains(b, `"has_update":true`) || !strings.Contains(b, "NEW CONTENT") {
		t.Fatalf("expected has_update true with remote content, got %s", b)
	}
}

func TestSourceCheckUpToDate(t *testing.T) {
	local := "---\nname: alpha\ndescription: A\n---\nsame"
	srv, id, _ := importedServer(t, local)

	raw := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(local))
	}))
	defer raw.Close()
	srv.rawBaseOverride = raw.URL

	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/skills/"+id+"/source/check", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"has_update":false`) {
		t.Fatalf("expected has_update false, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestSourceCheckNoGitHubSource(t *testing.T) {
	// 普通 skill（无来源行）→ 400。
	srv, id, _ := setupSkill(t)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/skills/"+id+"/source/check", nil))
	if rec.Code != 400 {
		t.Fatalf("want 400, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestSourceCheckRemoteError(t *testing.T) {
	srv, id, _ := importedServer(t, "---\nname: alpha\n---\nx")
	raw := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	}))
	defer raw.Close()
	srv.rawBaseOverride = raw.URL

	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/skills/"+id+"/source/check", nil))
	if rec.Code != 502 {
		t.Fatalf("want 502, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestSourceApplyWritesAndBackups(t *testing.T) {
	// 导入到 ~/.claude/skills（非 git 工作树）→ apply 应写 .bak。
	srv, id, dir := importedServer(t, "---\nname: alpha\ndescription: A\n---\nold body")

	newContent := "---\nname: alpha\ndescription: A\n---\nbrand new body"
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/skills/"+id+"/source/apply",
		strings.NewReader(`{"content":`+jsonString(newContent)+`}`))
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "applied") {
		t.Fatalf("code %d %s", rec.Code, rec.Body.String())
	}

	got, _ := os.ReadFile(filepath.Join(dir, "SKILL.md"))
	if string(got) != newContent {
		t.Fatalf("file not updated: %q", got)
	}
	bak, err := os.ReadFile(filepath.Join(dir, "SKILL.md.bak"))
	if err != nil || !strings.Contains(string(bak), "old body") {
		t.Fatalf("backup missing or wrong: %v %q", err, bak)
	}

	// 索引应已用新内容更新。
	sk, _ := srv.st.Get(id)
	if sk == nil || !strings.Contains(sk.Body, "brand new body") {
		t.Fatalf("index not reindexed: %+v", sk)
	}
}

// jsonString 把字符串编码为 JSON 字面量（含引号）。
func jsonString(s string) string {
	r := strings.ReplaceAll(s, "\\", "\\\\")
	r = strings.ReplaceAll(r, "\"", "\\\"")
	r = strings.ReplaceAll(r, "\n", "\\n")
	return "\"" + r + "\""
}
