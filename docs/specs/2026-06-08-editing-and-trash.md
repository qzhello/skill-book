# SkillBook 编辑体验与治理改进设计

- 日期：2026-06-08
- 状态：已批准（待实现）

把四项相关改进合为一份设计：**来源令牌改为 per-skill**、**修复"在 Finder 打开"对非 SKILL.md 文件失败**、**新增文件级操作**、**应用内回收站**。四者相对独立，可分别实现与测试，但共享"Skill 目录内操作 + 路径越界防护"这一基础。

---

## 模块 A：来源令牌 per-skill

### 现状与问题
当前令牌是**全局一个**，存 `~/.skillbook/source.json`（`sourceAuthConfig{Token}`），所有私有来源共用；设置弹窗与来源弹窗两个入口写的都是它。用户预期是「每个 Skill 的来源若为私有仓库，绑定它自己的令牌」。

### 目标
令牌随**每个 Skill 的来源记录**走（纯 per-skill，**不保留**全局令牌）。

### 改动
- **存储**：`skill_sources` 表新增列 `token TEXT NOT NULL DEFAULT ''`（幂等 `ALTER TABLE` 迁移）。`store.Source` 加 `Token string`；`sourceCols` / `scanSource` / `PutSource` 同步包含该列。
- **写入** `handlePutSource`：请求体加 `token` 字段；**非空则更新、空则保留原值**（先 `GetSource` 读现有 token 回填），避免保存其他来源字段时误清空。清除来源（url 为空 → `DeleteSource`）时连带删除 token。
- **回显** `sourceResponse`：**绝不返回 token 明文**，改为返回 `has_token bool`。
- **抓取改用 per-skill token**：`handleSourceCheck` / `handleSourceApply` / `import_routes` 中对该 skill 来源的抓取，使用该 skill `Source.Token`（而非全局）。导入（`POST /api/import`，尚无 skill 归属）可接收请求体里的一次性 token，仅用于本次抓取、不持久化。
- **移除全局机制**：删除 `internal/server/sourceauth.go`、路由 `GET/PUT /api/source-auth`、`~/.skillbook/source.json` 的读写、设置弹窗里的全局令牌输入（`#cfgSrcToken` 及其 i18n / 说明）。
- **前端**：来源弹窗（`#sourceModal`）加 token 输入框（`type=password`，占位"私有仓库填；留空不修改"，配合 `has_token` 显示"已配置/未配置"提示），随来源一起 `PUT /api/skills/{id}/source`。

### 安全
token 仅存本机 SQLite，GET 只回 `has_token`，不进日志、不进备份（备份只打包 skills 文件，不含 DB）。

---

## 模块 B：修复"在 Finder 打开"对非 SKILL.md 失败

### 现状与问题
`handleReveal` 用 `isKnownSkillPath(path)` 校验，它只在 `path == skill.FilePath`（即 SKILL.md 本身）时放行。在文件树点击非 SKILL.md 文件后 `state.filePath` 变为该文件，点"在 Finder 打开"被判 403 → 前端 toast「打开失败」。

### 改动
`handleReveal` 改用 `s.skillForPath(path) != nil` 判断（与读取文件 `handleGetFile` 一致）——只要该路径位于某个已知 skill 目录内即放行。删除/保留 `isKnownSkillPath`：若无其他调用者则一并删除。

### 测试
- reveal 一个 skill 目录内的非 SKILL.md 文件 → 通过校验（mock exec 或仅测校验分支，不实际起 Finder）。
- reveal 一个目录外路径 → 仍 403。

---

## 模块 C：文件级操作（新建文件 / 新建文件夹 / 删除 / 重命名）

### 现状与问题
仅有「新建整个 Skill」与「删除整个 Skill 目录」，缺少 Skill 目录内的文件级操作。

### 新增 API（均要求目标位于某 skill 目录内 + 名称合法）
- `POST /api/file/new` `{dir, name}` → 在 `dir` 下创建空文件。
- `POST /api/dir/new` `{dir, name}` → 创建子文件夹。
- `POST /api/file/rename` `{path, newName}` → 同目录内重命名文件/文件夹。
- `POST /api/file/delete` `{path}` → 删除文件/文件夹，走**系统废纸篓**（`trash.ToTrash`，可在 Finder 恢复）。

