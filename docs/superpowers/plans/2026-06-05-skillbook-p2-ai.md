# SkillBook P2 Implementation Plan — AI + Editor Overhaul

**Goal:** 加入 AI 能力（优化已有 skill + 配方新建）与全面重做的详情/编辑体验（满高编辑器、⌘F 查找、编辑/浏览双模式、Finder 打开、AI 优化并排 diff），以及搜索时的布局过渡动画。

**决策**
- AI provider：两类适配器 —— `anthropic`(Claude) 与 `openai`(OpenAI 兼容，覆盖 DeepSeek/OpenAI/Codex/Ollama，可配 base_url)。设置面板选择；key 存 `~/.skillbook/config.json`，env 变量兜底；留空则只用模板、不启用 AI。
- AI 优化结果：与原文**并排 diff**，「应用 / 放弃」。
- 范围：AI 优化 + 配方新建 都做。

**分工**
- 后端（subagent）：`internal/ai` 包 + 配置 + 全部新路由（TDD）。
- 前端（主控直接实现）：`web/*` 全部交互与视觉。

---

## API 契约（前后端共同遵守）

### 配置
- `GET /api/config` → `{provider, baseURL, model, hasKey}`（**绝不回传 key 明文**）
- `PUT /api/config` body `{provider, baseURL, apiKey, model}` → `{status}`
  - `apiKey` 为空字符串表示「保持原 key 不变」；提供则覆盖。
  - 写入 `~/.skillbook/config.json`（权限 0600）。
- `POST /api/ai/test` → `{ok, message}`（用当前配置发一个最小请求验证）

### AI
- `GET /api/recipes` → `{recipes:[{id,name,kind}]}`
  - 来源：扫描到的创作类 skill（name 含 `skill-creator`/`writing-skills`/`skill` 且 `creator|writing|authoring`）+ 一个内置 `{id:"blank",name:"空白脚手架"}`。
- `POST /api/ai/optimize` body `{content, recipe?}` → `{result}`
  - system = 选定配方正文（默认 writing-skills 风格指导）；user = 「优化这份 SKILL.md，保持 frontmatter，输出完整 markdown」+ content。
- `POST /api/ai/create` body `{name, brief, recipe}` → `{result}`
  - system = 配方正文；user = 「按该方法论，根据下面这句话创建一个名为 name 的 skill，输出完整 SKILL.md」+ brief。
  - AI 未配置时返回 501 + `{error}`，前端降级为「插入配方脚手架」。

### Skill 文件操作
- `POST /api/skills/new` body `{name, content}` → `{id}`
  - 写 `~/.claude/skills/<name>/SKILL.md`；`name` 仅允许 `[a-z0-9-]`；已存在则 409。
  - 写后重扫该条并入库；返回新 skill 的 id。
- `POST /api/reveal` body `{path}` → `{status}`
  - 校验 `path` 必须是库中已存在的某个 skill 的 `file_path`（防越权），再 `open -R <path>`（macOS）。非 macOS 返回 501。

---

## 后端文件结构（subagent 负责）

```
internal/ai/
├── config.go      # Config 结构 + Load/Save(~/.skillbook/config.json) + env 兜底 + Effective()
├── client.go      # Client.Complete(ctx, system, user) + provider 分发
├── anthropic.go   # Anthropic /v1/messages 适配
├── openai.go      # OpenAI 兼容 /chat/completions 适配
└── *_test.go      # config 读写/合并、provider 分发用 httptest 假服务器
internal/recipe/
└── recipe.go      # 从 store/scanner 选出创作类 skill 正文；内置 blank
```
server.go 新增上述路由 handler，装配 ai.Client + recipe。

**安全**：key 不入日志、不回传；config 文件 0600；reveal 路径白名单校验；ai 请求设超时（如 60s）与 MaxBytes。

---

## 前端范围（主控负责，web/*）

1. **详情抽屉重做**
   - 编辑器**满高**（flex:1 + CodeMirror height:100%）。
   - 顶部模式切换：**浏览**（marked.js 渲染 markdown，只读、排版好看）/ **编辑**（CodeMirror）。
   - 工具条按钮：AI 优化 / 在 Finder 打开 / 保存并提交 / 查找(⌘F 触发 CodeMirror search)。
   - ⌘F：编辑模式用 CodeMirror search 插件；浏览模式用浏览器原生即可。
2. **AI 优化 diff**：调用 `/api/ai/optimize` → 弹出并排 diff（原文 | AI 稿），「应用」覆盖编辑器、「放弃」关闭。无配置时提示去设置。
3. **设置面板**：齿轮图标 → 抽屉/弹窗，配置 provider/baseURL/model/apiKey + 测试连接。
4. **新建 skill**：「新建」按钮 → 弹窗选配方 + 名称 + 大白话 →（有 AI）生成初稿 /（无 AI）插入脚手架 → `POST /api/skills/new` → 打开编辑。
5. **搜索布局过渡**：空状态大居中搜索；一旦有 query/分类，搜索框平滑上移收紧、下方结果区铺满（CSS class 过渡，`transform/opacity`，尊重 reduced-motion）。

外部依赖（CDN，零构建）：marked.js（markdown 渲染 + DOMPurify 净化）、CodeMirror search/dialog/searchcursor 插件。

---

## 验证
- 后端：`go test ./...` 全绿；ai 适配用 httptest 假服务器（不打真实 API）。
- 前端：内置 Preview 截图核对编辑/浏览/diff/设置/新建/搜索动画；无 console error；reduced-motion 正常。
- 安全：确认 key 不出现在任何 GET 响应与日志。
