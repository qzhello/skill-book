# SkillBook P1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 本地 Go 单进程应用：一键启动 → 扫描全机 Claude Code skill → 浏览/搜索 → 查看 → 在线编辑保存（保存自动本地 git 提交）→ 跨来源同名冲突高亮。

**Architecture:** Go 后端，文件为唯一真相源；扫描器解析各来源 `SKILL.md` 的 YAML frontmatter，写入 SQLite（modernc 纯 Go 驱动）+ FTS5 全文索引；`net/http` 提供 JSON API；前端用 `//go:embed` 打包的 htmx + 原生 CSS + CodeMirror（CDN 仅在浏览器侧加载，构建零 node）。编辑保存写回磁盘并 `git commit`。

**Tech Stack:** Go 1.25, `modernc.org/sqlite`（纯 Go，含 FTS5）, `gopkg.in/yaml.v3`, 标准库 `net/http` / `embed` / `os/exec`(git), htmx + CodeMirror（前端 CDN）。

---

## File Structure

```
skill-book/
├── go.mod
├── Makefile
├── start.sh
├── cmd/skillbook/main.go            # 入口：装配依赖、起 HTTP、开浏览器
├── internal/
│   ├── model/skill.go               # Skill / Source 类型
│   ├── scanner/frontmatter.go       # 解析 SKILL.md frontmatter
│   ├── scanner/scanner.go           # 遍历来源根目录 → []model.Skill
│   ├── store/store.go               # SQLite 打开 + schema(含 FTS5)
│   ├── store/skills.go              # Upsert/List/Search/Get/Conflicts
│   ├── editor/editor.go             # 读写 SKILL.md + git commit
│   ├── gitsync/git.go               # git 命令封装(shell out)
│   └── server/server.go             # 路由 + handlers + embed 前端
└── web/
    ├── index.html
    ├── app.js
    └── style.css
```

每个文件单一职责：`scanner` 只产出数据、`store` 只管持久化与查询、`editor` 只管文件读写与提交、`server` 只管 HTTP 装配。

---

## Task 0: 项目脚手架与可运行骨架

**Files:**
- Create: `go.mod`, `cmd/skillbook/main.go`, `Makefile`, `start.sh`, `.gitignore`

- [ ] **Step 1: 初始化 module 与依赖**

Run:
```bash
cd /Users/quzhihao/GolandProjects/skill-book
go mod init skillbook
go get modernc.org/sqlite@latest
go get gopkg.in/yaml.v3@latest
```
Expected: 生成 `go.mod` / `go.sum`，含两个依赖。

- [ ] **Step 2: 写最小入口 `cmd/skillbook/main.go`**

```go
package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:7777", "listen address")
	flag.Parse()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	log.Printf("SkillBook listening on http://%s", *addr)
	if err := http.ListenAndServe(*addr, mux); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 3: 写 `.gitignore`**

```
/skillbook
/skillbook.db
*.db-wal
*.db-shm
```

- [ ] **Step 4: 写 `Makefile`**

```makefile
.PHONY: run build test
run:
	go run ./cmd/skillbook
build:
	go build -o skillbook ./cmd/skillbook
test:
	go test ./...
```

- [ ] **Step 5: 写 `start.sh`（一键启动）**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
ADDR="${SKILLBOOK_ADDR:-127.0.0.1:7777}"
go build -o skillbook ./cmd/skillbook
( sleep 1; (command -v open >/dev/null && open "http://${ADDR}") || true ) &
exec ./skillbook -addr "${ADDR}"
```
Then run: `chmod +x start.sh`

- [ ] **Step 6: 验证可运行**

Run: `go run ./cmd/skillbook -addr 127.0.0.1:7777 &` then `curl -s http://127.0.0.1:7777/healthz`
Expected: 输出 `ok`。随后 `kill %1`。

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: project scaffold + runnable skeleton"
```

---

## Task 1: 领域模型 `model.Skill`

**Files:**
- Create: `internal/model/skill.go`
- Test: `internal/model/skill_test.go`

- [ ] **Step 1: 写失败测试**

```go
package model

import "testing"

