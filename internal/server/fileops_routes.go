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
