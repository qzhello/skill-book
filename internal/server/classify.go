package server

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"skillbook/internal/model"
)

// classifyProgress 是标签分类后台任务的进度快照。
type classifyProgress struct {
	Running bool   `json:"running"`
	Total   int    `json:"total"`
	Done    int    `json:"done"`
	Failed  int    `json:"failed"`
	Err     string `json:"err,omitempty"`
}

// classifyConcurrency 限制并发调用 AI 的协程数，避免压垮上游/触发限流。
const classifyConcurrency = 4

// classifySystemPrompt 是默认分类提示词。可被 ~/.skillbook/classifier.md 覆盖
// （"把分类逻辑做成可编辑的 Skill"）。{vocab} 会替换为已有标签词表以鼓励复用。
const classifySystemPrompt = `你是一个技能库分类助手。根据给定 skill 的名称和描述，归纳 1-3 个简短的主题标签（宁少勿滥）。
要求：
- 标签要短（中文 2-6 字，或一个英文单词），描述领域/用途/技术栈，如：测试、Web、前端、后端、数据库、API、CLI、文档、安全、性能、部署、AI、Go、Python、TypeScript、React。
- 强约束：尽量只从下列已有标签中挑选（语义吻合就复用）；只有确实没有合适的才新建标签，且新建最多 1 个。避免造同义词（如"测试/单元测试/test"应统一为"测试"）。
- 已有标签（按常用度）：{vocab}
- 只输出一个 JSON 字符串数组，例如 ["测试","Go"]，不要输出任何解释或代码块标记。`

// handleClassifyStatus 返回当前分类进度。
func (s *Server) handleClassifyStatus(w http.ResponseWriter, _ *http.Request) {
	s.clsMu.Lock()
	snap := s.cls
	s.clsMu.Unlock()
	writeJSON(w, http.StatusOK, snap)
}

// handleClassifyStart 启动一次标签分类。
//   - body.force=true：对全部 skill 重新分类；否则仅分类"未分类"（增量）。
//   - 已在运行：直接返回当前进度，不重复启动。
//   - AI 未配置：返回 501。
func (s *Server) handleClassifyStart(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Force bool `json:"force"`
	}
	_ = readJSONBodyOptional(r, &body)

	s.clsMu.Lock()
	if s.cls.Running {
		snap := s.cls
		s.clsMu.Unlock()
		writeJSON(w, http.StatusOK, snap)
		return
	}
	s.clsMu.Unlock()

	// AI 配置门槛（测试注入 aiCompleteFn 时跳过）。
	if s.aiCompleteFn == nil && !effectiveAI().Configured() {
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "请先在设置里配置 AI（用于自动打标签）"})
		return
	}

	all, err := s.st.List()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	tagged, err := s.st.TaggedIDSet()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	todo := make([]model.Skill, 0, len(all))
	for _, sk := range all {
		if body.Force || !tagged[sk.ID()] {
			todo = append(todo, sk)
		}
	}
	if len(todo) == 0 {
		writeJSON(w, http.StatusOK, classifyProgress{Running: false, Total: 0, Done: 0})
		return
	}

	s.clsMu.Lock()
	s.cls = classifyProgress{Running: true, Total: len(todo)}
	s.clsMu.Unlock()

	go s.runClassify(todo)
	writeJSON(w, http.StatusAccepted, classifyProgress{Running: true, Total: len(todo)})
}

// runClassify 并发分类 todo 中的 skill，实时更新进度。脱离请求生命周期，用独立 ctx。
func (s *Server) runClassify(todo []model.Skill) {
	defer func() {
		s.clsMu.Lock()
		s.cls.Running = false
		s.clsMu.Unlock()
	}()

	vocab, _ := s.st.DistinctTags()
	system := s.classifierPrompt(vocab)

	// AI 调用并发（受 sem 限流），但 DB 写入串行（单消费者），避免并发写 SQLite 冲突。
	type result struct {
		id   string
		name string
		tags []string
		err  error
	}
	results := make(chan result, len(todo))
	sem := make(chan struct{}, classifyConcurrency)
	var wg sync.WaitGroup
	for _, sk := range todo {
		wg.Add(1)
		sem <- struct{}{}
		go func(sk model.Skill) {
			defer wg.Done()
			defer func() { <-sem }()
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			tags, err := s.classifyOne(ctx, system, sk)
			results <- result{id: sk.ID(), name: sk.Name, tags: tags, err: err}
		}(sk)
	}
	go func() { wg.Wait(); close(results) }()

	for r := range results {
		// 即便失败也写一行空标签，标记"已处理"，避免重扫反复重试同一条卡住进度。
		if r.err != nil {
			log.Printf("classify: skill %q 失败: %v", r.name, r.err)
			_ = s.st.SetTags(r.id, nil)
			s.bumpClassify(false, true)
			continue
		}
		if serr := s.st.SetTags(r.id, r.tags); serr != nil {
			log.Printf("classify: 写入标签失败 %q: %v", r.name, serr)
			s.bumpClassify(false, true)
			continue
		}
		s.bumpClassify(true, false)
	}
}

