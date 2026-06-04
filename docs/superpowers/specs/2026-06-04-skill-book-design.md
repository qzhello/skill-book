# SkillBook 设计文档

- 日期：2026-06-04
- 状态：已通过 brainstorming，待用户复核
- 项目目录：`/Users/quzhihao/GolandProjects/skill-book`

## 1. 目标与定位

一个**本地运行的 Skill 管理台**，把分散在本机各处的 Claude Code skill 统一管起来，并提供：统一浏览/搜索、在线编辑、按「配方」创建、AI 可选优化、版本备份、导入安装到目标工具目录、远程仓库更新。

核心原则：

- **文件是唯一真相源**：所有 skill 内容始终以磁盘上的 `SKILL.md` 为准；SQLite 仅作索引/状态缓存，可随时从磁盘重建。
- **AI 为可选增强**：不配模型 key 时，除「AI 生成/优化」外的所有功能照常工作。
- **不依赖 Claude 会话运行时**：不做 `claude -p` headless 调用；「复用现有 skill」指的是复用创作类 skill 的**正文方法论**作为生成指导。

## 2. 形态与启动

- 语言：**Go**，目标单二进制。
- 前端：`//go:embed` 打包，技术栈 htmx/Alpine + 原生 CSS + CodeMirror，**零 node 依赖**。
- **一键启动脚本**（`start.sh` / `make run`）：编译并运行，自动打开浏览器 `http://localhost:<PORT>`。
- **首次进入**：空状态页 + 醒目的「扫描」按钮；点击后扫描本地 skill 并入库展示。

## 3. 架构（分层）

```
skill-book/
├── cmd/skillbook/         # main，一键启动入口
├── internal/
│   ├── scanner/           # 扫描多来源 → skill 元数据
│   ├── store/             # SQLite + FTS5 索引、状态（收藏/启用/禁用）
│   ├── editor/            # 读写 SKILL.md（文件=唯一真相源）
│   ├── gitsync/           # 本地自动提交 + GitHub 备份/拉取
│   ├── recipe/            # “创建配方” = 扫描到的创作类 skill 正文
│   ├── ai/                # 可选 LLM provider（Anthropic / OpenAI 兼容）
│   ├── installer/         # 安装目标 {名称,路径,格式}，导入/安装
│   └── server/            # HTTP API + embed 前端
└── web/                   # 前端静态资源（被 embed）
```

每个 `internal/*` 包职责单一、通过明确接口通信、可独立测试。

## 4. 扫描来源

- `~/.claude/skills`（用户级）
- 项目级 `.claude/skills`
- plugins 内的 skill（`~/.claude/plugins/...`）

跨来源**同名 skill 高亮冲突**，标明各自来源与优先级（用户级 > 项目级 > plugin，遵循 Claude Code 解析顺序）。

## 5. 浏览 / 搜索

- 列表 + 分类 + 来源标签 + 启用/禁用/收藏状态。
- 检索：基于 **SQLite FTS5** 的全文/标题/description 关键字检索。
- 语义检索（embedding）属后续阶段，不在 P1~P3。

## 6. 创建（配方模型）

新建 skill 时选择「配方」：

- 配方来源 = 扫描到的**创作类 skill**（如 `skill-creator`、`writing-skills`）+ 内置空白脚手架；用户可手动把任意 skill 标记为「模板」加入此列表。
- **未配 AI**：所选配方的 `SKILL.md` 正文作为脚手架插入编辑器，用户照着填。
- **已配 AI**：配方正文 + 用户的大白话描述 → AI 产出规范 `SKILL.md` 初稿，回填编辑器。

## 7. AI（可选增强）

- 设置页配置 provider（**Anthropic** 或 **OpenAI 兼容** base_url+key）+ model。
- 留空 → 全程使用模板/脚手架，其余功能不受影响。
- 用途：①大白话 → skill 初稿；②优化已有 skill。

## 8. 编辑 / 版本

- CodeMirror Markdown 编辑器，保存即写回磁盘文件。
- 保存后**自动 `git commit`** 到本地仓库，形成版本/备份历史。

## 9. 安装 / 导入

- 安装目标抽象为 `{名称, 路径, 格式}`，内置 Claude Code 的几个目标（用户级/项目级），预留 Codex(`~/.agents/skills`)、Gemini 等扩展位。
- 支持从**本地路径 / URL** 导入 skill，并安装到选定目标。

## 10. 远程

- **备份目的地**：仅 **GitHub**，通过 `git push`。
- **更新来源**：可配置远程 GitHub skill 仓库；勾选「自动更新」后，检测到上游变化 → **直接覆盖**本地（本地 git 历史作为兜底，可回滚）。默认不勾选。
- **触发方式**：**仅手动**（点按钮触发同步/更新）。不做定时轮询、不做常驻 daemon。

## 11. 额外功能（已纳入考虑，分阶段）

- 跨来源去重 / 冲突高亮（P1）
- 启用 / 禁用软开关（不删文件）（P2）
- 质量体检面板（复用 `skill-health` 检查项：缺 description、超长、frontmatter 不规范等）（P2）
- 依赖 / 互链关系图（靠后，暂不排期）

## 12. 分阶段交付

- **P1（MVP）**：一键启动 → 扫描 → 浏览/搜索（SQLite+FTS5）→ 查看详情 → 编辑保存 + 本地自动 git 提交 → 跨来源冲突高亮。
- **P2**：配方创建 + AI 可选生成 + AI 优化 + 质量体检面板 + 启用/禁用。
- **P3**：导入/安装到目标目录 + GitHub 备份（push）。
- **P4**：远程更新来源 + 手动触发的覆盖式更新 + 语义检索（embedding，可选）。

## 13. 关键决策记录

| 决策点 | 结论 |
|--------|------|
| 实现语言 | Go，单二进制，一键启动脚本 |
| 前端 | go:embed + htmx/Alpine + CodeMirror，零 node |
| 数据 | 文件为真相源；SQLite + FTS5 做索引/状态 |
| AI 落地 | 不碰会话运行时；配方=创作类 skill 正文；provider 可选(Anthropic/OpenAI 兼容)，留空仅用模板 |
| 创建模型 | 「配方=可选 skill」动态列表 |
| 安装目标 | 抽象 {名称,路径,格式}，Claude Code 起步，预留 Codex/Gemini |
| 备份 | 仅 GitHub push |
| 更新 | 远程 GitHub 仓库，直接覆盖，git 历史兜底 |
| 触发 | 仅手动 |
| 版本 | 编辑保存自动本地 git commit |
