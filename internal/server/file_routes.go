package server

import (
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"

	"skillbook/internal/model"
	"skillbook/internal/scanner"
)

var skillNameRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)

// handleNewSkill 创建一个新的用户级 skill 文件并入库。
func (s *Server) handleNewSkill(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name    string `json:"name"`
		Content string `json:"content"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	if !skillNameRe.MatchString(body.Name) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name 仅允许小写字母、数字与连字符，且不能以连字符开头"})
		return
	}

	home, err := os.UserHomeDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	plat := s.defaultPlatform()
	dir := filepath.Join(home, "."+plat, "skills", body.Name)
	filePath := filepath.Join(dir, "SKILL.md")

	if _, err := os.Stat(filePath); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "该 skill 已存在"})
		return
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if err := os.WriteFile(filePath, []byte(body.Content), 0o644); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	name, desc, _ := scanner.ParseFrontmatter([]byte(body.Content))
	if name == "" {
		name = body.Name
	}
	var mtime int64
	if info, err := os.Stat(filePath); err == nil {
		mtime = info.ModTime().Unix()
	}
	sk := model.Skill{
		Source: model.SourceUser, Platform: model.Platform(plat), Dir: dir, FilePath: filePath,
		Name: name, Description: desc, Body: body.Content,
		BodyHash: model.HashBody(body.Content), MTime: mtime,
	}
	if err := s.st.Upsert(sk); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"id": sk.ID()})
}

// handleReveal 在 Finder 中定位一个属于库内 skill 的文件。
// 仅当 path 命中库中某个 skill 的 file_path 时才执行，防越权。
func (s *Server) handleReveal(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Path string `json:"path"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	if !s.isKnownSkillPath(body.Path) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "path 不在库中"})
		return
	}
	if runtime.GOOS != "darwin" {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持在 Finder 打开"})
		return
	}
	if err := exec.Command("open", "-R", body.Path).Run(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "revealed"})
}

// isKnownSkillPath 检查 path 是否等于库中某个 skill 的 file_path。
func (s *Server) isKnownSkillPath(path string) bool {
	if path == "" {
		return false
	}
	skills, err := s.st.List()
	if err != nil {
		return false
	}
	for _, sk := range skills {
		if sk.FilePath == path {
			return true
		}
	}
	return false
}
