package store

import (
	"database/sql"
	"errors"
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
INSERT INTO skills(id,source,dir,file_path,name,description,body,body_hash,mtime)
VALUES(?,?,?,?,?,?,?,?,?)
ON CONFLICT(id) DO UPDATE SET
  source=excluded.source, dir=excluded.dir, file_path=excluded.file_path,
  name=excluded.name, description=excluded.description, body=excluded.body,
  body_hash=excluded.body_hash, mtime=excluded.mtime`,
		id, sk.Source, sk.Dir, sk.FilePath, sk.Name, sk.Description, sk.Body, sk.BodyHash, sk.MTime)
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
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &sk, nil
}

// NameGroups 分析同名 skill：返回真冲突与重复两类 name。
//   - conflicts：同名但内容不同（body_hash 有多个）→ 需要关注。
//   - dups：同名且内容完全一致（同一份装了多处）→ 仅提示重复。
// 同时返回每个 name 的副本总数，供 UI 显示“重复 ×N”。
func (s *Store) NameGroups() (conflicts, dups []string, counts map[string]int, err error) {
	rows, err := s.db.Query(`
SELECT name, COUNT(*) AS c, COUNT(DISTINCT body_hash) AS d
FROM skills GROUP BY name HAVING c > 1 ORDER BY name`)
	if err != nil {
		return nil, nil, nil, err
	}
	defer rows.Close()
	counts = map[string]int{}
	for rows.Next() {
		var name string
		var c, d int
		if err := rows.Scan(&name, &c, &d); err != nil {
			return nil, nil, nil, err
		}
		counts[name] = c
		if d > 1 {
			conflicts = append(conflicts, name)
		} else {
			dups = append(dups, name)
		}
	}
	return conflicts, dups, counts, rows.Err()
}
