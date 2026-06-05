# SkillBook 来源治理与重复治理设计文档

- 日期：2026-06-05
- 状态：设计草案，可交给其他 AI 拆解实现计划
- 项目目录：`/Users/quzhihao/GolandProjects/skill-book`

## 1. 背景

SkillBook 当前已经具备本地扫描、浏览、搜索、编辑、AI 优化、重复/冲突识别的 MVP 雏形。但后续要同时支持 Claude、Codex、插件缓存、项目级 skill、用户自建 skill、远程来源链接，核心难点会从“能不能扫到文件”变成“这些文件到底来自哪里、能不能改、重复时该保留谁、未来如何更新”。

本设计把 SkillBook 定位为**本机 Skill 注册中心**：

- 文件仍是唯一真相源。
- SQLite 是索引、来源元数据、治理状态和 UI 状态缓存。
- 不盲目合并或删除来源，而是把来源关系讲清楚，让用户做可恢复的治理动作。
- 远程链接是 skill 的来源线索，不等于立即启用自动同步。

## 2. 目标

### 2.1 产品目标

SkillBook 应回答四个问题：

1. 这个 skill 在本机有哪些副本？
2. 每个副本属于哪个平台、哪个安装范围、哪个源头？
3. 哪些副本可以安全编辑，哪些应只读？
4. 如果重复或冲突，用户应该如何比较、保留、忽略或删除？

### 2.2 非目标

当前阶段不做：

- 自动判断“最佳副本”并静默删除其他副本。
- 自动覆盖本地 skill。
- 复杂包管理器语义，例如版本约束、依赖解析、锁文件。
- 后台常驻自动同步。
- 跨机器云端同步。

## 3. 核心概念

### 3.1 Skill Copy

磁盘上的一个实际 skill 目录称为一份 `Skill Copy`。同一个逻辑 skill 可以有多份 copy。

每份 copy 至少包含：

```text
id
name
description
platform
scope
sourceKind
rootPath
dir
filePath
bodyHash
mtime
writable
managed
sourceURL
sourceRef
sourceRev
governanceStatus
```

### 3.2 Logical Skill

按 `name` 聚合后的逻辑 skill。重复/冲突治理以 Logical Skill 为单位展示。

聚合规则：

```text
same name + same bodyHash      => duplicate group
same name + different bodyHash => conflict group
single copy                    => normal
```

后续可以加入更高级的聚合规则，例如 frontmatter 里的 canonical id，但 P0 不需要。

### 3.3 Source Root

扫描根目录称为 `Source Root`。它描述某类 skill 的安装位置和安全策略。

建议模型：

```text
id
label
platform: claude | codex | unknown
scope: user | project | plugin | cache | custom
path
writable
managed
priority
enabled
```

默认 roots：

```text
Claude 用户级       ~/.claude/skills                writable=true
Claude 项目级       <project>/.claude/skills        writable=true
Claude 插件         ~/.claude/plugins               writable=false 或 cautious
Codex 用户级        ~/.codex/skills                 writable=true
Codex 插件缓存      ~/.codex/plugins/cache          writable=false
自定义目录          用户配置                         由用户选择
```

`platform` 和 `scope` 不应再压缩成现在的 `user/project/plugin`。否则后面 Claude 插件和 Codex 插件都会混在一起，重复治理会变得很难解释。

## 4. 来源链接模型

用户希望“对某个 Skill 可以配置来源链接”。这里建议把来源链接设计成 copy 级别属性，而不是只挂在 name 上。

原因：

- 同名 skill 可能有多个副本，分别来自不同仓库。
- 插件缓存里的 skill 可能来自插件包，不应和用户自己 fork 的 skill 混淆。
- 用户级 skill 可能是从某个 GitHub 文件复制来的，但后来已经本地改写。

### 4.1 字段

建议字段：

```text
source_url      原始来源链接，例如 GitHub repo、目录、单文件 URL
source_kind     github_repo | github_file | local_path | plugin | manual | unknown
source_ref      分支、tag、commit、插件版本或用户填写的版本描述
source_subpath  仓库内路径，例如 skills/foo/SKILL.md
source_rev      最近一次确认的 commit sha 或版本号
source_note     用户备注
sync_policy     none | check_only | manual_update
```

### 4.2 UI 呈现

详情页增加“来源”区：

```text
来源链接：<url>
类型：GitHub 仓库 / GitHub 文件 / 本地目录 / 插件 / 手动
版本：main / v1.2.0 / commit sha
同步策略：不检查 / 仅检查更新 / 手动更新
```

按钮：

```text
打开来源
编辑来源信息
检查更新
复制来源链接
```

### 4.3 默认推断