func TestSkillID_StableFromSourceAndPath(t *testing.T) {
	a := Skill{Source: SourceUser, Dir: "/home/u/.claude/skills/foo"}
	b := Skill{Source: SourceUser, Dir: "/home/u/.claude/skills/foo"}
	if a.ID() != b.ID() {
		t.Fatalf("ID not stable: %q vs %q", a.ID(), b.ID())
	}
	if a.ID() == "" {
		t.Fatal("ID empty")
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/model/ -run TestSkillID_StableFromSourceAndPath -v`
Expected: 编译失败 / `undefined: Skill`。

- [ ] **Step 3: 写最小实现**

```go
package model

import (
	"crypto/sha1"
	"encoding/hex"
)

type Source string

const (
	SourceUser    Source = "user"
	SourceProject Source = "project"
	SourcePlugin  Source = "plugin"
)

// Skill 是磁盘上一个 skill 目录的元数据。文件是唯一真相源。
type Skill struct {
	Source      Source
	Dir         string // skill 目录绝对路径
	FilePath    string // SKILL.md 绝对路径
	Name        string // frontmatter name，缺省回退为目录名
	Description string // frontmatter description
	Body        string // SKILL.md 全文
	MTime       int64  // SKILL.md 修改时间(unix)
}

// ID 由来源+目录派生，稳定且唯一。
func (s Skill) ID() string {
	sum := sha1.Sum([]byte(string(s.Source) + "|" + s.Dir))
	return hex.EncodeToString(sum[:])
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/model/ -v`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add internal/model/ && git commit -m "feat(model): Skill type with stable ID"
```

---

## Task 2: frontmatter 解析

**Files:**
- Create: `internal/scanner/frontmatter.go`
- Test: `internal/scanner/frontmatter_test.go`

- [ ] **Step 1: 写失败测试**

```go
package scanner

import "testing"

func TestParseFrontmatter_NameAndDescription(t *testing.T) {
	content := "---\nname: foo-skill\ndescription: does foo\n---\n# Body\nhello\n"
	name, desc, err := ParseFrontmatter([]byte(content))
	if err != nil {
		t.Fatal(err)
	}
	if name != "foo-skill" {
		t.Fatalf("name=%q", name)
	}
	if desc != "does foo" {
		t.Fatalf("desc=%q", desc)
	}
}

func TestParseFrontmatter_NoFrontmatter(t *testing.T) {
	name, desc, err := ParseFrontmatter([]byte("# just a heading\n"))
	if err != nil {
		t.Fatal(err)
	}
	if name != "" || desc != "" {
		t.Fatalf("expected empties, got name=%q desc=%q", name, desc)
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/scanner/ -run TestParseFrontmatter -v`
Expected: `undefined: ParseFrontmatter`。

- [ ] **Step 3: 写最小实现**

```go
package scanner

import (
	"bytes"
	"strings"

	"gopkg.in/yaml.v3"
)

type frontmatter struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

// ParseFrontmatter 提取 SKILL.md 顶部 `---` 包裹的 YAML 的 name/description。
// 无 frontmatter 时返回空串且 err 为 nil。
func ParseFrontmatter(content []byte) (name, description string, err error) {
	s := string(content)
	if !strings.HasPrefix(s, "---") {
		return "", "", nil
	}
	rest := strings.TrimPrefix(s, "---")
	rest = strings.TrimLeft(rest, "\r\n")
	idx := strings.Index(rest, "\n---")
	if idx < 0 {
		return "", "", nil
	}
	yamlPart := rest[:idx]
	var fm frontmatter
	if err := yaml.Unmarshal([]byte(yamlPart), &fm); err != nil {
		return "", "", err
	}
	return strings.TrimSpace(fm.Name), strings.TrimSpace(fm.Description), nil
}

var _ = bytes.MinRead // keep imports tidy if trimmed later
```

> 注：若 `bytes` 未使用，删除该 import 与末行占位。保留与否以 `go vet` 为准。

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/scanner/ -run TestParseFrontmatter -v`
Expected: PASS（两个用例）。

- [ ] **Step 5: Commit**

```bash
git add internal/scanner/frontmatter.go internal/scanner/frontmatter_test.go
git commit -m "feat(scanner): parse SKILL.md frontmatter"
```

---

## Task 3: 多来源扫描器

**Files:**
- Create: `internal/scanner/scanner.go`
- Test: `internal/scanner/scanner_test.go`

- [ ] **Step 1: 写失败测试**

```go
package scanner

import (
	"os"
	"path/filepath"
	"testing"

	"skillbook/internal/model"
)

func writeSkill(t *testing.T, root, name, fm string) {
	t.Helper()
	dir := filepath.Join(root, name)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(fm), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestScanRoots_FindsSkillsWithSource(t *testing.T) {
	root := t.TempDir()
	writeSkill(t, root, "alpha", "---\nname: alpha\ndescription: A\n---\nbody")
	writeSkill(t, root, "beta", "---\nname: beta\ndescription: B\n---\nbody")

	got, err := ScanRoots([]Root{{Path: root, Source: model.SourceUser}})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 {
		t.Fatalf("want 2, got %d", len(got))
	}
	for _, s := range got {
		if s.Source != model.SourceUser {
			t.Fatalf("bad source %q", s.Source)
		}
		if s.Name == "" || s.FilePath == "" {
			t.Fatalf("missing fields: %+v", s)
		}
	}
}

func TestScanRoots_NameFallsBackToDir(t *testing.T) {
	root := t.TempDir()
	writeSkill(t, root, "no-name", "---\ndescription: only desc\n---\nbody")
	got, err := ScanRoots([]Root{{Path: root, Source: model.SourcePlugin}})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Name != "no-name" {
		t.Fatalf("want fallback name 'no-name', got %+v", got)
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/scanner/ -run TestScanRoots -v`
Expected: `undefined: ScanRoots` / `undefined: Root`。

- [ ] **Step 3: 写最小实现**

```go
package scanner

import (
	"io/fs"
	"os"
	"path/filepath"

	"skillbook/internal/model"
)

// Root 是一个扫描根目录及其来源标签。
type Root struct {
	Path   string
	Source model.Source
}

// ScanRoots 遍历每个 root，找到所有包含 SKILL.md 的目录，解析为 Skill。
// 不存在的 root 跳过而非报错。
func ScanRoots(roots []Root) ([]model.Skill, error) {
	var out []model.Skill
	for _, root := range roots {
		if _, err := os.Stat(root.Path); err != nil {
			continue
		}
		err := filepath.WalkDir(root.Path, func(p string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil // 单条错误不致命
			}
			if d.IsDir() || d.Name() != "SKILL.md" {
				return nil
			}
			content, rerr := os.ReadFile(p)
			if rerr != nil {
				return nil
			}
			name, desc, _ := ParseFrontmatter(content)
			dir := filepath.Dir(p)
			if name == "" {
				name = filepath.Base(dir)
			}
			info, _ := d.Info()
			var mtime int64
			if info != nil {
				mtime = info.ModTime().Unix()
			}
			out = append(out, model.Skill{
				Source:      root.Source,
				Dir:         dir,
				FilePath:    p,
				Name:        name,
				Description: desc,
				Body:        string(content),
				MTime:       mtime,
			})
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return out, nil
}

// DefaultRoots 返回本机标准来源（用户级、当前项目级、plugins）。
func DefaultRoots(home, cwd string) []Root {
	return []Root{
		{Path: filepath.Join(home, ".claude", "skills"), Source: model.SourceUser},
		{Path: filepath.Join(cwd, ".claude", "skills"), Source: model.SourceProject},
		{Path: filepath.Join(home, ".claude", "plugins"), Source: model.SourcePlugin},
	}
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/scanner/ -v`
Expected: PASS（含 frontmatter 与 scanner 全部用例）。

- [ ] **Step 5: Commit**

```bash
git add internal/scanner/scanner.go internal/scanner/scanner_test.go
git commit -m "feat(scanner): walk roots into Skill list with source tags"
```

---

## Task 4: SQLite store —— schema + Upsert + List

**Files:**
- Create: `internal/store/store.go`, `internal/store/skills.go`
- Test: `internal/store/skills_test.go`

- [ ] **Step 1: 写失败测试**

```go
package store

import (
	"testing"

	"skillbook/internal/model"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	st, err := Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })
	return st
}

func TestUpsertAndList(t *testing.T) {
	st := newTestStore(t)
	s := model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "A", Body: "body", MTime: 1}
	if err := st.Upsert(s); err != nil {
		t.Fatal(err)
	}
	// 再次 upsert 同 ID 应更新而非重复
	s.Description = "A2"
	if err := st.Upsert(s); err != nil {
		t.Fatal(err)
	}
	list, err := st.List()
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 {
		t.Fatalf("want 1, got %d", len(list))
	}
	if list[0].Description != "A2" {
		t.Fatalf("want updated desc, got %q", list[0].Description)
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/store/ -run TestUpsertAndList -v`
Expected: `undefined: Open`。

- [ ] **Step 3: 写 `store.go`（打开 + schema）**

```go
package store

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

type Store struct{ db *sql.DB }

const schema = `
CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY,
  source      TEXT NOT NULL,
  dir         TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  body        TEXT NOT NULL,
  mtime       INTEGER NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name, description, body, content=''
);
`

// Open 打开（或新建）数据库并建表。dsn 用 ":memory:" 可做测试。
func Open(dsn string) (*Store, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }
```

- [ ] **Step 4: 写 `skills.go`（Upsert + List）**

```go
package store

import "skillbook/internal/model"

// Upsert 写入或更新一条 skill，并同步 FTS。
func (s *Store) Upsert(sk model.Skill) error {
	id := sk.ID()
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM skills_fts WHERE rowid IN (SELECT rowid FROM skills WHERE id=?)`, id); err != nil {
		return err
	}
	res, err := tx.Exec(`
INSERT INTO skills(id,source,dir,file_path,name,description,body,mtime)
VALUES(?,?,?,?,?,?,?,?)
ON CONFLICT(id) DO UPDATE SET
  source=excluded.source, dir=excluded.dir, file_path=excluded.file_path,
  name=excluded.name, description=excluded.description, body=excluded.body, mtime=excluded.mtime`,
		id, sk.Source, sk.Dir, sk.FilePath, sk.Name, sk.Description, sk.Body, sk.MTime)
	if err != nil {
		return err
	}
	_ = res
	var rowid int64
	if err := tx.QueryRow(`SELECT rowid FROM skills WHERE id=?`, id).Scan(&rowid); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO skills_fts(rowid,name,description,body) VALUES(?,?,?,?)`,
		rowid, sk.Name, sk.Description, sk.Body); err != nil {
		return err
	}
	return tx.Commit()
}

func scanRows(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]model.Skill, error) {
	var out []model.Skill
	for rows.Next() {
		var sk model.Skill
		if err := rows.Scan(&sk.Source, &sk.Dir, &sk.FilePath, &sk.Name, &sk.Description, &sk.Body, &sk.MTime); err != nil {
			return nil, err
		}
		out = append(out, sk)
	}
	return out, rows.Err()
}

// List 返回全部 skill，按 name 升序。
func (s *Store) List() ([]model.Skill, error) {
	rows, err := s.db.Query(`SELECT source,dir,file_path,name,description,body,mtime FROM skills ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRows(rows)
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `go test ./internal/store/ -run TestUpsertAndList -v`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add internal/store/ && git commit -m "feat(store): sqlite schema + upsert + list with fts sync"
```

---

## Task 5: store —— FTS5 搜索 + 按 ID 取单条

**Files:**
- Modify: `internal/store/skills.go`
- Test: `internal/store/skills_test.go`（追加）

- [ ] **Step 1: 追加失败测试**

```go
func TestSearch_MatchesDescription(t *testing.T) {
	st := newTestStore(t)
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "handles payment refunds", Body: "x", MTime: 1})
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/d/beta", FilePath: "/d/beta/SKILL.md",
		Name: "beta", Description: "renders charts", Body: "y", MTime: 1})

	hits, err := st.Search("refund")
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 1 || hits[0].Name != "alpha" {
		t.Fatalf("want [alpha], got %+v", hits)
	}
}

func TestGetByID(t *testing.T) {
	st := newTestStore(t)
	sk := model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "A", Body: "B", MTime: 1}
	_ = st.Upsert(sk)
	got, err := st.Get(sk.ID())
	if err != nil {
		t.Fatal(err)
	}
	if got == nil || got.Name != "alpha" {
		t.Fatalf("got %+v", got)
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/store/ -run 'TestSearch_MatchesDescription|TestGetByID' -v`
Expected: `undefined: Search` / `undefined: Get`。

- [ ] **Step 3: 实现 Search + Get（追加到 `skills.go`）**

```go
import "strings"

// Search 用 FTS5 前缀匹配查询；空 query 等价于 List。
func (s *Store) Search(query string) ([]model.Skill, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return s.List()
	}
	match := query + "*"
	rows, err := s.db.Query(`
SELECT s.source,s.dir,s.file_path,s.name,s.description,s.body,s.mtime
FROM skills_fts f JOIN skills s ON s.rowid=f.rowid
WHERE skills_fts MATCH ? ORDER BY rank`, match)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRows(rows)
}

// Get 按 ID 取单条，不存在返回 (nil,nil)。
func (s *Store) Get(id string) (*model.Skill, error) {
	row := s.db.QueryRow(`SELECT source,dir,file_path,name,description,body,mtime FROM skills WHERE id=?`, id)
	var sk model.Skill
	err := row.Scan(&sk.Source, &sk.Dir, &sk.FilePath, &sk.Name, &sk.Description, &sk.Body, &sk.MTime)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			return nil, nil
		}
		return nil, err
	}
	return &sk, nil
}
```

> 注意：`strings` import 合并进文件已有 import 块。

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/store/ -v`
Expected: PASS（全部 store 用例）。

- [ ] **Step 5: Commit**

```bash
git add internal/store/ && git commit -m "feat(store): fts search + get by id"
```

---

## Task 6: 跨来源同名冲突检测

**Files:**
- Modify: `internal/store/skills.go`
- Test: `internal/store/skills_test.go`（追加）

- [ ] **Step 1: 追加失败测试**

```go
func TestConflicts_SameNameDifferentSource(t *testing.T) {
	st := newTestStore(t)
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/u/foo", FilePath: "/u/foo/SKILL.md", Name: "foo", MTime: 1})
	_ = st.Upsert(model.Skill{Source: model.SourcePlugin, Dir: "/p/foo", FilePath: "/p/foo/SKILL.md", Name: "foo", MTime: 1})
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/u/bar", FilePath: "/u/bar/SKILL.md", Name: "bar", MTime: 1})

	names, err := st.ConflictNames()
	if err != nil {
		t.Fatal(err)
	}
	if len(names) != 1 || names[0] != "foo" {
		t.Fatalf("want [foo], got %+v", names)
	}
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/store/ -run TestConflicts -v`
Expected: `undefined: ConflictNames`。

- [ ] **Step 3: 实现 ConflictNames（追加到 `skills.go`）**

```go
// ConflictNames 返回出现在 >1 条记录里的 name（即跨来源/跨目录同名）。
func (s *Store) ConflictNames() ([]string, error) {
	rows, err := s.db.Query(`SELECT name FROM skills GROUP BY name HAVING COUNT(*)>1 ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var n string
		if err := rows.Scan(&n); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/store/ -v`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add internal/store/ && git commit -m "feat(store): cross-source name conflict detection"
```

---

## Task 7: 编辑器 —— 保存写回文件 + 自动 git 提交

**Files:**
- Create: `internal/gitsync/git.go`, `internal/editor/editor.go`
- Test: `internal/editor/editor_test.go`

- [ ] **Step 1: 写 `gitsync/git.go`（无独立测试，由 editor 测试覆盖）**

```go
package gitsync

import (
	"os/exec"
)

// CommitFile 在 repoDir 内 `git add <file>` 并提交。
// 若 repoDir 非 git 仓库则先 init。文件无变化时 commit 会非零退出，调用方可忽略。
func CommitFile(repoDir, file, message string) error {
	if err := run(repoDir, "rev-parse", "--is-inside-work-tree"); err != nil {
		if err := run(repoDir, "init"); err != nil {
			return err
		}
	}
	if err := run(repoDir, "add", file); err != nil {
		return err
	}
	// 允许“无变更”导致的非零退出
	_ = run(repoDir, "commit", "-m", message)
	return nil
}

func run(dir string, args ...string) error {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	return cmd.Run()
}
```

- [ ] **Step 2: 写失败测试 `editor/editor_test.go`**

```go
package editor

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestSave_WritesFileAndCommits(t *testing.T) {
	repo := t.TempDir()
	// 配置最小 git 身份，避免 commit 失败
	for _, a := range [][]string{{"init"}, {"config", "user.email", "t@t"}, {"config", "user.name", "t"}} {
		c := exec.Command("git", a...)
		c.Dir = repo
		if err := c.Run(); err != nil {
			t.Fatal(err)
		}
	}
	skillDir := filepath.Join(repo, "skills", "foo")
	if err := os.MkdirAll(skillDir, 0o755); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(skillDir, "SKILL.md")
	if err := os.WriteFile(file, []byte("old"), 0o644); err != nil {
		t.Fatal(err)
	}

	ed := New(repo)
	if err := ed.Save(file, "new content"); err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(file)
	if string(got) != "new content" {
		t.Fatalf("file not written: %q", got)
	}
	// 应有一次提交
	c := exec.Command("git", "log", "--oneline")
	c.Dir = repo
	out, err := c.Output()
	if err != nil || len(out) == 0 {
		t.Fatalf("expected a commit, err=%v out=%q", err, out)
	}
}

func TestSave_RejectsPathOutsideRepo(t *testing.T) {
	repo := t.TempDir()
	ed := New(repo)
	if err := ed.Save("/etc/passwd", "x"); err == nil {
		t.Fatal("expected rejection of path outside repo")
	}
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `go test ./internal/editor/ -v`
Expected: `undefined: New`。

- [ ] **Step 4: 写 `editor/editor.go`**

```go
package editor

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"skillbook/internal/gitsync"
)

// Editor 把编辑写回磁盘并提交到 repoRoot 的 git 仓库。
type Editor struct{ repoRoot string }

func New(repoRoot string) *Editor { return &Editor{repoRoot: repoRoot} }

// Save 校验路径在 repoRoot 内，写入内容并自动 commit。
func (e *Editor) Save(filePath, content string) error {
	absRoot, err := filepath.Abs(e.repoRoot)
	if err != nil {
		return err
	}
	absFile, err := filepath.Abs(filePath)
	if err != nil {
		return err
	}
	rel, err := filepath.Rel(absRoot, absFile)
	if err != nil || strings.HasPrefix(rel, "..") {
		return fmt.Errorf("refuse to write outside repo: %s", filePath)
	}
	if err := os.WriteFile(absFile, []byte(content), 0o644); err != nil {
		return err
	}
	msg := "edit: " + filepath.Base(filepath.Dir(absFile))
	return gitsync.CommitFile(absRoot, absFile, msg)
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `go test ./internal/editor/ -v`
Expected: PASS（两个用例）。

- [ ] **Step 6: Commit**

```bash
git add internal/editor/ internal/gitsync/
git commit -m "feat(editor): save SKILL.md to disk + auto git commit, path-guarded"
```

> **设计说明（重要）**：编辑器只对**位于一个 git 仓库内**的 skill 自动提交。`~/.claude/skills` 默认不是 git 仓库；P1 的自动提交保证在「skill 所在目录或其某层父目录是 git 仓库」时生效，否则 `CommitFile` 会 `git init` 在 skillRoot 上。装配时（Task 9）`repoRoot` 传该 skill 的来源根（如 `~/.claude/skills`），首次保存会在该根 `git init` 建立本地版本库——符合「本地自动 git 备份」目标。

---

## Task 8: HTTP API + 装配

**Files:**
- Create: `internal/server/server.go`
- Modify: `cmd/skillbook/main.go`
- Test: `internal/server/server_test.go`

API：
- `POST /api/scan` → 重新扫描默认来源，入库，返回 `{count}`
- `GET  /api/skills?q=` → 列表/搜索，返回 `{conflicts:[...], skills:[...]}`
- `GET  /api/skills/{id}` → 单条
- `PUT  /api/skills/{id}` → body `{content}`，保存并提交，重扫该条

- [ ] **Step 1: 写失败测试**

```go
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/server/ -run TestScanThenList -v`
Expected: `undefined: New`。

- [ ] **Step 3: 写 `server/server.go`**

```go
package server

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"

	"skillbook/internal/editor"
	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

//go:embed all:../../web
var webFS embed.FS

type Server struct {
	st    *store.Store
	roots []scanner.Root
}

func New(st *store.Store, roots []scanner.Root) *Server {
	return &Server{st: st, roots: roots}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/scan", s.handleScan)
	mux.HandleFunc("GET /api/skills", s.handleList)
	mux.HandleFunc("GET /api/skills/{id}", s.handleGet)
	mux.HandleFunc("PUT /api/skills/{id}", s.handleSave)

	sub, _ := fs.Sub(webFS, "../../web")
	mux.Handle("/", http.FileServer(http.FS(sub)))
	return mux
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	skills, err := scanner.ScanRoots(s.roots)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	for _, sk := range skills {
		if err := s.st.Upsert(sk); err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
	}
	writeJSON(w, 200, map[string]int{"count": len(skills)})
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	skills, err := s.st.Search(q)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	conflicts, _ := s.st.ConflictNames()
	type item struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Source      string `json:"source"`
		Description string `json:"description"`
		Dir         string `json:"dir"`
	}
	out := make([]item, 0, len(skills))
	for _, sk := range skills {
		out = append(out, item{sk.ID(), sk.Name, string(sk.Source), sk.Description, sk.Dir})
	}
	writeJSON(w, 200, map[string]any{"conflicts": conflicts, "skills": out})
}

func (s *Server) handleGet(w http.ResponseWriter, r *http.Request) {
	sk, err := s.st.Get(r.PathValue("id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, 200, map[string]any{
		"id": sk.ID(), "name": sk.Name, "source": string(sk.Source),
		"description": sk.Description, "dir": sk.Dir, "file_path": sk.FilePath, "body": sk.Body,
	})
}

func (s *Server) handleSave(w http.ResponseWriter, r *http.Request) {
	sk, err := s.st.Get(r.PathValue("id"))
	if err != nil || sk == nil {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	var body struct {
		Content string `json:"content"`
	}
	raw, _ := io.ReadAll(r.Body)
	if err := json.Unmarshal(raw, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "bad json"})
		return
	}
	// repoRoot = 该 skill 来源根：从 file_path 向上找到与来源匹配的根。
	// P1 简化：用 skill 所在目录的父目录作为 repo 根（即 skills 根目录）。
	repoRoot := filepath.Dir(sk.Dir)
	ed := editor.New(repoRoot)
	if err := ed.Save(sk.FilePath, body.Content); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	// 重扫该文件并更新索引
	content, _ := os.ReadFile(sk.FilePath)
	name, desc, _ := scanner.ParseFrontmatter(content)
	if name == "" {
		name = filepath.Base(sk.Dir)
	}
	updated := model.Skill{Source: sk.Source, Dir: sk.Dir, FilePath: sk.FilePath,
		Name: name, Description: desc, Body: string(content), MTime: sk.MTime}
	_ = s.st.Upsert(updated)
	writeJSON(w, 200, map[string]string{"status": "saved"})
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/server/ -v`
Expected: PASS。

> 若 embed 因 `web/` 暂为空导致编译失败，先创建占位：`mkdir -p web && echo "placeholder" > web/index.html`，Task 9 会替换。

- [ ] **Step 5: 改写 `cmd/skillbook/main.go` 完成装配**

```go
package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"skillbook/internal/scanner"
	"skillbook/internal/server"
	"skillbook/internal/store"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:7777", "listen address")
	dbPath := flag.String("db", "skillbook.db", "sqlite path")
	flag.Parse()

	home, _ := os.UserHomeDir()
	cwd, _ := os.Getwd()

	st, err := store.Open(*dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	roots := scanner.DefaultRoots(home, cwd)
	srv := server.New(st, roots)

	log.Printf("SkillBook on http://%s  (db=%s)", *addr, filepath.Clean(*dbPath))
	if err := http.ListenAndServe(*addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 6: Commit**

```bash
git add internal/server/ cmd/skillbook/main.go
git commit -m "feat(server): scan/list/get/save API + main wiring"
```

---

## Task 9: 前端（空状态+扫描、列表+搜索、详情、编辑、冲突高亮）

**Files:**
- Create: `web/index.html`, `web/style.css`, `web/app.js`

- [ ] **Step 1: 写 `web/index.html`**

```html
<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>SkillBook</title>
<link rel="stylesheet" href="/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.css" />
</head>
<body>
<header>
  <h1>SkillBook</h1>
  <div class="toolbar">
    <input id="q" type="search" placeholder="搜索 skill…" />
    <button id="scan">扫描</button>
  </div>
</header>
<main>
  <aside id="list" class="list"><p class="empty">点「扫描」加载本机 skill。</p></aside>
  <section id="detail" class="detail"></section>
</main>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/markdown/markdown.min.js"></script>
<script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 写 `web/style.css`**

```css
:root{--bg:#0f1115;--panel:#171a21;--line:#262b36;--text:#e6e9ef;--muted:#8b93a3;--accent:#5b9bff;--warn:#f0a23b}
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--line)}
h1{font-size:16px;margin:0;letter-spacing:.5px}
.toolbar{display:flex;gap:8px}
input,button{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:7px 12px}
button{cursor:pointer}button:hover{border-color:var(--accent)}
main{display:grid;grid-template-columns:320px 1fr;height:calc(100vh - 53px)}
.list{overflow:auto;border-right:1px solid var(--line);padding:8px}
.empty{color:var(--muted);padding:16px}
.card{padding:10px 12px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px;cursor:pointer}
.card:hover{border-color:var(--accent)}
.card .name{font-weight:600}
.card .meta{color:var(--muted);font-size:12px;margin-top:2px}
.badge{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--line);margin-right:6px}
.badge.user{color:#7ee0a2}.badge.project{color:#5b9bff}.badge.plugin{color:#c79bff}
.badge.conflict{color:var(--warn);border-color:var(--warn)}
.detail{padding:16px;overflow:auto}
.detail h2{margin:0 0 4px}
.detail .path{color:var(--muted);font-size:12px;word-break:break-all}
.actions{margin:12px 0;display:flex;gap:8px}
.CodeMirror{height:60vh;border:1px solid var(--line);border-radius:10px}
.toast{position:fixed;bottom:16px;right:16px;background:var(--panel);border:1px solid var(--accent);padding:10px 14px;border-radius:10px}
```

- [ ] **Step 3: 写 `web/app.js`**

```js
const $ = (s) => document.querySelector(s);
let editor = null, current = null, conflicts = new Set();

async function load(q = "") {
  const res = await fetch("/api/skills?q=" + encodeURIComponent(q));
  const data = await res.json();
  conflicts = new Set(data.conflicts || []);
  renderList(data.skills || []);
}

function renderList(skills) {
  const el = $("#list");
  if (!skills.length) { el.innerHTML = '<p class="empty">无结果。点「扫描」或调整搜索。</p>'; return; }
  el.innerHTML = "";
  for (const s of skills) {
    const card = document.createElement("div");
    card.className = "card";
    const conf = conflicts.has(s.name) ? '<span class="badge conflict">冲突</span>' : "";
    card.innerHTML = `<div class="name">${esc(s.name)}</div>
      <div class="meta"><span class="badge ${s.source}">${s.source}</span>${conf}${esc(s.description || "")}</div>`;
    card.onclick = () => open(s.id);
    el.appendChild(card);
  }
}

async function open(id) {
  const res = await fetch("/api/skills/" + id);
  const s = await res.json();
  current = s;
  const conf = conflicts.has(s.name) ? '<span class="badge conflict">同名冲突</span>' : "";
  $("#detail").innerHTML = `<h2>${esc(s.name)} ${conf}</h2>
    <div class="path">${esc(s.file_path)}</div>
    <div class="actions"><button id="save">保存并提交</button></div>
    <textarea id="ed"></textarea>`;
  editor = CodeMirror.fromTextArea($("#ed"), { mode: "markdown", lineNumbers: true, lineWrapping: true });
  editor.setValue(s.body || "");
  $("#save").onclick = save;
}

async function save() {
  if (!current) return;
  const res = await fetch("/api/skills/" + current.id, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: editor.getValue() }),
  });
  toast(res.ok ? "已保存并提交" : "保存失败");
  if (res.ok) load($("#q").value);
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function esc(s){return (s||"").replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

$("#scan").onclick = async () => {
  $("#scan").disabled = true;
  const res = await fetch("/api/scan", { method: "POST" });
  const d = await res.json();
  $("#scan").disabled = false;
  toast("扫描到 " + (d.count ?? 0) + " 个 skill");
  load();
};
$("#q").addEventListener("input", (e) => load(e.target.value));
load();
```

- [ ] **Step 4: 构建并手动验证（视觉/交互）**

Run:
```bash
go build -o skillbook ./cmd/skillbook && ./start.sh
```
Expected：浏览器自动打开 `http://127.0.0.1:7777`，看到空状态 → 点「扫描」后左侧出现 skill 列表（你本机有 151+ 个用户级 skill）→ 顶部搜索框输入关键词实时过滤 → 点条目右侧出现 CodeMirror 编辑器 → 改内容点「保存并提交」出现 toast。同名 skill 显示橙色「冲突」徽标。手动核对：`git -C ~/.claude/skills log --oneline -1` 应出现 `edit: <skill名>` 提交。验证后 `Ctrl-C` 停止。

> 测试规范（参照 web/testing.md）：此任务以**视觉/交互手动验证**为主，断点 320/768/1024/1440 观察无溢出；列表与详情两栏在窄屏下应可纵向堆叠（如时间允许在 style.css 加 `@media(max-width:720px){main{grid-template-columns:1fr}}`）。

- [ ] **Step 5: Commit**

```bash
git add web/ && git commit -m "feat(web): scan/list/search/detail/edit UI with conflict badges"
```

---

## Task 10: 端到端冒烟 + 文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 全量测试**

Run: `go test ./...`
Expected: 全 PASS。

- [ ] **Step 2: 写 `README.md`**

```markdown
# SkillBook

本地 Skill 管理台（P1 MVP）：扫描全机 Claude Code skill，浏览/搜索/在线编辑，保存自动本地 git 提交，跨来源同名冲突高亮。

## 一键启动
```bash
./start.sh           # 默认 127.0.0.1:7777，自动开浏览器
SKILLBOOK_ADDR=127.0.0.1:8080 ./start.sh
```

## 来源
- `~/.claude/skills`（用户级）
- `<当前目录>/.claude/skills`（项目级）
- `~/.claude/plugins`（plugin）

## 路线图
P2 配方创建+AI 优化 / P3 导入安装+GitHub 备份 / P4 远程更新+语义检索。详见 `docs/superpowers/specs/`。
```

- [ ] **Step 3: Commit**

```bash
git add README.md && git commit -m "docs: README with quickstart"
```

---

## Self-Review（已执行）

- **Spec 覆盖**：P1 要求逐项有任务 —— 一键启动(T0)、扫描(T3/T8)、浏览搜索 SQLite+FTS5(T4/T5/T8/T9)、查看(T8/T9)、编辑保存+本地 git(T7/T8/T9)、冲突高亮(T6/T8/T9)。✅
- **占位符扫描**：无 TBD/TODO；所有代码步骤含完整代码。frontmatter.go 中 `bytes` 占位已注明按 `go vet` 删除。
- **类型一致性**：`model.Skill` 字段、`store` 方法名（Upsert/List/Search/Get/ConflictNames）、`editor.New/Save`、`server.New/Handler`、`scanner.Root/ScanRoots/DefaultRoots/ParseFrontmatter` 在各任务间一致。
- **已知简化**：`handleSave` 的 `repoRoot=filepath.Dir(sk.Dir)`（即 skills 根）→ 首次保存会在该根 `git init`；这满足「本地 git 版本/备份」目标，P3 再接 GitHub push。
