package backup

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Runner 执行一次 git 调用：在 dir 下以 env 运行 `git args...`，返回 stdout。
// 抽成接口便于测试注入假执行器（无需真实 git / 网络）。
type Runner func(ctx context.Context, dir string, env []string, args ...string) (string, error)

// SrcDir 描述一个待备份的源目录及其在备份仓库内的子目录名。
type SrcDir struct {
	Sub  string // 备份仓库内子目录，如 "claude" / "codex"
	Path string // 本机源目录绝对路径
}

// Service 负责把若干源目录镜像进一个工作仓库并 push / restore。
type Service struct {
	WorkDir string   // 工作仓库，默认 ~/.skillbook/backup
	Run     Runner   // git 执行器
	Srcs    []SrcDir // 备份范围
}

// Result 概述一次操作结果。
type Result struct {
	Changed bool   `json:"changed"`
	Message string `json:"message"`
}

// Status 概述备份状态。
type Status struct {
	Configured     bool     `json:"configured"`
	RepoURL        string   `json:"repoURL"`
	Branch         string   `json:"branch"`
	LastBackupUnix int64    `json:"lastBackup"`
	Scope          []string `json:"scope"`
}

// DefaultService 构造默认服务：工作仓库 ~/.skillbook/backup，
// 备份范围为用户级 ~/.claude/skills 与 ~/.codex/skills。
func DefaultService(home string, run Runner) *Service {
	if run == nil {
		run = defaultRunner
	}
	return &Service{
		WorkDir: filepath.Join(home, ".skillbook", "backup"),
		Run:     run,
		Srcs: []SrcDir{
			{Sub: "claude", Path: filepath.Join(home, ".claude", "skills")},
			{Sub: "codex", Path: filepath.Join(home, ".codex", "skills")},
		},
	}
}

// ScopePaths 返回备份范围内的源目录路径（供前端展示）。
func (s *Service) ScopePaths() []string {
	out := make([]string, 0, len(s.Srcs))
	for _, d := range s.Srcs {
		out = append(out, d.Path)
	}
	return out
}

// defaultRunner 是生产用 git 执行器。
func defaultRunner(ctx context.Context, dir string, env []string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = dir
	cmd.Env = env
	var out, errb bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errb
	if err := cmd.Run(); err != nil {
		// stderr 可能含仓库 URL（非 token），上层不回显给用户。
		return out.String(), fmt.Errorf("git %s: %w: %s", args[0], err, strings.TrimSpace(errb.String()))
	}
	return out.String(), nil
}

// authArgs 返回让本次 git 通过环境变量 SKILLBOOK_GIT_TOKEN 完成认证的 -c 参数。
// 先清空已配置的 credential.helper（避免系统钥匙串干扰/泄露），再注入只读 env 的 helper。
// 关键：token 的“值”不出现在任何命令行参数里，只通过进程环境变量传递。
func authArgs() []string {
	return []string{
		"-c", "credential.helper=",
		"-c", `credential.helper=!f() { test "$1" = get && printf 'username=oauth2\npassword=%s\n' "$SKILLBOOK_GIT_TOKEN"; }; f`,
	}
}

// env 组装 git 运行环境；net 为真时注入 token 环境变量。
func gitEnv(cfg Config, net bool) []string {
	env := append(os.Environ(), "GIT_TERMINAL_PROMPT=0")
	if net {
		env = append(env, "SKILLBOOK_GIT_TOKEN="+cfg.Token)
	}
	return env
}

// git 执行一次仓库内 git 操作。net 为真时附带认证参数与 token 环境。
func (s *Service) git(ctx context.Context, cfg Config, net bool, args ...string) (string, error) {
	full := args
	if net {
		full = append(authArgs(), args...)
	}
	return s.Run(ctx, s.WorkDir, gitEnv(cfg, net), full...)
}

// ensureRepo 确保 WorkDir 是个绑定了 origin 的 git 工作仓库。
func (s *Service) ensureRepo(ctx context.Context, cfg Config) error {
	gitDir := filepath.Join(s.WorkDir, ".git")
	if _, err := os.Stat(gitDir); err == nil {
		// 已存在：同步 origin 地址（仓库地址可能被改过）。
		_, err := s.git(ctx, cfg, false, "remote", "set-url", "origin", cfg.RepoURL)
		return err
	}
	if err := os.MkdirAll(s.WorkDir, 0o700); err != nil {
		return err
	}
	if _, err := s.git(ctx, cfg, false, "init", "-b", cfg.EffectiveBranch()); err != nil {
		return err
	}
	// 设置本地提交身份，避免在缺省全局配置的机器上 commit 失败。
	if _, err := s.git(ctx, cfg, false, "config", "user.email", "skillbook@local"); err != nil {
		return err
	}
	if _, err := s.git(ctx, cfg, false, "config", "user.name", "SkillBook"); err != nil {
		return err
	}
	_, err := s.git(ctx, cfg, false, "remote", "add", "origin", cfg.RepoURL)
	return err
}

