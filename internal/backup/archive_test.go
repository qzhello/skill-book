package backup

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestPackUnpackRoundTrip(t *testing.T) {
	// 准备两个源目录（模拟 claude/codex）
	claudeSrc := t.TempDir()
	if err := os.WriteFile(filepath.Join(claudeSrc, "SKILL.md"), []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(claudeSrc, "sub"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(claudeSrc, "sub", "a.txt"), []byte("nested"), 0o644); err != nil {
		t.Fatal(err)
	}

	srcs := []SrcDir{{Sub: "claude", Path: claudeSrc}}
	data, man, err := packArchive(srcs, time.Unix(1700000000, 0).UTC())
	if err != nil {
		t.Fatalf("packArchive: %v", err)
	}
	if man.TotalFiles != 2 {
		t.Fatalf("TotalFiles=%d want 2", man.TotalFiles)
	}

	// 解包到新目标
	dstRoot := t.TempDir()
	claudeDst := filepath.Join(dstRoot, "claude-restored")
	dsts := map[string]string{"claude": claudeDst}
	trashed := []string{}
	trashFn := func(p string) (string, error) { trashed = append(trashed, p); return p, os.RemoveAll(p) }

	n, err := unpackArchive(data, dsts, trashFn)
	if err != nil {
		t.Fatalf("unpackArchive: %v", err)
	}
	if n != 1 {
		t.Fatalf("restored subs=%d want 1", n)
	}
	if b, _ := os.ReadFile(filepath.Join(claudeDst, "SKILL.md")); string(b) != "hello" {
		t.Fatalf("SKILL.md=%q want hello", b)
	}
	if b, _ := os.ReadFile(filepath.Join(claudeDst, "sub", "a.txt")); string(b) != "nested" {
		t.Fatalf("sub/a.txt=%q want nested", b)
	}
}

func TestUnpackTrashesExistingTargetOnce(t *testing.T) {
	claudeSrc := t.TempDir()
	os.WriteFile(filepath.Join(claudeSrc, "new.md"), []byte("new"), 0o644)
	data, _, err := packArchive([]SrcDir{{Sub: "claude", Path: claudeSrc}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}

	claudeDst := t.TempDir() // 已存在的旧目录
	os.WriteFile(filepath.Join(claudeDst, "old.md"), []byte("old"), 0o644)
	var trashed []string
	trashFn := func(p string) (string, error) { trashed = append(trashed, p); return p, os.RemoveAll(p) }

	if _, err := unpackArchive(data, map[string]string{"claude": claudeDst}, trashFn); err != nil {
		t.Fatal(err)
	}
	if len(trashed) != 1 || trashed[0] != claudeDst {
		t.Fatalf("trashed=%v want [%s]", trashed, claudeDst)
	}
	if _, err := os.Stat(filepath.Join(claudeDst, "old.md")); err == nil {
		t.Fatal("old.md 应已随旧目录被移走")
	}
}

func TestUnpackRejectsZipSlip(t *testing.T) {
	// 手工构造含越权路径 ../evil 的恶意归档
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gz)
	payload := []byte("pwned")
	hdr := &tar.Header{Name: "claude/../../evil.txt", Mode: 0o644, Size: int64(len(payload)), Typeflag: tar.TypeReg}
	if err := tw.WriteHeader(hdr); err != nil {
		t.Fatal(err)
	}
	tw.Write(payload)
	tw.Close()
	gz.Close()

	claudeDst := t.TempDir()
	parent := filepath.Dir(claudeDst)
	trashFn := func(p string) (string, error) { return p, nil }
	// 不应报错地"成功"写出越权文件：要么跳过要么返回错误，但绝不能在 parent 写出 evil.txt
	_, _ = unpackArchive(buf.Bytes(), map[string]string{"claude": claudeDst}, trashFn)
	if _, err := os.Stat(filepath.Join(parent, "evil.txt")); err == nil {
		t.Fatal("zip-slip 越权文件被写出，防护失效")
	}
}
