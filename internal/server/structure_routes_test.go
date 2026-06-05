package server

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"skillbook/internal/model"
)

// makeSkillOnDisk 在临时目录内造一个真实 skill 目录（含 git 仓库），入库并返回。
func makeSkillOnDisk(t *testing.T, srv *Server, name, body string) model.Skill {
	t.Helper()
	dir := filepath.Join(t.TempDir(), name)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	fp := filepath.Join(dir, "SKILL.md")
	content := "---\nname: " + name + "\ndescription: D\n---\n" + body
	if err := os.WriteFile(fp, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	// editor.Save 需要 git 仓库才能提交；初始化一个。
	for _, args := range [][]string{
		{"init", "-q"},
		{"config", "user.email", "t@t"},
		{"config", "user.name", "t"},
		{"add", "."},
		{"commit", "-qm", "init"},
	} {
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %v %s", args, err, out)
		}
	}
	info, _ := os.Stat(fp)
	sk := model.Skill{
		Source: model.SourceUser, Dir: dir, FilePath: fp,
		Name: name, Description: "D", Body: content,
		BodyHash: model.HashBody(content), MTime: info.ModTime().Unix(),
	}
	if err := srv.st.Upsert(sk); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	return sk
}

func TestSkillFiles_TreeOrdering(t *testing.T) {
	srv := newSrv(t)
	sk := makeSkillOnDisk(t, srv, "tree", "x")
	// 加一些额外文件/目录。
	_ = os.MkdirAll(filepath.Join(sk.Dir, "scripts"), 0o755)
	_ = os.WriteFile(filepath.Join(sk.Dir, "scripts", "run.sh"), []byte("#!/bin/sh\n"), 0o644)
	_ = os.WriteFile(filepath.Join(sk.Dir, "README.md"), []byte("readme"), 0o644)

	rec := do(t, srv, http.MethodGet, "/api/skills/"+sk.ID()+"/files", "")
	if rec.Code != 200 {
		t.Fatalf("code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Root  string `json:"root"`
		Files []struct {
			Rel string `json:"rel"`
			Dir bool   `json:"dir"`
		} `json:"files"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.Root != sk.Dir {
		t.Fatalf("root = %q", out.Root)
	}
	if len(out.Files) == 0 || out.Files[0].Rel != "SKILL.md" {
		t.Fatalf("SKILL.md should be first, got %+v", out.Files)
	}
	// .git 不应出现。
	for _, f := range out.Files {
		if strings.HasPrefix(f.Rel, ".git") {
			t.Fatalf(".git leaked: %+v", f)
		}
	}
	// scripts 目录应排在 README.md / scripts/run.sh 之前（目录在前）。
	var relOrder []string
	for _, f := range out.Files {
		relOrder = append(relOrder, f.Rel)
	}
	idxDir, idxReadme := indexOf(relOrder, "scripts"), indexOf(relOrder, "README.md")
	if idxDir == -1 || idxReadme == -1 || idxDir > idxReadme {
		t.Fatalf("dir should precede files (excluding SKILL.md), order=%v", relOrder)
	}
}

func indexOf(ss []string, v string) int {
	for i, s := range ss {
		if s == v {
			return i
		}
	}
	return -1
}

func TestGetFile_WhitelistAllowsAndDenies(t *testing.T) {
	srv := newSrv(t)
	sk := makeSkillOnDisk(t, srv, "rw", "hello")

	// 合法：读 SKILL.md。
	rec := do(t, srv, http.MethodGet, "/api/file?path="+sk.FilePath, "")
	if rec.Code != 200 {
		t.Fatalf("legit read code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Binary  bool   `json:"binary"`
		Content string `json:"content"`
		Rel     string `json:"rel"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if out.Binary || !strings.Contains(out.Content, "hello") || out.Rel != "SKILL.md" {
		t.Fatalf("unexpected read result %+v", out)
	}

	// 越权：用 ../ 逃逸 skill 目录 → 403。
	escape := filepath.Join(sk.Dir, "..", "..", "etc", "passwd")
	rec = do(t, srv, http.MethodGet, "/api/file?path="+escape, "")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("escape read should be 403, got %d %s", rec.Code, rec.Body.String())
	}

	// 完全无关路径 → 403。
	rec = do(t, srv, http.MethodGet, "/api/file?path=/etc/hosts", "")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("unrelated read should be 403, got %d", rec.Code)
	}
}

