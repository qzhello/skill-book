package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const defaultOpenAIBaseURL = "https://api.openai.com/v1"

type openAIReq struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *Client) completeOpenAI(ctx context.Context, system, user string) (string, error) {
	base := c.cfg.BaseURL
	if base == "" {
		base = defaultOpenAIBaseURL
	}
	url := strings.TrimRight(base, "/") + "/chat/completions"

	msgs := make([]openAIMessage, 0, 2)
	if system != "" {
		msgs = append(msgs, openAIMessage{Role: "system", Content: system})
	}
	msgs = append(msgs, openAIMessage{Role: "user", Content: user})

	body, err := json.Marshal(openAIReq{Model: c.cfg.Model, Messages: msgs})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return "", err
	}

	var parsed openAIResp
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("openai: 无法解析响应 (status %d)", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		if parsed.Error != nil {
			return "", fmt.Errorf("openai: %s", parsed.Error.Message)
		}
		return "", fmt.Errorf("openai: status %d", resp.StatusCode)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("openai: 空响应")
	}
	return parsed.Choices[0].Message.Content, nil
}
