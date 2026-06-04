package recipe

import (
	"strings"
	"testing"

	"skillbook/internal/model"
	"skillbook/internal/store"
)

func newStore(t *testing.T, skills ...model.Skill) *store.Store {
	t.Helper()
	st, err := store.Open(":memory:")
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { st.Close() })
	for _, sk := range skills {
		if err := st.Upsert(sk); err != nil {
			t.Fatalf("upsert: %v", err)
		}
	}
	return st
}

func mkSkill(name, dir, body string) model.Skill {
	return model.Skill{
		Source: model.SourceUser, Dir: dir, FilePath: dir + "/SKILL.md",
		Name: name, Body: body, BodyHash: model.HashBody(body),
	}
}

func TestListSelectsCreatorSkillsPlusBlank(t *testing.T) {
	st := newStore(t,
		mkSkill("writing-skills", "/a/writing-skills", "writing body"),
		mkSkill("golang-patterns", "/a/golang-patterns", "go body"),
		mkSkill("skill-creator", "/a/skill-creator", "creator body"),
		mkSkill("my-authoring-skill", "/a/authoring", "authoring body"),
	)

	got, err := List(st)
	if err != nil {
		t.Fatalf("List: %v", err)
	}

	names := map[string]string{}
	for _, r := range got {
		names[r.Name] = r.Kind
	}
	if names["空白脚手架"] != "builtin" {
		t.Fatalf("missing blank builtin: %+v", got)
	}
	if names["writing-skills"] != "skill" {
		t.Fatalf("missing writing-skills: %+v", got)
	}
	if names["skill-creator"] != "skill" {
		t.Fatalf("missing skill-creator: %+v", got)
	}
	if names["my-authoring-skill"] != "skill" {
		t.Fatalf("missing authoring skill: %+v", got)
	}
	if _, ok := names["golang-patterns"]; ok {
		t.Fatalf("non-creator skill should be excluded: %+v", got)
	}
	// blank 必须第一个
	if got[0].ID != BlankID {
		t.Fatalf("blank should be first, got %+v", got[0])
	}
}

func TestListDedupesByName(t *testing.T) {
	st := newStore(t,
		mkSkill("writing-skills", "/a/writing-skills", "v1"),
		mkSkill("writing-skills", "/b/writing-skills", "v2"),
	)
	got, err := List(st)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	count := 0
	for _, r := range got {
		if r.Name == "writing-skills" {
			count++
		}
	}
	if count != 1 {
		t.Fatalf("expected dedupe to 1, got %d", count)
	}
}

func TestBodyBlankReturnsTemplate(t *testing.T) {
	st := newStore(t)
	body, err := Body(st, BlankID)
	if err != nil {
		t.Fatalf("Body: %v", err)
	}
	if body == "" || !strings.Contains(body, "name:") {
		t.Fatalf("blank template invalid: %q", body)
	}
}

func TestBodyOfSkill(t *testing.T) {
	sk := mkSkill("skill-creator", "/a/skill-creator", "the methodology")
	st := newStore(t, sk)
	body, err := Body(st, sk.ID())
	if err != nil {
		t.Fatalf("Body: %v", err)
	}
	if body != "the methodology" {
		t.Fatalf("body = %q", body)
	}
}

func TestWritingRecipeBodyPrefersWritingSkills(t *testing.T) {
	st := newStore(t,
		mkSkill("skill-creator", "/a/skill-creator", "creator body"),
		mkSkill("writing-skills", "/a/writing-skills", "writing body"),
	)
	if got := WritingRecipeBody(st); got != "writing body" {
		t.Fatalf("WritingRecipeBody = %q", got)
	}
}
