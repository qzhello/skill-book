package store

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

type Store struct{ db *sql.DB }

const schema = `
CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY,
  source      TEXT NOT NULL,
  dir         TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  body        TEXT NOT NULL,
  body_hash   TEXT NOT NULL DEFAULT '',
  platform    TEXT NOT NULL DEFAULT 'claude',
  mtime       INTEGER NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name, description, body
);
CREATE TABLE IF NOT EXISTS skill_sources (
  skill_id       TEXT PRIMARY KEY,
  source_kind    TEXT NOT NULL DEFAULT 'unknown',
  source_url     TEXT NOT NULL DEFAULT '',
  source_ref     TEXT NOT NULL DEFAULT '',
  source_subpath TEXT NOT NULL DEFAULT '',
  source_rev     TEXT NOT NULL DEFAULT '',
  source_note    TEXT NOT NULL DEFAULT '',
  sync_policy    TEXT NOT NULL DEFAULT 'none',
  auto_check     INTEGER NOT NULL DEFAULT 0,
  targets        TEXT NOT NULL DEFAULT '',
  has_update     INTEGER NOT NULL DEFAULT 0,
  checked_at     INTEGER NOT NULL DEFAULT 0,
  updated_at     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS skill_tags (
  skill_id   TEXT PRIMARY KEY,
  tags       TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT 0
);
`

// Open 打开（或新建）数据库并建表。dsn 用 ":memory:" 可做测试。
func Open(dsn string) (*Store, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	// 迁移：为升级前创建的旧表补列（已存在则忽略报错）。
	_, _ = db.Exec(`ALTER TABLE skills ADD COLUMN body_hash TEXT NOT NULL DEFAULT ''`)
	_, _ = db.Exec(`ALTER TABLE skills ADD COLUMN platform TEXT NOT NULL DEFAULT 'claude'`)
	_, _ = db.Exec(`ALTER TABLE skill_sources ADD COLUMN auto_check INTEGER NOT NULL DEFAULT 0`)
	_, _ = db.Exec(`ALTER TABLE skill_sources ADD COLUMN targets TEXT NOT NULL DEFAULT ''`)
	_, _ = db.Exec(`ALTER TABLE skill_sources ADD COLUMN has_update INTEGER NOT NULL DEFAULT 0`)
	_, _ = db.Exec(`ALTER TABLE skill_sources ADD COLUMN checked_at INTEGER NOT NULL DEFAULT 0`)
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }
