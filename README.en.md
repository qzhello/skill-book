# SkillBook

<p align="center"><b>Local Skill manager</b> · browse · search · edit · AI-optimize every Claude Code / Codex Skill on your machine</p>

<p align="center">
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a>
</p>

---

SkillBook is a **fully local**, single-process web app (one Go binary with the frontend embedded — no Node required): scan every Skill on your machine, search command-palette style, edit each Skill as a directory, run per-dimension AI optimization with per-suggestion accept/reject, auto-tag Skills with AI, import from GitHub with upstream update checks, and archive backups to your own S3. Your data stays on your machine; secrets are stored locally and never committed.

## ✨ Features

- **Unified browse / search** — scans auto-discovered per-platform Skills (`~/.claude/skills`, `~/.codex/skills`, etc.) plus your custom project directories; FTS5 full-text search with exact-name priority; virtualized list for thousands of entries.
- **Configurable scan dirs / projects** — `~/.<tool>/skills` are checked by default (can be unchecked), and you can add/remove project directories to scan (built-in folder browser with multi-select); each directory is a "project" whose `SKILL.md` files are scanned recursively, and you can filter by project.
- **Tag classification** — after scanning, auto-tag Skills with AI (incremental, skips already-tagged, batched & async with a progress bar); supports multiple tags, search/filter by tag, and manual editing; the classifier ruleset is editable in-app (`~/.skillbook/classifier.md`).
- **Duplicate vs. conflict** — same name + same body is flagged "duplicate"; same name + different body is flagged "naming conflict"; bulk locate / move-to-Trash.
- **Directory-level editing** — a Skill is a directory: file tree + CodeMirror, browse/edit modes; saving auto-commits when the file already lives in a git work tree.
- **AI optimization as a Skill** — ships an editable review ruleset (`~/.skillbook/optimizer.md`) you can tune in-app; the model audits per dimension and returns structured suggestions you accept one by one (exact string replacement). Works with DeepSeek / OpenAI / Claude / local Ollama, etc.
- **Source governance** — annotate each Skill with a source link (a chip in the title); GitHub sources support "check for updates"; import a Skill directory straight from github.com; private repos can be given an access token (masked display, stored locally only).
- **S3 backup / restore** — one click to pack user-level `~/.claude/skills` and `~/.codex/skills` into a timestamped `tar.gz` archive and upload it to your own S3 (compatible with Cloudflare R2 / MinIO / Aliyun OSS); keeps a configurable number of historical versions (default 20, oldest auto-pruned), and you can browse the history list and restore any version (overwritten local dirs go to Trash first). The secret is stored only in `~/.skillbook/backup.json` (0600, never echoed, uploaded, or included in backups).
- **Security first** — deletes go to the system Trash (never `rm`), symlink & path-traversal defense (including zip-slip protection when unpacking archives), outbound requests restricted to github.com, API keys / credentials live only in `~/.skillbook/*.json` (0600, never echoed, never uploaded).

## 🖥 Requirements

- **macOS** (officially supported today; other OSes can build & run after installing Go themselves)
- **Go 1.25+** (the one-click script installs it for you)
- Pure-Go dependencies (`modernc.org/sqlite` — no CGO, no system SQLite needed)

## 🚀 One-click install & run

```bash
# 1) Prepare the environment (auto-detect & install Homebrew + Go, then build)
./install.sh

# 2) Start (runs in the background, non-blocking; default http://127.0.0.1:7777, opens the browser)
./start.sh

# Stop / restart
./stop.sh
./restart.sh

# Custom listen address
SKILLBOOK_ADDR=127.0.0.1:8080 ./start.sh
```

On first run, click "Scan" (top-right) to load all Skills, then use the search box. `start.sh` runs detached, writes its pid to `.skillbook.pid` and logs to `skillbook.log`, and reuses an already-running instance.

## 🔨 Manual build / cross-compile

The entry package is `./cmd/skillbook` (module name `skillbook`):

```bash
# Native build
go build -o skillbook ./cmd/skillbook

# Apple Silicon (M-series)
GOOS=darwin GOARCH=arm64 go build -o skillbook-darwin-arm64 ./cmd/skillbook

# Intel Mac
GOOS=darwin GOARCH=amd64 go build -o skillbook-darwin-amd64 ./cmd/skillbook

# Run
./skillbook -addr 127.0.0.1:7777
```

> Frontend assets are embedded via `//go:embed`, so the artifact is a single file you can copy to any same-arch Mac and run directly.

## 🤖 Configure AI (optional)

AI optimization / recipe generation needs an LLM. Open Settings (the gear, top-right), pick a provider and fill in Base URL / Model / API Key:

| Provider | Example Base URL | Example Model |
| --- | --- | --- |
| OpenAI-compatible (DeepSeek) | `https://api.deepseek.com` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Local Ollama | `http://127.0.0.1:11434/v1` | `qwen2.5` |
| Anthropic | (default) | `claude-3-5-sonnet` |

Environment-variable fallback is supported (e.g. `ANTHROPIC_API_KEY`). **Keys are written only to `~/.skillbook/config.json` (mode 0600); they are never echoed, never committed to git, and never uploaded.**

## 📂 Scanned source directories

By default it scans auto-discovered per-platform user-level directories (e.g. `~/.claude/skills`, `~/.codex/skills`) plus the project-level `.claude/skills` under the current directory. Customize them under "Settings → Scan directories":

- `~/.<tool>/skills` (user level, checked by default, can be unchecked)
- `<cwd>/.<tool>/skills` (project level)
- Any custom project directory (its `SKILL.md` files are scanned recursively; each directory is a "project")

## 🔐 Security & privacy

- Deletions always go to the system **Trash** — recoverable, never permanently removed.
- Outbound clone / fetch is restricted to `github.com` hosts; redirects to non-github hosts are rejected.
- No personal data is ever placed in URL parameters; nothing about your machine is collected or sent out.
- Prefer binding to loopback only (default `127.0.0.1`).

## 🗺 Roadmap

- Semantic retrieval, scheduled auto-backup, cross-platform support

## 📄 License

MIT
