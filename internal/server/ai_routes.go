package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"skillbook/internal/ai"
	"skillbook/internal/recipe"
)

const aiMaxBody = 1 << 20 // 1 MiB

// genericWritingGuidance 在库中找不到 writing 风格配方时作为 optimize 的兜底 system。
const genericWritingGuidance = `你是一名资深技术写作者，擅长打磨 Claude Code 的 SKILL.md。` +
	`优化时保持原有 YAML frontmatter（name/description）不变，` +
	`让结构清晰、步骤可操作、措辞精炼，去除冗余与含糊表达。`

// readJSONBody 读取受限大小的请求体并解析为 v。
func readJSONBody(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, aiMaxBody)
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求体过大或无法读取"})
		return false
	}
	if err := json.Unmarshal(raw, v); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad json"})
		return false
	}
	return true
}

// effectiveAI 每次请求读取合并后的 AI 配置。
func effectiveAI() ai.Config { return ai.Load().Effective() }

// handleGetConfig 返回当前配置，绝不回传 key 明文。
func (s *Server) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	cfg := ai.Load()
	writeJSON(w, http.StatusOK, map[string]any{
		"provider": string(cfg.Provider),
		"baseURL":  cfg.BaseURL,
		"model":    cfg.Model,
		"hasKey":   cfg.APIKey != "",
	})
}

// handlePutConfig 写入配置。apiKey 为空表示保持原 key 不变。
func (s *Server) handlePutConfig(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Provider string `json:"provider"`
		BaseURL  string `json:"baseURL"`
		APIKey   string `json:"apiKey"`
		Model    string `json:"model"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	cur := ai.Load()
	next := ai.Config{
		Provider: ai.Provider(body.Provider),
		BaseURL:  body.BaseURL,
		Model:    body.Model,
		APIKey:   cur.APIKey, // 默认保留
	}
	if body.APIKey != "" {
		next.APIKey = body.APIKey
	}
	if err := ai.Save(next); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// handleAITest 用当前配置发一个最小请求验证连通性。
func (s *Server) handleAITest(w http.ResponseWriter, r *http.Request) {
	cfg := effectiveAI()
	if !cfg.Configured() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "AI 未配置"})
		return
	}
	client := ai.NewClient(cfg)
	out, err := client.Complete(r.Context(), "", "ping")
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "message": err.Error()})
		return
	}
	_ = out
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "message": "连接成功"})
}

// handleRecipes 返回可用配方列表。
func (s *Server) handleRecipes(w http.ResponseWriter, r *http.Request) {
	recipes, err := recipe.List(s.st)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"recipes": recipes})
}

// handleOptimize 用配方为 system，优化传入的 SKILL.md。
func (s *Server) handleOptimize(w http.ResponseWriter, r *http.Request) {
	cfg := effectiveAI()
	if !cfg.Configured() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "AI 未配置"})
		return
	}
	var body struct {
		Content string `json:"content"`
		Recipe  string `json:"recipe"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	system := s.optimizeSystem(body.Recipe)
	user := "下面是一份 SKILL.md，请在保持 YAML frontmatter 的前提下优化它的结构、清晰度与可操作性，只输出完整 markdown，不要解释：\n\n" + body.Content

	s.complete(w, r.Context(), cfg, system, user)
}

// optimizeSystem 解析 optimize 的 system 提示：指定配方 > writing 风格 > 通用兜底。
func (s *Server) optimizeSystem(recipeID string) string {
	if recipeID != "" && recipeID != recipe.BlankID {
		if b, _ := recipe.Body(s.st, recipeID); b != "" {
			return b
		}
	}
	if b := recipe.WritingRecipeBody(s.st); b != "" {
		return b
	}
	return genericWritingGuidance
}

// handleCreate 按配方方法论创建一个新 skill 初稿。
func (s *Server) handleCreate(w http.ResponseWriter, r *http.Request) {
	cfg := effectiveAI()
	if !cfg.Configured() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "AI 未配置"})
		return
	}
	var body struct {
		Name   string `json:"name"`
		Brief  string `json:"brief"`
		Recipe string `json:"recipe"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	system := genericWritingGuidance
	if b, _ := recipe.Body(s.st, body.Recipe); b != "" {
		system = b
	}
	user := "请按上述方法论，创建一个名为 " + body.Name + " 的 skill。需求：" + body.Brief +
		"。只输出完整 SKILL.md（含 frontmatter name/description），不要解释。"

	s.complete(w, r.Context(), cfg, system, user)
}

// complete 调用 AI 并把结果作为 {result} 返回。
func (s *Server) complete(w http.ResponseWriter, ctx context.Context, cfg ai.Config, system, user string) {
	client := ai.NewClient(cfg)
	out, err := client.Complete(ctx, system, user)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"result": out})
}
