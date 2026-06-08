package backup

import (
	"path/filepath"
	"strings"
)

// withinDir 报告 target 是否落在 base 目录内（防路径逃逸）。
// 先 Clean 规范化两端，避免 `.`/冗余分隔符导致的非预期相对路径。
func withinDir(base, target string) bool {
	rel, err := filepath.Rel(filepath.Clean(base), filepath.Clean(target))
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}
