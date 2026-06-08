package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"skillbook/internal/editor"
	"skillbook/internal/githubsrc"
	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

const (
	cloneTimeout   = 60 * time.Second // git clone 上限
	fetchTimeout   = 15 * time.Second // raw 抓取上限
	rawMaxBody     = 2 << 20          // 2 MiB，限制 raw SKILL.md 大小
	importSyncPlcy = "check_only"     // 导入的默认同步策略
)

// gitClone 是默认的 clone 执行器：浅克隆公共仓库到 destDir。
// ref 非空时加 --branch。使用 CommandContext 以受超时控制。
func gitClone(ctx context.Context, cloneURL, ref, destDir string) error {
	args := []string{"clone", "--depth", "1"}
	if ref != "" {
		args = append(args, "--branch", ref)
	}
	args = append(args, "--", cloneURL, destDir)
	cmd := exec.CommandContext(ctx, "git", args...)
	// 禁用任何交互式凭据提示，避免公共仓库以外的卡顿。
	cmd.Env = append(os.Environ(), "GIT_TERMINAL_PROMPT=0")
	return cmd.Run()
}

// handleImport 从 github 仓库导入一个 skill 到 ~/.claude/skills/<name>/。
//
// 安全：url 必须经 githubsrc.ParseURL（仅 github.com、严格字符集）；clone
// 目标为临时目录，用后即删；落点目录用 filepath 校验在临时/目标目录内；
// 不覆盖已存在的目标目录。
func (s *Server) handleImport(w http.ResponseWriter, r *http.Request) {
	var body struct {
		URL  string `json:"url"`
		Name string `json:"name"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	owner, repo, ref, subpath, err := githubsrc.ParseURL(body.URL)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// 目标 skill 名：优先用户给定，否则取 subpath 基名或 repo 名。
	name := strings.TrimSpace(body.Name)
	if name == "" {
		if subpath != "" {
			name = filepath.Base(subpath)
		} else {
			name = repo
		}
	}
	if !skillNameRe.MatchString(name) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name 仅允许小写字母、数字与连字符，且不能以连字符开头"})
		return
	}

	home, err := os.UserHomeDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	destPlat := s.defaultPlatform()
	destDir := filepath.Join(home, "."+destPlat, "skills", name)
	if _, err := os.Stat(destDir); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "该 skill 已存在"})
		return
	}

	tmp, err := os.MkdirTemp("", "skillbook-import-")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer os.RemoveAll(tmp)
	cloneRoot := filepath.Join(tmp, "repo")

	ctx, cancel := context.WithTimeout(r.Context(), cloneTimeout)
	defer cancel()
	cloneURL := githubsrc.CloneURL(owner, repo)
	if err := s.cloneFn(ctx, cloneURL, ref, cloneRoot); err != nil {
		// 不回显完整 git 错误（可能含 URL），仅给通用提示。
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "克隆仓库失败"})
		return
	}

	srcURL := cloneURL
	id, name, herr := s.importFromClone(cloneRoot, subpath, name, destDir, srcURL, ref)
	if herr != nil {
		writeJSON(w, herr.code, map[string]string{"error": herr.msg})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"id": id, "name": name})
}

// httpErr 携带状态码的内部错误。
type httpErr struct {
	code int
	msg  string
}

// importFromClone 在已克隆的仓库目录上完成定位 + 拷贝 + 入库 + 写来源。
// 与 clone 执行解耦，便于用本地 file:// 仓库在不联网下测试。
//
// cloneRoot 为已克隆仓库根；subpath 为仓库内 skill 子目录；name 为目标 skill
// 名；destDir 为 ~/.claude/skills/<name>；srcURL/ref 写入来源记录。
func (s *Server) importFromClone(cloneRoot, subpath, name, destDir, srcURL, ref string) (string, string, *httpErr) {
	// 定位 skill 目录，并确保落点在 cloneRoot 内（防 subpath 逃逸）。
	skillSrc := cloneRoot
	if subpath != "" {
		skillSrc = filepath.Join(cloneRoot, filepath.FromSlash(subpath))
		if !withinDir(cloneRoot, skillSrc) {
			return "", "", &httpErr{http.StatusBadRequest, "非法 subpath"}
		}
	}
	skillMD := filepath.Join(skillSrc, "SKILL.md")
	if st, err := os.Stat(skillMD); err != nil || st.IsDir() {
		return "", "", &httpErr{http.StatusUnprocessableEntity, "目标目录下没有 SKILL.md"}
	}

	// 不覆盖已存在目录（二次确认，clone 期间可能被并发创建）。
	if _, err := os.Stat(destDir); err == nil {
		return "", "", &httpErr{http.StatusConflict, "该 skill 已存在"}
	}
	if err := copyDir(skillSrc, destDir); err != nil {
		return "", "", &httpErr{http.StatusInternalServerError, err.Error()}
	}

	// 取克隆仓库的 HEAD sha 作为来源 rev（失败不致命）。
	sha, _ := runGit(cloneRoot, "rev-parse", "HEAD")

	destMD := filepath.Join(destDir, "SKILL.md")
	content, err := os.ReadFile(destMD)
	if err != nil {
		return "", "", &httpErr{http.StatusInternalServerError, err.Error()}
	}
	pname, desc, _ := scanner.ParseFrontmatter(content)
	if pname == "" {
		pname = name
	}
	var mtime int64
	if info, err := os.Stat(destMD); err == nil {
		mtime = info.ModTime().Unix()
	}
	sk := model.Skill{
		Source: model.SourceUser, Platform: model.Platform(platformFromSkillDir(destDir)), Dir: destDir, FilePath: destMD,
		Name: pname, Description: desc, Body: string(content),
		BodyHash: model.HashBody(string(content)), MTime: mtime,
	}
	if err := s.st.Upsert(sk); err != nil {
		return "", "", &httpErr{http.StatusInternalServerError, err.Error()}
	}

	id := sk.ID()
	src := store.Source{
		SkillID:       id,
		SourceKind:    "github_repo",
		SourceURL:     srcURL,
		SourceRef:     ref,
		SourceSubpath: subpath,
		SourceRev:     sha,
		SyncPolicy:    importSyncPlcy,
		UpdatedAt:     time.Now().Unix(),
	}
	if err := s.st.PutSource(src); err != nil {
		return "", "", &httpErr{http.StatusInternalServerError, err.Error()}
	}
	return id, name, nil
}

// handleSourceCheck 抓取 github 上游 SKILL.md，比较 hash 判断是否有更新。
func (s *Server) handleSourceCheck(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sk, err := s.st.Get(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	src, found, err := s.st.GetSource(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if !found || src.SourceKind != "github_repo" || src.SourceURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "该 skill 没有 github 来源"})
		return
	}

	owner, repo, _, _, perr := githubsrc.ParseURL(src.SourceURL)
	if perr != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": perr.Error()})
		return
	}
	token := src.Token
	rawURL := s.upstreamSkillURL(owner, repo, src.SourceRef, src.SourceSubpath, token)

	remote, ferr := fetchRaw(r.Context(), rawURL, token)
	if ferr != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": fetchFailMessage(rawURL, ferr, token != "")})
		return
	}
	remoteHash := model.HashBody(remote)
	localHash := model.HashBody(sk.Body)
	writeJSON(w, http.StatusOK, map[string]any{
		"has_update":     remoteHash != localHash,
		"local_hash":     localHash,
		"remote_hash":    remoteHash,
		"remote_content": remote,
		"remote_rev":     "",
	})
}

// handleSourceApply 把上游内容写入本地 SKILL.md，可恢复并重新入库。
func (s *Server) handleSourceApply(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sk, err := s.st.Get(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	var body struct {
		Content string   `json:"content"`
		Targets []string `json:"targets"` // 安装到哪些平台：claude/codex；空则沿用该 skill 当前所在文件
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	targets := sanitizeTargetList(body.Targets)
	// 无目标：保持旧行为，原地覆写该 skill 自身的 SKILL.md。
	if len(targets) == 0 {
		if err := s.writeSkillFile(sk.Dir, sk.FilePath, sk.Source, sk.Platform, body.Content); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		_ = s.st.SetSourceUpdateFlag(id, false, time.Now().Unix())
		writeJSON(w, http.StatusOK, map[string]any{"status": "applied", "installed": []string{string(sk.Platform)}})
		return
	}

	// 有目标：写到每个所选平台的用户级目录 ~/.<plat>/skills/<name>/SKILL.md（可新建）。
	home, _ := os.UserHomeDir()
	name, _, _ := scanner.ParseFrontmatter([]byte(body.Content))
	if name == "" {
		name = filepath.Base(sk.Dir)
	}
	installed := []string{}
	for _, plat := range targets {
		dir := filepath.Join(home, "."+plat, "skills", name)
		file := filepath.Join(dir, "SKILL.md")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		if err := s.writeSkillFile(dir, file, model.SourceUser, model.Platform(plat), body.Content); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		installed = append(installed, plat)
	}
	_ = s.st.SetSourceUpdateFlag(id, false, time.Now().Unix())
	writeJSON(w, http.StatusOK, map[string]any{"status": "applied", "installed": installed})
}

// sanitizeTargetList 仅保留合法平台 id（可插拔，见 platformIDRe）并去重。
func sanitizeTargetList(in []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, p := range in {
		p = strings.TrimSpace(p)
		if platformIDRe.MatchString(p) && !seen[p] {
			seen[p] = true
			out = append(out, p)
		}
	}
	return out
}

// writeSkillFile 写入（覆盖）一个 SKILL.md：非 git 树先存 .bak、越界防护、并重新入库。
func (s *Server) writeSkillFile(dir, file string, source model.Source, platform model.Platform, content string) error {
	if !insideGitWorktree(dir) {
		if existing, err := os.ReadFile(file); err == nil {
			if err := os.WriteFile(file+".bak", existing, 0o644); err != nil {
				log.Printf("apply: 备份 %s 失败: %v（仍继续覆写）", file+".bak", err)
			}
		}
	}
	ed := editor.New(filepath.Dir(dir))
	if err := ed.Save(file, content); err != nil {
		return err
	}
	data, _ := os.ReadFile(file)
	name, desc, _ := scanner.ParseFrontmatter(data)
	if name == "" {
		name = filepath.Base(dir)
	}
	var mtime int64
	if info, err := os.Stat(file); err == nil {
		mtime = info.ModTime().Unix()
	}
	return s.st.Upsert(model.Skill{
		Source: source, Platform: platform, Dir: dir, FilePath: file,
		Name: name, Description: desc, Body: string(data),
		BodyHash: model.HashBody(string(data)), MTime: mtime,
	})
}

// rawBase 允许测试用假 raw 服务覆盖默认地址；生产返回原 url。
func (s *Server) rawBase(u string) string {
	if s.rawBaseOverride != "" {
		return s.rawBaseOverride
	}
	return u
}

// fetchRaw 带超时与大小上限地抓取一个 url，返回正文。
// token 非空时放进 Authorization 头（用于私有仓库的 Contents API）；
// 对 api.github.com 还会带上 raw media type 头以返回原始文件内容。
func fetchRaw(ctx context.Context, rawURL, token string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, fetchTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if strings.Contains(strings.ToLower(rawURL), githubsrc.HostAPI) {
		req.Header.Set("Accept", "application/vnd.github.raw")
	}
	client := &http.Client{
		Timeout: fetchTimeout,
		// 纵深防御：拒绝跳转到非 github 系主机，避免 SSRF。
		CheckRedirect: func(req *http.Request, _ []*http.Request) error {
			h := strings.ToLower(req.URL.Hostname())
			if h != githubsrc.HostRaw && h != githubsrc.HostGitHub && h != githubsrc.HostAPI {
				return fmt.Errorf("blocked redirect to non-github host: %s", h)
			}
			return nil
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", &httpErr{resp.StatusCode, "non-200"}
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, rawMaxBody))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// upstreamSkillURL 根据是否有 token 选择抓取地址：
// 有 token → Contents API（可读私有仓库）；无 token → 公共 raw 域名。
// 经 s.rawBase 透传以便测试覆盖。
func (s *Server) upstreamSkillURL(owner, repo, ref, subpath, token string) string {
	if token != "" {
		return s.rawBase(githubsrc.ContentsAPIURL(owner, repo, ref, subpath))
	}
	return s.rawBase(githubsrc.RawSkillURL(owner, repo, ref, subpath))
}

func (e *httpErr) Error() string { return e.msg }

// fetchFailMessage 把抓取失败映射为可诊断的中文信息，并附上实际尝试的 URL。
// hasToken 表示当前是否已配置来源访问令牌，用于在 404/401/403 时给出不同建议：
// 未配令牌 → 提示"可能是私有仓库，去设置里配置访问令牌"；已配 → 提示检查令牌权限。
func fetchFailMessage(rawURL string, err error, hasToken bool) string {
	var he *httpErr
	if errors.As(err, &he) {
		switch he.code {
		case http.StatusNotFound, http.StatusUnauthorized, http.StatusForbidden:
			if hasToken {
				return fmt.Sprintf("无法访问上游（HTTP %d）：已配置访问令牌，请确认该令牌对此仓库有读取权限（repo scope），以及链接/分支/子路径正确。尝试地址：%s", he.code, rawURL)
			}
			return fmt.Sprintf("无法访问上游（HTTP %d）：仓库不存在或为私有仓库。若是私有仓库，请到「设置」配置 GitHub 访问令牌后重试；否则检查链接/分支/子路径。尝试地址：%s", he.code, rawURL)
		default:
			return fmt.Sprintf("上游返回 HTTP %d。尝试地址：%s", he.code, rawURL)
		}
	}
	return "网络抓取失败：" + err.Error() + "。尝试地址：" + rawURL
}

// insideGitWorktree 报告 dir 是否在某个 git 工作树内。
func insideGitWorktree(dir string) bool {
	_, err := runGit(dir, "rev-parse", "--is-inside-work-tree")
	return err == nil
}

// withinDir 报告 target 是否落在 base 目录内（防路径逃逸）。
func withinDir(base, target string) bool {
	rel, err := filepath.Rel(base, target)
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

// copyDir 递归拷贝 src 到 dst，跳过 .git 目录。
func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	for _, e := range entries {
		if e.Name() == ".git" {
			continue
		}
		sp := filepath.Join(src, e.Name())
		dp := filepath.Join(dst, e.Name())
		if e.IsDir() {
			if err := copyDir(sp, dp); err != nil {
				return err
			}
			continue
		}
		if !e.Type().IsRegular() {
			continue // 跳过符号链接等特殊文件
		}
		data, err := os.ReadFile(sp)
		if err != nil {
			return err
		}
		if err := os.WriteFile(dp, data, 0o644); err != nil {
			return err
		}
	}
	return nil
}
