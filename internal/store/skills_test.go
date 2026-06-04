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

func TestSearch_MatchesDescription(t *testing.T) {
	st := newTestStore(t)
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "handles payment refunds", Body: "x", MTime: 1})
	_ = st.Upsert(model.Skill{Source: model.SourceUser, Dir: "/d/beta", FilePath: "/d/beta/SKILL.md",
		Name: "beta", Description: "renders charts", Body: "y", MTime: 1})

	hits, err := st.Search("refund")
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 1 || hits[0].Name != "alpha" {
		t.Fatalf("want [alpha], got %+v", hits)
	}
}

func TestGetByID(t *testing.T) {
	st := newTestStore(t)
	sk := model.Skill{Source: model.SourceUser, Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md",
		Name: "alpha", Description: "A", Body: "B", MTime: 1}
	_ = st.Upsert(sk)
	got, err := st.Get(sk.ID())
	if err != nil {
		t.Fatal(err)
	}
	if got == nil || got.Name != "alpha" {
		t.Fatalf("got %+v", got)
	}
}
