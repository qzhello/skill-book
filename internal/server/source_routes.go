package server

import (
	"net/http"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"skillbook/internal/store"
)

// 来源类型与同步策略枚举。
var validSyncPolicies = map[string]bool{"none": true, "check_only": true, "manual_update": true}
var validSourceKinds = map[string]bool{
	"github_repo": true, "github_file": true, "local_path": true, "manual": true, "unknown": true,
}

// inferSource 在 skillDir 所在 git 仓库里只读推断来源。
// 不联网、不写。推断不出返回 ok=false。
func inferSource(skillDir string) (kind, url, subpath string, ok bool) {
	top, err := runGit(skillDir, "rev-parse", "--show-toplevel")
	if err != nil || top == "" {
		return "", "", "", false
	}
	remote, err := runGit(skillDir, "config", "--get", "remote.origin.url")
	if err != nil || remote == "" {
		return "", "", "", false
	}
	url = normalizeGitURL(remote)
	// git --show-toplevel 返回解析过软链的路径；skillDir 可能含软链（如 macOS /tmp）。
	// 对 skillDir 也做一次软链解析，使 Rel 结果稳定。
	dir := skillDir
	if resolved, err := filepath.EvalSymlinks(skillDir); err == nil {
		dir = resolved
	}
	if rel, err := filepath.Rel(top, dir); err == nil && rel != "." {
		subpath = rel
	}
	return "github_repo", url, subpath, true
}

// runGit 在 dir 下执行只读 git 子命令并返回 trim 后的 stdout。
func runGit(dir string, args ...string) (string, error) {
	full := append([]string{"-C", dir}, args...)
	out, err := exec.Command("git", full...).Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

// normalizeGitURL 把 git remote 规整为 https://github.com/<owner>/<repo>（去 .git）。
// 处理 git@github.com:owner/repo.git 与 https://github.com/owner/repo.git 两种形态；
// 非 github 原样返回（仅去掉尾部 .git）。
func normalizeGitURL(remote string) string {
	r := strings.TrimSpace(remote)
	if strings.HasPrefix(r, "git@github.com:") {
		path := strings.TrimPrefix(r, "git@github.com:")
		return "https://github.com/" + strings.TrimSuffix(path, ".git")
	}
	if i := strings.Index(r, "github.com/"); i >= 0 {
		path := r[i+len("github.com/"):]
		return "https://github.com/" + strings.TrimSuffix(path, ".git")
	}
	// ssh:// 形态 ssh://git@github.com/owner/repo.git
	if strings.Contains(r, "github.com") {
		if i := strings.Index(r, "github.com"); i >= 0 {
			rest := r[i+len("github.com"):]
			rest = strings.TrimLeft(rest, ":/")
			return "https://github.com/" + strings.TrimSuffix(rest, ".git")
		}
	}
	return strings.TrimSuffix(r, ".git")
}

// handleGetSource 返回持久来源，无则尝试 git 推断（不落库）。
func (s *Server) handleGetSource(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sk, err := s.st.Get(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if src, found, err := s.st.GetSource(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	} else if found {
		writeJSON(w, http.StatusOK, sourceResponse(*src, false))
		return
	}
	// 无持久行 → 尝试推断
	if kind, url, subpath, ok := inferSource(sk.Dir); ok {
		writeJSON(w, http.StatusOK, map[string]any{
			"source_kind": kind, "source_url": url, "source_ref": "",
			"source_subpath": subpath, "source_rev": "", "source_note": "",
			"sync_policy": "none", "inferred": true,
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"source_kind": "unknown", "source_url": "", "source_ref": "",
		"source_subpath": "", "source_rev": "", "source_note": "",
		"sync_policy": "none", "inferred": false,
	})
}

// sourceResponse 把持久行序列化为带 inferred 标记的响应。
func sourceResponse(src store.Source, inferred bool) map[string]any {
	return map[string]any{
		"source_kind": src.SourceKind, "source_url": src.SourceURL, "source_ref": src.SourceRef,
		"source_subpath": src.SourceSubpath, "source_rev": src.SourceRev, "source_note": src.SourceNote,
		"sync_policy": src.SyncPolicy, "inferred": inferred,
	}
}

// handlePutSource 落库或清除某 skill 的来源。
func (s *Server) handlePutSource(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sk, err := s.st.Get(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	var body struct {
		SourceURL  string `json:"source_url"`
		SourceKind string `json:"source_kind"`
		SourceRef  string `json:"source_ref"`
		SourceNote string `json:"source_note"`
		SyncPolicy string `json:"sync_policy"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	syncPolicy := body.SyncPolicy
	if syncPolicy == "" {
		syncPolicy = "none"
	}
	if !validSyncPolicies[syncPolicy] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "非法 sync_policy"})
		return
	}

	url := strings.TrimSpace(body.SourceURL)
	if url == "" {
		if err := s.st.DeleteSource(id); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "cleared"})
		return
	}

	kind := body.SourceKind
	if kind == "" {
		kind = inferKindFromURL(url)
	}
	if !validSourceKinds[kind] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "非法 source_kind"})
		return
	}

	src := store.Source{
		SkillID:    id,
		SourceKind: kind,
		SourceURL:  url,
		SourceRef:  body.SourceRef,
		SourceNote: body.SourceNote,
		SyncPolicy: syncPolicy,
		UpdatedAt:  time.Now().Unix(),
	}
	if err := s.st.PutSource(src); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// inferKindFromURL 在未给定 kind 时按 url 粗略推断，默认 manual。
func inferKindFromURL(url string) string {
	if strings.Contains(url, "github.com") {
		if strings.Contains(url, "/blob/") {
			return "github_file"
		}
		return "github_repo"
	}
	return "manual"
}

// handleListSources 返回有持久来源行的 skill id 列表。
func (s *Server) handleListSources(w http.ResponseWriter, r *http.Request) {
	ids, err := s.st.LinkedSourceIDs()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"linked": ids})
}
