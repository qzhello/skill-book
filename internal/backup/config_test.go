package backup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestConfigSaveLoadRoundTrip(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	want := Config{RepoURL: "https://github.com/me/skill-backup", Token: "tok-123", Branch: "main"}
	if err := Save(want); err != nil {
		t.Fatalf("Save: %v", err)
	}

	got := Load()
	if got != want {
		t.Fatalf("round-trip mismatch: got %+v want %+v", got, want)
	}
}

func TestConfigSavePermission0600(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	if err := Save(Config{RepoURL: "https://github.com/me/r", Token: "t"}); err != nil {
		t.Fatalf("Save: %v", err)
	}
	info, err := os.Stat(filepath.Join(home, ".skillbook", "backup.json"))
	if err != nil {
		t.Fatalf("stat: %v", err)
	}
	if perm := info.Mode().Perm(); perm != 0o600 {
		t.Fatalf("perm = %o, want 600", perm)
	}
}

func TestConfigLoadMissingReturnsEmpty(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	if got := Load(); got != (Config{}) {
		t.Fatalf("missing file should load empty, got %+v", got)
	}
}

func TestConfiguredAndBranch(t *testing.T) {
	cases := []struct {
		cfg        Config
		configured bool
		branch     string
	}{
		{Config{}, false, "main"},
		{Config{RepoURL: "https://github.com/a/b"}, false, "main"},
		{Config{RepoURL: "https://github.com/a/b", Token: "t"}, true, "main"},
		{Config{RepoURL: "https://github.com/a/b", Token: "t", Branch: "prod"}, true, "prod"},
	}
	for i, c := range cases {
		if c.cfg.Configured() != c.configured {
			t.Errorf("case %d: Configured=%v want %v", i, c.cfg.Configured(), c.configured)
		}
		if c.cfg.EffectiveBranch() != c.branch {
			t.Errorf("case %d: Branch=%q want %q", i, c.cfg.EffectiveBranch(), c.branch)
		}
	}
}
