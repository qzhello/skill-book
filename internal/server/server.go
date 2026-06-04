package server

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"skillbook/internal/editor"
	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

//go:embed all:web
var webFS embed.FS

type Server struct {
	st    *store.Store
	roots []scanner.Root
}

func New(st *store.Store, roots []scanner.Root) *Server {
	return &Server{st: st, roots: roots}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/scan", s.handleScan)
	mux.HandleFunc("GET /api/skills", s.handleList)
	mux.HandleFunc("GET /api/skills/{id}", s.handleGet)
	mux.HandleFunc("PUT /api/skills/{id}", s.handleSave)

	sub, _ := fs.Sub(webFS, "web")
	mux.Handle("/", http.FileServer(http.FS(sub)))
	return mux
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	skills, err := scanner.ScanRoots(s.roots)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	for _, sk := range skills {
		if err := s.st.Upsert(sk); err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
	}
	writeJSON(w, 200, map[string]int{"count": len(skills)})
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	skills, err := s.st.Search(q)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	conflicts, dups, dupCounts, err := s.st.NameGroups()
	if err != nil {
		log.Printf("handleList: NameGroups failed: %v", err)
	}
	type item struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Source      string `json:"source"`
		Description string `json:"description"`
		Dir         string `json:"dir"`
	}
	out := make([]item, 0, len(skills))
	for _, sk := range skills {
		out = append(out, item{sk.ID(), sk.Name, string(sk.Source), sk.Description, sk.Dir})
	}
	writeJSON(w, 200, map[string]any{
		"conflicts": conflicts, "dups": dups, "dupCounts": dupCounts, "skills": out,
	})
}

func (s *Server) handleGet(w http.ResponseWriter, r *http.Request) {
	sk, err := s.st.Get(r.PathValue("id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, 200, map[string]any{
		"id": sk.ID(), "name": sk.Name, "source": string(sk.Source),
		"description": sk.Description, "dir": sk.Dir, "file_path": sk.FilePath, "body": sk.Body,
	})
}

func (s *Server) handleSave(w http.ResponseWriter, r *http.Request) {
	sk, err := s.st.Get(r.PathValue("id"))
	if err != nil || sk == nil {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	var body struct {
		Content string `json:"content"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "cannot read request body"})
		return
	}
	if err := json.Unmarshal(raw, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "bad json"})
		return
	}
	// repoRoot = 该 skill 来源根：从 file_path 向上找到与来源匹配的根。
	// P1 简化：用 skill 所在目录的父目录作为 repo 根（即 skills 根目录）。
	repoRoot := filepath.Dir(sk.Dir)
	ed := editor.New(repoRoot)
	if err := ed.Save(sk.FilePath, body.Content); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	// 重扫该文件并更新索引
	content, _ := os.ReadFile(sk.FilePath)
	name, desc, _ := scanner.ParseFrontmatter(content)
	if name == "" {
		name = filepath.Base(sk.Dir)
	}
	updated := model.Skill{Source: sk.Source, Dir: sk.Dir, FilePath: sk.FilePath,
		Name: name, Description: desc, Body: string(content),
		BodyHash: model.HashBody(string(content)), MTime: sk.MTime}
	if err := s.st.Upsert(updated); err != nil {
		// 文件已成功保存，仅索引更新失败，记日志后仍返回 200。
		log.Printf("handleSave: Upsert index update failed for %s: %v", sk.FilePath, err)
	}
	writeJSON(w, 200, map[string]string{"status": "saved"})
}
