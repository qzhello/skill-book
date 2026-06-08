# SkillBook

<p align="center"><b>本地 Skill 管理台</b> · 浏览 · 搜索 · 在线编辑 · AI 优化你本机的全部 Claude Code / Codex Skill</p>

<p align="center">
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a>
</p>

---

SkillBook 是一个**纯本地**运行的单进程 Web 应用（Go 单二进制，前端已内嵌，无需 Node）：一键扫描全机 Skill，命令面板式搜索，把每个 Skill 当目录在线编辑，按维度做 AI 优化并逐条采纳建议，用 AI 自动打标签分类，支持从 GitHub 导入与上游更新检查，并能把备份归档到你自己的 S3。数据只在你本机，密钥只存本地、永不入库。

## ✨ 功能一览

- **统一浏览 / 搜索**：扫描自动发现的各平台 Skill（`~/.claude/skills`、`~/.codex/skills` 等）与自定义项目目录，FTS5 全文检索 + 名称精确优先，虚拟滚动应对上千条。
- **可配置扫描目录 / 项目**：`~/.<工具>/skills` 默认勾选（可取消），并可增删要扫描的项目目录（内置文件夹浏览器，支持批量选择）；每个目录即一个「项目」，递归扫描其下所有 `SKILL.md`，可按项目筛选。
- **标签分类**：扫描后用 AI 自动为 Skill 打标签（增量、跳过已打、批量异步带进度条），支持多标签、按标签搜索 / 筛选、手动编辑；分类规则可在平台内编辑（`~/.skillbook/classifier.md`）。
- **重复 vs 冲突区分**：同名同内容标记为「重复」、同名不同内容标记为「命名冲突」，可批量定位 / 移到废纸篓。
- **目录级在线编辑**：Skill 即目录，左侧文件树 + CodeMirror，浏览 / 编辑双模式，保存时若已在 git 工作区会自动提交。
- **AI 优化即 Skill**：内置一份可在平台编辑的「优化规则」（`~/.skillbook/optimizer.md`），按维度逐条体检，返回结构化建议，逐条采纳后精确替换。兼容 DeepSeek / OpenAI / Claude / 本地 Ollama 等。
- **来源治理**：每个 Skill 可标注来源链接（标题处 chip），GitHub 来源支持「检查更新」；可直接从 github.com 导入 Skill 目录；私有仓库可配置访问令牌（掩码展示，仅存本机）。
- **S3 备份 / 恢复**：一键把用户级 `~/.claude/skills`、`~/.codex/skills` 打包成带时间戳的 `tar.gz` 归档，上传到你自己的 S3（兼容 Cloudflare R2 / MinIO / 阿里云 OSS）；保留可配置份数的历史版本（默认 20，超出自动清理最旧），可在弹窗内查看历史列表并恢复任意版本（被覆盖的本地目录先移废纸篓）。Secret 仅存本机 `~/.skillbook/backup.json`（0600，不回显、不上传、不入备份内容）。
- **安全优先**：删除走系统废纸篓（绝不 `rm`）、符号链接与路径越权防护（含归档解包 zip-slip 防护）、出站仅放行 github.com、API key / 凭据仅存 `~/.skillbook/*.json`（0600，不回显、不上传）。

## 🖥 环境要求

- **macOS**（目前仅官方支持 macOS；其它系统可自行装好 Go 后编译运行）
- **Go 1.25+**（一键脚本会自动安装）
- 纯 Go 依赖（`modernc.org/sqlite`，无需 CGO、无需系统级 SQLite）

## 🚀 一键安装与启动

```bash
# 1) 一键准备环境（自动检测并安装 Homebrew + Go，然后编译）
./install.sh

# 2) 启动（后台运行，不阻塞终端，默认 http://127.0.0.1:7777，自动开浏览器）
./start.sh

# 停止 / 重启
./stop.sh
./restart.sh

# 自定义监听地址
SKILLBOOK_ADDR=127.0.0.1:8080 ./start.sh
```

首次进入点右上角「扫描」加载本机全部 Skill，然后用顶部搜索框查找。`start.sh` 后台运行，pid 记于 `.skillbook.pid`，日志写入 `skillbook.log`，重复运行会复用已在跑的实例。

## 🔨 手动编译 / 交叉编译

入口包为 `./cmd/skillbook`，模块名 `skillbook`：

```bash
# 本机编译
go build -o skillbook ./cmd/skillbook

# Apple Silicon（M 系列）
GOOS=darwin GOARCH=arm64 go build -o skillbook-darwin-arm64 ./cmd/skillbook

# Intel Mac
GOOS=darwin GOARCH=amd64 go build -o skillbook-darwin-amd64 ./cmd/skillbook

# 运行
./skillbook -addr 127.0.0.1:7777
```

> 前端资源通过 `//go:embed` 编译进二进制，产物为单文件，拷到同架构 Mac 上可直接运行。

## 🤖 配置 AI（可选）

AI 优化 / 配方生成需要一个大模型。打开右上角设置（齿轮），选择 Provider 并填入 Base URL / Model / API Key：

| Provider | 示例 Base URL | 示例 Model |
| --- | --- | --- |
| OpenAI 兼容（DeepSeek） | `https://api.deepseek.com` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 本地 Ollama | `http://127.0.0.1:11434/v1` | `qwen2.5` |
| Anthropic | （默认） | `claude-3-5-sonnet` |

也支持环境变量回退（如 `ANTHROPIC_API_KEY`）。**Key 只写入本机 `~/.skillbook/config.json`（权限 0600），不会回显、不会进入 git、不会上传。**

## 📂 扫描的来源目录

默认扫描自动发现的各平台用户级目录（如 `~/.claude/skills`、`~/.codex/skills`）与当前目录下的项目级 `.claude/skills`。可在「设置 → 扫描目录」里自定义：

- `~/.<工具>/skills`（用户级，默认勾选、可取消）
- `<当前目录>/.<工具>/skills`（项目级）
- 任意自定义项目目录（递归扫描其下所有 `SKILL.md`，每个目录即一个「项目」）

## 🔐 安全与隐私

- 删除一律移入系统**废纸篓**，可恢复，永不永久删除。
- 出站克隆 / 抓取只允许 `github.com` 系主机，拒绝重定向到非 github 主机。
- 不在 URL 参数中放任何个人数据；不收集、不外发本机数据。
- 建议仅监听回环地址（默认 `127.0.0.1`）。

## 🗺 路线图

- 语义检索、定时自动备份、跨平台支持

## 📄 License

MIT
