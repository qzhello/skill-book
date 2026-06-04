package ai

import (
	"context"
	"errors"
	"net/http"
	"time"
)

// Client 用给定配置调用 AI provider。
type Client struct {
	cfg  Config
	http *http.Client
}

// NewClient 用配置构造 Client，HTTP 超时 60s。
func NewClient(cfg Config) *Client {
	return &Client{
		cfg:  cfg,
		http: &http.Client{Timeout: 60 * time.Second},
	}
}

// Complete 发送一次补全请求，按 Provider 分发。
func (c *Client) Complete(ctx context.Context, system, user string) (string, error) {
	if !c.cfg.Configured() {
		return "", errors.New("AI 未配置")
	}
	switch c.cfg.Provider {
	case ProviderOpenAI:
		return c.completeOpenAI(ctx, system, user)
	case ProviderAnthropic:
		return c.completeAnthropic(ctx, system, user)
	default:
		return "", errors.New("未知 provider: " + string(c.cfg.Provider))
	}
}
