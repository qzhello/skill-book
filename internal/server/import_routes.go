package server

import (
	"context"
	"io"
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
	destDir := filepath.Join(home, ".claude", "skills", name)
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
		Source: model.SourceUser, Dir: destDir, FilePath: destMD,
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
	rawURL := s.rawBase(githubsrc.RawSkillURL(owner, repo, src.SourceRef, src.SourceSubpath))

	remote, ferr := fetchRaw(r.Context(), rawURL)
	if ferr != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "抓取上游失败"})
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
		Content string `json:"content"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	// 可恢复：若不在 git 工作树内，先把现有 SKILL.md 备份为同目录 .bak。
	if !insideGitWorktree(sk.Dir) {
		if existing, err := os.ReadFile(sk.FilePath); err == nil {
			bak := sk.FilePath + ".bak"
			_ = os.WriteFile(bak, existing, 0o644)
		}
	}

	// editor.Save 提供越界防护；在 git 内则提交。repoRoot 用 skill 目录父级。
	ed := editor.New(filepath.Dir(sk.Dir))
	if err := ed.Save(sk.FilePath, body.Content); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	content, _ := os.ReadFile(sk.FilePath)
	name, desc, _ := scanner.ParseFrontmatter(content)
	if name == "" {
		name = filepath.Base(sk.Dir)
	}
	var mtime int64
	if info, err := os.Stat(sk.FilePath); err == nil {
		mtime = info.ModTime().Unix()
	}
	updated := model.Skill{Source: sk.Source, Dir: sk.Dir, FilePath: sk.FilePath,
		Name: name, Description: desc, Body: string(content),
		BodyHash: model.HashBody(string(content)), MTime: mtime}
	if err := s.st.Upsert(updated); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "applied"})
}

// rawBase 允许测试用假 raw 服务覆盖默认地址；生产返回原 url。
func (s *Server) rawBase(u string) string {
	if s.rawBaseOverride != "" {
		return s.rawBaseOverride
	}
	return u
}

// fetchRaw 带超时与大小上限地抓取一个 raw url，返回正文。
func fetchRaw(ctx context.Context, rawURL string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, fetchTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}
	client := &http.Client{Timeout: fetchTimeout}
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

func (e *httpErr) Error() string { return e.msg }

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
