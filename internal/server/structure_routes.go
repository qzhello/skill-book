package server

import (
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"

	"skillbook/internal/editor"
	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/trash"
)

// maxFileReadBytes 超过此大小的文件视为二进制，不返回内容。
const maxFileReadBytes = 256 << 10 // 256KB

// fileEntry 是文件树中的一个条目。
type fileEntry struct {
	Rel  string `json:"rel"`
	Abs  string `json:"abs"`
	Size int64  `json:"size"`
	Dir  bool   `json:"dir"`
}

// skillForPath 返回 abs 所属的 skill：abs 必须位于某个已知 skill.Dir 之内
// （filepath.Rel 不以 ".." 开头），否则返回 nil。abs 应已 Clean。
func (s *Server) skillForPath(abs string) *model.Skill {
	skills, err := s.st.List()
	if err != nil {
		return nil
	}
	for i := range skills {
		rel, err := filepath.Rel(skills[i].Dir, abs)
		if err != nil {
			continue
		}
		if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			continue
		}
		return &skills[i]
	}
	return nil
}

// handleSkillFiles 列出某 skill 目录下的完整文件树。
// GET /api/skills/{id}/files
func (s *Server) handleSkillFiles(w http.ResponseWriter, r *http.Request) {
	sk, err := s.st.Get(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	var entries []fileEntry
	walkErr := filepath.WalkDir(sk.Dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // 跳过无法访问的条目，不中断
		}
		if path == sk.Dir {
			return nil // 不含根本身
		}
		if d.IsDir() && d.Name() == ".git" {
			return fs.SkipDir
		}
		rel, relErr := filepath.Rel(sk.Dir, path)
		if relErr != nil {
			return nil
		}
		var size int64
		if info, e := d.Info(); e == nil {
			size = info.Size()
		}
		entries = append(entries, fileEntry{Rel: rel, Abs: path, Size: size, Dir: d.IsDir()})
		return nil
	})
	if walkErr != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": walkErr.Error()})
		return
	}

	sortFileEntries(entries)
	writeJSON(w, http.StatusOK, map[string]any{"root": sk.Dir, "files": entries})
}

// sortFileEntries 排序：SKILL.md 最前，其余目录在前、文件在后，再按 rel 字典序。
func sortFileEntries(entries []fileEntry) {
	sort.SliceStable(entries, func(i, j int) bool {
		a, b := entries[i], entries[j]
		ai, bi := a.Rel == "SKILL.md", b.Rel == "SKILL.md"
		if ai != bi {
			return ai
		}
		if a.Dir != b.Dir {
			return a.Dir // 目录在前
		}
		return a.Rel < b.Rel
	})
}

// handleGetFile 读取白名单内某文件内容。
// GET /api/file?path=<abs>
func (s *Server) handleGetFile(w http.ResponseWriter, r *http.Request) {
	abs := filepath.Clean(r.URL.Query().Get("path"))
	sk := s.skillForPath(abs)
	if sk == nil {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "path 不在库中"})
		return
	}
	info, err := os.Stat(abs)
	if err != nil || info.IsDir() {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "文件不存在"})
		return
	}
	rel, _ := filepath.Rel(sk.Dir, abs)

	if info.Size() > maxFileReadBytes {
		writeJSON(w, http.StatusOK, map[string]any{
			"rel": rel, "abs": abs, "size": info.Size(), "binary": true,
		})
		return
	}
	data, err := os.ReadFile(abs)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if !utf8.Valid(data) {
		writeJSON(w, http.StatusOK, map[string]any{
			"rel": rel, "abs": abs, "size": info.Size(), "binary": true,
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"rel": rel, "abs": abs, "size": info.Size(), "binary": false, "content": string(data),
	})
}

// handlePutFile 写入白名单内某文件，写盘 + git 提交；若是 SKILL.md 则重索引。
// PUT /api/file  body {path, content}
func (s *Server) handlePutFile(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
	var body struct {
		Path    string `json:"path"`
		Content string `json:"content"`
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

	// repoRoot 用所属 skill.Dir：editor 据此做越界防护，确保只能写在该目录内。
	ed := editor.New(sk.Dir)
	if err := ed.Save(abs, body.Content); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	reindexed := false
	if abs == filepath.Clean(sk.FilePath) {
		if err := s.reindexSkill(sk); err != nil {
			// 文件已保存，仅索引失败：记日志后仍返回成功。
			writeJSON(w, http.StatusOK, map[string]any{"status": "saved", "reindexed": false})
			return
		}
		reindexed = true
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "saved", "reindexed": reindexed})
}

