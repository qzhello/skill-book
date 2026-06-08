# 编辑体验与回收站改进 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 SkillBook 落地四项改进——修复"在 Finder 打开"对非 SKILL.md 文件失败、来源令牌改为 per-skill、新增文件级操作、应用内回收站。

**Architecture:** 后端 Go + 内嵌 vanilla JS 前端；SQLite（`skill_sources` 表加列）；删除走系统废纸篓或自管回收站目录；所有文件操作复用 `skillForPath` 目录内越界防护。

**Tech Stack:** Go（module `skillbook`），`net/http`，`modernc.org/sqlite`，前端 vanilla HTML/CSS/JS。

**Spec:** `docs/specs/2026-06-08-editing-and-trash.md`

**实现顺序：** Task 1（reveal）→ 2-3（令牌）→ 4-5（文件操作）→ 6-7（回收站）。各任务独立提交。工作分支：`feat/editing-trash`。

---

## Task 1: 修复 reveal 对非 SKILL.md 文件失败（模块 B）

**Files:**
- Modify: `internal/server/file_routes.go`（`handleReveal`、删除 `isKnownSkillPath`）
- Test: `internal/server/file_routes_test.go`（新建或追加）

`handleReveal` 当前用 `isKnownSkillPath`（只认 `path == skill.FilePath`）。改为 `skillForPath`（目录内任意文件放行）。`open` 命令抽成包级变量便于测试。

- [ ] **Step 1: 写失败测试**

创建/追加 `internal/server/file_routes_test.go`：

```go
package server

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func TestRevealAllowsNonSkillMdInsideSkillDir(t *testing.T) {
	srv := newSrv(t)
	// 造一个 skill：目录内除 SKILL.md 外再放一个 ref.md
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("---\nname: x\n---\n"), 0o644)
	os.WriteFile(filepath.Join(dir, "ref.md"), []byte("hi"), 0o644)
	if err := srv.st.Upsert(mkSkill(dir)); err != nil {
		t.Fatal(err)
	}
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
```

> `mkSkill(dir)` 辅助：若测试包内已有构造 `model.Skill` 的 helper 就用现成的；否则在本测试文件加：
> ```go
> func mkSkill(dir string) model.Skill {
> 	return model.Skill{Source: "user", Platform: "claude", Dir: dir,
> 		FilePath: filepath.Join(dir, "SKILL.md"), Name: filepath.Base(dir), Body: "x"}
> }
> ```
> 并 `import "skillbook/internal/model"`。先 grep 测试包是否已有同名 helper，避免重复声明。

- [ ] **Step 2: 运行确认失败**

Run: `go test ./internal/server/ -run TestReveal 2>&1 | head`
Expected: 编译失败（`revealFn` 未定义）或断言失败。

- [ ] **Step 3: 改 handleReveal**

在 `internal/server/file_routes.go` 顶部（import 后）加包级变量，并改写 `handleReveal` 的校验与执行：

```go
// revealFn 执行"在 Finder 中定位"。默认用 macOS `open -R`；测试可注入。
var revealFn func(path string) error

func defaultReveal(path string) error {
	return exec.Command("open", "-R", path).Run()
}
```

把 `handleReveal` 改为：

```go
func (s *Server) handleReveal(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Path string `json:"path"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	abs := filepath.Clean(body.Path)
	if s.skillForPath(abs) == nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "path 不在库中"})
		return
	}
	if runtime.GOOS != "darwin" {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持在 Finder 打开"})
		return
	}
	fn := revealFn
	if fn == nil {
		fn = defaultReveal
	}
	if err := fn(abs); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "revealed"})
}
```

确保 `file_routes.go` 已 import `path/filepath`（若无则加）。删除 `isKnownSkillPath` 函数（先 `grep -rn isKnownSkillPath internal/` 确认无其他调用者；若有则保留）。

- [ ] **Step 4: 运行确认通过**

Run: `go test ./internal/server/ -run TestReveal -v 2>&1 | tail`
Expected: 两个测试 PASS。

- [ ] **Step 5: 全量编译测试 + 提交**

```bash
go build ./... && go test ./... 2>&1 | tail -5
git add internal/server/file_routes.go internal/server/file_routes_test.go
git commit -m "fix(server): 在 Finder 打开支持 skill 目录内任意文件"
```

---

## Task 2: 来源令牌 per-skill — 后端（模块 A）

**Files:**
- Modify: `internal/store/store.go`（schema + 迁移加 `token` 列）
- Modify: `internal/store/sources.go`（`Source.Token`、`sourceCols`、`scanSource`、`PutSource`）
- Modify: `internal/server/source_routes.go`（`handlePutSource` 收 token、`sourceResponse` 加 `has_token`）
- Modify: `internal/server/import_routes.go`（`handleSourceCheck` 用 `src.Token`）
- Modify: `internal/server/autocheck.go`（`checkOneSource` 用 `src.Token`）
- Delete: `internal/server/sourceauth.go`；移除其路由
- Modify: `internal/server/server.go`（删 `GET/PUT /api/source-auth` 注册）
- Test: `internal/store/sources_test.go`、`internal/server/source_routes_test.go`

- [ ] **Step 1: 写失败测试（store 层）**

追加到 `internal/store/sources_test.go`（若不存在则创建，`package store`）：

```go
func TestSourceTokenRoundTrip(t *testing.T) {
	st, err := Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	in := Source{SkillID: "s1", SourceKind: "github_repo", SourceURL: "https://github.com/o/r",
		Token: "ghp_secret", SyncPolicy: "none", Targets: "claude"}
	if err := st.PutSource(in); err != nil {
		t.Fatal(err)
	}
	got, found, err := st.GetSource("s1")
	if err != nil || !found {
		t.Fatalf("GetSource found=%v err=%v", found, err)
	}
	if got.Token != "ghp_secret" {
		t.Fatalf("token round-trip: got %q", got.Token)
	}
}
```

- [ ] **Step 2: 运行确认失败**

Run: `go test ./internal/store/ -run TestSourceToken 2>&1 | head`
Expected: 编译失败（`Source.Token` 未定义）。

- [ ] **Step 3: store 加 token 列**

在 `internal/store/store.go` 的 `skill_sources` 建表 SQL 里，`updated_at` 行后补一列（保持幂等：`CREATE TABLE IF NOT EXISTS` 对已有库不生效，故同时加迁移）：

把建表块内 `  updated_at     INTEGER NOT NULL DEFAULT 0` 改为：
```sql
  updated_at     INTEGER NOT NULL DEFAULT 0,
  token          TEXT NOT NULL DEFAULT ''