扫描时可以做轻量推断：

- 如果 copy 在 `~/.claude/plugins` 或 `~/.codex/plugins/cache` 下，`source_kind=plugin`，`managed=false`，默认只读。
- 如果 skill 目录自身在 git repo 内，可以读取 remote URL，填入 `source_url`。
- 如果无法推断，`source_kind=manual` 或 `unknown`，由用户补充。

不要在 P0 里做网络抓取。来源链接先作为元数据保存。

## 5. 重复治理方案

重复治理不好搞的根因不是“重复太多”，而是来源层级很多，删除或合并都可能误伤。因此治理要分成“观察、解释、操作”三层。

### 5.1 分组

重复治理页面按 name 分组：

```text
skill-name
状态：重复 / 冲突 / 可疑重复
副本数：N
平台分布：Claude x2, Codex x1
推荐动作：保留用户级，插件缓存只读忽略
```

每个副本展示：

```text
平台
范围
路径
是否可写
来源链接
mtime
大小
bodyHash 短码
治理状态
```

### 5.2 状态定义

```text
normal       单副本，无需治理
duplicate   同名同内容
conflict    同名不同内容
ignored     用户选择忽略该组或某副本
preferred   用户标记首选副本
archived    已移到废纸篓或归档
readonly    来源不可编辑，只参与展示
```

### 5.3 操作原则

P0/P1 只提供可恢复、低风险动作：

- 打开详情
- 打开 Finder
- 打开来源链接
- 标记首选
- 标记忽略
- 并排对比
- 移到废纸篓

不要提供“一键清理所有重复”。如果要做，也必须放到后续阶段，并且默认只处理 `duplicate + writable + unmanaged` 的副本。

### 5.4 推荐规则

治理页可以给出推荐，但不自动执行。

推荐优先级：

```text
用户级 writable copy
项目级 writable copy
用户自定义 source_url copy
插件 copy
插件缓存 readonly copy
```

如果同名同内容：

```text
保留优先级最高的 copy
其他 copy 建议：标记忽略或移到废纸篓
readonly/cache copy 不建议删除，只建议忽略
```

如果同名不同内容：

```text
不建议删除
展示 diff
允许用户标记 preferred
允许用户修改 name 或复制为新 skill
```

## 6. 权限与安全策略

每份 copy 都应有 `writable` 和 `managed`。

```text
writable=true   允许在 SkillBook 中编辑文件
writable=false  只读展示，保存按钮禁用
managed=true    SkillBook 创建或明确接管
managed=false   外部工具/插件管理，SkillBook 谨慎操作
```

默认策略：

```text
~/.claude/skills              writable=true, managed=true
<project>/.claude/skills      writable=true, managed=true
~/.codex/skills               writable=true, managed=true
~/.claude/plugins             writable=false, managed=false
~/.codex/plugins/cache        writable=false, managed=false
```

写操作要求：

- 请求必须来自本地页面。
- 服务启动时生成随机 token，前端 API 请求携带 token。
- 所有写路径必须命中已知 writable root。
- symlink 解析后仍必须在 root 内。
- 删除只能移到废纸篓，不直接 `rm -rf`。

## 7. 搜索与筛选

搜索应统一走后端，而不是前端本地筛选。

API 建议：

```text
GET /api/skills?q=&platform=&scope=&status=&writable=&sourceKind=
```

排序：

```text
name exact
name prefix
name token prefix
description match
body FTS match
mtime desc
```

筛选 chips：

```text
全部
Claude
Codex
用户级
项目级
插件
只读
重复
冲突
有来源链接
无来源链接
已忽略
```

## 8. 页面结构建议

### 8.1 首页

首页保持当前搜索优先的体验，但分类从“用户级/项目级/插件”升级为二维来源：

```text
Claude 用户级
Claude 插件
Codex 用户级
Codex 插件缓存
自定义目录
```

### 8.2 详情抽屉

详情页分块：

```text
标题区：name、平台、scope、重复/冲突 badge、只读 badge
路径区：file path、root label
来源区：source_url、source_kind、source_ref、同步策略
内容区：预览 / 编辑 / 文件树
治理区：首选、忽略、打开重复组、打开来源
```

### 8.3 治理中心

新增“治理中心”入口，承载重复/冲突/缺来源链接。

Tabs：

```text
重复
冲突
无来源链接
只读来源
已忽略
```

## 9. 数据库建议

当前可以先在 `skills` 表加字段，但更推荐拆表，避免技能正文表越来越臃肿。

### 9.1 source_roots

```sql
CREATE TABLE source_roots (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  platform TEXT NOT NULL,
  scope TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  writable INTEGER NOT NULL,
  managed INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  enabled INTEGER NOT NULL
);
```

