package backup

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

// fakeStore 内存实现 ArchiveStore，供服务测试使用。
type fakeStore struct {
	objs    map[string][]byte
	metas   map[string]map[string]string
	deleted []string
}

func newFakeStore() *fakeStore {
	return &fakeStore{objs: map[string][]byte{}, metas: map[string]map[string]string{}}
}
func (f *fakeStore) Put(_ context.Context, key string, data []byte, meta map[string]string) error {
	f.objs[key] = data
	f.metas[key] = meta
	return nil
}
func (f *fakeStore) List(_ context.Context) ([]ArchiveInfo, error) {
	var out []ArchiveInfo
	for k, d := range f.objs {
		name := k[len("skillbook/"):]
		fc := -1
		if f.metas[k] != nil {
			if v, ok := f.metas[k]["filecount"]; ok {
				if n := parseIntSafe(v); n >= 0 {
					fc = n
				}
			}
		}
		out = append(out, ArchiveInfo{Name: name, Key: k, Time: parseArchiveTime(name), Size: int64(len(d)), FileCount: fc})
	}
	// 倒序
	for i := 0; i < len(out); i++ {
		for j := i + 1; j < len(out); j++ {
			if out[j].Time > out[i].Time {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	return out, nil
}
func (f *fakeStore) Get(_ context.Context, key string) ([]byte, error) {
	d, ok := f.objs[key]
	if !ok {
		return nil, os.ErrNotExist
	}
	return d, nil
}
func (f *fakeStore) Delete(_ context.Context, key string) error {
	delete(f.objs, key)
	f.deleted = append(f.deleted, key)
	return nil
}
func (f *fakeStore) Test(_ context.Context) error { return nil }

func parseIntSafe(s string) int {
	n := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return -1
		}
		n = n*10 + int(c-'0')
	}
	return n
}

func newSvc(t *testing.T, fs *fakeStore) *Service {
	src := t.TempDir()
	os.WriteFile(filepath.Join(src, "SKILL.md"), []byte("x"), 0o644)
	return &Service{
		Srcs:     []SrcDir{{Sub: "claude", Path: src}},
		NewStore: func(Config) (ArchiveStore, error) { return fs, nil },
	}
}

func cfgOK() Config {
	return Config{Endpoint: "e", Bucket: "b", AccessKey: "ak", SecretKey: "sk", Prefix: "skillbook/"}
}

func TestPushUploadsArchive(t *testing.T) {
	fs := newFakeStore()
	s := newSvc(t, fs)
	res, err := s.Push(context.Background(), cfgOK())
	if err != nil {
		t.Fatalf("Push: %v", err)
	}
	if res.FileCount != 1 {
		t.Fatalf("FileCount=%d want 1", res.FileCount)
	}
	if len(fs.objs) != 1 {
		t.Fatalf("objs=%d want 1", len(fs.objs))
	}
}

func TestPushPrunesOldestBeyondKeepCount(t *testing.T) {
	fs := newFakeStore()
	// 预置 3 个旧归档，时间递增
	fs.objs["skillbook/skillbook-20260101-000000.tar.gz"] = []byte("a")
	fs.objs["skillbook/skillbook-20260102-000000.tar.gz"] = []byte("b")
	fs.objs["skillbook/skillbook-20260103-000000.tar.gz"] = []byte("c")
	s := newSvc(t, fs)
	cfg := cfgOK()
	cfg.KeepCount = 2
	if _, err := s.Push(context.Background(), cfg); err != nil {
		t.Fatalf("Push: %v", err)
	}
	// push 后共 4 个，保留 2 个 → 删 2 个最旧的（20260101、20260102）
	if len(fs.objs) != 2 {
		t.Fatalf("after prune objs=%d want 2 (deleted=%v)", len(fs.objs), fs.deleted)
	}
	if _, ok := fs.objs["skillbook/skillbook-20260101-000000.tar.gz"]; ok {
		t.Fatal("最旧归档应被删除")
	}
}

func TestRestoreSpecificVersion(t *testing.T) {
	fs := newFakeStore()
	s := newSvc(t, fs)
	// 先 push 生成一个归档
	if _, err := s.Push(context.Background(), cfgOK()); err != nil {
		t.Fatal(err)
	}
	list, _ := fs.List(context.Background())
	name := list[0].Name

	// 改恢复目标到新目录
	dst := t.TempDir()
	s.Srcs[0].Path = dst
	os.WriteFile(filepath.Join(dst, "stale.md"), []byte("stale"), 0o644)
	var trashed []string
	trashFn := func(p string) (string, error) { trashed = append(trashed, p); return p, os.RemoveAll(p) }

	res, err := s.Restore(context.Background(), cfgOK(), name, trashFn)
	if err != nil {
		t.Fatalf("Restore: %v", err)
	}
	if res.Restored != 1 {
		t.Fatalf("Restored=%d want 1", res.Restored)
	}
	if len(trashed) != 1 {
		t.Fatalf("旧目录应入废纸篓: %v", trashed)
	}
	if b, _ := os.ReadFile(filepath.Join(dst, "SKILL.md")); string(b) != "x" {
		t.Fatalf("恢复内容=%q want x", b)
	}
}

func TestRestoreRejectsBadName(t *testing.T) {
	fs := newFakeStore()
	s := newSvc(t, fs)
	_, err := s.Restore(context.Background(), cfgOK(), "../evil.tar.gz", func(p string) (string, error) { return p, nil })
	if err == nil {
		t.Fatal("非法归档名应被拒绝")
	}
}