func (s *Server) bumpClassify(ok, failed bool) {
	s.clsMu.Lock()
	if ok || failed {
		s.cls.Done++
	}
	if failed {
		s.cls.Failed++
	}
	s.clsMu.Unlock()
}

// classifyOne 调一次 AI 给单个 skill 打标签，解析 JSON 数组。
func (s *Server) classifyOne(ctx context.Context, system string, sk model.Skill) ([]string, error) {
	user := "技能名称：" + sk.Name + "\n描述：" + sk.Description
	out, _, err := s.aiComplete(ctx, system, user)
	if err != nil {
		return nil, err
	}
	return parseTags(out), nil
}

// parseTags 从模型输出里抽取标签数组：优先 JSON，退化为逗号/换行分隔。
func parseTags(out string) []string {
	out = strings.TrimSpace(out)
	// 去掉可能的 ```json ``` 围栏
	if strings.HasPrefix(out, "```") {
		if i := strings.Index(out, "\n"); i >= 0 {
			out = out[i+1:]
		}
		out = strings.TrimSuffix(strings.TrimSpace(out), "```")
		out = strings.TrimSpace(out)
	}
	// 截取第一个 [ .. ] 作为 JSON 数组
	if l, r := strings.Index(out, "["), strings.LastIndex(out, "]"); l >= 0 && r > l {
		var arr []string
		if json.Unmarshal([]byte(out[l:r+1]), &arr) == nil {
			return arr
		}
	}
	// 退化：按逗号/换行/顿号切分
	repl := strings.NewReplacer("\n", ",", "、", ",", "，", ",")
	parts := strings.Split(repl.Replace(out), ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.Trim(strings.TrimSpace(p), `"'[]`); t != "" {
			res = append(res, t)
		}
	}
	return res
}

// classifierPromptPath 返回可编辑分类规则文件路径 ~/.skillbook/classifier.md。
func classifierPromptPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "classifier.md"), nil
}

// classifierPrompt 返回最终 system 提示词：优先读 ~/.skillbook/classifier.md，
// 否则用内置默认；再把 {vocab} 替换为已有标签词表。
func (s *Server) classifierPrompt(vocab []string) string {
	tmpl := classifySystemPrompt
	if path, err := classifierPromptPath(); err == nil {
		if raw, rerr := os.ReadFile(path); rerr == nil && strings.TrimSpace(string(raw)) != "" {
			tmpl = string(raw)
		}
	}
	v := "（暂无）"
	if len(vocab) > 0 {
		if len(vocab) > 20 {
			vocab = vocab[:20] // 只喂高频前 20，促使收敛、避免词表膨胀
		}
		v = strings.Join(vocab, "、")
	}
	return strings.ReplaceAll(tmpl, "{vocab}", v)
}

// handleGetClassifier 返回当前分类规则（无自定义则返回内置默认）。
func (s *Server) handleGetClassifier(w http.ResponseWriter, _ *http.Request) {
	content := classifySystemPrompt
	custom := false
	if path, err := classifierPromptPath(); err == nil {
		if raw, rerr := os.ReadFile(path); rerr == nil && strings.TrimSpace(string(raw)) != "" {
			content, custom = string(raw), true
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"content": content, "custom": custom})
}

// handlePutClassifier 保存自定义分类规则；内容为空表示恢复内置默认（删除文件）。
func (s *Server) handlePutClassifier(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Content string `json:"content"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	path, err := classifierPromptPath()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if strings.TrimSpace(body.Content) == "" {
		if rerr := os.Remove(path); rerr != nil && !os.IsNotExist(rerr) {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": rerr.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "reset"})
		return
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if err := os.WriteFile(path, []byte(body.Content), 0o644); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

// readJSONBodyOptional 尽力解析请求体到 v；体为空或非法时静默忽略（用于可选参数）。
func readJSONBodyOptional(r *http.Request, v any) error {
	raw, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil || len(raw) == 0 {
		return err
	}
	return json.Unmarshal(raw, v)
}

// handleSetTags 手动覆盖某 skill 的标签（用户编辑）。
func (s *Server) handleSetTags(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sk, err := s.st.Get(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sk == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	var body struct {
		Tags []string `json:"tags"`
	}
	if !readJSONBody(w, r, &body) {
		return
	}
	if err := s.st.SetTags(id, body.Tags); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}
