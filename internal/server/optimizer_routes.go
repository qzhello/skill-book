package server

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"skillbook/internal/ai"
	"skillbook/internal/optimizer"
)

// optimizeJSONInstruction 是追加到优化规则之后的固定 JSON 输出契约。
// 评判标准来自 optimizer.md，JSON 格式要求固定在代码里。
const optimizeJSONInstruction = "\n\n---\n\n" +
	"你是 skill 评审。依据上面的标准，对用户提供的 SKILL.md 逐条找出可改进点。\n" +
	"**只输出一个 JSON 数组**，不要输出任何解释、前言或 markdown 代码围栏。\n" +
	"数组每一项是一个对象，字段如下：\n" +
	"- dimension：维度名（中文，如 \"Frontmatter 规范\"）\n" +
	"- severity：严重度，只能是 high、medium、low 之一\n" +
	"- original：从原文中**逐字精确摘录**的、可被精确替换的片段（必须是原文的精确子串）\n" +
	"- suggested：改写后的片段\n" +
	"- reason：简短理由（中文）\n" +
	"original 必须是原文的精确子串，否则该项会被丢弃。\n" +
	"若没有任何可改进点，返回空数组 []。"

// maxSuggestions 限制返回给前端的建议条数。
const maxSuggestions = 50

// maxFieldLen 限制单项 original/suggested 的长度（4KB）。
const maxFieldLen = 4 << 10

// validSeverities 是允许的严重度取值，非法值归一为 medium。
var validSeverities = map[string]bool{"high": true, "medium": true, "low": true}

// Suggestion 是一条结构化优化建议。
type Suggestion struct {
	Dimension string `json:"dimension"`
	Severity  string `json:"severity"`
	Original  string `json:"original"`
	Suggested string `json:"suggested"`
	Reason    string `json:"reason"`
}

// handleGetOptimizer 返回当前优化规则内容（首次会落盘默认）。
func (s *Server) handleGetOptimizer(w http.ResponseWriter, r *http.Request) {
	content, err := optimizer.Load()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"content": content})
}

// handlePutOptimizer 保存优化规则内容；去空白后为空则拒绝。
func (s *Server) handlePutOptimizer(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Content string `json:"content"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Content) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "内容不能为空"})
		return
	}
	if err := optimizer.Save(body.Content); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// aiComplete 调用 LLM 得到原始文本：优先用注入的 aiCompleteFn（跳过 Configured 门槛），
// 否则走真实 client。返回 (text, configured, err)。
func (s *Server) aiComplete(ctx context.Context, system, user string) (string, bool, error) {
	if s.aiCompleteFn != nil {
		out, err := s.aiCompleteFn(ctx, system, user)
		return out, true, err
	}
	cfg := effectiveAI()
	if !cfg.Configured() {
		return "", false, nil
	}
	out, err := ai.NewClient(cfg).Complete(ctx, system, user)
	return out, true, err
}

// handleOptimize 依据优化规则对 SKILL.md 逐条体检，返回结构化建议。
func (s *Server) handleOptimize(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Content string `json:"content"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}

	rules, err := optimizer.Load()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	system := rules + optimizeJSONInstruction
	user := body.Content

	out, configured, err := s.aiComplete(r.Context(), system, user)
	if !configured {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "AI 未配置"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}

	suggestions, ok := parseSuggestions(out)
	if !ok {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "AI 返回无法解析"})
		return
	}
	suggestions = filterSuggestions(suggestions, body.Content)
	writeJSON(w, http.StatusOK, map[string]any{"suggestions": suggestions})
}

// parseSuggestions 鲁棒解析 AI 原始输出为建议数组。
// 去掉 ```json / ``` 围栏，截取第一个 '[' 到最后一个 ']'，再 json.Unmarshal。
// 解析失败返回 ok=false。
func parseSuggestions(raw string) ([]Suggestion, bool) {
	s := stripFences(raw)
	start := strings.IndexByte(s, '[')
	end := strings.LastIndexByte(s, ']')
	if start < 0 || end < start {
		return nil, false
	}
	candidate := s[start : end+1]
	var out []Suggestion
	if err := json.Unmarshal([]byte(candidate), &out); err != nil {
		return nil, false
	}
	return out, true
}

// stripFences 去掉常见的 markdown 代码围栏标记。
func stripFences(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "```json", "")
	s = strings.ReplaceAll(s, "```JSON", "")
	s = strings.ReplaceAll(s, "```", "")
	return s
}

// filterSuggestions 过滤并规整建议：
//   - 丢弃 original 为空或不是 content 精确子串的项（保证前端可精确替换）；
//   - severity 非法归一为 medium；
//   - original/suggested 截断到 maxFieldLen；
//   - 最多保留 maxSuggestions 条。
func filterSuggestions(in []Suggestion, content string) []Suggestion {
	out := make([]Suggestion, 0, len(in))
	for _, sg := range in {
		if sg.Original == "" || !strings.Contains(content, sg.Original) {
			continue
		}
		if !validSeverities[sg.Severity] {
			sg.Severity = "medium"
		}
		sg.Original = truncate(sg.Original, maxFieldLen)
		sg.Suggested = truncate(sg.Suggested, maxFieldLen)
		out = append(out, sg)
		if len(out) >= maxSuggestions {
			break
		}
	}
	return out
}

// truncate 按字节安全截断字符串（不切断多字节字符）。
func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	// 回退到不超过 max 的 rune 边界。
	cut := max
	for cut > 0 && !utf8RuneStart(s[cut]) {
		cut--
	}
	return s[:cut]
}

// utf8RuneStart 报告字节 b 是否是一个 UTF-8 编码点的起始字节。
func utf8RuneStart(b byte) bool { return b&0xC0 != 0x80 }
