package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"skillbook/internal/trash"
)

// recycleItem 是回收站清单里的一条记录。
type recycleItem struct {
	ID        string `json:"id"`       // 删除时间戳（纳秒）字符串
	Name      string `json:"name"`     // 原目录名
	OrigPath  string `json:"origPath"` // 删除前的绝对路径
	Platform  string `json:"platform"`
	DeletedAt int64  `json:"deletedAt"`
}

func recycleDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "trash"), nil
}

func recycleManifestPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "trash.json"), nil
}

// loadRecycle 读取清单；不存在返回空。
func loadRecycle() ([]recycleItem, error) {
	p, err := recycleManifestPath()
	if err != nil {
		return nil, err
	}
	raw, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return []recycleItem{}, nil
		}
		return nil, err
	}
	var items []recycleItem
	if err := json.Unmarshal(raw, &items); err != nil {
		return []recycleItem{}, nil
	}
	return items, nil
}

// saveRecycle 原子写清单（0600）。
func saveRecycle(items []recycleItem) error {
	p, err := recycleManifestPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	raw, _ := json.MarshalIndent(items, "", "  ")
	tmp, err := os.CreateTemp(filepath.Dir(p), ".trash-*.json")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return err
	}
	if _, err := tmp.Write(raw); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, p)
}

// moveToRecycle 把 skill 目录移入回收站并登记。返回是否成功。
func moveToRecycle(srcDir, platform string, now time.Time) error {
	rd, err := recycleDir()
	if err != nil {
		return err
	}
	id := fmt.Sprintf("%d", now.UnixNano())
	slot := filepath.Join(rd, id)
	if err := os.MkdirAll(slot, 0o700); err != nil {
		return err
	}
	base := filepath.Base(srcDir)
	if err := os.Rename(srcDir, filepath.Join(slot, base)); err != nil {
		return err
	}
	items, _ := loadRecycle()
	items = append(items, recycleItem{
		ID: id, Name: base, OrigPath: srcDir, Platform: platform, DeletedAt: now.Unix(),
	})
	return saveRecycle(items)
}

// handleListTrash 返回回收站清单。GET /api/trash
func (s *Server) handleListTrash(w http.ResponseWriter, _ *http.Request) {
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// handleRestoreTrash 恢复一项到原路径。POST /api/trash/restore {id}
func (s *Server) handleRestoreTrash(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ID string `json:"id"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	rd, _ := recycleDir()
	idx := -1
	for i := range items {
		if items[i].ID == body.ID {
			idx = i
			break
		}
	}
	if idx < 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "回收站中无此项"})
		return
	}
	it := items[idx]
	if _, err := os.Lstat(it.OrigPath); err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "原位置已存在同名，无法恢复"})
		return
	}
	src := filepath.Join(rd, it.ID, it.Name)
	if err := os.MkdirAll(filepath.Dir(it.OrigPath), 0o755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if err := os.Rename(src, it.OrigPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	_ = os.RemoveAll(filepath.Join(rd, it.ID))
	items = append(items[:idx], items[idx+1:]...)
	_ = saveRecycle(items)
	writeJSON(w, http.StatusOK, map[string]string{"status": "restored"})
}

// handleEmptyTrash 清空回收站：所有项移到系统废纸篓。POST /api/trash/empty
func (s *Server) handleEmptyTrash(w http.ResponseWriter, _ *http.Request) {
	if !trash.Supported() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "仅 macOS 支持移到废纸篓"})
		return
	}
	items, err := loadRecycle()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "读取回收站失败"})
		return
	}
	rd, _ := recycleDir()
	moved := 0
	for _, it := range items {
		slot := filepath.Join(rd, it.ID)
		if _, err := os.Stat(slot); err == nil {
			if _, terr := trash.ToTrash(slot); terr == nil {
				moved++
			}
		}
	}
	_ = saveRecycle([]recycleItem{})
	writeJSON(w, http.StatusOK, map[string]any{"emptied": moved})
}
