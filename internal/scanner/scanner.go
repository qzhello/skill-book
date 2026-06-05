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

// DefaultRoots 返回本机标准来源：仅用户自管理的 skill（用户级 + 项目级）。
// 不再扫描 ~/.claude/plugins —— 插件 skill 由插件系统管理、只读且大量重复缓存，
// 是噪声而非用户要治理的对象。Codex 用户级目录存在才会被扫到（ScanRoots 跳过缺失根）。
func DefaultRoots(home, cwd string) []Root {
	return []Root{
		{Path: filepath.Join(home, ".claude", "skills"), Source: model.SourceUser},
		{Path: filepath.Join(cwd, ".claude", "skills"), Source: model.SourceProject},
		{Path: filepath.Join(home, ".codex", "skills"), Source: model.SourceUser},
	}
}
