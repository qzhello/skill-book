package server

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"skillbook/internal/model"
	"skillbook/internal/scanner"
)

// 扫描目录配置：在默认自动发现的 ~/.<工具>/skills 之外，允许用户增删要扫描的"项目目录"，
// 并可取消勾选某些默认目录。持久化于 ~/.skillbook/scan-dirs.json。
//
// 每个额外目录即一个"项目"，递归扫描其下所有 SKILL.md；项目名默认取文件夹名，可自定义。
type extraDir struct {
	Path string `json:"path"`
	Name string `json:"name"` // 项目名，空则取 filepath.Base(Path)
}
type scanDirsConfig struct {
	Disabled []string   `json:"disabled"` // 被取消勾选的目录绝对路径
	Extra    []extraDir `json:"extra"`    // 用户额外添加的项目目录
}

// projName 返回项目名：自定义优先，否则文件夹名。
func (e extraDir) projName() string {
	if n := strings.TrimSpace(e.Name); n != "" {
		return n
	}
	return filepath.Base(e.Path)
}

// projectOf 判断某 skill 目录属于哪个项目（按额外目录前缀匹配，取最长匹配）。
// 不属于任何额外目录返回 ""（即"全局/用户级"）。
func (s *Server) projectOf(dir string) string {
	cfg := loadScanDirs()
	best, name := "", ""
	for _, e := range cfg.Extra {
		p := filepath.Clean(e.Path)
		if (dir == p || strings.HasPrefix(dir, p+string(filepath.Separator))) && len(p) > len(best) {
			best, name = p, e.projName()
		}
	}
	return name
}

func scanDirsPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "scan-dirs.json"), nil
}

func loadScanDirs() scanDirsConfig {
	var cfg scanDirsConfig
	path, err := scanDirsPath()
	if err != nil {
		return cfg
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return cfg
	}
	_ = json.Unmarshal(raw, &cfg)
	return cfg
}

func saveScanDirs(cfg scanDirsConfig) error {
	path, err := scanDirsPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	raw, _ := json.MarshalIndent(cfg, "", "  ")
	return os.WriteFile(path, raw, 0o644)
}

// effectiveRoots 计算本次扫描的有效目录：默认自动发现的 roots 去掉被禁用的，
// 再加上用户额外添加且未禁用的目录（额外目录平台留空，按路径推断）。
func (s *Server) effectiveRoots() []scanner.Root {
	cfg := loadScanDirs()
	disabled := map[string]bool{}
	for _, p := range cfg.Disabled {
		disabled[p] = true
	}
	var out []scanner.Root
	for _, r := range s.roots {
		if !disabled[r.Path] {
			out = append(out, r)
		}
	}
	for _, e := range cfg.Extra {
		p := strings.TrimSpace(e.Path)
		if p == "" || disabled[p] {
			continue
		}
		out = append(out, scanner.Root{Path: p, Source: model.SourceProject, Platform: ""})
	}
	return out
}

// shortPath 把 home 前缀替换为 ~，便于展示。
func shortPath(p string) string {
	if home, err := os.UserHomeDir(); err == nil && strings.HasPrefix(p, home) {
		return "~" + strings.TrimPrefix(p, home)
	}
	return p
}

// handleBrowse 列出某目录下的子目录，供前端文件夹浏览器选择。path 为空则从 HOME 开始。
func (s *Server) handleBrowse(w http.ResponseWriter, r *http.Request) {
	home, _ := os.UserHomeDir()
	p := strings.TrimSpace(r.URL.Query().Get("path"))
	if p == "" {
		p = home
	}
	if !filepath.IsAbs(p) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "需要绝对路径"})
		return
	}
	p = filepath.Clean(p)
	entries, err := os.ReadDir(p)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "无法读取目录：" + err.Error()})
		return
	}
	type d struct {
		Name string `json:"name"`
		Path string `json:"path"`
	}
	dirs := []d{}
	for _, e := range entries {
		if !e.IsDir() {
			// 允许软链接到目录
			if info, serr := os.Stat(filepath.Join(p, e.Name())); serr != nil || !info.IsDir() {
				continue
			}
		}
		dirs = append(dirs, d{Name: e.Name(), Path: filepath.Join(p, e.Name())})
	}
	parent := filepath.Dir(p)
	if parent == p {
		parent = "" // 已到根
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"path": p, "short": shortPath(p), "parent": parent, "home": home, "dirs": dirs,
	})
}

// handleGetScanDirs 返回默认目录（含勾选态）与额外目录列表。
func (s *Server) handleGetScanDirs(w http.ResponseWriter, _ *http.Request) {
	cfg := loadScanDirs()
	disabled := map[string]bool{}
	for _, p := range cfg.Disabled {
		disabled[p] = true
	}
	type dir struct {
		Path    string `json:"path"`
		Short   string `json:"short"`
		Label   string `json:"label"`
		Name    string `json:"name"`
		Enabled bool   `json:"enabled"`
	}
	auto := make([]dir, 0, len(s.roots))
	for _, r := range s.roots {
		auto = append(auto, dir{
			Path:    r.Path,
			Short:   shortPath(r.Path),
			Label:   platformLabel(string(r.Platform)),
			Enabled: !disabled[r.Path],
		})
	}
	extra := make([]dir, 0, len(cfg.Extra))
	for _, e := range cfg.Extra {
		extra = append(extra, dir{Path: e.Path, Short: shortPath(e.Path), Name: e.projName(), Enabled: !disabled[e.Path]})
	}
	writeJSON(w, http.StatusOK, map[string]any{"auto": auto, "extra": extra})
}

// handlePutScanDirs 保存扫描目录配置：disabled 为取消勾选的路径，extra 为额外目录。
// 额外目录必须是绝对路径。
func (s *Server) handlePutScanDirs(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Disabled []string   `json:"disabled"`
		Extra    []extraDir `json:"extra"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	seen := map[string]bool{}
	extra := []extraDir{}
	for _, e := range body.Extra {
		p := strings.TrimSpace(e.Path)
		if p == "" || seen[p] {
			continue
		}
		if !filepath.IsAbs(p) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "扫描目录必须是绝对路径：" + p})
			return
		}
		seen[p] = true
		extra = append(extra, extraDir{Path: filepath.Clean(p), Name: strings.TrimSpace(e.Name)})
	}
	dis := []string{}
	dseen := map[string]bool{}
	for _, p := range body.Disabled {
		p = strings.TrimSpace(p)
		if p != "" && !dseen[p] {
			dseen[p] = true
			dis = append(dis, p)
		}
	}
	if err := saveScanDirs(scanDirsConfig{Disabled: dis, Extra: extra}); err != nil {
		log.Printf("scandirs: save failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存失败，请重试"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}
