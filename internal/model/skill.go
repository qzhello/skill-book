package model

import (
	"crypto/sha1"
	"encoding/hex"
)

type Source string

const (
	SourceUser    Source = "user"
	SourceProject Source = "project"
	SourcePlugin  Source = "plugin"
)

// Skill 是磁盘上一个 skill 目录的元数据。文件是唯一真相源。
type Skill struct {
	Source      Source
	Dir         string // skill 目录绝对路径
	FilePath    string // SKILL.md 绝对路径
	Name        string // frontmatter name，缺省回退为目录名
	Description string // frontmatter description
	Body        string // SKILL.md 全文
	BodyHash    string // Body 的内容哈希，用于区分“重复”与“真冲突”
	MTime       int64  // SKILL.md 修改时间(unix)
}

// ID 由来源+目录派生，稳定且唯一。
func (s Skill) ID() string {
	sum := sha1.Sum([]byte(string(s.Source) + "|" + s.Dir))
	return hex.EncodeToString(sum[:])
}

// HashBody 返回内容的稳定哈希。同名 skill 哈希相同=重复，不同=真冲突。
func HashBody(body string) string {
	sum := sha1.Sum([]byte(body))
	return hex.EncodeToString(sum[:])
}
