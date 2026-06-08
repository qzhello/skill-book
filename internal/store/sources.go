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
	AutoCheck     bool   `json:"auto_check"`
	Targets       string `json:"targets"` // 逗号分隔的平台：claude,codex
	HasUpdate     bool   `json:"has_update"`
	CheckedAt     int64  `json:"checked_at"`
	UpdatedAt     int64  `json:"updated_at"`
	Token         string `json:"-"` // 私有仓库访问令牌；绝不序列化回前端
}

const sourceCols = `skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,auto_check,targets,has_update,checked_at,updated_at,token`

func scanSource(sc interface{ Scan(...any) error }) (*Source, error) {
	var src Source
	var auto, hasUpd int
	if err := sc.Scan(&src.SkillID, &src.SourceKind, &src.SourceURL, &src.SourceRef,
		&src.SourceSubpath, &src.SourceRev, &src.SourceNote, &src.SyncPolicy,
		&auto, &src.Targets, &hasUpd, &src.CheckedAt, &src.UpdatedAt, &src.Token); err != nil {
		return nil, err
	}
	src.AutoCheck = auto != 0
	src.HasUpdate = hasUpd != 0
	return &src, nil
}

// GetSource 返回某 skill 的持久来源行；不存在时 found=false。
func (s *Store) GetSource(skillID string) (*Source, bool, error) {
	row := s.db.QueryRow(`SELECT `+sourceCols+` FROM skill_sources WHERE skill_id=?`, skillID)
	src, err := scanSource(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, false, nil
		}
		return nil, false, err
	}
	return src, true, nil
}

// PutSource upsert 一条来源记录。
func (s *Store) PutSource(src Source) error {
	auto, hasUpd := 0, 0
	if src.AutoCheck {
		auto = 1
	}
	if src.HasUpdate {
		hasUpd = 1
	}
	_, err := s.db.Exec(`
INSERT INTO skill_sources(skill_id,source_kind,source_url,source_ref,source_subpath,source_rev,source_note,sync_policy,auto_check,targets,has_update,checked_at,updated_at,token)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(skill_id) DO UPDATE SET
  source_kind=excluded.source_kind, source_url=excluded.source_url, source_ref=excluded.source_ref,
  source_subpath=excluded.source_subpath, source_rev=excluded.source_rev, source_note=excluded.source_note,
  sync_policy=excluded.sync_policy, auto_check=excluded.auto_check, targets=excluded.targets,
  has_update=excluded.has_update, checked_at=excluded.checked_at, updated_at=excluded.updated_at, token=excluded.token`,
		src.SkillID, src.SourceKind, src.SourceURL, src.SourceRef, src.SourceSubpath,
		src.SourceRev, src.SourceNote, src.SyncPolicy, auto, src.Targets, hasUpd, src.CheckedAt, src.UpdatedAt, src.Token)
	return err
}

// AutoCheckSources 返回所有开启了自动检测且为 github_repo 的来源。
func (s *Store) AutoCheckSources() ([]Source, error) {
	rows, err := s.db.Query(`SELECT ` + sourceCols + ` FROM skill_sources WHERE auto_check=1 AND source_kind='github_repo' AND source_url<>''`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Source{}
	for rows.Next() {
		src, err := scanSource(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *src)
	}
	return out, rows.Err()
}

// SetSourceUpdateFlag 仅更新某来源的“有更新”标记与检查时间。
func (s *Store) SetSourceUpdateFlag(skillID string, hasUpdate bool, checkedAt int64) error {
	v := 0
	if hasUpdate {
		v = 1
	}
	_, err := s.db.Exec(`UPDATE skill_sources SET has_update=?, checked_at=? WHERE skill_id=?`, v, checkedAt, skillID)
	return err
}

// SourcesWithUpdate 返回当前被标记为“有更新”的 skill_id。
func (s *Store) SourcesWithUpdate() ([]string, error) {
	rows, err := s.db.Query(`SELECT skill_id FROM skill_sources WHERE has_update=1`)
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
