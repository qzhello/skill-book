package backup

import (
	"os"
	"testing"
)

func TestConfiguredRequiresAllCoreFields(t *testing.T) {
	full := Config{Endpoint: "s3.amazonaws.com", Bucket: "b", AccessKey: "ak", SecretKey: "sk"}
	if !full.Configured() {
		t.Fatal("expected Configured()=true when all core fields present")
	}
	cases := []Config{
		{Bucket: "b", AccessKey: "ak", SecretKey: "sk"},   // 缺 endpoint
		{Endpoint: "e", AccessKey: "ak", SecretKey: "sk"}, // 缺 bucket
		{Endpoint: "e", Bucket: "b", SecretKey: "sk"},     // 缺 accessKey
		{Endpoint: "e", Bucket: "b", AccessKey: "ak"},     // 缺 secretKey
	}
	for i, c := range cases {
		if c.Configured() {
			t.Fatalf("case %d: expected Configured()=false", i)
		}
	}
}

func TestEffectivePrefixDefaultsAndTrailingSlash(t *testing.T) {
	if got := (Config{}).EffectivePrefix(); got != "skillbook/" {
		t.Fatalf("empty prefix => %q, want skillbook/", got)
	}
	if got := (Config{Prefix: "foo"}).EffectivePrefix(); got != "foo/" {
		t.Fatalf("prefix foo => %q, want foo/", got)
	}
	if got := (Config{Prefix: "bar/"}).EffectivePrefix(); got != "bar/" {
		t.Fatalf("prefix bar/ => %q, want bar/", got)
	}
}

func TestEffectiveKeepCountDefault(t *testing.T) {
	if got := (Config{}).EffectiveKeepCount(); got != 20 {
		t.Fatalf("default keepCount => %d, want 20", got)
	}
	if got := (Config{KeepCount: 5}).EffectiveKeepCount(); got != 5 {
		t.Fatalf("keepCount 5 => %d, want 5", got)
	}
	if got := (Config{KeepCount: -1}).EffectiveKeepCount(); got != 20 {
		t.Fatalf("negative keepCount => %d, want 20", got)
	}
}

func TestSaveLoadRoundTrip(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	in := Config{Endpoint: "s3.amazonaws.com", Region: "us-east-1", Bucket: "bk",
		Prefix: "skillbook/", AccessKey: "AKIA", SecretKey: "sk", UseSSL: true, KeepCount: 7}
	if err := Save(in); err != nil {
		t.Fatalf("Save: %v", err)
	}
	got := Load()
	if got != in {
		t.Fatalf("round-trip mismatch:\n got %+v\nwant %+v", got, in)
	}
}

func TestSaveUses0600(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	if err := Save(Config{Endpoint: "e", Bucket: "b", AccessKey: "a", SecretKey: "s"}); err != nil {
		t.Fatalf("Save: %v", err)
	}
	p, err := Path()
	if err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(p)
	if err != nil {
		t.Fatal(err)
	}
	if perm := info.Mode().Perm(); perm != 0o600 {
		t.Fatalf("perm=%o want 600", perm)
	}
}

func TestLoadMissingReturnsEmpty(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	if got := Load(); got.Configured() {
		t.Fatalf("missing config should be empty/unconfigured, got %+v", got)
	}
}
