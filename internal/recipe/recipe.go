// Package recipe 从已扫描的 skill 库里挑出"创作类" skill 作为新建/优化的方法论配方，
// 并提供一个内置的空白脚手架。
package recipe

import (
	"strings"

	"skillbook/internal/store"
)

// BlankID 是内置空白脚手架的固定 ID。
const BlankID = "blank"

// AuthoringID 是内置「标准 Skill 写法」方法论配方的固定 ID。
const AuthoringID = "authoring"

// Recipe 是一个可选的创作配方。Kind 为 "builtin" 或 "skill"。
type Recipe struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Kind string `json:"kind"`
}

// blankTemplate 是内置空白 SKILL.md 脚手架模板。
const blankTemplate = `---
name: my-skill
description: 一句话描述这个 skill 解决什么问题、何时使用。
---

# My Skill

## 何时使用

描述触发这个 skill 的场景。

## 步骤

1. 第一步
2. 第二步
3. 第三步

## 注意事项

- 关键约束或边界条件
`

// isCreatorSkill 判断一个 skill 名是否属于创作类配方。
func isCreatorSkill(name string) bool {
	n := strings.ToLower(name)
	if strings.Contains(n, "skill-creator") || strings.Contains(n, "writing-skills") {
		return true
	}
	if strings.Contains(n, "skill") &&
		(strings.Contains(n, "creator") || strings.Contains(n, "writing") || strings.Contains(n, "authoring")) {
		return true
	}
	return false
}

// List 返回内置 blank + 库中所有创作类 skill（按 name 去重）。
func List(st *store.Store) ([]Recipe, error) {
	skills, err := st.List()
	if err != nil {
		return nil, err
	}
	out := []Recipe{
		{ID: AuthoringID, Name: "标准 Skill 写法", Kind: "builtin"},
		{ID: BlankID, Name: "空白脚手架", Kind: "builtin"},
	}
	seen := map[string]bool{}
	for _, sk := range skills {
		if !isCreatorSkill(sk.Name) || seen[sk.Name] {
			continue
		}
		seen[sk.Name] = true
		out = append(out, Recipe{ID: sk.ID(), Name: sk.Name, Kind: "skill"})
	}
	return out, nil
}

// Body 返回配方正文：blank 返回内置模板，否则返回对应 skill 的 Body。
func Body(st *store.Store, id string) (string, error) {
	if id == BlankID {
		return blankTemplate, nil
	}
	if id == AuthoringID {
		return authoringMethodology, nil
	}
	sk, err := st.Get(id)
	if err != nil {
		return "", err
	}
	if sk == nil {
		return "", nil
	}
	return sk.Body, nil
}

// WritingRecipeBody 返回适合"优化"的 writing 风格配方正文，找不到则返回空串。
func WritingRecipeBody(st *store.Store) string {
	skills, err := st.List()
	if err != nil {
		return ""
	}
	// 优先 writing-skills，其次任意创作类。
	var fallback string
	for _, sk := range skills {
		if !isCreatorSkill(sk.Name) {
			continue
		}
		if strings.Contains(strings.ToLower(sk.Name), "writing-skills") {
			return sk.Body
		}
		if fallback == "" {
			fallback = sk.Body
		}
	}
	return fallback
}
