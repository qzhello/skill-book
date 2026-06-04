package scanner

import (
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
