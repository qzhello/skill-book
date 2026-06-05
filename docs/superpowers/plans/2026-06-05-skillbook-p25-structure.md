# SkillBook P2.5 — 目录结构编辑 + 重复/冲突管理

**Goal:** Skill 作为目录对待：详情里展示文件树、可查看/编辑目录内任意文件（SKILL.md / README.md / scripts 等）；详情抽屉可一键全屏；修复浏览模式文本不可选；点「重复/冲突」标签弹出管理列表（多选定位/删除[移废纸篓]、冲突并排对比、点名打开）；AI 未配置时引导去设置。

**决策**
- 删除 = **移到系统废纸篓**（macOS ~/.Trash，可恢复），UI 二次确认。
- 多文件：**完整文件树**，可编辑任意文件。
- 弹窗：多选定位(Finder) + 多选删除 + 冲突并排对比 + 点名打开。

**分工**：后端新端点（subagent）；前端交互视觉（主控）。

---

## API 契约

### 目录 / 多文件
- `GET /api/skills/{id}/files` → `{root, files:[{rel, abs, size, dir}]}`
  - 递归列出 skill 目录下所有条目；`dir:true` 为目录；跳过 `.git`。排序：SKILL.md 最前，其余目录在前、文件在后、按名。
- `GET /api/file?path=<abs>` → `{rel, abs, size, binary, content}`
  - **白名单**：abs 必须在某个已知 skill 目录内。非 UTF-8 或 >256KB → `{binary:true}` 不返回 content。
- `PUT /api/file` body `{path, content}` → `{status, reindexed}`
  - 白名单校验；写盘 + 自动 git 提交（复用 editor 的越界防护与提交）。
  - 若该文件是某 skill 的 SKILL.md → 重算 name/desc/BodyHash 并 Upsert，`reindexed:true`。

### 删除（废纸篓）
- `POST /api/skills/trash` body `{dirs:[...]}` → `{trashed:[...], failed:[{dir,error}]}`
  - 每个 dir 必须**精确等于**某个已知 skill 的目录；移动到 `~/.Trash/<base>`（重名加 ` <n>` 或时间后缀）。
  - 非 darwin → 501。移动成功后从 store 删除对应行（按 dir 前缀）。

### 分组
- `GET /api/groups?kind=dup|conflict` → `{groups:[{name, kind, copies:[{id, source, dir, file_path, size, mtime}]}]}`
  - dup=同名内容一致；conflict=同名内容不同。按 name 排序。

### 安全
- 路径白名单：`filepath.Clean` 后，file 读写要求 abs 在某 skill.Dir 之内（`filepath.Rel` 不以 `..` 开头）；trash 要求 dir 精确等于某 skill.Dir。
- 所有写/删 body 加 `MaxBytesReader`；trash/删除不可作用于 skill 目录之外的任何路径。
- 错误不泄露无关路径；非法路径一律 403。

---

## 后端文件（subagent）
- `internal/server/file_routes.go`：扩展，新增 `/api/skills/{id}/files`、`/api/file`(GET/PUT)、`/api/skills/trash`、`/api/groups`。
- `internal/store`：可加 `DeleteByDirPrefix(dir)`、`Group(kind)` 查询（或在 handler 内用 List 过滤）。
- `internal/trash`（可选小包）：`ToTrash(dir) error`（移动到 ~/.Trash，处理重名）。
- 复用 `editor`/`gitsync` 做提交；复用 `model.HashBody`。

## 前端（主控）
1. 详情抽屉：左侧**文件树**（SKILL.md 默认选中）+ 右侧 浏览/编辑。切换文件用 `/api/file`；保存 SKILL.md 用 `/api/skills/{id}`（更新索引），其它文件用 `/api/file`。
2. **全屏切换**：抽屉左沿「展开全屏 / 还原」按钮（`.sheet.full` → width:100vw）。
3. **修复浏览选区**：`.md-preview{user-select:text}`，排查并移除任何阻断选择的样式。
4. **AI 引导**：未配置时 AI 按钮显「未配置」态，点击 → toast + 打开设置并提示填 key/model。
5. **重复/冲突管理弹窗**：点 `重复`/`冲突` 标签 → 弹窗（`/api/groups`）：分组列出副本（来源徽标+路径+大小/时间），复选框；底部操作：定位(Finder)、移到废纸篓(二次确认)；冲突分组可选两份「并排对比」；点某副本名→打开详情。

## 验证
- 后端 `go test ./...` 全绿；路径白名单/trash 用临时目录测试（trash 测试可在临时 HOME 下验证移动行为，非 darwin 跳过）。
- 前端 Preview 截图核对文件树/全屏/选区/管理弹窗；无 console error。
