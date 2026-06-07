package server

import (
	"net/http"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// platformIDRe 限定平台 id 安全字符集，既支持可插拔（任意工具名），又防路径穿越。
var platformIDRe = regexp.MustCompile(`^[a-z][a-z0-9-]{0,31}$`)

// platformIDs 返回当前扫描根中出现过的去重平台 id。claude 优先，其余按字母序。
func (s *Server) platformIDs() []string {
	seen := map[string]bool{}
	var ids []string
	for _, r := range s.effectiveRoots() {
		id := string(r.Platform)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool {
		ci, cj := ids[i] == "claude", ids[j] == "claude"
		if ci != cj {
			return ci // claude 排最前
		}
		return ids[i] < ids[j]
	})
	return ids
}

// platformLabel 把平台 id 派生为展示名：已知工具用惯用名，未知工具首字母大写。
func platformLabel(id string) string {
	switch id {
	case "claude":
		return "Claude"
	case "codex":
		return "Codex"
	case "":
		return ""
	}
	return strings.ToUpper(id[:1]) + id[1:]
}

// defaultPlatform 返回新建/导入默认落地的平台：优先 claude，否则首个已发现平台，再否则 claude。
func (s *Server) defaultPlatform() string {
	ids := s.platformIDs()
	for _, id := range ids {
		if id == "claude" {
			return "claude"
		}
	}
	if len(ids) > 0 {
		return ids[0]
	}
	return "claude"
}

// platformFromSkillDir 从 ~/.<工具>/skills/<name> 形态的 skill 目录反推平台 id。
// 推断不出（不含 .<工具> 段）回退 claude。
func platformFromSkillDir(dir string) string {
	platDir := filepath.Dir(filepath.Dir(dir)) // .../.codex/skills/<name> → .../.codex
	id := strings.TrimPrefix(filepath.Base(platDir), ".")
	if platformIDRe.MatchString(id) {
		return id
	}
	return "claude"
}

// handleListPlatforms 返回当前发现的平台列表（id + 展示名）与默认落地平台，供前端动态渲染。
func (s *Server) handleListPlatforms(w http.ResponseWriter, r *http.Request) {
	ids := s.platformIDs()
	out := make([]map[string]string, 0, len(ids))
	for _, id := range ids {
		out = append(out, map[string]string{"id": id, "label": platformLabel(id)})
	}
	writeJSON(w, http.StatusOK, map[string]any{"platforms": out, "default": s.defaultPlatform()})
}
