package scanner

import (
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"skillbook/internal/model"
)

// skipDirs 是递归扫描项目目录时跳过的重目录/缓存目录，避免扫到 vendored SKILL.md。
var skipDirs = map[string]bool{
	"node_modules": true, ".git": true, "vendor": true, "dist": true,
	"build": true, ".venv": true, "venv": true, "__pycache__": true, "target": true,
}

// Root 是一个扫描根目录及其来源/平台标签。
type Root struct {
	Path     string
	Source   model.Source
	Platform model.Platform
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
			if d.IsDir() {
				// 跳过常见重目录，避免在项目目录里扫到 vendored / 缓存的 SKILL.md。
				if skipDirs[d.Name()] && p != root.Path {
					return filepath.SkipDir
				}
				return nil
			}
			if d.Name() != "SKILL.md" {
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
			// 自定义扫描目录的 root.Platform 为空，按 SKILL.md 路径里的 .<工具> 段推断。
			platform := root.Platform
			if platform == "" {
				platform = model.Platform(inferPlatformFromPath(dir))
			}
			out = append(out, model.Skill{
				Source:      root.Source,
				Platform:    platform,
				Dir:         dir,
				FilePath:    p,
				Name:        name,
				Description: desc,
				Body:        string(content),
				BodyHash:    model.HashBody(string(content)),
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

// inferPlatformFromPath 从 skill 目录路径推断平台：取 "skills" 目录的上一级若是
// 点目录（如 .../.claude/skills/foo → claude）；推断不出回退 "claude"。
func inferPlatformFromPath(dir string) string {
	segs := strings.Split(dir, string(filepath.Separator))
	for i := 1; i < len(segs); i++ {
		if segs[i] == "skills" && strings.HasPrefix(segs[i-1], ".") && len(segs[i-1]) > 1 {
			return strings.TrimPrefix(segs[i-1], ".")
		}
	}
	return "claude"
}

// DiscoverPlatformIDs 在 base 下查找形如 .<工具>/skills 的目录，返回去掉前导点的
// 工具 id（如 .claude→claude）。平台不再写死：放进 ~/.<工具>/skills 的工具会被自动发现。
// 只认含 skills 子目录的点目录，从而把 .config/.cache 等噪声目录排除。
// 结果按字母序去重；不存在或不可读的 base 返回 nil。
func DiscoverPlatformIDs(base string) []string {
	entries, err := os.ReadDir(base)
	if err != nil {
		return nil
	}
	seen := map[string]bool{}
	var ids []string
	for _, e := range entries {
		name := e.Name()
		if len(name) < 2 || !strings.HasPrefix(name, ".") {
			continue
		}
		if name == ".Trash" || name == ".skillbook" {
			continue // 系统废纸篓与自管目录不作为平台
		}
		if !e.IsDir() {
			// 允许软链接到目录：用 Stat 再确认。
			if info, serr := os.Stat(filepath.Join(base, name)); serr != nil || !info.IsDir() {
				continue
			}
		}
		skillsDir := filepath.Join(base, name, "skills")
		if info, serr := os.Stat(skillsDir); serr != nil || !info.IsDir() {
			continue
		}
		id := strings.TrimPrefix(name, ".")
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	return ids
}

// discoverRoots 把 base 下发现的每个平台映射为一个带 source 标签的扫描根。
func discoverRoots(base string, src model.Source) []Root {
	ids := DiscoverPlatformIDs(base)
	roots := make([]Root, 0, len(ids))
	for _, id := range ids {
		roots = append(roots, Root{
			Path:     filepath.Join(base, "."+id, "skills"),
			Source:   src,
			Platform: model.Platform(id),
		})
	}
	return roots
}

// DefaultRoots 通过扫描发现本机平台：用户级取 ~/.<工具>/skills，项目级取 <cwd>/.<工具>/skills。
// 不再写死 claude/codex —— 任何把 skills 放进 .<工具>/skills 的工具都会被自动纳入。
// 不扫描插件目录（~/.claude/plugins）：插件 skill 只读、重复缓存多，是噪声。
func DefaultRoots(home, cwd string) []Root {
	roots := discoverRoots(home, model.SourceUser)
	roots = append(roots, discoverRoots(cwd, model.SourceProject)...)
	return roots
}
