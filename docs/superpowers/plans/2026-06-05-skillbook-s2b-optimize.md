# SkillBook S2b — AI 优化重构（规则即 Skill + 逐条建议）+ 来源进标题

**Goal:**
1. **来源进标题区**：来源从独立整行收进详情左上角（标题/徽标那一行），紧凑显示；点击弹小框编辑/保存；未设置显示"未设置来源"。
2. **AI 优化重构**：优化方法论作为一个**可编辑的规则文件**（`~/.skillbook/optimizer.md`，内置默认、启动落盘、平台可改）；优化时按维度逐条体检，返回结构化建议 `{维度, 严重度, 原文, 建议, 理由}`；前端**逐条建议卡片**可单独采纳/忽略，合并采纳项生成新稿预览。

**决策**：优化规则=专用文件 `~/.skillbook/optimizer.md` + 平台编辑入口；逐条采纳=建议卡片。

**分工**：后端（subagent）；前端来源进标题 + 建议卡片 + 规则编辑器（主控）。

---

## 后端

### 1. optimizer 规则文件（`internal/optimizer` 包）
- 用 `//go:embed default.md` 内置默认优化规则（见下"默认规则内容"）。
- `Path()` = `~/.skillbook/optimizer.md`；`Load()`：文件不存在则写入默认再返回；`Save(content)` 写入（0644）。
- `default.md`：用中文写，列出优化维度与判定标准（**只放评判标准，不放 JSON 格式要求**——JSON 输出契约固定在代码里）。维度：
  1. Frontmatter 规范（name kebab-case 且与目录名一致；description 第三人称、含"何时使用"具体触发词）
  2. 可发现性（description 让 agent 知道何时用，而非只说是什么）
  3. 结构清晰（分节、可扫读、参考式而非叙事）
  4. 可操作性（具体步骤/命令/示例/Do-Don't）
  5. 简洁与 token 效率（去冗余去重复）
  6. 示例质量（正/反例）
  7. 一致性/反模式（术语一致、无死链、无矛盾、无一次性叙事）
  8. 完整性（边界情况、注意事项）

### 2. 端点
- `GET /api/optimizer` → `{content}`（Load）
- `PUT /api/optimizer` body `{content}` → `{status}`（Save；空内容拒绝 400）
- 重构 `POST /api/ai/optimize` body `{content}` → `{suggestions:[{dimension, severity, original, suggested, reason}]}`
  - system = optimizer.md 内容 + 固定 JSON 指令：「你是 skill 评审。依据上面的标准，逐条找出可改进点。**只输出 JSON 数组**，每项字段：dimension(维度名)、severity(high|medium|low)、original(从原文**逐字摘录**的、可被精确替换的片段)、suggested(改写后的片段)、reason(简短理由，中文)。不要输出解释或 markdown 代码围栏。original 必须是原文的精确子串。若无可改进项，返回 []。」
  - user = 待优化的 SKILL.md 全文。
  - 后端：调 ai.Client.Complete；**鲁棒解析** AI 返回（剥 ```json 围栏、截取第一个 `[`..`]`）；解析失败→502 `{error}`；AI 未配置→501。过滤掉 original 为空或不在原文中的项（防止无法应用）。返回 suggestions。

**安全/鲁棒**：body MaxBytes（走 readJSONBody）；optimizer 文件路径固定 `~/.skillbook/`，不接受用户传路径；解析 AI 输出限制条数（如最多 50 条）与单项长度。

## 前端（主控，web/*）
### A. 来源进标题
- 详情 `.sheet-title` 行：标题 + 徽标后追加一个**来源 chip**：有来源显示 `↗ <host/owner>`（点击打开来源链接）+ 一个"编辑"小图标；未设置显示灰色「未设置来源」。点击 chip/编辑 → 弹**来源编辑小模态**（复用现有 source 表单：url/kind/ref/sync/note + 保存/清除）。
- 移除 path 下方那条独立 `#sourceBox` 整行（或保留为空、不显示）。github 来源的"检查更新"按钮挪进来源编辑模态或 chip 旁。

### B. AI 优化建议卡片
- AI 优化按钮 → 调新 optimize → 若无配置引导设置；得到 suggestions → 打开**优化建议模态**：
  - 顶部：N 条建议 + 「全采纳/全不采纳」。
  - 每条卡片：维度 badge + 严重度色点 + 理由；下面**原文片段**（红底）→**建议片段**（绿底）；右侧勾选「采纳」。
  - 底部：「应用采纳项」→ 依次对编辑器内容做 `original→suggested` 字符串替换（首次匹配；找不到则跳过并提示 N 处未能定位）→ 切到编辑模式 + 标记未保存 + 关闭模态 + toast。
- 无建议时提示「没有发现可优化点」。

### C. 优化规则编辑器
- 设置弹窗（齿轮）里加一个入口「编辑优化规则」→ 打开一个带 CodeMirror 的模态，载入 `GET /api/optimizer`，可改并 `PUT` 保存。（或独立小模态。）

## 验证
- 后端 `go test ./...` 全绿；optimizer Load/Save 往返（临时 HOME）；optimize 的 JSON 解析用假 ai client（注入）覆盖：正常数组、带围栏、含不在原文的项被过滤、空数组。
- 前端 Preview：来源 chip + 弹框编辑；建议卡片采纳→应用到编辑器；规则编辑器载入/保存。AI 真实调用需配 key，留给用户。
