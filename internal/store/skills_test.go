package store

import (
	"testing"

	"skillbook/internal/model"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	st, err := Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })
	return st
}

func TestUpsertAndList(t *testing.T) {
	st := newTestStore(t)
	s := model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "A", Body: "body", MTime: 1}
	if err := st.Upsert(s); err != nil {
		t.Fatal(err)
	}
	// 再次 upsert 同 ID 应更新而非重复
	s.Description = "A2"
	if err := st.Upsert(s); err != nil {
		t.Fatal(err)
	}
	list, err := st.List()
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 {
		t.Fatalf("want 1, got %d", len(list))
	}
	if list[0].Description != "A2" {
		t.Fatalf("want updated desc, got %q", list[0].Description)
	}
}
