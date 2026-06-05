package server

import (
	"context"
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"skillbook/internal/backup"
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
	// cloneFn 执行 git clone，将 cloneURL 克隆到 destDir。
	// 默认 gitClone（真实 git）；测试可注入本地仓库克隆以避免联网。
	cloneFn func(ctx context.Context, cloneURL, ref, destDir string) error
	// rawBaseOverride 非空时，source/check 用它替换 raw 抓取地址（仅测试用）。
	rawBaseOverride string
	// aiCompleteFn 抽象"调用 LLM 得到原始文本"，便于测试注入假实现。
	// 非 nil 时直接使用它（并跳过 Configured 门槛检查）；
	// nil 时走真实 ai.NewClient(effectiveAI()).Complete。
	aiCompleteFn func(ctx context.Context, system, user string) (string, error)
	// backupSvc 非 nil 时用于备份/恢复（测试注入假 git Runner）；
	// nil 时按 HOME 构造默认服务。
	backupSvc *backup.Service
}

func New(st *store.Store, roots []scanner.Root) *Server {
	return &Server{st: st, roots: roots, cloneFn: gitClone}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/scan", s.handleScan)
	mux.HandleFunc("GET /api/skills", s.handleList)
	mux.HandleFunc("GET /api/skills/{id}", s.handleGet)
	mux.HandleFunc("PUT /api/skills/{id}", s.handleSave)

	// 配置
	mux.HandleFunc("GET /api/config", s.handleGetConfig)
	mux.HandleFunc("PUT /api/config", s.handlePutConfig)
	mux.HandleFunc("POST /api/ai/test", s.handleAITest)
	// AI
	mux.HandleFunc("GET /api/recipes", s.handleRecipes)
	mux.HandleFunc("POST /api/ai/optimize", s.handleOptimize)
	// 优化规则文件
	mux.HandleFunc("GET /api/optimizer", s.handleGetOptimizer)
	mux.HandleFunc("PUT /api/optimizer", s.handlePutOptimizer)
	mux.HandleFunc("POST /api/ai/create", s.handleCreate)
	// 文件操作
	mux.HandleFunc("POST /api/skills/new", s.handleNewSkill)
	mux.HandleFunc("POST /api/reveal", s.handleReveal)
	// 目录结构 / 多文件
	mux.HandleFunc("GET /api/skills/{id}/files", s.handleSkillFiles)
	mux.HandleFunc("GET /api/file", s.handleGetFile)
	mux.HandleFunc("PUT /api/file", s.handlePutFile)
	mux.HandleFunc("POST /api/skills/trash", s.handleTrash)
	mux.HandleFunc("POST /api/skills/sync", s.handleSync)
	mux.HandleFunc("GET /api/groups", s.handleGroups)
	// 来源链接
	mux.HandleFunc("GET /api/skills/{id}/source", s.handleGetSource)
	mux.HandleFunc("PUT /api/skills/{id}/source", s.handlePutSource)
	mux.HandleFunc("GET /api/sources", s.handleListSources)
	// GitHub 导入 + 更新检查/应用
	mux.HandleFunc("POST /api/import", s.handleImport)
	mux.HandleFunc("POST /api/skills/{id}/source/check", s.handleSourceCheck)
	mux.HandleFunc("POST /api/skills/{id}/source/apply", s.handleSourceApply)
	// GitHub 备份 / 恢复
	mux.HandleFunc("GET /api/backup/config", s.handleGetBackupConfig)
	mux.HandleFunc("PUT /api/backup/config", s.handlePutBackupConfig)
	mux.HandleFunc("GET /api/backup/status", s.handleBackupStatus)
	mux.HandleFunc("POST /api/backup/push", s.handleBackupPush)
	mux.HandleFunc("POST /api/backup/restore", s.handleBackupRestore)

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
	ids := make([]string, 0, len(skills))
	for _, sk := range skills {
		if err := s.st.Upsert(sk); err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
		ids = append(ids, sk.ID())
	}
	// mark-and-sweep：清除已从磁盘消失的幽灵记录
	removed, err := s.st.Sweep(ids)
	if err != nil {
		log.Printf("handleScan: Sweep failed: %v", err)
	}
	writeJSON(w, 200, map[string]int{"count": len(skills), "removed": removed})
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
		Platform    string `json:"platform"`
		Description string `json:"description"`
		Dir         string `json:"dir"`
		MTime       int64  `json:"mtime"`
	}
	out := make([]item, 0, len(skills))
	for _, sk := range skills {
		out = append(out, item{sk.ID(), sk.Name, string(sk.Source), string(sk.Platform), sk.Description, sk.Dir, sk.MTime})
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
		"id": sk.ID(), "name": sk.Name, "source": string(sk.Source), "platform": string(sk.Platform),
		"description": sk.Description, "dir": sk.Dir, "file_path": sk.FilePath, "body": sk.Body, "mtime": sk.MTime,
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
	mtime := sk.MTime
	if info, e := os.Stat(sk.FilePath); e == nil {
		mtime = info.ModTime().Unix()
	}
	updated := model.Skill{Source: sk.Source, Platform: sk.Platform, Dir: sk.Dir, FilePath: sk.FilePath,
		Name: name, Description: desc, Body: string(content),
		BodyHash: model.HashBody(string(content)), MTime: mtime}
	if err := s.st.Upsert(updated); err != nil {
		// 文件已成功保存，仅索引更新失败，记日志后仍返回 200。
		log.Printf("handleSave: Upsert index update failed for %s: %v", sk.FilePath, err)
	}
	writeJSON(w, 200, map[string]string{"status": "saved"})
}
