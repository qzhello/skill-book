package store

import (
	"reflect"
	"sort"
	"testing"
)

func openMem(t *testing.T) *Store {
	t.Helper()
	st, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	t.Cleanup(func() { st.Close() })
	return st
}

func TestGetSourceNotFound(t *testing.T) {
	st := openMem(t)
	_, found, err := st.GetSource("nope")
	if err != nil {
		t.Fatalf("GetSource: %v", err)
	}
	if found {
		t.Fatal("expected found=false for missing row")
	}
}

func TestPutAndGetSource(t *testing.T) {
	st := openMem(t)
	want := Source{
		SkillID:       "abc",
		SourceKind:    "github_repo",
		SourceURL:     "https://github.com/o/r",
		SourceRef:     "main",
		SourceSubpath: "skills/foo",
		SourceRev:     "deadbeef",
		SourceNote:    "from upstream",
		SyncPolicy:    "check_only",
		UpdatedAt:     1234,
	}
	if err := st.PutSource(want); err != nil {
		t.Fatalf("PutSource: %v", err)
	}
	got, found, err := st.GetSource("abc")
	if err != nil {
		t.Fatalf("GetSource: %v", err)
	}
	if !found {
		t.Fatal("expected found=true")
	}
	if !reflect.DeepEqual(*got, want) {
		t.Fatalf("got %+v want %+v", *got, want)
	}
}

func TestPutSourceUpsert(t *testing.T) {
	st := openMem(t)
	if err := st.PutSource(Source{SkillID: "abc", SourceURL: "u1", SourceKind: "manual"}); err != nil {
		t.Fatalf("put1: %v", err)
	}
	if err := st.PutSource(Source{SkillID: "abc", SourceURL: "u2", SourceKind: "github_repo", UpdatedAt: 9}); err != nil {
		t.Fatalf("put2: %v", err)
	}
	got, _, err := st.GetSource("abc")
	if err != nil {
		t.Fatalf("GetSource: %v", err)
	}
	if got.SourceURL != "u2" || got.SourceKind != "github_repo" || got.UpdatedAt != 9 {
		t.Fatalf("upsert did not overwrite: %+v", got)
	}
}

func TestDeleteSource(t *testing.T) {
	st := openMem(t)
	if err := st.PutSource(Source{SkillID: "abc", SourceURL: "u"}); err != nil {
		t.Fatalf("put: %v", err)
	}
	if err := st.DeleteSource("abc"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	_, found, err := st.GetSource("abc")
	if err != nil {
		t.Fatalf("GetSource: %v", err)
	}
	if found {
		t.Fatal("expected deleted")
	}
	// delete of missing is a no-op
	if err := st.DeleteSource("missing"); err != nil {
		t.Fatalf("delete missing: %v", err)
	}
}

func TestLinkedSourceIDs(t *testing.T) {
	st := openMem(t)
	if got, err := st.LinkedSourceIDs(); err != nil || len(got) != 0 {
		t.Fatalf("empty: got %v err %v", got, err)
	}
	st.PutSource(Source{SkillID: "a", SourceURL: "u"})
	st.PutSource(Source{SkillID: "b", SourceURL: "u"})
	got, err := st.LinkedSourceIDs()
	if err != nil {
		t.Fatalf("LinkedSourceIDs: %v", err)
	}
	sort.Strings(got)
	if !reflect.DeepEqual(got, []string{"a", "b"}) {
		t.Fatalf("got %v", got)
	}
}
