package server

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"skillbook/internal/backup"
)

func TestBackupConfigPutThenGetHidesSecret(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPut, "/api/backup/config",
		`{"endpoint":"s3.amazonaws.com","bucket":"bk","accessKey":"AKIA","secretKey":"super-secret-xyz"}`)
	if rec.Code != 200 {
		t.Fatalf("put code=%d body=%s", rec.Code, rec.Body.String())
	}
	rec = do(t, srv, http.MethodGet, "/api/backup/config", "")
	body := rec.Body.String()
	if strings.Contains(body, "super-secret-xyz") {
		t.Fatalf("secret leaked: %s", body)
	}
	if !strings.Contains(body, `"hasSecret":true`) {
		t.Fatalf("expected hasSecret:true, got %s", body)
	}
}

func TestBackupConfigRejectsEmptyCore(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPut, "/api/backup/config", `{"endpoint":"","bucket":"b","accessKey":"a","secretKey":"s"}`)
	if rec.Code != 400 {
		t.Fatalf("expected 400 for empty endpoint, got %d", rec.Code)
	}
}

func TestBackupConfigKeepsSecretWhenBlank(t *testing.T) {
	srv := newSrv(t)
	do(t, srv, http.MethodPut, "/api/backup/config",
		`{"endpoint":"e","bucket":"b","accessKey":"a","secretKey":"first-secret"}`)
	// 第二次提交不带 secret，应保留原值
	do(t, srv, http.MethodPut, "/api/backup/config",
		`{"endpoint":"e","bucket":"b","accessKey":"a","secretKey":""}`)
	cfg := backup.Load()
	if cfg.SecretKey != "first-secret" {
		t.Fatalf("secret 应保留原值，got %q", cfg.SecretKey)
	}
}

func TestBackupPushUnconfigured(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/backup/push", "")
	if rec.Code != 400 {
		t.Fatalf("expected 400 when unconfigured, got %d", rec.Code)
	}
}

func TestBackupPushWithInjectedService(t *testing.T) {
	srv := newSrv(t)
	if err := backup.Save(backup.Config{Endpoint: "e", Bucket: "b", AccessKey: "a", SecretKey: "s"}); err != nil {
		t.Fatal(err)
	}
	src := t.TempDir()
	os.WriteFile(filepath.Join(src, "SKILL.md"), []byte("x"), 0o644)
	srv.backupSvc = &backup.Service{
		Srcs:     []backup.SrcDir{{Sub: "claude", Path: src}},
		NewStore: func(backup.Config) (backup.ArchiveStore, error) { return newMemStore(), nil },
	}
	rec := do(t, srv, http.MethodPost, "/api/backup/push", "")
	if rec.Code != 200 {
		t.Fatalf("push code=%d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"fileCount":1`) {
		t.Fatalf("expected fileCount:1, got %s", rec.Body.String())
	}
}

func TestBackupRestoreRejectsEmptyName(t *testing.T) {
	srv := newSrv(t)
	if err := backup.Save(backup.Config{Endpoint: "e", Bucket: "b", AccessKey: "a", SecretKey: "s"}); err != nil {
		t.Fatal(err)
	}
	rec := do(t, srv, http.MethodPost, "/api/backup/restore", `{"name":"  "}`)
	if rec.Code != 400 {
		t.Fatalf("expected 400 for blank name, got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestBackupListUnconfigured(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodGet, "/api/backup/list", "")
	if rec.Code != 400 {
		t.Fatalf("expected 400 when unconfigured, got %d", rec.Code)
	}
}

func TestBackupTestUnconfigured(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/backup/test", "")
	if rec.Code != 400 {
		t.Fatalf("expected 400 when unconfigured, got %d", rec.Code)
	}
}

// memStore 是路由测试用的内存 ArchiveStore。
type memStore struct{ objs map[string][]byte }

func newMemStore() *memStore { return &memStore{objs: map[string][]byte{}} }
func (m *memStore) Put(_ context.Context, key string, data []byte, _ map[string]string) error {
	m.objs[key] = data
	return nil
}
func (m *memStore) List(_ context.Context) ([]backup.ArchiveInfo, error) {
	out := []backup.ArchiveInfo{}
	for k, d := range m.objs {
		out = append(out, backup.ArchiveInfo{Name: filepath.Base(k), Key: k, Size: int64(len(d))})
	}
	return out, nil
}
func (m *memStore) Get(_ context.Context, key string) ([]byte, error) { return m.objs[key], nil }
func (m *memStore) Delete(_ context.Context, key string) error        { delete(m.objs, key); return nil }
func (m *memStore) Test(_ context.Context) error                      { return nil }
