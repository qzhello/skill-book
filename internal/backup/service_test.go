package backup

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// fakeRunner 记录所有 git 调用，并按 args 前缀返回预设输出。
type fakeRunner struct {
	calls   [][]string
	envs    [][]string
	outputs map[string]string // key: 以空格连接的 args 前缀匹配
}

func (f *fakeRunner) run(_ context.Context, _ string, env []string, args ...string) (string, error) {
	f.calls = append(f.calls, args)
	f.envs = append(f.envs, env)
	joined := strings.Join(args, " ")
	for k, v := range f.outputs {
		if strings.Contains(joined, k) {
			return v, nil
		}
	}
	return "", nil
}

func newService(t *testing.T, f *fakeRunner) *Service {
	return &Service{
		WorkDir: filepath.Join(t.TempDir(), "backup"),
		Run:     f.run,
		Srcs: []SrcDir{
			{Sub: "claude", Path: filepath.Join(t.TempDir(), "claude-src")},
		},
	}
}

// 仅作测试哨兵字符串（断言它不出现在 git 参数里），刻意不用真实 PAT 前缀。
const secretToken = "FAKE-SENTINEL-TOKEN-DO-NOT-USE-0001"

// assertNoTokenLeak 断言 token 的“值”从未出现在任何 git 命令行参数里。
func assertNoTokenLeak(t *testing.T, f *fakeRunner) {
	t.Helper()
	for _, call := range f.calls {
		for _, a := range call {
			if strings.Contains(a, secretToken) {
				t.Fatalf("token 泄漏进 git 参数: %v", call)
			}
		}
	}
}

func TestPushCommitsAndPushesWhenChanged(t *testing.T) {
	f := &fakeRunner{outputs: map[string]string{"status --porcelain": " M claude/x\n"}}
	s := newService(t, f)
	// 准备源文件
	src := s.Srcs[0].Path
	if err := os.MkdirAll(src, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(src, "SKILL.md"), []byte("hi"), 0o644); err != nil {
		t.Fatal(err)
	}

	cfg := Config{RepoURL: "https://github.com/me/bk", Token: secretToken}
	res, err := s.Push(context.Background(), cfg)
	if err != nil {
		t.Fatalf("Push: %v", err)
	}
	if !res.Changed {
		t.Fatalf("expected Changed=true")
	}
	if !hasCall(f, "commit") || !hasCall(f, "push") {
		t.Fatalf("expected commit+push, calls: %v", f.calls)
	}
	assertNoTokenLeak(t, f)
	// token 必须经环境变量传递
	if !envHasToken(f) {
		t.Fatalf("token 应通过 SKILLBOOK_GIT_TOKEN 环境变量传递")
	}
}

func TestPushSkipsWhenNoChange(t *testing.T) {
	f := &fakeRunner{outputs: map[string]string{"status --porcelain": "\n"}}
	s := newService(t, f)
	if err := os.MkdirAll(s.Srcs[0].Path, 0o755); err != nil {
		t.Fatal(err)
	}
	res, err := s.Push(context.Background(), Config{RepoURL: "https://github.com/me/bk", Token: secretToken})
	if err != nil {
		t.Fatalf("Push: %v", err)
	}
	if res.Changed {
		t.Fatalf("expected Changed=false on no diff")
	}
	if hasCall(f, "commit") || hasCall(f, "push") {
		t.Fatalf("should not commit/push when clean, calls: %v", f.calls)
	}
	assertNoTokenLeak(t, f)
}

func TestRestoreTrashesThenRestores(t *testing.T) {
	f := &fakeRunner{}
	s := newService(t, f)
	// 工作仓库里放好“远程已拉取”的内容
	sub := filepath.Join(s.WorkDir, "claude")
	if err := os.MkdirAll(sub, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sub, "SKILL.md"), []byte("restored"), 0o644); err != nil {
		t.Fatal(err)
	}
	// 本地已有旧目录
	if err := os.MkdirAll(s.Srcs[0].Path, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(s.Srcs[0].Path, "old.md"), []byte("old"), 0o644); err != nil {
		t.Fatal(err)
	}

	var trashed []string
	trashFn := func(p string) (string, error) { trashed = append(trashed, p); return p, os.RemoveAll(p) }

	res, err := s.Restore(context.Background(), Config{RepoURL: "https://github.com/me/bk", Token: secretToken}, trashFn)
	if err != nil {
		t.Fatalf("Restore: %v", err)
	}
	if !res.Changed {
		t.Fatalf("expected restored")
	}
	if len(trashed) != 1 || trashed[0] != s.Srcs[0].Path {
		t.Fatalf("旧目录未被移废纸篓: %v", trashed)
	}
	if b, _ := os.ReadFile(filepath.Join(s.Srcs[0].Path, "SKILL.md")); string(b) != "restored" {
		t.Fatalf("恢复内容不正确: %q", b)
	}
	if !hasCall(f, "fetch") || !hasCall(f, "reset") {
		t.Fatalf("expected fetch+reset, calls: %v", f.calls)
	}
	assertNoTokenLeak(t, f)
}

func hasCall(f *fakeRunner, sub string) bool {
	for _, c := range f.calls {
		if strings.Contains(strings.Join(c, " "), sub) {
			return true
		}
	}
	return false
}

func envHasToken(f *fakeRunner) bool {
	for _, env := range f.envs {
		for _, e := range env {
			if e == "SKILLBOOK_GIT_TOKEN="+secretToken {
				return true
			}
		}
	}
	return false
}