// Push 镜像所有源目录到工作仓库并提交、推送。无变更时不提交。
func (s *Service) Push(ctx context.Context, cfg Config) (Result, error) {
	if err := s.ensureRepo(ctx, cfg); err != nil {
		return Result{}, err
	}
	var fileCount int
	for _, d := range s.Srcs {
		dst := filepath.Join(s.WorkDir, d.Sub)
		if !withinDir(s.WorkDir, dst) {
			return Result{}, fmt.Errorf("非法子目录 %q", d.Sub)
		}
		if err := mirrorDir(d.Path, dst); err != nil {
			return Result{}, err
		}
		fileCount += countFiles(dst)
	}
	if _, err := s.git(ctx, cfg, false, "add", "-A"); err != nil {
		return Result{}, err
	}
	status, err := s.git(ctx, cfg, false, "status", "--porcelain")
	if err != nil {
		return Result{}, err
	}
	if strings.TrimSpace(status) == "" {
		return Result{Changed: false, Message: "没有变更，无需备份"}, nil
	}
	msg := fmt.Sprintf("backup: %s (%d files)", time.Now().UTC().Format(time.RFC3339), fileCount)
	if _, err := s.git(ctx, cfg, false, "commit", "-m", msg); err != nil {
		return Result{}, err
	}
	if _, err := s.git(ctx, cfg, true, "push", "origin", cfg.EffectiveBranch()); err != nil {
		return Result{}, err
	}
	return Result{Changed: true, Message: msg}, nil
}

// Restore 拉取远程最新内容并覆盖回本地源目录；被覆盖的源目录先移废纸篓。
// trashFn 注入便于测试（生产传 trash.ToTrash）。
func (s *Service) Restore(ctx context.Context, cfg Config, trashFn func(string) (string, error)) (Result, error) {
	if err := s.ensureRepo(ctx, cfg); err != nil {
		return Result{}, err
	}
	branch := cfg.EffectiveBranch()
	if _, err := s.git(ctx, cfg, true, "fetch", "origin", branch); err != nil {
		return Result{}, err
	}
	if _, err := s.git(ctx, cfg, false, "reset", "--hard", "origin/"+branch); err != nil {
		return Result{}, err
	}
	var restored int
	for _, d := range s.Srcs {
		sub := filepath.Join(s.WorkDir, d.Sub)
		if !withinDir(s.WorkDir, sub) {
			return Result{}, fmt.Errorf("非法子目录 %q", d.Sub)
		}
		if _, err := os.Stat(sub); err != nil {
			continue // 备份里没有该子目录，跳过
		}
		if _, err := os.Stat(d.Path); err == nil {
			if _, err := trashFn(d.Path); err != nil {
				return Result{}, fmt.Errorf("移动旧目录到废纸篓失败: %w", err)
			}
		}
		if err := copyTree(sub, d.Path); err != nil {
			return Result{}, err
		}
		restored++
	}
	return Result{Changed: restored > 0, Message: fmt.Sprintf("已恢复 %d 个目录", restored)}, nil
}

// Status 读取工作仓库最近一次提交时间作为“上次备份时间”。
func (s *Service) Status(ctx context.Context, cfg Config) Status {
	st := Status{
		Configured: cfg.Configured(),
		RepoURL:    cfg.RepoURL,
		Branch:     cfg.EffectiveBranch(),
		Scope:      s.ScopePaths(),
	}
	if out, err := s.git(ctx, cfg, false, "log", "-1", "--format=%ct"); err == nil {
		if ts, perr := strconv.ParseInt(strings.TrimSpace(out), 10, 64); perr == nil {
			st.LastBackupUnix = ts
		}
	}
	return st
}

// countFiles 统计 dir 下普通文件数（用于提交信息，失败返回 0）。
func countFiles(dir string) int {
	n := 0
	_ = filepath.WalkDir(dir, func(_ string, e os.DirEntry, err error) error {
		if err == nil && !e.IsDir() {
			n++
		}
		return nil
	})
	return n
}
