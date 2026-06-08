package backup

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// SrcDir 描述一个待备份的源目录及其在归档内的子目录名。
type SrcDir struct {
	Sub  string // 归档内子目录，如 "claude" / "codex"
	Path string // 本机源目录绝对路径
}

// PlatformStat 是单个平台在归档里的文件统计。
type PlatformStat struct {
	ID    string `json:"id"`
	Files int    `json:"files"`
}

// Manifest 是归档内 manifest.json 的内容。
type Manifest struct {
	Version    int            `json:"version"`
	CreatedAt  string         `json:"createdAt"`
	Platforms  []PlatformStat `json:"platforms"`
	TotalFiles int            `json:"totalFiles"`
}

const manifestName = "manifest.json"

// packArchive 把若干源目录打包成 tar.gz 字节流，返回归档内容与 manifest。
// 跳过 .git 目录与符号链接/特殊文件（只打包普通文件），防越权。
func packArchive(srcs []SrcDir, now time.Time) ([]byte, Manifest, error) {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gz)

	man := Manifest{Version: 1, CreatedAt: now.UTC().Format(time.RFC3339)}
	for _, d := range srcs {
		n, err := addDirToTar(tw, d.Sub, d.Path)
		if err != nil {
			return nil, Manifest{}, err
		}
		man.Platforms = append(man.Platforms, PlatformStat{ID: d.Sub, Files: n})
		man.TotalFiles += n
	}
	// manifest 最后写（内容此时才完整）
	mraw, _ := json.MarshalIndent(man, "", "  ")
	if err := writeTarFile(tw, manifestName, mraw); err != nil {
		return nil, Manifest{}, err
	}
	if err := tw.Close(); err != nil {
		return nil, Manifest{}, err
	}
	if err := gz.Close(); err != nil {
		return nil, Manifest{}, err
	}
	return buf.Bytes(), man, nil
}

// addDirToTar 递归把 src 下的普通文件写入 tar，归档内路径前缀为 sub/。返回文件数。
// src 不存在视为空集（返回 0，不报错）。
func addDirToTar(tw *tar.Writer, sub, src string) (int, error) {
	info, err := os.Lstat(src)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
		return 0, nil // 源是符号链接/非目录 → 跳过，防越权
	}
	count := 0
	err = filepath.WalkDir(src, func(p string, e os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if e.IsDir() {
			if e.Name() == ".git" {
				return filepath.SkipDir
			}
			return nil
		}
		if !e.Type().IsRegular() {
			return nil // 跳过符号链接等特殊文件
		}
		rel, err := filepath.Rel(src, p)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		// 归档内统一用正斜杠
		name := sub + "/" + filepath.ToSlash(rel)
		if err := writeTarFile(tw, name, data); err != nil {
			return err
		}
		count++
		return nil
	})
	return count, err
}

// writeTarFile 写一个普通文件条目（0644）。
func writeTarFile(tw *tar.Writer, name string, data []byte) error {
	hdr := &tar.Header{Name: name, Mode: 0o644, Size: int64(len(data)), Typeflag: tar.TypeReg}
	if err := tw.WriteHeader(hdr); err != nil {
		return err
	}
	_, err := tw.Write(data)
	return err
}

// unpackArchive 解包 tar.gz 到各目标目录。
//
//   - dsts: 子目录名 → 本机目标绝对路径；归档里不在 dsts 的子目录被忽略。
//   - manifest.json 条目被跳过。
//   - zip-slip 防护：每个条目解出的路径必须落在其目标根目录内，否则跳过。
//   - 跳过符号链接等非普通文件条目。
//   - 每个子目录首次写入前，若目标目录已存在则调 trashFn 移走（仅一次）。
//
// 返回实际恢复（写入过文件）的子目录数。
func unpackArchive(data []byte, dsts map[string]string, trashFn func(string) (string, error)) (int, error) {
	gz, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return 0, err
	}
	defer gz.Close()
	tr := tar.NewReader(gz)

	trashed := map[string]bool{}
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return len(trashed), err
		}
		if hdr.Typeflag != tar.TypeReg {
			continue // 只接受普通文件
		}
		name := filepath.ToSlash(hdr.Name)
		if name == manifestName {
			continue
		}
		sub, rest, ok := strings.Cut(name, "/")
		if !ok || rest == "" {
			continue
		}
		dst, ok := dsts[sub]
		if !ok {
			continue // 不在恢复目标里的平台
		}
		target := filepath.Join(dst, filepath.FromSlash(rest))
		if !withinDir(dst, target) {
			continue // zip-slip 防护：越权条目跳过
		}
		if !trashed[sub] {
			if _, serr := os.Stat(dst); serr == nil {
				if _, terr := trashFn(dst); terr != nil {
					return len(trashed), terr
				}
			}
			trashed[sub] = true
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return len(trashed), err
		}
		out, err := os.Create(target)
		if err != nil {
			return len(trashed), err
		}
		if _, err := io.Copy(out, tr); err != nil {
			out.Close()
			return len(trashed), err
		}
		if err := out.Close(); err != nil {
			return len(trashed), err
		}
	}
	return len(trashed), nil
}
