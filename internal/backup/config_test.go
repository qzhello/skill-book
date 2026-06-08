package backup

import "testing"

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
