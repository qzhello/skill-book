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

func TestBackupConfigPutThenGetHidesToken(t *testing.T) {
	srv := newSrv(t) // HOME 已指向临时目录
	rec := do(t, srv, http.MethodPut, "/api/backup/config",
		`{"repoURL":"https://github.com/me/skill-backup","branch":"main","token":"ghp_secret_xyz"}`)
	if rec.Code != 200 {
		t.Fatalf("put code=%d body=%s", rec.Code, rec.Body.String())
	}
	rec = do(t, srv, http.MethodGet, "/api/backup/config", "")
	body := rec.Body.String()
	if strings.Contains(body, "ghp_secret_xyz") || strings.Contains(body, "token") && strings.Contains(body, "ghp_") {
		t.Fatalf("token leaked in config response: %s", body)
	}
	if !strings.Contains(body, `"hasToken":true`) {
		t.Fatalf("expected hasToken:true, got %s", body)
	}
}

func TestBackupConfigRejectsNonGitHub(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPut, "/api/backup/config",
		`{"repoURL":"https://evil.example.com/me/repo","token":"t"}`)
	if rec.Code != 400 {
		t.Fatalf("expected 400 for non-github url, got %d", rec.Code)
	}
}

func TestBackupConfigRejectsBadBranch(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPut, "/api/backup/config",
		`{"repoURL":"https://github.com/me/bk","branch":"../../evil","token":"t"}`)
	if rec.Code != 400 {
		t.Fatalf("expected 400 for bad branch, got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestBackupPushUnconfigured(t *testing.T) {
	srv := newSrv(t)
	rec := do(t, srv, http.MethodPost, "/api/backup/push", "")
	if rec.Code != 400 {
		t.Fatalf("expected 400 when unconfigured, got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestBackupPushWithInjectedService(t *testing.T) {
	srv := newSrv(t)
	// 配置（HOME 临时，写入真实 backup.json）
	if err := backup.Save(backup.Config{RepoURL: "https://github.com/me/bk", Token: "tok"}); err != nil {
		t.Fatal(err)
	}
	// 注入假 git 执行器 + 临时源目录
	src := t.TempDir()
	if err := os.WriteFile(filepath.Join(src, "SKILL.md"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	srv.backupSvc = &backup.Service{
		WorkDir: filepath.Join(t.TempDir(), "wk"),
		Run: func(_ context.Context, _ string, _ []string, args ...string) (string, error) {
			if len(args) > 0 && args[0] == "status" {
				return " M claude/SKILL.md\n", nil
			}
			// authArgs 会把 -c ... 放前面；status 判断用 args[0]，此处其余返回空
			for _, a := range args {
				if a == "status" {
					return " M x\n", nil
				}
			}
			return "", nil
		},
		Srcs: []backup.SrcDir{{Sub: "claude", Path: src}},
	}
	rec := do(t, srv, http.MethodPost, "/api/backup/push", "")
	if rec.Code != 200 {
		t.Fatalf("push code=%d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"changed":true`) {
		t.Fatalf("expected changed:true, got %s", rec.Body.String())
	}
}
