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
  mtime       INTEGER NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name, description, body
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
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }
