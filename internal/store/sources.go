package store

import (
	"database/sql"
	"errors"
)

// Source 是 skill 的持久来源记录，对应 skill_sources 表。
type Source struct {
	SkillID       string `json:"skill_id"`
	SourceKind    string `json:"source_kind"`
	SourceURL     string `json:"source_url"`
	SourceRef     string `json:"source_ref"`
	SourceSubpath string `json:"source_subpath"`
	SourceRev     string `json:"source_rev"`
	SourceNote    string `json:"source_note"`
	SyncPolicy    string `json:"sync_policy"`
	UpdatedAt     int64  `json:"updated_at"`
}

// GetSource 返回某 skill 的持久来源行；不存在时 found=false。
func (s *Store) GetSource(skillID string) (*Source, bool, error) {
	row := s.db.QueryRow(`
SELECT skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,updated_at
FROM skill_sources WHERE skill_id=?`, skillID)
	var src Source
	err := row.Scan(&src.SkillID, &src.SourceKind, &src.SourceURL, &src.SourceRef,
		&src.SourceSubpath, &src.SourceRev, &src.SourceNote, &src.SyncPolicy, &src.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, false, nil
		}
		return nil, false, err
	}
	return &src, true, nil
}

// PutSource upsert 一条来源记录。
func (s *Store) PutSource(src Source) error {
	_, err := s.db.Exec(`
INSERT INTO skill_sources(skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,updated_at)
VALUES(?,?,?,?,?,?,?,?,?)
ON CONFLICT(skill_id) DO UPDATE SET
  source_kind=excluded.source_kind, source_url=excluded.source_url, source_ref=excluded.source_ref,
  source_subpath=excluded.source_subpath, source_rev=excluded.source_rev, source_note=excluded.source_note,
  sync_policy=excluded.sync_policy, updated_at=excluded.updated_at`,
		src.SkillID, src.SourceKind, src.SourceURL, src.SourceRef, src.SourceSubpath,
		src.SourceRev, src.SourceNote, src.SyncPolicy, src.UpdatedAt)
	return err
}

// DeleteSource 删除某 skill 的来源行；不存在为 no-op。
func (s *Store) DeleteSource(skillID string) error {
	_, err := s.db.Exec(`DELETE FROM skill_sources WHERE skill_id=?`, skillID)
	return err
}

// LinkedSourceIDs 返回所有有持久来源行的 skill_id。
func (s *Store) LinkedSourceIDs() ([]string, error) {
	rows, err := s.db.Query(`SELECT skill_id FROM skill_sources ORDER BY skill_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}
