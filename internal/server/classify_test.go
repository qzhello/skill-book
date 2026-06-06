package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"skillbook/internal/model"
)

// 注入假 AI，验证分类把"未分类"的 skill 打上标签，且增量跳过已分类的。
func TestClassify_TagsUntaggedSkills(t *testing.T) {
	srv := newTestServer(t)
	srv.aiCompleteFn = func(_ context.Context, _, user string) (string, error) {
		// 按名称返回不同标签，确认每条独立处理
		if strings.Contains(user, "alpha") {
			return `["测试","Go"]`, nil
		}
		return "```json\n[\"Web\"]\n```", nil // 验证去围栏
	}
	_ = srv.st.Upsert(model.Skill{Source: "user", Platform: "claude", Dir: "/d/alpha", FilePath: "/d/alpha/SKILL.md", Name: "alpha", Description: "x"})
	_ = srv.st.Upsert(model.Skill{Source: "user", Platform: "claude", Dir: "/d/beta", FilePath: "/d/beta/SKILL.md", Name: "beta", Description: "y"})

	// 启动分类
	req := httptest.NewRequest(http.MethodPost, "/api/tags/classify", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusAccepted && rec.Code != http.StatusOK {
		t.Fatalf("classify start code=%d", rec.Code)
	}

	// 等待后台完成
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		srv.clsMu.Lock()
		running := srv.cls.Running
		srv.clsMu.Unlock()
		if !running {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	m, _ := srv.st.TagsByID()
	alphaID := model.Skill{Source: "user", Dir: "/d/alpha"}.ID()
	betaID := model.Skill{Source: "user", Dir: "/d/beta"}.ID()
	if len(m[alphaID]) != 2 || m[alphaID][0] != "测试" {
		t.Fatalf("alpha tags=%v", m[alphaID])
	}
	if len(m[betaID]) != 1 || m[betaID][0] != "Web" {
		t.Fatalf("beta tags=%v", m[betaID])
	}

	// 增量：再次启动，已分类的不应重复处理（total=0）
	req2 := httptest.NewRequest(http.MethodPost, "/api/tags/classify", strings.NewReader(`{}`))
	rec2 := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec2, req2)
	var p classifyProgress
	_ = json.Unmarshal(rec2.Body.Bytes(), &p)
	if p.Total != 0 {
		t.Fatalf("incremental should skip tagged, got total=%d", p.Total)
	}
}