> 注意区分：**单个文件/文件夹删除走系统废纸篓**（轻量、可 Finder 找回）；**整个 Skill 删除走应用内回收站**（模块 D）。回收站清单以 Skill 为单位，单文件不进清单，保持简单。

### 校验（统一）
- `dir`/`path` 必须 `skillForPath != nil`（在某 skill 目录内）；越界一律 403。
- `name`/`newName`：非空、不含 `/`、`\`、`..`、不以 `.` 开头的越权名；重名返回 409。
- 新建/重命名后路径仍须落在原 skill 目录内（`withinDir` 校验）。
- 若操作命中 `SKILL.md`（新建/删除/重命名导致其变化）则重索引该 skill。

### 前端
文件树每行 hover 显示操作图标（重命名、删除），树头部加「新建文件」「新建文件夹」按钮；操作后 `loadFiles` 刷新树。删除前 confirm。

---

## 模块 D：应用内回收站

### 现状与问题
删除 Skill = 直接 `os.Rename` 到系统 `~/.Trash`。两个后果：
1. `DiscoverPlatformIDs` 把 `~/.Trash`（因里面形成了 `skills` 子目录）误识别成名为 "Trash" 的**平台**，删掉的 Skill 又出现在主列表/搜索。
2. 无法在 app 内枚举 / 恢复 / 清空（不能去动用户整个系统废纸篓）。

### 目标
删除 Skill → 进 **SkillBook 自管回收站**；主列表不显示；设置里可查看 / 恢复 / 一键清空。

### 存储
- 回收文件：移到 `~/.skillbook/trash/<id>/<原目录名>`，`<id>` 用删除时间戳（纳秒，保证唯一）。
- 集中清单 `~/.skillbook/trash.json`：数组 `[{id, name, origPath, platform, deletedAt}]`。元数据放清单而非塞进被删目录，避免污染恢复内容。原子写（temp+rename，0600）。

### 行为
- **删除** `POST /api/skills/trash`（沿用）：改为移到回收站目录 + 追加清单条目（不再直接进系统 `~/.Trash`）。
- **查看** `GET /api/trash`：返回清单（名称 / 原位置 / 删除时间）。
- **恢复** `POST /api/trash/restore` `{id}`：移回 `origPath`；**若原位置已存在同名 → 报错跳过提示，不覆盖**；成功后从清单移除。
- **一键清空** `POST /api/trash/empty`：把回收站内所有目录移到系统 `~/.Trash`（双保险，仍可 Finder 找回），清空清单与 `~/.skillbook/trash/`。

### 修复 .Trash 平台 bug
`scanner.DiscoverPlatformIDs` 排除系统废纸篓 `.Trash` 与自管目录 `.skillbook`（不将其下的 `skills` 当平台）。`scan-dirs.json` 里历史遗留的 disabled `~/.Trash/skills` 变为无意义但无害，保留。

### 前端
- 设置「管理与工具」菜单新增「垃圾桶」入口。
- 垃圾桶弹窗：顶部「清空回收站」按钮（confirm）+ 列表（名称 / 原位置 / 删除时间 + 每项「恢复」按钮）+ 空态提示。
- 主列表/搜索：天然不显示（已移出扫描目录，且 .skillbook 不被发现为平台）。

### 安全
仍绝不永久删除（清空 = 进系统废纸篓）；回收站目录不被扫描。

---

## 测试策略（按模块）

- **A**：`PutSource`+`GetSource` 往返含 token；`handleGetSource` 不回显 token（只 `has_token`）；空 token 保留原值；抓取使用 per-skill token；旧全局 `/api/source-auth` 路由已移除（404）。
- **B**：reveal 校验对目录内非 SKILL.md 放行、对目录外拒绝。
- **C**：新建/新建文件夹/重命名/删除的越界拒绝、重名 409、名称非法拒绝、删除进系统废纸篓、命中 SKILL.md 重索引。
- **D**：删除进回收站+清单、恢复回原位、恢复冲突报错、清空进系统废纸篓+清单清空、`DiscoverPlatformIDs` 排除 `.Trash`/`.skillbook`。
- 全量 `go test ./...` 绿；前端 Playwright 冒烟（来源弹窗 token 字段、文件树操作、垃圾桶视图）。

## 实现顺序建议
B（最小修复）→ A（令牌）→ C（文件操作）→ D（回收站）。各模块独立提交。