```

并在迁移区（`Open` 里那串 `ALTER TABLE`）末尾加一行：
```go
	_, _ = db.Exec(`ALTER TABLE skill_sources ADD COLUMN token TEXT NOT NULL DEFAULT ''`)
```

- [ ] **Step 4: sources.go 带上 token**

在 `internal/store/sources.go`：

`Source` 结构体加字段（放在 `UpdatedAt` 后）：
```go
	UpdatedAt     int64  `json:"updated_at"`
	Token         string `json:"-"` // 私有仓库访问令牌；绝不序列化回前端
```

`sourceCols` 末尾加 `,token`：
```go
const sourceCols = `skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,auto_check,targets,has_update,checked_at,updated_at,token`
```

`scanSource` 的 `Scan(...)` 末尾加 `&src.Token`：
```go
	if err := sc.Scan(&src.SkillID, &src.SourceKind, &src.SourceURL, &src.SourceRef,
		&src.SourceSubpath, &src.SourceRev, &src.SourceNote, &src.SyncPolicy,
		&auto, &src.Targets, &hasUpd, &src.CheckedAt, &src.UpdatedAt, &src.Token); err != nil {
		return nil, err
	}
```

`PutSource` 的 INSERT 列、VALUES 占位、ON CONFLICT 更新、参数都加 token：
```go
	_, err := s.db.Exec(`
INSERT INTO skill_sources(skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,auto_check,targets,has_update,checked_at,updated_at,token)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(skill_id) DO UPDATE SET
  source_kind=excluded.source_kind, source_url=excluded.source_url, source_ref=excluded.source_ref,
  source_subpath=excluded.source_subpath, source_rev=excluded.source_rev, source_note=excluded.source_note,
  sync_policy=excluded.sync_policy, auto_check=excluded.auto_check, targets=excluded.targets,
  has_update=excluded.has_update, checked_at=excluded.checked_at, updated_at=excluded.updated_at, token=excluded.token`,
		src.SkillID, src.SourceKind, src.SourceURL, src.SourceRef, src.SourceSubpath,
		src.SourceRev, src.SourceNote, src.SyncPolicy, auto, src.Targets, hasUpd, src.CheckedAt, src.UpdatedAt, src.Token)
	return err
```

- [ ] **Step 5: store 测试通过**

Run: `go test ./internal/store/ -run TestSourceToken -v 2>&1 | tail`
Expected: PASS。

- [ ] **Step 6: 写失败测试（server 层）**

追加到 `internal/server/source_routes_test.go`（若不存在则创建，`package server`）：

```go
func TestPutSourceTokenHiddenOnGet(t *testing.T) {
	srv := newSrv(t)
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("x"), 0o644)
	sk := mkSkill(dir)
	srv.st.Upsert(sk)
	id := sk.ID()

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
```

> 复用 Task 1 的 `mkSkill` helper（同测试包）。确保该文件 import `os`、`path/filepath`、`strings`、`net/http`、`testing`。

- [ ] **Step 7: 运行确认失败**

Run: `go test ./internal/server/ -run TestPutSourceToken 2>&1 | head`
Expected: FAIL（当前不处理 token / 不回 has_token）。

- [ ] **Step 8: 改 handlePutSource + sourceResponse**

在 `internal/server/source_routes.go`：

`handlePutSource` 的请求体结构加 `Token`：
```go
	var body struct {
		SourceURL     string   `json:"source_url"`
		SourceKind    string   `json:"source_kind"`
		SourceRef     string   `json:"source_ref"`
		SourceSubpath string   `json:"source_subpath"`
		SourceNote    string   `json:"source_note"`
		SyncPolicy    string   `json:"sync_policy"`
		AutoCheck     bool     `json:"auto_check"`
		Targets       []string `json:"targets"`
		Token         string   `json:"token"`
	}
```

构造 `src` 之前，按"空保留"读旧 token：
```go
	token := strings.TrimSpace(body.Token)
	if token == "" {
		if old, found, _ := s.st.GetSource(id); found {
			token = old.Token // 留空表示沿用原令牌
		}
	}
