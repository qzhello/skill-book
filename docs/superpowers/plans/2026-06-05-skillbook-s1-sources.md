# SkillBook S1 — 来源链接

**Goal:** 每个 skill 可标记"从哪来"（来源链接 + 类型 + ref + 备注 + 同步策略），扫描时从 git remote 轻量推断，详情页有"来源区"，首页支持"有/无来源链接"筛选。并补 S0 尾巴：内置创作配方（不依赖扫描）。

**分工**：后端新端点（subagent，不碰 web/）；前端来源区（主控）。

## 数据
```sql
CREATE TABLE skill_sources (
  skill_id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL DEFAULT 'unknown',   -- github_repo|github_file|local_path|manual|unknown
  source_url TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',           -- 分支/tag/commit/版本
  source_subpath TEXT NOT NULL DEFAULT '',
  source_rev TEXT NOT NULL DEFAULT '',
  source_note TEXT NOT NULL DEFAULT '',
  sync_policy TEXT NOT NULL DEFAULT 'none',       -- none|check_only|manual_update
  updated_at INTEGER NOT NULL DEFAULT 0
);
```
> 注：skill_id 基于来源+目录派生，稳定；trash/sweep 删除 skill 时也应清理对应 source 行（可在 DeleteByDir/Sweep 里顺带，或容忍孤儿行——孤儿行无害，后续可不清）。本期容忍孤儿行。

## API 契约
- `GET /api/skills/{id}/source` → `{source_kind, source_url, source_ref, source_subpath, source_rev, source_note, sync_policy, inferred}`
  - 有持久行 → 返回它，`inferred:false`。
  - 无持久行 → 尝试 **git 推断**：在 skill.Dir 找到所在 git 仓库（`git -C dir rev-parse --show-toplevel`），读 `remote.origin.url`；若是 GitHub→`source_kind:github_repo`，`source_url`=remote（规整成 https），`source_subpath`=skill.Dir 相对仓库根；返回 `inferred:true`（**不落库**）。推断不出→空 + `source_kind:unknown`、`inferred:false`。
- `PUT /api/skills/{id}/source` body `{source_url, source_kind, source_ref, source_note, sync_policy}` → 落库（upsert，`updated_at`=服务端时间）→ `{status}`。`source_url` 空表示清除该 skill 的来源（删除行）。校验 sync_policy ∈ {none,check_only,manual_update}；source_kind 给定枚举。
- `GET /api/sources` → `{linked:[skill_id,...]}`（有持久来源行的 skill id 列表，供首页"有来源链接"筛选）。

## 配方内置（S0 尾巴）
- `internal/recipe`：新增内置配方 `{id:"authoring", name:"标准 Skill 写法", kind:"builtin"}`，`Body("authoring")` 返回一段内置的 skill 写作方法论（frontmatter 规范 + 何时用 description + 结构建议 + 反例），使创建/优化不依赖扫描到 writing-skills。`List` 把 authoring 排在 blank 前。

## 安全
- git 推断只读（rev-parse/config get），不写、不联网。
- PUT 校验枚举；body MaxBytes（走现有 readJSONBody）。
- 不在 GET 响应里泄露无关路径。

## 前端（主控，web/*）
- 详情 sheet 在 path 下方加 **来源区**：显示 来源链接(可点开)/类型/ref/同步策略/备注；"编辑来源"展开表单(url/kind/ref/note/sync_policy)→保存；"复制链接"。无来源时显示"未设置来源"+（若 inferred）"检测到 git 来源，一键采用"。
- 首页 chips 加 **有来源 / 无来源**（点击筛选，基于 `/api/sources` 的 linked 集合 + 客户端过滤）。
- 创建弹窗的配方下拉自然会多出"标准 Skill 写法"。

## 验证
- 后端 `go test ./...` 全绿；source 端点 httptest；git 推断在临时 git repo 里验证。
- 前端 Preview 截图核对来源区编辑/保存/采用推断、有无来源筛选。
