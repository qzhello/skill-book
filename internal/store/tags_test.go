package store

import "testing"

func TestTags_SetGetIncremental(t *testing.T) {
	st, err := Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	// 初始：无任何标签行
	set, _ := st.TaggedIDSet()
	if len(set) != 0 {
		t.Fatalf("want empty tagged set, got %v", set)
	}

	// 写标签（含去重/去空白）
	if err := st.SetTags("sk1", []string{" Web ", "测试", "web", ""}); err != nil {
		t.Fatal(err)
	}
	m, _ := st.TagsByID()
	got := m["sk1"]
	if len(got) != 2 || got[0] != "Web" || got[1] != "测试" {
		t.Fatalf("want [Web 测试], got %v", got)
	}

	// 空标签也算"已处理"（增量分类据此跳过）
	if err := st.SetTags("sk2", nil); err != nil {
		t.Fatal(err)
	}
	set, _ = st.TaggedIDSet()
	if !set["sk1"] || !set["sk2"] {
		t.Fatalf("want sk1+sk2 marked processed, got %v", set)
	}

	// DistinctTags 频次降序
	_ = st.SetTags("sk3", []string{"测试"})
	tags, _ := st.DistinctTags()
	if len(tags) == 0 || tags[0] != "测试" {
		t.Fatalf("want 测试 most frequent, got %v", tags)
	}
}
