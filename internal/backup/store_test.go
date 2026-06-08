package backup

import (
	"testing"
	"time"
)

func TestArchiveKeyFormat(t *testing.T) {
	cfg := Config{Prefix: "skillbook/"}
	got := archiveKey(cfg, time.Date(2026, 6, 8, 15, 30, 0, 0, time.UTC))
	want := "skillbook/skillbook-20260608-153000.tar.gz"
	if got != want {
		t.Fatalf("archiveKey=%q want %q", got, want)
	}
}

func TestParseArchiveTime(t *testing.T) {
	ts := parseArchiveTime("skillbook-20260608-153000.tar.gz")
	want := time.Date(2026, 6, 8, 15, 30, 0, 0, time.UTC).Unix()
	if ts != want {
		t.Fatalf("parseArchiveTime=%d want %d", ts, want)
	}
	if parseArchiveTime("garbage.txt") != 0 {
		t.Fatal("非法名应返回 0")
	}
}

func TestValidArchiveName(t *testing.T) {
	ok := []string{"skillbook-20260608-153000.tar.gz"}
	bad := []string{
		"../skillbook-20260608-153000.tar.gz",
		"skillbook-x/y.tar.gz",
		"skillbook-..tar.gz",
		"other.tar.gz",
		"skillbook-20260608-153000.zip",
	}
	for _, n := range ok {
		if !validArchiveName(n) {
			t.Fatalf("%q 应合法", n)
		}
	}
	for _, n := range bad {
		if validArchiveName(n) {
			t.Fatalf("%q 应非法", n)
		}
	}
}