### 9.2 skills

保留 copy 级别数据：

```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  root_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  scope TEXT NOT NULL,
  dir TEXT NOT NULL,
  file_path TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  body TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  mtime INTEGER NOT NULL,
  writable INTEGER NOT NULL,
  managed INTEGER NOT NULL
);
```

### 9.3 skill_sources

来源链接：

```sql
CREATE TABLE skill_sources (
  skill_id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  source_subpath TEXT NOT NULL DEFAULT '',
  source_rev TEXT NOT NULL DEFAULT '',
  source_note TEXT NOT NULL DEFAULT '',
  sync_policy TEXT NOT NULL DEFAULT 'none',
  updated_at INTEGER NOT NULL
);
```

### 9.4 skill_governance

治理状态：

```sql
CREATE TABLE skill_governance (
  skill_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'normal',
  preferred INTEGER NOT NULL DEFAULT 0,
  ignored INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
```

## 10. API 建议

### 10.1 Roots

```text
GET /api/roots
PUT /api/roots/{id}
POST /api/roots/custom
```

### 10.2 Skills

```text
GET /api/skills?q=&platform=&scope=&status=
GET /api/skills/{id}
PUT /api/skills/{id}
GET /api/skills/{id}/files
GET /api/file?path=
PUT /api/file
```

### 10.3 Source Links

```text
GET /api/skills/{id}/source
PUT /api/skills/{id}/source
POST /api/skills/{id}/source/check
```

`source/check` 第一版可以只校验 URL 形态，不请求网络。后续再支持 GitHub API 或 raw URL 检查。

### 10.4 Governance

```text
GET /api/governance/groups?kind=duplicate|conflict|missing_source
PUT /api/skills/{id}/governance
POST /api/governance/trash
POST /api/governance/prefer
POST /api/governance/ignore
```

## 11. 分阶段路线

### P0：来源模型落地

目标：让 SkillBook 真正区分 Claude/Codex/插件缓存/可写只读。

任务：

- 引入 `Source Root` 模型。
- 扫描 `~/.codex/skills`。
- 扫描 Codex 插件缓存，只读展示。
- skill 记录增加 platform/scope/writable/managed。
- UI badge 改为平台 + 范围。
- 只读 copy 禁用保存和 AI 应用保存。

### P1：搜索和幽灵数据治理

目标：搜索可信，扫描结果可信。

任务：

- 前端搜索改为请求后端。
- 后端支持 q/platform/scope/status 筛选。
- 扫描时 mark-and-sweep，移除已不存在的 skill 记录。
- 保留最近扫描错误，用于 UI 展示。

### P2：来源链接

目标：每个 skill copy 可以标记“从哪里来”。

任务：

- 增加 `skill_sources`。
- 详情页显示来源区。
- 支持编辑来源链接、类型、ref、备注。
- 支持“有来源链接/无来源链接”筛选。
- 从 git remote 轻量推断来源。

### P3：重复/冲突治理中心

目标：把重复治理从 badge 变成完整工作流。

任务：

- 新增治理中心。
- duplicate/conflict/missing_source tabs。
- 支持标记 preferred/ignored。
- 支持并排对比。
- 支持可恢复删除到废纸篓。
- readonly/cache 副本只允许忽略，不建议删除。

### P4：手动更新检查

目标：来源链接开始产生实际价值，但仍不自动覆盖。

任务：

- 对 GitHub repo/file 支持手动检查更新。
- 显示本地 hash、远端 hash、更新时间。
- 允许用户查看 diff 后手动应用。
- 应用前写 git commit，应用后再写 git commit。

## 12. 给实现 AI 的注意事项

1. 不要先做自动清理。重复治理的第一原则是可解释、可恢复。
2. 不要把 Codex 作为 AI provider。Codex 是平台/工具来源，AI provider 是 OpenAI 兼容或 Anthropic。
3. 不要把 source URL 挂在 name 上，必须挂在具体 copy 上。
4. 不要让插件缓存默认可写。
5. 不要让前端继续绕过后端 FTS 自己搜全部数据。
6. 不要在扫描时删除磁盘文件。扫描只更新索引。
7. 不要静默覆盖本地修改。任何远程更新都必须先展示 diff。

## 13. 推荐优先实现顺序

如果只能选一条主线，建议按这个顺序：

```text
Source Root 模型
Codex 扫描
只读/可写策略
后端统一搜索
扫描 mark-and-sweep
来源链接编辑
治理中心
手动更新检查
```

这样每一步都能独立提升产品确定性，而且不会把重复治理建立在模糊的数据源之上。
