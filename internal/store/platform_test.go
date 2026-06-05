package store

import (
	"testing"

	"skillbook/internal/model"
)

func TestPlatformRoundTrip(t *testing.T) {
	st, err := Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	claude := model.Skill{Source: model.SourceUser, Platform: model.PlatformClaude, Dir: "/c/a", FilePath: "/c/a/SKILL.md", Name: "a", Body: "x", BodyHash: model.HashBody("x")}
	codex := model.Skill{Source: model.SourceUser, Platform: model.PlatformCodex, Dir: "/x/a", FilePath: "/x/a/SKILL.md", Name: "a", Body: "y", BodyHash: model.HashBody("y")}
	for _, sk := range []model.Skill{claude, codex} {
		if err := st.Upsert(sk); err != nil {
			t.Fatal(err)
		}
	}

	got, err := st.Get(claude.ID())
	if err != nil || got == nil {
		t.Fatalf("get claude: %v", err)
	}
	if got.Platform != model.PlatformClaude {
		t.Fatalf("claude platform = %q, want claude", got.Platform)
	}
	got, _ = st.Get(codex.ID())
	if got == nil || got.Platform != model.PlatformCodex {
		t.Fatalf("codex platform = %v, want codex", got)
	}

	list, err := st.List()
	if err != nil {
		t.Fatal(err)
	}
	platforms := map[model.Platform]int{}
	for _, sk := range list {
		platforms[sk.Platform]++
	}
	if platforms[model.PlatformClaude] != 1 || platforms[model.PlatformCodex] != 1 {
		t.Fatalf("List platform counts wrong: %v", platforms)
	}
}
