package ai

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Provider 标识 AI 适配器类型。
type Provider string

const (
	ProviderAnthropic Provider = "anthropic"
	ProviderOpenAI    Provider = "openai"

	defaultAnthropicModel = "claude-3-5-sonnet-latest"
	defaultOpenAIModel    = "gpt-4o-mini"
)

// Config 是 AI 配置，持久化在 ~/.skillbook/config.json。
type Config struct {
	Provider Provider `json:"provider"`
	BaseURL  string   `json:"baseURL"`
	APIKey   string   `json:"apiKey"`
	Model    string   `json:"model"`
}

// configPath 返回 ~/.skillbook/config.json 的绝对路径。
func configPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillbook", "config.json"), nil
}

// Load 从 ~/.skillbook/config.json 读取配置。文件不存在时返回空配置，不报错。
func Load() Config {
	path, err := configPath()
	if err != nil {
		return Config{}
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return Config{}
	}
	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return Config{}
	}
	return cfg
}

// Save 把配置写入 ~/.skillbook/config.json，权限 0600。
func Save(cfg Config) error {
	path, err := configPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, raw, 0o600)
}

// Effective 合并环境变量兜底，返回可用配置。
// 文件中的非空字段优先；缺失字段从 env 推断：
//   - ANTHROPIC_API_KEY → anthropic
//   - OPENAI_API_KEY (+ OPENAI_BASE_URL) → openai
func (c Config) Effective() Config {
	out := c
	if out.APIKey == "" {
		if k := os.Getenv("ANTHROPIC_API_KEY"); k != "" {
			out.APIKey = k
			if out.Provider == "" {
				out.Provider = ProviderAnthropic
			}
		} else if k := os.Getenv("OPENAI_API_KEY"); k != "" {
			out.APIKey = k
			if out.Provider == "" {
				out.Provider = ProviderOpenAI
			}
			if out.BaseURL == "" {
				out.BaseURL = os.Getenv("OPENAI_BASE_URL")
			}
		}
	}
	if out.Provider == "" {
		// 无显式 provider 时按 key 来源推断默认。
		if os.Getenv("ANTHROPIC_API_KEY") != "" {
			out.Provider = ProviderAnthropic
		} else if os.Getenv("OPENAI_API_KEY") != "" {
			out.Provider = ProviderOpenAI
		}
	}
	if out.Model == "" {
		switch out.Provider {
		case ProviderOpenAI:
			out.Model = defaultOpenAIModel
		case ProviderAnthropic:
			out.Model = defaultAnthropicModel
		}
	}
	return out
}

// Configured 表示当前配置有可用的 API key。
func (c Config) Configured() bool {
	return c.APIKey != ""
}
