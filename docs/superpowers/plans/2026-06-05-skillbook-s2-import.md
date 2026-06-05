# SkillBook S2 — 导入 + 更新检查

**Goal:** 从 GitHub 导入 skill 装到 `~/.claude/skills`（自动填来源）；对有 GitHub 来源的 skill 手动检查上游更新 → 看 diff → 确认后应用（不静默覆盖，尽量可恢复）。

**安全主线**：所有出站抓取/克隆**仅允许 github.com 系**（github.com / raw.githubusercontent.com / api.github.com），防 SSRF；超时 + 大小上限；写盘复用 new-skill 的 name 校验与"不覆盖已存在"。

**分工**：后端（subagent）；前端导入弹窗 + 来源区检查更新（主控）。

## URL 解析（github 系）
支持：
- `https://github.com/<owner>/<repo>` → 整仓库为一个 skill（subpath=""，ref=默认分支）
- `https://github.com/<owner>/<repo>/tree/<ref>/<subpath>` → 该子目录
- `https://github.com/<owner>/<repo>/blob/<ref>/<path>/SKILL.md` → 该文件所在目录
非 github 主机 → 400/403 拒绝。

## API 契约
- `POST /api/import` body `{url, name?}` → `{id, name}`
  - 解析 url（仅 github）；`git clone --depth 1 [--branch ref] https://github.com/<owner>/<repo> <tmp>`（只读公共仓库，不需要 token）；定位 `<tmp>/<subpath>`，要求其中存在 `SKILL.md`；name 默认取 subpath 基名或 repo 名，**仅 `^[a-z0-9][a-z0-9-]*$`**；目标 `~/.claude/skills/<name>/`，已存在→409；拷贝整个 skill 目录（跳过 `.git`）。
  - 取 `git -C <tmp> rev-parse HEAD` 作 source_rev；写 `skill_sources`：source_kind=github_repo, source_url=`https://github.com/<owner>/<repo>`, source_ref=ref, source_subpath=subpath, source_rev=sha, sync_policy=check_only。
  - 重扫该目录入库；返回新 id。clone 临时目录用后即删。
  - 失败分类：400 url 非法/非 github；409 已存在；422 子目录无 SKILL.md；502 clone 失败。
- `POST /api/skills/{id}/source/check` → `{has_update, local_hash, remote_hash, remote_content, remote_rev}`
  - 要求该 skill 有 github 来源（否则 400）。用 raw 抓 `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<subpath>/SKILL.md`（超时 15s、上限 2MB）；remote_hash=HashBody(remote)；local_hash=该 skill 的 BodyHash；has_update=两者不同。remote_content 回传（供前端 diff/应用）。抓取失败 502。
- `POST /api/skills/{id}/source/apply` body `{content}` → `{status}`
  - 把 content 写入该 skill 的 SKILL.md（复用 editor.Save：路径越界防护 + 若在 git 仓库内则提交）；重算 BodyHash、reindex；更新 source_rev（前端在 apply 时把 check 返回的 remote_rev 一并带上，或后端重算）。
  - **可恢复**：写入前若不在 git 仓库，先把旧 SKILL.md 复制为 `SKILL.md.bak`（同目录），便于手动回退；在 git 仓库内则靠提交历史。

## 后端文件
- `internal/githubsrc`（新）：`ParseURL(url) (owner,repo,ref,subpath, err)`（仅 github）、`RawSkillURL(...)`、host 白名单。
- `internal/server/import_routes.go`（新）：三个 handler；clone 用 os/exec git；raw 抓取用带超时的 http.Client + LimitReader；写盘复用现有 new-skill 逻辑/校验。
- 复用 `store.PutSource`、`model.HashBody`、`editor.Save`、`scanner.ParseFrontmatter`、`DefaultRoots` 的用户级目录。

## 前端（主控）
1. **导入**：在「新建」弹窗加一个"从 GitHub 导入"分段/或独立按钮 → 输入 url(+可选名) → 调 `/api/import` → 成功后 loadAll + 打开新 skill；错误按状态码give 友好提示。
2. **来源区检查更新**：当 skill 有 github 来源时，来源区显示「检查更新」按钮 → 调 check → 有更新则弹**并排 diff**（本地 | 上游）→「应用更新」调 apply（二次确认）→ 成功后 reload + toast；无更新 toast「已是最新」。
3. apply 后刷新来源区（source_rev 更新）。

## 验证
- 后端 `go test ./...` 全绿；URL 解析单测；check/apply 用 httptest 假 raw 服务（**不打真实 github**）；import 的 clone 可在临时 git 裸仓库或跳过真实网络的前提下测 URL 解析 + 写盘路径（clone 本身可用本地 file:// 临时仓库验证，避免外网）。
- 前端 Preview：导入流程（可 mock）、来源区检查更新按钮与 diff。真实 github 抓取需联网，留给用户机器。
