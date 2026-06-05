// Package githubsrc 解析 github 仓库 URL 并拼接只读抓取地址。
//
// 安全主线：所有出站克隆/抓取仅允许 github.com 系主机（github.com /
// raw.githubusercontent.com）。ParseURL 拒绝任何非 github.com 主机，
// 并对 owner/repo/ref/subpath 做严格字符集校验，杜绝注入到 git refspec
// 或文件路径（禁止 `..`、空格、shell 元字符等）。
package githubsrc

import (
	"errors"
	"net/url"
	"path"
	"regexp"
	"strings"
)

// 允许的主机白名单。出站请求只允许这些主机。
const (
	HostGitHub = "github.com"
	HostRaw    = "raw.githubusercontent.com"
)

// segmentRe 限定 owner/repo/ref 的单段字符集：字母数字、连字符、下划线、点。
// 不允许斜杠、空格、shell 元字符，且后续单独检查禁止 ".." 段。
var segmentRe = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

// subSegmentRe 限定 subpath 每一段：与 segmentRe 相同字符集。
var subSegmentRe = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

var (
	ErrNotGitHub = errors.New("仅支持 https://github.com/ 开头的地址")
	ErrBadURL    = errors.New("无法解析的 github 地址")
	ErrBadChars  = errors.New("地址中包含非法字符")
)

// ParseURL 解析 github 仓库地址，返回 owner/repo/ref/subpath。
//
// 仅接受 https://github.com/... 形态，支持：
//   - /owner/repo                       → subpath="", ref=""
//   - /owner/repo/tree/<ref>/<subpath>  → 子目录
//   - /owner/repo/blob/<ref>/<path>     → subpath = 该文件所在目录
//
// ref 缺省返回 ""（调用方用默认分支）。非 github.com 主机返回 ErrNotGitHub。
func ParseURL(u string) (owner, repo, ref, subpath string, err error) {
	parsed, perr := url.Parse(strings.TrimSpace(u))
	if perr != nil {
		return "", "", "", "", ErrBadURL
	}
	if parsed.Scheme != "https" {
		return "", "", "", "", ErrNotGitHub
	}
	if !strings.EqualFold(parsed.Host, HostGitHub) {
		return "", "", "", "", ErrNotGitHub
	}

	// 切分路径段，去掉空段。
	raw := strings.Trim(parsed.Path, "/")
	if raw == "" {
		return "", "", "", "", ErrBadURL
	}
	segs := strings.Split(raw, "/")
	if len(segs) < 2 {
		return "", "", "", "", ErrBadURL
	}

	owner = segs[0]
	repo = strings.TrimSuffix(segs[1], ".git")
	if !validSegment(owner) || !validSegment(repo) {
		return "", "", "", "", ErrBadChars
	}

	// 仅 owner/repo。
	if len(segs) == 2 {
		return owner, repo, "", "", nil
	}

	mode := segs[2]
	if (mode != "tree" && mode != "blob") || len(segs) < 4 {
		return "", "", "", "", ErrBadURL
	}
	ref = segs[3]
	if !validSegment(ref) {
		return "", "", "", "", ErrBadChars
	}

	rest := segs[4:]
	if mode == "blob" {
		// blob 指向文件：subpath = 文件所在目录（去掉最后一段文件名）。
		if len(rest) > 0 {
			rest = rest[:len(rest)-1]
		}
	}
	if len(rest) > 0 {
		for _, seg := range rest {
			if !validSubSegment(seg) {
				return "", "", "", "", ErrBadChars
			}
		}
		subpath = path.Join(rest...)
	}
	return owner, repo, ref, subpath, nil
}

// validSegment 校验 owner/repo/ref 单段：非空、字符集合法、非 "." 或 ".."。
func validSegment(s string) bool {
	if s == "" || s == "." || s == ".." {
		return false
	}
	return segmentRe.MatchString(s)
}

// validSubSegment 校验 subpath 单段，规则同 validSegment（拒绝 ".."）。
func validSubSegment(s string) bool {
	if s == "" || s == "." || s == ".." {
		return false
	}
	return subSegmentRe.MatchString(s)
}

// RawSkillURL 拼接 raw.githubusercontent.com 上 SKILL.md 的只读地址。
// ref 为空时用 "HEAD"；subpath 为空时不含该段。
func RawSkillURL(owner, repo, ref, subpath string) string {
	if ref == "" {
		ref = "HEAD"
	}
	parts := []string{"https://" + HostRaw, owner, repo, ref}
	if subpath != "" {
		parts = append(parts, subpath)
	}
	parts = append(parts, "SKILL.md")
	return strings.Join(parts, "/")
}

// CloneURL 返回仓库的 https 克隆地址（只读公共仓库，无需 token）。
func CloneURL(owner, repo string) string {
	return "https://" + HostGitHub + "/" + owner + "/" + repo
}
