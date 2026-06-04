package ai

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCompleteAnthropic(t *testing.T) {
	var gotPath, gotKey, gotVer string
	var reqBody anthropicReq

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotKey = r.Header.Get("x-api-key")
		gotVer = r.Header.Get("anthropic-version")
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &reqBody)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"content":[{"type":"text","text":"hello from claude"}]}`))
	}))
	defer srv.Close()

	c := NewClient(Config{Provider: ProviderAnthropic, BaseURL: srv.URL, APIKey: "ak-test", Model: "claude-x"})
	out, err := c.Complete(context.Background(), "be helpful", "optimize this")
	if err != nil {
		t.Fatalf("Complete: %v", err)
	}
	if out != "hello from claude" {
		t.Fatalf("out = %q", out)
	}
	if gotPath != "/v1/messages" {
		t.Fatalf("path = %q", gotPath)
	}
	if gotKey != "ak-test" {
		t.Fatalf("x-api-key = %q", gotKey)
	}
	if gotVer != anthropicVersion {
		t.Fatalf("anthropic-version = %q", gotVer)
	}
	if reqBody.System != "be helpful" {
		t.Fatalf("system = %q", reqBody.System)
	}
	if len(reqBody.Messages) != 1 || reqBody.Messages[0].Role != "user" || reqBody.Messages[0].Content != "optimize this" {
		t.Fatalf("messages = %+v", reqBody.Messages)
	}
	if reqBody.Model != "claude-x" {
		t.Fatalf("model = %q", reqBody.Model)
	}
}

func TestCompleteOpenAI(t *testing.T) {
	var gotPath, gotAuth string
	var reqBody openAIReq

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotAuth = r.Header.Get("Authorization")
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &reqBody)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"choices":[{"message":{"role":"assistant","content":"hi from gpt"}}]}`))
	}))
	defer srv.Close()

	c := NewClient(Config{Provider: ProviderOpenAI, BaseURL: srv.URL, APIKey: "ok-test", Model: "gpt-x"})
	out, err := c.Complete(context.Background(), "sys prompt", "user prompt")
	if err != nil {
		t.Fatalf("Complete: %v", err)
	}
	if out != "hi from gpt" {
		t.Fatalf("out = %q", out)
	}
	if gotPath != "/chat/completions" {
		t.Fatalf("path = %q", gotPath)
	}
	if gotAuth != "Bearer ok-test" {
		t.Fatalf("auth = %q", gotAuth)
	}
	if len(reqBody.Messages) != 2 {
		t.Fatalf("messages = %+v", reqBody.Messages)
	}
	if reqBody.Messages[0].Role != "system" || reqBody.Messages[0].Content != "sys prompt" {
		t.Fatalf("system msg = %+v", reqBody.Messages[0])
	}
	if reqBody.Messages[1].Role != "user" || reqBody.Messages[1].Content != "user prompt" {
		t.Fatalf("user msg = %+v", reqBody.Messages[1])
	}
}

func TestCompleteUnconfigured(t *testing.T) {
	c := NewClient(Config{})
	if _, err := c.Complete(context.Background(), "s", "u"); err == nil {
		t.Fatal("expected error when unconfigured")
	}
}

func TestCompleteOpenAIErrorStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":{"message":"bad key"}}`))
	}))
	defer srv.Close()

	c := NewClient(Config{Provider: ProviderOpenAI, BaseURL: srv.URL, APIKey: "x", Model: "m"})
	_, err := c.Complete(context.Background(), "", "u")
	if err == nil {
		t.Fatal("expected error on 401")
	}
}
