package store

import "skillbook/internal/model"

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