```

`src := store.Source{...}` 里加 `Token: token,`。

`sourceResponse` 加 `has_token`（不回显明文）：
```go
func sourceResponse(src store.Source, inferred bool) map[string]any {
	return map[string]any{
		"source_kind": src.SourceKind, "source_url": src.SourceURL, "source_ref": src.SourceRef,
		"source_subpath": src.SourceSubpath, "source_rev": src.SourceRev, "source_note": src.SourceNote,
		"sync_policy": src.SyncPolicy, "auto_check": src.AutoCheck, "targets": src.Targets,
		"has_update": src.HasUpdate, "checked_at": src.CheckedAt, "inferred": inferred,
		"has_token": src.Token != "",
	}
}
```

- [ ] **Step 9: 抓取改用 per-skill token + 移除全局**

- `internal/server/import_routes.go` 第 ~218 行 `handleSourceCheck` 内：把 `token := loadSourceToken()` 改为 `token := src.Token`。
- `internal/server/autocheck.go` 第 ~81 行 `checkOneSource` 内：把 `token := loadSourceToken()` 改为 `token := src.Token`。
- 删除文件 `internal/server/sourceauth.go`。
- `internal/server/server.go`：删除两行路由注册
  ```go
  mux.HandleFunc("GET /api/source-auth", s.handleGetSourceAuth)
  mux.HandleFunc("PUT /api/source-auth", s.handlePutSourceAuth)
  ```

- [ ] **Step 10: 全量编译测试**

Run: `go build ./... && go test ./... 2>&1 | tail -8`
Expected: 编译通过；store/server 测试 PASS。若有测试引用了已删的 `/api/source-auth` 或 `loadSourceToken`，按提示删除/改写（应仅 `sourceauth` 相关测试，若有同删）。

- [ ] **Step 11: 提交**

```bash
git add internal/store/store.go internal/store/sources.go internal/store/sources_test.go \
        internal/server/source_routes.go internal/server/source_routes_test.go \
        internal/server/import_routes.go internal/server/autocheck.go internal/server/server.go
git rm internal/server/sourceauth.go 2>/dev/null; git add -A
git commit -m "feat(source): 来源令牌改为 per-skill（存 skill_sources，移除全局）"
```

---

## Task 3: 来源令牌 per-skill — 前端（模块 A）

**Files:**
- Modify: `internal/server/web/index.html`（来源弹窗 `#sourceModal` 加 token 输入；设置弹窗删全局令牌）
- Modify: `internal/server/web/app.js`（来源保存带 token、显示 has_token；移除全局令牌逻辑与 API）

- [ ] **Step 1: 来源弹窗加 token 输入**

先看 `#sourceModal` 现有结构：`grep -n 'sourceModal' internal/server/web/index.html` 并阅读该块。在来源链接输入下方、保存按钮上方插入一个令牌输入（紧跟子路径字段之后）：

```html
<label class="field"><span data-i18n="私有仓库访问令牌">私有仓库访问令牌</span> <i id="srcTokenHint2"></i>
  <input id="srcToken" type="password" placeholder="私有仓库填；留空不修改" data-i18n-ph="私有仓库填；留空不修改" /></label>
```

（id 用 `srcToken`；注意不要与设置里旧的 `cfgSrcToken` 冲突——后者将被删除。）

- [ ] **Step 2: 删设置弹窗的全局令牌字段**

在 `index.html` 删除设置弹窗里这两段（`grep -n 'cfgSrcToken\|来源访问令牌（私有仓库）' internal/server/web/index.html` 定位）：
- `<label class="field">…来源访问令牌（私有仓库）… <input id="cfgSrcToken" …></label>`
- 紧随其后那条只讲 token 的 `modal-note`（若该 note 同时讲 key，则只删 token 相关措辞，保留 key 说明）。

- [ ] **Step 3: app.js 接线**

`grep -n 'loadSource\|saveSource\|cfgSrcToken\|getSourceAuth\|putSourceAuth\|srcTokenIn\|sourceModal' internal/server/web/app.js` 找到来源弹窗的载入/保存函数与全局令牌逻辑。做四处改动：

1. **载入来源**（`loadSource`/打开来源弹窗处）：用响应的 `has_token` 设置提示，并清空输入：
```javascript
document.querySelector("#srcToken").value = "";
const hint = document.querySelector("#srcTokenHint2");
if (hint) hint.textContent = src.has_token ? t("（已配置，可留空）") : t("（未配置）");
```
2. **保存来源**：把 token 加入 PUT body：
```javascript
token: document.querySelector("#srcToken").value,
```
（加到现有 `putSource` 的 body 对象里。）
3. **删除全局令牌逻辑**：移除 `el.cfgSrcToken`/`srcTokenHint` 绑定、`API.getSourceAuth`/`API.putSourceAuth`、设置载入/保存里对 source-auth 的调用（grep 到的所有 `SourceAuth`/`cfgSrcToken`/`srcTokenIn` 引用）。
4. **i18n**：确保 `"私有仓库访问令牌"`、`"（已配置，可留空）"`、`"（未配置）"` 在 `I18N.en` 有英文（多为现成键）；删除仅旧全局流程用的键（如 `"来源访问令牌（私有仓库）"` 若不再被引用）。

- [ ] **Step 4: 校验 + 构建 + 冒烟**

```bash
node --check internal/server/web/app.js
grep -n 'cfgSrcToken\|getSourceAuth\|putSourceAuth' internal/server/web/app.js   # 期望无残留
./restart.sh
```
打开某 skill → 来源弹窗，确认有"私有仓库访问令牌"输入且控制台无 `el.cfgSrcToken is null` 之类报错。

- [ ] **Step 5: 提交**

```bash
git add internal/server/web/index.html internal/server/web/app.js
git commit -m "feat(web): 来源弹窗内 per-skill 令牌，移除全局令牌入口"
```

---

## Task 4: 文件级操作 — 后端（模块 C）

**Files:**
- Create: `internal/server/fileops_routes.go`（new file / new dir / rename / delete）
- Modify: `internal/server/server.go`（注册 4 条路由）
- Test: `internal/server/fileops_routes_test.go`

