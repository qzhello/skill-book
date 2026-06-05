package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"skillbook/internal/model"
	"skillbook/internal/scanner"
	"skillbook/internal/store"
)

// newTestServer 构造一个带内存 store 的 Server，并隔离 HOME 到临时目录，
// 避免 optimizer.Load 触碰真实 ~/.skillbook。
func newTestServer(t *testing.T) *Server {
	t.Helper()
	t.Setenv("HOME", t.TempDir())
	st, _ := store.Open(":memory:")
	return New(st, []scanner.Root{{Path: t.TempDir(), Source: model.SourceUser}})
}

// postOptimize 发起 /api/ai/optimize 请求并返回响应记录。
func postOptimize(t *testing.T, srv *Server, content string) *httptest.ResponseRecorder {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"content": content})
	req := httptest.NewRequest(http.MethodPost, "/api/ai/optimize", strings.NewReader(string(body)))
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	return rec
}

// decodeSuggestions 从响应体解出 suggestions 字段。
func decodeSuggestions(t *testing.T, rec *httptest.ResponseRecorder) []Suggestion {
	t.Helper()
	var out struct {
		Suggestions []Suggestion `json:"suggestions"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("解析响应失败: %v body=%s", err, rec.Body.String())
	}
	return out.Suggestions
}

func TestOptimizeNormalJSONArray(t *testing.T) {
	srv := newTestServer(t)
	const skill = "---\nname: Demo\n---\n这是正文 ABC。"
	srv.aiCompleteFn = func(_ context.Context, _, _ string) (string, error) {
		return `[{"dimension":"Frontmatter 规范","severity":"high","original":"name: Demo","suggested":"name: demo","reason":"应为 kebab-case"}]`, nil
	}
	rec := postOptimize(t, srv, skill)
	if rec.Code != http.StatusOK {
		t.Fatalf("期望 200，得到 %d: %s", rec.Code, rec.Body.String())
	}
	sg := decodeSuggestions(t, rec)
	if len(sg) != 1 || sg[0].Original != "name: Demo" || sg[0].Severity != "high" {
		t.Fatalf("建议解析错误: %+v", sg)
	}
}

func TestOptimizeStripsJSONFences(t *testing.T) {
	srv := newTestServer(t)
	const skill = "正文包含 片段X 和其他内容。"
	srv.aiCompleteFn = func(_ context.Context, _, _ string) (string, error) {
		return "```json\n[{\"dimension\":\"简洁\",\"severity\":\"low\",\"original\":\"片段X\",\"suggested\":\"片段Y\",\"reason\":\"更短\"}]\n```", nil
	}
	rec := postOptimize(t, srv, skill)
	if rec.Code != http.StatusOK {
		t.Fatalf("期望 200，得到 %d: %s", rec.Code, rec.Body.String())
	}
	sg := decodeSuggestions(t, rec)
	if len(sg) != 1 || sg[0].Original != "片段X" {
		t.Fatalf("围栏剥离失败: %+v", sg)
	}
}

func TestOptimizeFiltersOriginalNotInContent(t *testing.T) {
	srv := newTestServer(t)
	const skill = "正文只有 存在 这个词。"
	srv.aiCompleteFn = func(_ context.Context, _, _ string) (string, error) {
		// 第一项 original 在原文中，第二项不在 → 应被过滤。
		return `[
			{"dimension":"A","severity":"medium","original":"存在","suggested":"存在了","reason":"r1"},
			{"dimension":"B","severity":"high","original":"不存在的片段","suggested":"x","reason":"r2"}
		]`, nil
	}
	rec := postOptimize(t, srv, skill)
	if rec.Code != http.StatusOK {
		t.Fatalf("期望 200，得到 %d", rec.Code)
	}
	sg := decodeSuggestions(t, rec)
	if len(sg) != 1 || sg[0].Original != "存在" {
		t.Fatalf("过滤错误，应只剩 1 条 original=存在: %+v", sg)
	}
}

func TestOptimizeNonJSONReturns502(t *testing.T) {
	srv := newTestServer(t)
	srv.aiCompleteFn = func(_ context.Context, _, _ string) (string, error) {
		return "抱歉，我无法完成。", nil
	}
	rec := postOptimize(t, srv, "任意内容")
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("期望 502，得到 %d: %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "无法解析") {
		t.Fatalf("应返回解析错误: %s", rec.Body.String())
	}
}

func TestOptimizeEmptyArray(t *testing.T) {
	srv := newTestServer(t)
	srv.aiCompleteFn = func(_ context.Context, _, _ string) (string, error) {
		return "[]", nil
	}
	rec := postOptimize(t, srv, "已经很好的内容")
	if rec.Code != http.StatusOK {
		t.Fatalf("期望 200，得到 %d", rec.Code)
	}
	sg := decodeSuggestions(t, rec)
	if len(sg) != 0 {
		t.Fatalf("应为空数组: %+v", sg)
	}
}

func TestOptimizeNotConfigured(t *testing.T) {
	srv := newTestServer(t)
	// 不注入 aiCompleteFn，且确保无 env key。
	t.Setenv("ANTHROPIC_API_KEY", "")
	t.Setenv("OPENAI_API_KEY", "")
	rec := postOptimize(t, srv, "内容")
	if rec.Code != http.StatusNotImplemented {
		t.Fatalf("期望 501，得到 %d: %s", rec.Code, rec.Body.String())
	}
}

func TestOptimizerGetAndPut(t *testing.T) {
	srv := newTestServer(t)

	// GET：首次返回默认内容（含维度关键字）。
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/optimizer", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "Frontmatter") {
		t.Fatalf("GET 失败: %d %s", rec.Code, rec.Body.String())
	}

	// PUT 空内容 → 400。
	rec = httptest.NewRecorder()
	body, _ := json.Marshal(map[string]string{"content": "   "})
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/optimizer", strings.NewReader(string(body))))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("PUT 空内容应 400，得到 %d", rec.Code)
	}

	// PUT 有效内容 → saved，再 GET 回读。
	rec = httptest.NewRecorder()
	body, _ = json.Marshal(map[string]string{"content": "自定义规则内容"})
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/api/optimizer", strings.NewReader(string(body))))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "saved") {
		t.Fatalf("PUT 失败: %d %s", rec.Code, rec.Body.String())
	}
	rec = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/optimizer", nil))
	if !strings.Contains(rec.Body.String(), "自定义规则内容") {
		t.Fatalf("回读失败: %s", rec.Body.String())
	}
}