func TestPutFile_ReindexesSkillMd(t *testing.T) {
	srv := newSrv(t)
	sk := makeSkillOnDisk(t, srv, "edit", "old body")

	newContent := "---\nname: edit\ndescription: NEWDESC\n---\nnew body"
	payload, _ := json.Marshal(map[string]string{"path": sk.FilePath, "content": newContent})
	rec := do(t, srv, http.MethodPut, "/api/file", string(payload))
	if rec.Code != 200 {
		t.Fatalf("put code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Status    string `json:"status"`
		Reindexed bool   `json:"reindexed"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if out.Status != "saved" || !out.Reindexed {
		t.Fatalf("expected saved+reindexed, got %+v", out)
	}
	// 索引应已更新 description。
	got, _ := srv.st.Get(sk.ID())
	if got == nil || got.Description != "NEWDESC" {
		t.Fatalf("index not updated, got %+v", got)
	}
}

func TestPutFile_NonSkillMdNoReindex(t *testing.T) {
	srv := newSrv(t)
	sk := makeSkillOnDisk(t, srv, "edit2", "x")
	readme := filepath.Join(sk.Dir, "README.md")

	payload, _ := json.Marshal(map[string]string{"path": readme, "content": "# Readme"})
	rec := do(t, srv, http.MethodPut, "/api/file", string(payload))
	if rec.Code != 200 {
		t.Fatalf("put code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Reindexed bool `json:"reindexed"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if out.Reindexed {
		t.Fatalf("non-SKILL.md should not reindex")
	}
	if data, _ := os.ReadFile(readme); string(data) != "# Readme" {
		t.Fatalf("file not written: %q", data)
	}
}

func TestPutFile_DeniesOutsideWhitelist(t *testing.T) {
	srv := newSrv(t)
	_ = makeSkillOnDisk(t, srv, "edit3", "x")
	payload, _ := json.Marshal(map[string]string{"path": "/etc/evil", "content": "pwn"})
	rec := do(t, srv, http.MethodPut, "/api/file", string(payload))
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d %s", rec.Code, rec.Body.String())
	}
}

func TestGroups_Structure(t *testing.T) {
	srv := newSrv(t)
	// 两份同名内容不同 → conflict。
	a := model.Skill{Source: model.SourceUser, Dir: "/u/dup", FilePath: "/u/dup/SKILL.md",
		Name: "dup", BodyHash: "h1", MTime: 10}
	b := model.Skill{Source: model.SourcePlugin, Dir: "/p/dup", FilePath: "/p/dup/SKILL.md",
		Name: "dup", BodyHash: "h2", MTime: 20}
	_ = srv.st.Upsert(a)
	_ = srv.st.Upsert(b)
	// 两份同名内容一致 → dup。
	c := model.Skill{Source: model.SourceUser, Dir: "/u/same", FilePath: "/u/same/SKILL.md",
		Name: "same", BodyHash: "eq", MTime: 1}
	d := model.Skill{Source: model.SourcePlugin, Dir: "/p/same", FilePath: "/p/same/SKILL.md",
		Name: "same", BodyHash: "eq", MTime: 1}
	_ = srv.st.Upsert(c)
	_ = srv.st.Upsert(d)

	rec := do(t, srv, http.MethodGet, "/api/groups?kind=conflict", "")
	if rec.Code != 200 {
		t.Fatalf("code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Groups []struct {
			Name   string `json:"name"`
			Kind   string `json:"kind"`
			Copies []struct {
				ID     string `json:"id"`
				Source string `json:"source"`
				Dir    string `json:"dir"`
			} `json:"copies"`
		} `json:"groups"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if len(out.Groups) != 1 || out.Groups[0].Name != "dup" || out.Groups[0].Kind != "conflict" {
		t.Fatalf("conflict group bad: %+v", out.Groups)
	}
	if len(out.Groups[0].Copies) != 2 {
		t.Fatalf("expected 2 copies, got %+v", out.Groups[0].Copies)
	}

	rec = do(t, srv, http.MethodGet, "/api/groups?kind=dup", "")
	json.Unmarshal(rec.Body.Bytes(), &out)
	if len(out.Groups) != 1 || out.Groups[0].Name != "same" {
		t.Fatalf("dup group bad: %+v", out.Groups)
	}

	// 非法 kind → 400。
	rec = do(t, srv, http.MethodGet, "/api/groups?kind=bogus", "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("bad kind expected 400, got %d", rec.Code)
	}
}

func TestTrash_RejectsNonSkillDir(t *testing.T) {
	srv := newSrv(t)
	if !trashSupported() {
		// 非 darwin：整端点应 501。
		rec := do(t, srv, http.MethodPost, "/api/skills/trash", `{"dirs":["/whatever"]}`)
		if rec.Code != http.StatusNotImplemented {
			t.Fatalf("non-darwin expected 501, got %d %s", rec.Code, rec.Body.String())
		}
		return
	}

	sk := makeSkillOnDisk(t, srv, "keepme", "x")
	// 造一个非 skill 目录，必须不被动到。
	outsider := filepath.Join(t.TempDir(), "outsider")
	_ = os.MkdirAll(outsider, 0o755)

	payload, _ := json.Marshal(map[string][]string{"dirs": {outsider}})
	rec := do(t, srv, http.MethodPost, "/api/skills/trash", string(payload))
	if rec.Code != 200 {
		t.Fatalf("code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Trashed []string `json:"trashed"`
		Failed  []struct {
			Dir   string `json:"dir"`
			Error string `json:"error"`
		} `json:"failed"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if len(out.Trashed) != 0 || len(out.Failed) != 1 {
		t.Fatalf("non-skill should be failed, got %+v", out)
	}
	// outsider 必须仍在原地。
	if _, err := os.Stat(outsider); err != nil {
		t.Fatalf("outsider must not be moved: %v", err)
	}
	// skill 仍在库中。
	if got, _ := srv.st.Get(sk.ID()); got == nil {
		t.Fatalf("skill should remain in store")
	}
}

func TestTrash_MovesKnownSkill(t *testing.T) {
	if !trashSupported() {
		t.Skip("仅 macOS 支持移到废纸篓")
	}
	srv := newSrv(t) // newSrv 已把 HOME 指向临时目录
	sk := makeSkillOnDisk(t, srv, "trashme", "x")

	payload, _ := json.Marshal(map[string][]string{"dirs": {sk.Dir}})
	rec := do(t, srv, http.MethodPost, "/api/skills/trash", string(payload))
	if rec.Code != 200 {
		t.Fatalf("code = %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Trashed []string `json:"trashed"`
	}
	json.Unmarshal(rec.Body.Bytes(), &out)
	if len(out.Trashed) != 1 {
		t.Fatalf("expected 1 trashed, got %+v", out)
	}
	if _, err := os.Stat(sk.Dir); !os.IsNotExist(err) {
		t.Fatalf("skill dir should be gone")
	}
	if got, _ := srv.st.Get(sk.ID()); got != nil {
		t.Fatalf("skill should be removed from store")
	}
}

func trashSupported() bool { return runtime.GOOS == "darwin" }