所有操作复用 `s.skillForPath`（目录内防护）；名称校验拒绝空 / `/` / `\` / `..` / 以 `.` 开头。删除走系统废纸篓 `trash.ToTrash`。

- [ ] **Step 1: 写失败测试**

创建 `internal/server/fileops_routes_test.go`：

```go
package server

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func setupSkill(t *testing.T, srv *Server) (id, dir string) {
	dir = t.TempDir()
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("x"), 0o644)
	sk := mkSkill(dir)
	srv.st.Upsert(sk)
	return sk.ID(), dir
}

func TestNewFileAndDir(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupSkill(t, srv)
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
	_, dir := setupSkill(t, srv)
	for _, n := range []string{"", "../evil", "a/b", ".hidden"} {
		rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"`+n+`"}`)
		if rec.Code == 200 {
			t.Fatalf("name %q should be rejected", n)
		}
	}
}

func TestNewFileRejectsOutsideDir(t *testing.T) {
	srv := newSrv(t)
	setupSkill(t, srv)
	rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"/tmp","name":"x.md"}`)
	if rec.Code != 403 {
		t.Fatalf("expected 403 for dir outside any skill, got %d", rec.Code)
	}
}

func TestNewFileConflict(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupSkill(t, srv)
	do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"dup.md"}`)
	rec := do(t, srv, http.MethodPost, "/api/file/new", `{"dir":"`+dir+`","name":"dup.md"}`)
	if rec.Code != 409 {
		t.Fatalf("expected 409 on existing, got %d", rec.Code)
	}
}

func TestRenameFile(t *testing.T) {
	srv := newSrv(t)
	_, dir := setupSkill(t, srv)
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
	_, dir := setupSkill(t, srv)
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
```

> 末尾加 helper（避免直接依赖 trash 包名）：
> ```go
> func skillbookTrashSupported() bool { return trash.Supported() }
> ```
> 并 `import "skillbook/internal/trash"`。

- [ ] **Step 2: 运行确认失败**

Run: `go test ./internal/server/ -run 'TestNewFile|TestNewDir|TestRename|TestDeleteFile' 2>&1 | head`
Expected: 404（路由未注册）或编译失败。

- [ ] **Step 3: 实现 fileops_routes.go**

创建 `internal/server/fileops_routes.go`：

```go
package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"skillbook/internal/trash"
)

// validBaseName 校验单段文件/目录名：非空、不含分隔符与 ..、不以 . 开头。
func validBaseName(name string) bool {
	name = strings.TrimSpace(name)
	if name == "" || strings.HasPrefix(name, ".") {
		return false
	}
	if strings.ContainsAny(name, `/\`) || strings.Contains(name, "..") {
		return false
	}
	return true
}

// dirInSkill 校验 dir 在某 skill 目录内（含 skill 根本身）。
func (s *Server) dirInSkill(dir string) bool {
	return s.skillForPath(filepath.Clean(dir)) != nil
}

// handleNewFile 在 skill 目录内新建空文件。POST /api/file/new {dir,name}
func (s *Server) handleNewFile(w http.ResponseWriter, r *http.Request) {
	s.createEntry(w, r, false)
}

// handleNewDir 在 skill 目录内新建文件夹。POST /api/dir/new {dir,name}
func (s *Server) handleNewDir(w http.ResponseWriter, r *http.Request) {
	s.createEntry(w, r, true)
}

func (s *Server) createEntry(w http.ResponseWriter, r *http.Request, isDir bool) {
	var body struct {
		Dir  string `json:"dir"`
		Name string `json:"name"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	dir := filepath.Clean(body.Dir)
	if s.skillForPath(dir) == nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "目录不在库中"})
		return
	}
	if !validBaseName(body.Name) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "名称非法（不能为空/含 / \\ ..、或以 . 开头）"})
		return
	}
	target := filepath.Join(dir, strings.TrimSpace(body.Name))
	if !withinSkillDir(s, dir, target) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "越界路径"})
		return
	}
	if _, err := os.Lstat(target); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "同名已存在"})
		return
	}
	var err error
	if isDir {
		err = os.MkdirAll(target, 0o755)
	} else {
		var f *os.File
		f, err = os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o644)
		if err == nil {
			f.Close()
		}
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "created"})
}

// handleRenameEntry 同目录内重命名。POST /api/file/rename {path,newName}
func (s *Server) handleRenameEntry(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Path    string `json:"path"`
		NewName string `json:"newName"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	abs := filepath.Clean(body.Path)
	sk := s.skillForPath(abs)
	if sk == nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "path 不在库中"})
		return
	}
	if !validBaseName(body.NewName) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "名称非法"})
		return
	}
	dst := filepath.Join(filepath.Dir(abs), strings.TrimSpace(body.NewName))
	if !withinSkillDir(s, sk.Dir, dst) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "越界路径"})
		return
	}
	if _, err := os.Lstat(dst); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "同名已存在"})
		return
	}
	if err := os.Rename(abs, dst); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "renamed"})
}

// handleDeleteEntry 删除 skill 目录内的文件/文件夹，走系统废纸篓。
// POST /api/file/delete {path}
func (s *Server) handleDeleteEntry(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Path string `json:"path"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	abs := filepath.Clean(body.Path)
	sk := s.skillForPath(abs)
	if sk == nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "path 不在库中"})
		return
	}
	if abs == filepath.Clean(sk.Dir) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "不能在此删除整个 skill 目录"})
		return
	}
	if !trash.Supported() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持移到废纸篓"})
		return
	}
	if _, err := trash.ToTrash(abs); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "trashed"})
}

