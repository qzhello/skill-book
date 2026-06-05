package optimizer

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// macOS 的 os.UserHomeDir() 读取 $HOME，故用 t.Setenv("HOME", tmp) 隔离。
func TestLoadWritesDefaultThenReads(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	// 首次 Load：文件不存在 → 落盘默认并返回默认内容。
	got, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if got != DefaultRules() {
		t.Fatalf("首次 Load 应返回默认规则，得到 %d 字节", len(got))
	}

	// 文件确实落盘了。
	path := filepath.Join(tmp, ".skillbook", "optimizer.md")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("默认规则未落盘: %v", err)
	}
	if string(raw) != DefaultRules() {
		t.Fatalf("落盘内容与默认不一致")
	}
	if !strings.Contains(string(raw), "Frontmatter") {
		t.Fatalf("默认规则内容缺少预期维度")
	}
}

func TestSaveThenLoadRoundTrip(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)

	custom := "# 我的自定义规则\n只看 frontmatter。"
	if err := Save(custom); err != nil {
		t.Fatalf("Save: %v", err)
	}
	got, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if got != custom {
		t.Fatalf("往返不一致: 期望 %q 得到 %q", custom, got)
	}
}

func TestPathFixed(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("HOME", tmp)
	p, err := Path()
	if err != nil {
		t.Fatalf("Path: %v", err)
	}
	want := filepath.Join(tmp, ".skillbook", "optimizer.md")
	if p != want {
		t.Fatalf("Path = %q, want %q", p, want)
	}
}