// reindexSkill 重读 SKILL.md，重算 name/desc/BodyHash 并 Upsert。
func (s *Server) reindexSkill(sk *model.Skill) error {
	content, err := os.ReadFile(sk.FilePath)
	if err != nil {
		return err
	}
	name, desc, _ := scanner.ParseFrontmatter(content)
	if name == "" {
		name = filepath.Base(sk.Dir)
	}
	var mtime int64 = sk.MTime
	if info, e := os.Stat(sk.FilePath); e == nil {
		mtime = info.ModTime().Unix()
	}
	updated := model.Skill{
		Source: sk.Source, Dir: sk.Dir, FilePath: sk.FilePath,
		Name: name, Description: desc, Body: string(content),
		BodyHash: model.HashBody(string(content)), MTime: mtime,
	}
	return s.st.Upsert(updated)
}

// handleTrash 把若干 skill 目录移到系统废纸篓。
// POST /api/skills/trash  body {dirs:[...]}
func (s *Server) handleTrash(w http.ResponseWriter, r *http.Request) {
	if !trash.Supported() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持移到废纸篓"})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	var body struct {
		Dirs []string `json:"dirs"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	// 收集已知 skill 目录集合，用于精确匹配。
	known := map[string]bool{}
	if skills, err := s.st.List(); err == nil {
		for _, sk := range skills {
			known[filepath.Clean(sk.Dir)] = true
		}
	}

	type failure struct {
		Dir   string `json:"dir"`
		Error string `json:"error"`
	}
	trashed := []string{}
	failed := []failure{}

	for _, raw := range body.Dirs {
		dir := filepath.Clean(raw)
		if !known[dir] {
			failed = append(failed, failure{Dir: raw, Error: "目录不是已知 skill"})
			continue
		}
		if _, err := trash.ToTrash(dir); err != nil {
			failed = append(failed, failure{Dir: raw, Error: err.Error()})
			continue
		}
		if err := s.st.DeleteByDir(dir); err != nil {
			// 已移走但索引删除失败：仍计成功，避免悬挂条目阻断操作。
			trashed = append(trashed, dir)
			continue
		}
		trashed = append(trashed, dir)
	}

	writeJSON(w, http.StatusOK, map[string]any{"trashed": trashed, "failed": failed})
}

// groupCopy 是分组里的一份副本。
type groupCopy struct {
	ID       string `json:"id"`
	Source   string `json:"source"`
	Dir      string `json:"dir"`
	FilePath string `json:"file_path"`
	Size     int64  `json:"size"`
	MTime    int64  `json:"mtime"`
}

type group struct {
	Name   string      `json:"name"`
	Kind   string      `json:"kind"`
	Copies []groupCopy `json:"copies"`
}

// handleGroups 返回重复或冲突分组及其副本。
// GET /api/groups?kind=dup|conflict
func (s *Server) handleGroups(w http.ResponseWriter, r *http.Request) {
	kind := r.URL.Query().Get("kind")
	if kind != "dup" && kind != "conflict" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "kind 必须为 dup 或 conflict"})
		return
	}
	conflicts, dups, _, err := s.st.NameGroups()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	var names []string
	if kind == "conflict" {
		names = conflicts
	} else {
		names = dups
	}

	skills, err := s.st.List()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	byName := map[string][]model.Skill{}
	for _, sk := range skills {
		byName[sk.Name] = append(byName[sk.Name], sk)
	}

	groups := []group{}
	for _, name := range names {
		copies := []groupCopy{}
		for _, sk := range byName[name] {
			var size int64
			if info, e := os.Stat(sk.FilePath); e == nil {
				size = info.Size()
			}
			copies = append(copies, groupCopy{
				ID: sk.ID(), Source: string(sk.Source), Dir: sk.Dir,
				FilePath: sk.FilePath, Size: size, MTime: sk.MTime,
			})
		}
		groups = append(groups, group{Name: name, Kind: kind, Copies: copies})
	}
	sort.SliceStable(groups, func(i, j int) bool { return groups[i].Name < groups[j].Name })

	writeJSON(w, http.StatusOK, map[string]any{"groups": groups})
}