// withinSkillDir 报告 target 是否落在 skillDir 内（防越界）。
func withinSkillDir(s *Server, skillDir, target string) bool {
	rel, err := filepath.Rel(filepath.Clean(skillDir), filepath.Clean(target))
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}
```

- [ ] **Step 4: 注册路由**

在 `internal/server/server.go` 的文件操作区（`handleGetFile`/`handlePutFile` 附近）加：
```go
	mux.HandleFunc("POST /api/file/new", s.handleNewFile)
	mux.HandleFunc("POST /api/dir/new", s.handleNewDir)
	mux.HandleFunc("POST /api/file/rename", s.handleRenameEntry)
	mux.HandleFunc("POST /api/file/delete", s.handleDeleteEntry)
```

- [ ] **Step 5: 运行测试 + 全量**

Run: `go test ./internal/server/ -run 'TestNewFile|TestNewDir|TestRename|TestDeleteFile' -v 2>&1 | tail -20 && go build ./... && go test ./... 2>&1 | tail -5`
Expected: 文件操作测试 PASS；全量通过。

- [ ] **Step 6: 提交**

```bash
git add internal/server/fileops_routes.go internal/server/fileops_routes_test.go internal/server/server.go
git commit -m "feat(server): skill 目录内文件级操作（新建/新建夹/重命名/删除）"
```

---

## Task 5: 文件级操作 — 前端（模块 C）

**Files:**
- Modify: `internal/server/web/index.html`（文件树头部操作按钮）
- Modify: `internal/server/web/app.js`（API + 操作函数 + 树内按钮）
- Modify: `internal/server/web/style.css`（行内操作图标样式）

- [ ] **Step 1: API 封装**

在 `app.js` 的 `API` 对象里（`readFile`/`putFile` 附近）加：
```javascript
  newFile: (dir, name) => fetch("/api/file/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir, name }) }),
  newDir: (dir, name) => fetch("/api/dir/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir, name }) }),
  renameEntry: (path, newName) => fetch("/api/file/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, newName }) }),
  deleteEntry: (path) => fetch("/api/file/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }),
```

- [ ] **Step 2: 操作函数**

在 `app.js` 文件树相关区（`loadFiles`/`renderTree` 附近）加，使用现有 `state.current.dir` 作为 skill 根、`loadFiles(id)` 刷新树：
```javascript
async function fileOpNew(isDir) {
  if (!state.current) return;
  const name = prompt(isDir ? t("新建文件夹名称") : t("新建文件名称"));
  if (!name) return;
  const r = await (isDir ? API.newDir(state.current.dir, name) : API.newFile(state.current.dir, name));
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已创建")); await loadFiles(state.current.id); }
  else { toast(d.error || t("创建失败"), "err"); }
}
async function fileOpRename(abs) {
  const cur = abs.split("/").pop();
  const name = prompt(t("重命名为"), cur);
  if (!name || name === cur) return;
  const r = await API.renameEntry(abs, name);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已重命名")); await loadFiles(state.current.id); }
  else { toast(d.error || t("重命名失败"), "err"); }
}
async function fileOpDelete(abs) {
  if (!confirm(t("将「{n}」移到废纸篓（可在访达恢复）。确定？", { n: abs.split("/").pop() }))) return;
  const r = await API.deleteEntry(abs);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已移到废纸篓")); await loadFiles(state.current.id); }
  else { toast(d.error || t("删除失败"), "err"); }
}
```

- [ ] **Step 3: 树头按钮 + 行内操作**

在 `fileTreeHeadHtml()`（树头）加两个按钮：
```javascript
// 在返回的 HTML 里追加（保留现有折叠按钮）：
//  <button class="ft-act" id="ftNewFile" title="${t('新建文件')}">＋文件</button>
//  <button class="ft-act" id="ftNewDir" title="${t('新建文件夹')}">＋文件夹</button>
```
在文件树点击委托（`el.fileTree.addEventListener("click", …)`）里加分支：
```javascript
  if (e.target.closest("#ftNewFile")) { fileOpNew(false); return; }
  if (e.target.closest("#ftNewDir")) { fileOpNew(true); return; }
  const renameBtn = e.target.closest(".ft-rename");
  if (renameBtn) { fileOpRename(renameBtn.dataset.abs); return; }
  const delBtn = e.target.closest(".ft-del");
  if (delBtn) { fileOpDelete(delBtn.dataset.abs); return; }
```
在渲染每个文件/目录行（`renderNode`）的行尾加两个小按钮（SKILL.md 行可不显示删除/重命名，避免误删主文件）：
```javascript
// 行内（非 SKILL.md）追加：
//  <span class="ft-ops"><button class="ft-rename" data-abs="${esc(node.abs)}" title="${t('重命名')}">✎</button><button class="ft-del" data-abs="${esc(node.abs)}" title="${t('删除')}">🗑</button></span>
```

> 实现时阅读 `renderNode`/`fileTreeHeadHtml` 现有结构，按其拼接方式插入；行内按钮用 `.ft-ops` 容器，hover 显示。

- [ ] **Step 4: 样式**

在 `style.css` 末尾加：
```css
.ft-ops{opacity:0;display:inline-flex;gap:4px;margin-left:auto;padding-left:8px}
.ft-row:hover .ft-ops{opacity:1}
.ft-ops button,.ft-act{background:none;border:none;cursor:pointer;color:var(--muted);font-size:12px;padding:2px 4px;border-radius:4px}
.ft-ops button:hover,.ft-act:hover{background:var(--accent-weak);color:var(--accent)}
.ft-act{margin-left:6px}
```
（`.ft-row` 需要是 flex 行才能让 `margin-left:auto` 生效；若现有 `.ft-row` 非 flex，加 `.ft-row{display:flex;align-items:center}`，但先确认不破坏缩进——必要时只给含 `.ft-ops` 的行加。）

- [ ] **Step 5: i18n + 校验 + 冒烟**

在 `I18N.en` 加：`"新建文件"`, `"新建文件夹"`, `"新建文件名称"`, `"新建文件夹名称"`, `"重命名"`, `"重命名为"`, `"删除"`, `"已创建"`, `"创建失败"`, `"已重命名"`, `"重命名失败"`, `"删除失败"` 的英文。
```bash
node --check internal/server/web/app.js && ./restart.sh
```
打开某 skill，验证：树头有"＋文件/＋文件夹"，hover 文件行显示 ✎/🗑，新建/重命名/删除可用，控制台无报错。

- [ ] **Step 6: 提交**

```bash
git add internal/server/web/index.html internal/server/web/app.js internal/server/web/style.css
git commit -m "feat(web): 文件树内新建/重命名/删除文件与文件夹"
```

---

## Task 6: 应用内回收站 — 后端（模块 D）

**Files:**
- Create: `internal/server/recycle.go`（回收站清单 + 移入/列出/恢复/清空）
- Modify: `internal/server/structure_routes.go`（`handleTrash` 改为移入回收站）
- Modify: `internal/server/server.go`（注册 `GET /api/trash`、`POST /api/trash/restore`、`POST /api/trash/empty`）
- Modify: `internal/scanner/scanner.go`（`DiscoverPlatformIDs` 排除 `.Trash`/`.skillbook`）
- Test: `internal/server/recycle_test.go`、`internal/scanner/scanner_test.go`（追加）

- [ ] **Step 1: 写失败测试（scanner 排除）**

追加到 `internal/scanner/scanner_test.go`：
```go
func TestDiscoverPlatformIDsExcludesTrashAndSkillbook(t *testing.T) {
	base := t.TempDir()
	for _, d := range []string{".claude", ".Trash", ".skillbook"} {
		if err := os.MkdirAll(filepath.Join(base, d, "skills"), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	ids := DiscoverPlatformIDs(base)
	for _, id := range ids {
		if id == "Trash" || id == "skillbook" {
			t.Fatalf("should not discover %q as a platform; got %v", id, ids)
		}
	}
	found := false
	for _, id := range ids {
		if id == "claude" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected claude in %v", ids)
	}
}
```
（确保该测试文件 import `os`、`path/filepath`。）

- [ ] **Step 2: 运行确认失败**

Run: `go test ./internal/scanner/ -run TestDiscoverPlatformIDsExcludes 2>&1 | head`
Expected: FAIL（当前会发现 "Trash"/"skillbook"）。

- [ ] **Step 3: 改 DiscoverPlatformIDs**

在 `internal/scanner/scanner.go` 的 `DiscoverPlatformIDs` 循环里，`name` 取出后、判断前缀之后加排除：
```go
	for _, e := range entries {
		name := e.Name()
		if len(name) < 2 || !strings.HasPrefix(name, ".") {
			continue
		}
		if name == ".Trash" || name == ".skillbook" {
			continue // 系统废纸篓与自管目录不作为平台
		}
		...
```

- [ ] **Step 4: scanner 测试通过**

Run: `go test ./internal/scanner/ -run TestDiscoverPlatformIDsExcludes -v 2>&1 | tail`
Expected: PASS。

- [ ] **Step 5: 写失败测试（回收站）**

创建 `internal/server/recycle_test.go`：
```go
package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestTrashThenListRestore(t *testing.T) {
	srv := newSrv(t) // newSrv 已把 HOME 指向临时目录
	// 造 skill 目录在某扫描根下（用临时目录即可，handleTrash 按 known dir 校验）
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("x"), 0o644)
	sk := mkSkill(dir)
	srv.st.Upsert(sk)

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
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte("x"), 0o644)
	sk := mkSkill(dir)
	srv.st.Upsert(sk)
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
```

- [ ] **Step 6: 运行确认失败**

Run: `go test ./internal/server/ -run 'TestTrashThenList|TestRestoreConflict' 2>&1 | head`
Expected: 编译失败（`loadRecycle`/路由未定义）。

- [ ] **Step 7: 实现 recycle.go**

创建 `internal/server/recycle.go`：
```go
package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"skillbook/internal/trash"
)

// recycleItem 是回收站清单里的一条记录。
type recycleItem struct {
	ID        string `json:"id"`        // 删除时间戳（纳秒）字符串
	Name      string `json:"name"`      // 原目录名
	OrigPath  string `json:"origPath"`  // 删除前的绝对路径
	Platform  string `json:"platform"`
	DeletedAt int64  `json:"deletedAt"`
}

func recycleDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "trash"), nil
}

func recycleManifestPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "trash.json"), nil
}

// loadRecycle 读取清单；不存在返回空。
func loadRecycle() ([]recycleItem, error) {
	p, err := recycleManifestPath()
	if err != nil {
		return nil, err
	}
	raw, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return []recycleItem{}, nil
		}
		return nil, err
	}
	var items []recycleItem
	if err := json.Unmarshal(raw, &items); err != nil {
		return []recycleItem{}, nil
	}
	return items, nil
}

