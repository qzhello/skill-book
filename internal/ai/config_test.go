package ai

import (
	"os"
	"path/filepath"
	"testing"
)

// withHome 把 HOME 临时指向一个空目录，隔离文件读写。
func withHome(t *testing.T) string {
	t.Helper()
	home := t.TempDir()
	t.Setenv("HOME", home)
	return home
}

func TestSaveLoadRoundTrip(t *testing.T) {
	home := withHome(t)

	want := Config{Provider: ProviderOpenAI, BaseURL: "https://x.test/v1", APIKey: "sk-secret", Model: "gpt-4o"}
	if err := Save(want); err != nil {
		t.Fatalf("Save: %v", err)
	}

	got := Load()
	if got != want {
		t.Fatalf("round trip mismatch: got %+v want %+v", got, want)
	}

	// 文件权限应为 0600。
	info, err := os.Stat(filepath.Join(home, ".skillbook", "config.json"))
	if err != nil {
		t.Fatalf("stat: %v", err)
	}
	if perm := info.Mode().Perm(); perm != 0o600 {
		t.Fatalf("perm = %o, want 0600", perm)
	}
}

func TestLoadMissingReturnsEmpty(t *testing.T) {
	withHome(t)
	got := Load()
	if got != (Config{}) {
		t.Fatalf("expected empty config, got %+v", got)
	}
}

func TestEffectiveAnthropicEnv(t *testing.T) {
	withHome(t)
	t.Setenv("ANTHROPIC_API_KEY", "ak-123")
	t.Setenv("OPENAI_API_KEY", "")

	got := Config{}.Effective()
	if got.Provider != ProviderAnthropic {
		t.Fatalf("provider = %q, want anthropic", got.Provider)
	}
	if got.APIKey != "ak-123" {
		t.Fatalf("apiKey = %q", got.APIKey)
	}
	if !got.Configured() {
		t.Fatal("expected Configured() true")
	}
	if got.Model == "" {
		t.Fatal("expected default model filled")
	}
}

func TestEffectiveOpenAIEnv(t *testing.T) {
	withHome(t)
	t.Setenv("ANTHROPIC_API_KEY", "")
	t.Setenv("OPENAI_API_KEY", "ok-456")
	t.Setenv("OPENAI_BASE_URL", "https://deepseek.test/v1")

	got := Config{}.Effective()
	if got.Provider != ProviderOpenAI {
		t.Fatalf("provider = %q, want openai", got.Provider)
	}
	if got.APIKey != "ok-456" {
		t.Fatalf("apiKey = %q", got.APIKey)
	}
	if got.BaseURL != "https://deepseek.test/v1" {
		t.Fatalf("baseURL = %q", got.BaseURL)
	}
}

func TestEffectiveFilePreferredOverEnv(t *testing.T) {
	withHome(t)
	t.Setenv("ANTHROPIC_API_KEY", "env-key")

	cfg := Config{Provider: ProviderOpenAI, APIKey: "file-key", Model: "m"}
	got := cfg.Effective()
	if got.APIKey != "file-key" {
		t.Fatalf("apiKey = %q, want file-key (file precedence)", got.APIKey)
	}
	if got.Provider != ProviderOpenAI {
		t.Fatalf("provider = %q, want openai", got.Provider)
	}
}

func TestConfiguredFalseWhenEmpty(t *testing.T) {
	if (Config{}).Configured() {
		t.Fatal("empty config should not be Configured")
	}
}
