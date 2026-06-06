package store

import (
	"sort"
	"strings"
	"time"
)

// 标签独立存于 skill_tags 表，按 skill_id 关联。
// 关键：扫描重建 skills 表（Upsert）时不触碰本表，因此标签在重扫后保留，
// 也支持用户手动编辑。一个 skill 有行即视为"已分类"（即便标签为空也算处理过）。

// normalizeTags 去空白、去重、限长，保持原有顺序，最多 8 个。
func normalizeTags(in []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, raw := range in {
		t := strings.TrimSpace(raw)
		if t == "" || len([]rune(t)) > 24 {
			continue
		}
		key := strings.ToLower(t)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, t)
		if len(out) >= 8 {
			break
		}
	}
	return out
}

func encodeTags(tags []string) string { return strings.Join(normalizeTags(tags), ",") }

func decodeTags(s string) []string {
	if strings.TrimSpace(s) == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

// SetTags 写入（覆盖）某 skill 的标签；记录处理时间。tags 可为空（标记已处理）。
func (s *Store) SetTags(skillID string, tags []string) error {
	_, err := s.db.Exec(
		`INSERT INTO skill_tags (skill_id, tags, updated_at) VALUES (?,?,?)
		 ON CONFLICT(skill_id) DO UPDATE SET tags=excluded.tags, updated_at=excluded.updated_at`,
		skillID, encodeTags(tags), time.Now().Unix())
	return err
}

// TagsByID 返回所有已分类 skill 的标签映射（含标签为空的，表示已处理）。
func (s *Store) TagsByID() (map[string][]string, error) {
	rows, err := s.db.Query(`SELECT skill_id, tags FROM skill_tags`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string][]string{}
	for rows.Next() {
		var id, tags string
		if err := rows.Scan(&id, &tags); err != nil {
			return nil, err
		}
		out[id] = decodeTags(tags)
	}
	return out, rows.Err()
}

// TaggedIDSet 返回已分类（已处理）的 skill id 集合，供增量分类跳过。
func (s *Store) TaggedIDSet() (map[string]bool, error) {
	rows, err := s.db.Query(`SELECT skill_id FROM skill_tags`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out[id] = true
	}
	return out, rows.Err()
}

// DistinctTags 返回所有已用标签（按使用频次降序），供 AI 复用词表与前端筛选。
func (s *Store) DistinctTags() ([]string, error) {
	m, err := s.TagsByID()
	if err != nil {
		return nil, err
	}
	count := map[string]int{}
	for _, tags := range m {
		for _, t := range tags {
			count[t]++
		}
	}
	out := make([]string, 0, len(count))
	for t := range count {
		out = append(out, t)
	}
	sort.Slice(out, func(i, j int) bool {
		if count[out[i]] != count[out[j]] {
			return count[out[i]] > count[out[j]]
		}
		return out[i] < out[j]
	})
	return out, nil
}
