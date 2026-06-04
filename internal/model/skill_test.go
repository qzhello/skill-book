package model

import "testing"

func TestSkillID_StableFromSourceAndPath(t *testing.T) {
	a := Skill{Source: SourceUser, Dir: "/home/u/.claude/skills/foo"}
	b := Skill{Source: SourceUser, Dir: "/home/u/.claude/skills/foo"}
	if a.ID() != b.ID() {
		t.Fatalf("ID not stable: %q vs %q", a.ID(), b.ID())
	}
	if a.ID() == "" {
		t.Fatal("ID empty")
	}
}