// saveRecycle 原子写清单（0600）。
func saveRecycle(items []recycleItem) error {
	p, err := recycleManifestPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	raw, _ := json.MarshalIndent(items, "", "  ")
	tmp, err := os.CreateTemp(filepath.Dir(p), ".trash-*.json")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return err
	}
	if _, err := tmp.Write(raw); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, p)
}

// moveToRecycle 把 skill 目录移入回收站并登记。返回是否成功。
func moveToRecycle(srcDir, platform string, now time.Time) error {
	rd, err := recycleDir()
	if err != nil {
		return err
	}
	id := fmt.Sprintf("%d", now.UnixNano())
	slot := filepath.Join(rd, id)
	if err := os.MkdirAll(slot, 0o700); err != nil {
		return err
	}
	base := filepath.Base(srcDir)
	if err := os.Rename(srcDir, filepath.Join(slot, base)); err != nil {
		return err
	}
	items, _ := loadRecycle()
	items = append(items, recycleItem{
		ID: id, Name: base, OrigPath: srcDir, Platform: platform, DeletedAt: now.Unix(),
	})
	return saveRecycle(items)
}

// handleListTrash 返回回收站清单。GET /api/trash
func (s *Server) handleListTrash(w http.ResponseWriter, _ *http.Request) {
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// handleRestoreTrash 恢复一项到原路径。POST /api/trash/restore {id}
func (s *Server) handleRestoreTrash(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ID string `json:"id"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	rd, _ := recycleDir()
	idx := -1
	for i := range items {
		if items[i].ID == body.ID {
			idx = i
			break
		}
	}
	if idx < 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "回收站中无此项"})
		return
	}
	it := items[idx]
	if _, err := os.Lstat(it.OrigPath); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "原位置已存在同名，无法恢复"})
		return
	}
	src := filepath.Join(rd, it.ID, it.Name)
	if err := os.MkdirAll(filepath.Dir(it.OrigPath), 0o755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if err := os.Rename(src, it.OrigPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	_ = os.RemoveAll(filepath.Join(rd, it.ID))
	items = append(items[:idx], items[idx+1:]...)
	_ = saveRecycle(items)
	writeJSON(w, http.StatusOK, map[string]string{"status": "restored"})
}

// handleEmptyTrash 清空回收站：所有项移到系统废纸篓。POST /api/trash/empty
func (s *Server) handleEmptyTrash(w http.ResponseWriter, _ *http.Request) {
	if !trash.Supported() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持移到废纸篓"})
		return
	}
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	rd, _ := recycleDir()
	moved := 0
	for _, it := range items {
		slot := filepath.Join(rd, it.ID)
		if _, err := os.Stat(slot); err == nil {
			if _, terr := trash.ToTrash(slot); terr == nil {
				moved++
			}
		}
	}
	_ = saveRecycle([]recycleItem{})
	writeJSON(w, http.StatusOK, map[string]any{"emptied": moved})
}
```

- [ ] **Step 8: handleTrash 改为移入回收站**

在 `internal/server/structure_routes.go` 的 `handleTrash` 里，把删除每个目录的逻辑从 `trash.ToTrash(dir)` 改为 `moveToRecycle`。具体把：
```go
		if _, err := trash.ToTrash(dir); err != nil {
			failed = append(failed, failure{Dir: raw, Error: err.Error()})
			continue
		}
```
改为：
```go
		// 取平台用于清单展示
		platform := ""
		if skills, e := s.st.List(); e == nil {
			for _, sk := range skills {
				if filepath.Clean(sk.Dir) == dir {
					platform = string(sk.Platform)
					break
				}
			}
		}
		if err := moveToRecycle(dir, platform, time.Now()); err != nil {
			failed = append(failed, failure{Dir: raw, Error: err.Error()})
			continue
		}
```
`handleTrash` 顶部 `if !trash.Supported()` 守卫可保留（回收站清空仍依赖系统废纸篓；且 `moveToRecycle` 在非 macOS 也能工作，但为一致先保留守卫）。确保 `structure_routes.go` 已 import `time`（若无则加）。

- [ ] **Step 9: 注册路由**

在 `internal/server/server.go` 加：
```go
	mux.HandleFunc("GET /api/trash", s.handleListTrash)
	mux.HandleFunc("POST /api/trash/restore", s.handleRestoreTrash)
	mux.HandleFunc("POST /api/trash/empty", s.handleEmptyTrash)
```

- [ ] **Step 10: 运行测试 + 全量**

Run: `go test ./internal/server/ -run 'TestTrashThenList|TestRestoreConflict' -v 2>&1 | tail -20 && go build ./... && go test ./... 2>&1 | tail -6`
Expected: 回收站测试 PASS；全量通过。

> 注意：`newSrv(t)` 必须把 `HOME` 指向临时目录（回收站写 `~/.skillbook/trash*`）。先确认现有 `newSrv` 是否 `t.Setenv("HOME", ...)`；若否，本任务测试需自行 `t.Setenv("HOME", t.TempDir())` 开头（其它备份测试已依赖此，故大概率已具备）。

- [ ] **Step 11: 提交**

```bash
git add internal/server/recycle.go internal/server/recycle_test.go internal/server/structure_routes.go internal/server/server.go internal/scanner/scanner.go internal/scanner/scanner_test.go
git commit -m "feat(trash): 应用内回收站（移入/列出/恢复/清空）+ 平台发现排除 .Trash"
```

---

## Task 7: 应用内回收站 — 前端（模块 D）

**Files:**
- Modify: `internal/server/web/index.html`（设置菜单加「垃圾桶」+ 回收站弹窗）
- Modify: `internal/server/web/app.js`（打开/渲染/恢复/清空 + i18n + 事件）
- Modify: `internal/server/web/style.css`（列表样式，可复用 `.bk-item`）

- [ ] **Step 1: 设置菜单加入口 + 弹窗骨架**

在 `index.html` 设置弹窗 `.cfg-menu` 里（`#openBackup` 那组菜单项旁）加：
```html
<button id="openTrash" class="cfg-menu-item">
  <span data-i18n="垃圾桶">垃圾桶</span>
</button>
```
在 `#backupModal` 之后加回收站弹窗：
```html
<div id="trashModal" class="modal" hidden role="dialog" aria-modal="true" aria-label="垃圾桶">
  <div class="modal-head"><h3 data-i18n="垃圾桶">垃圾桶</h3><button class="icon-btn" data-close><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>
  <div class="modal-body">
    <div class="bk-list-head">
      <span data-i18n="已删除的 Skill">已删除的 Skill</span>
      <button id="trashEmpty" class="btn btn-danger btn-sm" data-i18n="清空回收站">清空回收站</button>
    </div>
    <div id="trashList" class="bk-list"></div>
  </div>
</div>
```

- [ ] **Step 2: el 绑定 + API**

`app.js` el 绑定加：`openTrash: $("#openTrash"), trashModal: $("#trashModal"), trashList: $("#trashList"), trashEmpty: $("#trashEmpty"),`

API 加：
```javascript
  trashItems: () => fetch("/api/trash").then(J),
  trashRestore: (id) => fetch("/api/trash/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }),
  trashEmptyAll: () => fetch("/api/trash/empty", { method: "POST" }),
```

- [ ] **Step 3: 打开/渲染/操作函数**

```javascript
async function openTrash() {
  openModal(el.trashModal);
  el.trashList.innerHTML = `<div class="bk-empty">${t("加载中…")}</div>`;
  try {
    const d = await API.trashItems();
    const items = d.items || [];
    if (!items.length) { el.trashList.innerHTML = `<div class="bk-empty">${t("回收站是空的")}</div>`; return; }
    el.trashList.innerHTML = items.map((it) => `
      <div class="bk-item">
        <div class="bk-item-main">
          <span class="bk-item-time">${esc(it.name)}</span>
          <span class="bk-item-meta">${esc(it.origPath || "")}${it.deletedAt ? " · " + fmtTime(it.deletedAt) : ""}</span>
        </div>
        <button class="btn btn-ghost btn-sm tr-restore" data-id="${esc(it.id)}">${t("恢复")}</button>
      </div>`).join("");
    el.trashList.querySelectorAll(".tr-restore").forEach((b) =>
      b.addEventListener("click", () => doTrashRestore(b.dataset.id, b)));
  } catch { el.trashList.innerHTML = `<div class="bk-empty">${t("读取回收站失败")}</div>`; }
}
async function doTrashRestore(id, btn) {
  if (btn) { btn.disabled = true; }
  const r = await API.trashRestore(id);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已恢复")); await openTrash(); doScan(); }
  else { toast(d.error || t("恢复失败"), "err"); if (btn) btn.disabled = false; }
}
async function doTrashEmpty() {
  if (!confirm(t("清空回收站？内容会被移到系统废纸篓（仍可在访达恢复）。"))) return;
  const r = await API.trashEmptyAll();
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已清空回收站")); await openTrash(); }
  else { toast(d.error || t("清空失败"), "err"); }
}
```

- [ ] **Step 4: 事件绑定**

```javascript
el.openTrash.addEventListener("click", openTrash);
el.trashEmpty.addEventListener("click", doTrashEmpty);
```

- [ ] **Step 5: i18n**

在 `I18N.en` 加英文：`"垃圾桶"`, `"已删除的 Skill"`, `"清空回收站"`, `"回收站是空的"`, `"读取回收站失败"`, `"清空回收站？内容会被移到系统废纸篓（仍可在访达恢复）。"`, `"已清空回收站"`, `"清空失败"`（`"恢复"`, `"已恢复"`, `"恢复失败"`, `"加载中…"` 已有）。

- [ ] **Step 6: 校验 + 构建 + 冒烟**

```bash
node --check internal/server/web/app.js && ./restart.sh
```
设置 → 垃圾桶：删除一个 skill 后应出现在列表；恢复回到主列表；清空把它移到系统废纸篓。控制台无报错。

- [ ] **Step 7: 提交**

```bash
git add internal/server/web/index.html internal/server/web/app.js internal/server/web/style.css
git commit -m "feat(web): 设置内垃圾桶视图（查看/恢复/清空）"
```

---

## Task 8: 全量验证

- [ ] **Step 1:** `go build ./... && go test ./... 2>&1 | tail -30` → 全绿
- [ ] **Step 2:** `go vet ./... 2>&1 | tail` → 无新增告警
- [ ] **Step 3:** Playwright 冒烟（从 `/Users/quzhihao/Downloads/pixelle/Pixelle-Video` 跑 `uv run python`）：
  - 来源弹窗有"私有仓库访问令牌"输入；设置里不再有全局令牌字段
  - 文件树有新建/重命名/删除，点非 SKILL.md 文件后"在 Finder 打开"不再报错（mock 或仅验证请求 200）
  - 设置 → 垃圾桶弹窗可打开、空态正常
  - 控制台无报错
- [ ] **Step 4:** 如有微调，`git add -A && git commit -m "test: 编辑/回收站功能验证微调"`

---

## Self-Review 备注（已核对）

- **Spec 覆盖**：模块 A（Task 2/3）、B（Task 1）、C（Task 4/5）、D（Task 6/7）全覆盖；测试策略各任务含。
- **类型一致**：`recycleItem`/`loadRecycle`/`saveRecycle`/`moveToRecycle`（recycle.go）、`Source.Token`/`has_token`、`validBaseName`/`withinSkillDir`/`revealFn`、API 路径 `/api/file/new|/api/dir/new|/api/file/rename|/api/file/delete|/api/trash|/api/trash/restore|/api/trash/empty` 在前后端一致。
- **helper 复用**：`mkSkill` 在 Task 1 定义、后续任务复用（实现者需确认测试包内唯一，避免重复声明）。
- **删除语义区分**：单文件删除→系统废纸篓（Task 4）；整 skill 删除→应用回收站（Task 6）——spec 一致。
- **HOME 隔离**：回收站测试依赖 `newSrv` 把 HOME 指向临时目录（Task 6 Step 10 备注已提示确认）。
