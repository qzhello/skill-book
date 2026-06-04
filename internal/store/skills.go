package store

import (
	"strings"

	"skillbook/internal/model"
)

// Upsert 写入或更新一条 skill，并同步 FTS。
func (s *Store) Upsert(sk model.Skill) error {
	id := sk.ID()
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM skills_fts WHERE rowid IN (SELECT rowid FROM skills WHERE id=?)`, id); err != nil {
		return err
	}
	res, err := tx.Exec(`
INSERT INTO skills(id,source,dir,file_path,name,description,body,mtime)
VALUES(?,?,?,?,?,?,?,?)
ON CONFLICT(id) DO UPDATE SET
  source=excluded.source, dir=excluded.dir, file_path=excluded.file_path,
  name=excluded.name, description=excluded.description, body=excluded.body, mtime=excluded.mtime`,
		id, sk.Source, sk.Dir, sk.FilePath, sk.Name, sk.Description, sk.Body, sk.MTime)
	if err != nil {
		return err
	}
	_ = res
	var rowid int64
	if err := tx.QueryRow(`SELECT rowid FROM skills WHERE id=?`, id).Scan(&rowid); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO skills_fts(rowid,name,description,body) VALUES(?,?,?,?)`,
		rowid, sk.Name, sk.Description, sk.Body); err != nil {
		return err
	}
	return tx.Commit()
}

func scanRows(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]model.Skill, error) {
	var out []model.Skill
	for rows.Next() {
		var sk model.Skill
		if err := rows.Scan(&sk.Source, &sk.Dir, &sk.FilePath, &sk.Name, &sk.Description, &sk.Body, &sk.MTime); err != nil {
			return nil, err
		}
		out = append(out, sk)
	}
	return out, rows.Err()
}

// List 返回全部 skill，按 name 升序。
func (s *Store) List() ([]model.Skill, error) {
	rows, err := s.db.Query(`SELECT source,dir,file_path,name,description,body,mtime FROM skills ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRows(rows)
}

// Search 用 FTS5 前缀匹配查询；空 query 等价于 List。
func (s *Store) Search(query string) ([]model.Skill, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return s.List()
	}
	match := query + "*"
	rows, err := s.db.Query(`
SELECT s.source,s.dir,s.file_path,s.name,s.description,s.body,s.mtime
FROM skills_fts f JOIN skills s ON s.rowid=f.rowid
WHERE skills_fts MATCH ? ORDER BY rank`, match)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRows(rows)
}

// Get 按 ID 取单条，不存在返回 (nil,nil)。
func (s *Store) Get(id string) (*model.Skill, error) {
	row := s.db.QueryRow(`SELECT source,dir,file_path,name,description,body,mtime FROM skills WHERE id=?`, id)
	var sk model.Skill
	err := row.Scan(&sk.Source, &sk.Dir, &sk.FilePath, &sk.Name, &sk.Description, &sk.Body, &sk.MTime)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			return nil, nil
		}
		return nil, err
	}
	return &sk, nil
}
