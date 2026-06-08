/* ===================== SkillBook front-end ===================== */
/* ---------- i18n（中文即 key + 英文字典） ---------- */
const I18N = {
  en: {
    // 模态提示（整段，路径以纯文本内联）
    "key 仅保存在本机 ~/.skillbook/config.json，不会上传、不回显。": "Key is stored locally in ~/.skillbook/config.json — never uploaded or echoed back.",
    "key 仅保存在本机 ~/.skillbook/（0600），不会上传、不回显。": "Key is stored locally in ~/.skillbook/ (0600) — never uploaded or echoed back.",
    "克隆公共仓库的该 skill 目录到 ~/.claude/skills，并自动填好来源链接。仅支持 github.com。": "Clones that skill directory from the public repo into ~/.claude/skills and fills in the source link. Only github.com is supported.",
    "保存在本机 ~/.skillbook/optimizer.md": "Stored locally in ~/.skillbook/optimizer.md",
    // 来源自动检测 / 更新
    "自动检测来源更新": "Auto-check source updates",
    "关闭": "Off",
    "每 6 小时": "Every 6 hours",
    "每天": "Daily",
    "每 3 天": "Every 3 days",
    "每周": "Weekly",
    "自动检测更新": "Auto-check for updates",
    "仓库内子路径（SKILL.md 所在目录，如 cr；根目录留空）": "Subpath in repo (dir containing SKILL.md, e.g. cr; blank for root)",
    "私有仓库访问令牌": "Private repo access token",
    "私有仓库填；留空不修改": "For private repos; blank keeps current",
    "更新目标": "Update target",
    "检测到上游有更新，点「检查更新」查看并应用。": "Upstream has updates — click “Check for updates” to review and apply.",
    "有可用更新": "Update available",
    "可更新": "Updatable",
    // 文件目录收起
    "收起 / 展开文件目录": "Collapse / expand file tree",
    // 收藏
    "收藏": "Favorites",
    "取消收藏": "Remove from favorites",
    // 失败后缀片段
    "，{n} 失败": "; {n} failed",
    "，{n} 个失败": "; {n} failed",
    // 拼接式片段
    "没有发现": "No ",
    "已在 Finder 定位 ": "Located ",
    " 项": " items in Finder",
    "失败：": "Failed: ",
    "已创建 ": "Created ",
    "已导入 ": "Imported ",
    // 表单字段补充
    "名称": "Name",
    "GitHub 链接": "GitHub link",
    "本地名称": "Local name",
    "分支": "Branch",
    // 顶栏 / 通用按钮
    "收起 / 展开左侧目录": "Collapse / expand sidebar",
    "收起左侧目录": "Collapse sidebar",
    "新建 skill": "New skill",
    "新建": "New",
    "切换深色 / 浅色主题": "Toggle dark / light theme",
    "切换语言 / Switch language": "切换语言 / Switch language",
    "设置 AI": "AI settings",
    "扫描": "Scan",
    // 侧栏
    "搜索 skill…": "Search skills…",
    "清除搜索": "Clear search",
    "欢迎使用 SkillBook": "Welcome to SkillBook",
    "点右上角「扫描」加载本机所有 skill。": "Click “Scan” at the top right to load all skills on this machine.",
    "从左侧选择一个 skill 查看详情": "Select a skill on the left to view details",
    // 详情头
    "浏览": "View",
    "编辑": "Edit",
    "双屏": "Split",
    "查找 (⌘F)": "Find (⌘F)",
    "在 Finder 中打开": "Reveal in Finder",
    "阅读字体 / 字号": "Reading font / size",
    "字号": "Size",
    "减小": "Decrease",
    "增大": "Increase",
    "字体": "Font",
    "默认": "Default",
    "衬线": "Serif",
    "等宽": "Mono",
    "用 AI 优化这份 skill": "Optimize this skill with AI",
    "未配置 AI —— 点此前往设置填 API key 与模型": "AI not configured — click to open settings and add API key & model",
    "AI 优化": "AI Optimize",
    "保存": "Save",
    "删除（移到废纸篓）": "Delete (move to Trash)",
    "删除该 skill": "Delete this skill",
    "拖拽调整左右宽度": "Drag to resize panes",
    "拖拽调整宽度": "Drag to resize",
    "二进制 / 超大文件，不支持在此编辑。": "Binary / very large file — not editable here.",
    // 设置模态
    "AI 设置": "AI Settings",
    "OpenAI 兼容（DeepSeek / OpenAI / Codex / Ollama）": "OpenAI-compatible (DeepSeek / OpenAI / Codex / Ollama)",
    "Anthropic（Claude）": "Anthropic (Claude)",
    "可留空用默认": "leave empty for default",
    "留空则不修改已存的 key": "leave empty to keep saved key",
    "key 仅保存在本机 ": "Key is stored only on this machine at ",
    "，不会上传、不回显。": " — never uploaded, never echoed.",
    "测试连接": "Test connection",
    "编辑优化规则": "Edit optimize rules",
    "编辑分类规则": "Edit tagging rules",
    "分类规则": "Tagging rules",
    "优化规则": "Optimize rules",
    "配置要扫描的目录与项目": "Configure scan directories & projects",
    "AI 自动打标签的规则": "Rules for AI auto-tagging",
    "AI 优化 skill 的评审依据": "Criteria for AI skill optimization",
    "备份到 GitHub 仓库": "Back up to a GitHub repo",
    "扫描目录": "Scan directories",
    "勾选要扫描的目录。每个额外目录视为一个项目，递归扫描其下所有 SKILL.md，项目名默认取文件夹名。": "Check directories to scan. Each extra directory is a project — its SKILL.md files are scanned recursively, project name defaults to the folder name.",
    "项目名（可选）": "Project name (optional)",
    "添加": "Add",
    "保存后点「扫描」生效": "Click Scan after saving to apply",
    "默认目录": "Default directories",
    "项目目录": "Project directories",
    "（无）": "(none)",
    "（暂无，下方添加）": "(none yet — add below)",
    "项目名": "Project name",
    "移除": "Remove",
    "请输入目录路径": "Enter a directory path",
    "已保存，点「扫描」生效": "Saved — click Scan to apply",
    "管理与工具": "Management & tools",
    "浏览…": "Browse…",
    "浏览文件夹…": "Browse folders…",
    "浏览选择": "Browse & pick",
    "将扫描的目录": "Directories to scan",
    "勾选要扫描的目录；额外目录视为项目，递归扫描其下 SKILL.md。": "Check directories to scan; extra ones are projects, scanned recursively for SKILL.md.",
    "或手动输入路径": "Or enter a path manually",
    "输入路径，回车跳转": "Enter a path, press Enter to jump",
    "跳转": "Go",
    "上级目录": "Parent directory",
    "添加所选": "Add selected",
    "进入": "Open",
    "（无子目录）": "(no subdirectories)",
    "（暂无子目录）": "(no subdirectories)",
    "已选 {n}": "{n} selected",
    "无法读取目录": "Cannot read directory",
    "未选择目录": "No directory selected",
    "已添加，记得保存": "Added — remember to save",
    "读取失败": "Failed to load",
    "全部重新分类": "Re-tag all",
    "分类规则（AI 打标签依据）": "Tagging rules (AI labeling basis)",
    "保存在本机 ~/.skillbook/classifier.md；留空恢复默认。{vocab} 会替换为已有标签。": "Stored locally in ~/.skillbook/classifier.md; empty restores default. {vocab} is replaced with existing tags.",
    "已保存分类规则": "Tagging rules saved",
    "备份与同步": "Backup & Sync",
    "垃圾桶": "Trash",
    "查看与恢复已删除的 Skill": "View and restore deleted skills",
    "已删除的 Skill": "Deleted skills",
    "清空回收站": "Empty trash",
    "回收站是空的": "Trash is empty",
    "读取回收站失败": "Failed to load trash",
    "清空回收站？内容会被移到系统废纸篓（仍可在访达恢复）。": "Empty trash? Items will be moved to the system Trash (still recoverable in Finder).",
    "已清空回收站": "Trash emptied",
    "清空失败": "Empty failed",
    "历史备份": "Backup history",
    "S3 配置": "S3 settings",
    "如 s3.amazonaws.com / R2 / MinIO 地址": "e.g. s3.amazonaws.com / R2 / MinIO endpoint",
    "路径前缀": "Key prefix",
    "保留个数": "Keep count",
    "使用 HTTPS": "Use HTTPS",
    "测试连接": "Test connection",
    "上次备份：{t} · 共 {n} 份": "Last backup: {t} · {n} total",
    "尚未配置备份（在左侧 S3 配置中填写）": "Backup not configured (fill in S3 settings on the left)",
    "配置后可在此查看历史备份": "Backups appear here once configured",
    "上一页": "Prev",
    "下一页": "Next",
    "第 {c}/{n} 页": "Page {c}/{n}",
    "还没有备份，点击「立即备份」": "No backups yet — click \"Backup now\"",
    "获取备份列表失败": "Failed to load backup list",
    "{n} 个文件": "{n} files",
    "恢复": "Restore",
    "测试中…": "Testing…",
    "连接成功 ✓": "Connected ✓",
    "连接失败": "Connection failed",
    "请先填写：{f}": "Please fill in: {f}",
    "将用该备份覆盖本地各平台 skills 目录；被覆盖的现有目录会先移到废纸篓（可恢复）。确定继续？": "This overwrites local per-platform skills directories with this backup; existing directories are moved to Trash first (recoverable). Continue?",
    "备份范围：自动发现的各平台用户级 skills 目录。Secret 仅写入本机 ~/.skillbook/backup.json（0600），不回显、不上传、不入备份内容。": "Backup scope: auto-discovered per-platform user-level skills directories (~/.<tool>/skills). The secret is written only to ~/.skillbook/backup.json (0600) — never echoed, uploaded, or included in backups.",
    // 新建模态
    "新建 skill ": "New skill ",
    "从 GitHub 导入": "Import from GitHub",
    "名称 ": "Name ",
    "小写字母、数字、连字符": "lowercase letters, digits, hyphens",
    "创建配方": "Recipe",
    "一句话描述（大白话）": "One-line description (plain words)",
    "描述这个 skill 要做什么，AI 会据此生成初稿…": "Describe what this skill does; AI will draft from this…",
    "GitHub 链接 ": "GitHub link ",
    "仓库 / tree 子目录 / blob 文件": "repo / tree subdir / blob file",
    "本地名称 ": "Local name ",
    "留空则用仓库/目录名": "leave empty to use repo/dir name",
    "可选": "optional",
    "克隆公共仓库的该 skill 目录到 ": "Clones that skill directory from the public repo into ",
    "，并自动填好来源链接。仅支持 github.com。": ", and auto-fills the source link. github.com only.",
    "创建": "Create",
    "导入": "Import",
    // diff 模态
    "AI 优化对比": "AI optimize comparison",
    "AI 优化 · 并排对比": "AI Optimize · Side-by-side",
    "原文": "Original",
    "AI 优化稿": "AI draft",
    "放弃": "Discard",
    "关闭": "Close",
    "应用到编辑器": "Apply to editor",
    // 重复/冲突
    "重复与冲突管理": "Duplicate & conflict management",
    "管理": "Manage",
    "并排对比": "Compare",
    "定位选中": "Locate selected",
    "移到废纸篓": "Move to Trash",
    // 来源
    "来源": "Source",
    "来源链接": "Source link",
    // AI 优化建议
    "AI 优化建议": "AI optimization suggestions",
    "全采纳": "Accept all",
    "全不采纳": "Accept none",
    "应用采纳项": "Apply accepted",
    // 优化规则
    "优化规则": "Optimize rules",
    "优化规则（AI 评审依据）": "Optimize rules (basis for AI review)",
    "保存在本机 ": "Stored on this machine at ",
    "保存规则": "Save rules",
    // 备份
    "未配置": "Not configured",
    "私有仓库，需先在 GitHub 建好": "private repo, create it on GitHub first",
    "分支 ": "Branch ",
    "默认 main": "default main",
    "GitHub Token ": "GitHub Token ",
    "留空则不修改已存的 token": "leave empty to keep saved token",
    "备份范围：": "Backup scope: ",
    " 与 ": " and ",
    "（0600），不回显、不上传、不入备份内容。需要对该仓库有写权限的 ": " (0600); never echoed, uploaded, or included in backups. Requires write access via the ",
    " scope。": " scope.",
    "保存配置": "Save config",
    "从备份恢复": "Restore from backup",
    "立即备份": "Backup now",
    // ---- 动态文案（app.js） ----
    // 分类 / 平台 / chips
    "用户级": "User",
    "项目级": "Project",
    "插件": "Plugin",
    "冲突": "Conflict",
    "重复": "Duplicate",
    "有来源": "Sourced",
    "无来源": "No source",
    "全部": "All",
    "平台：{p}": "Platform: {p}",
    // 徽章 / 标记
    "同名但内容不同": "Same name, different content",
    "同名且内容一致，重复安装": "Same name and content, installed multiple times",
    "重复 ×{n}": "Duplicate ×{n}",
    "命名冲突": "Name conflict",
    "重复 {n} 份": "{n} duplicates",
    "更新于 {t}": "Updated {t}",
    "最新": "Newest",
    // 相对时间
    "{n}天前": "{n}d ago",
    "一周前": "a week ago",
    // toast / 状态
    "扫描完成 · {n} 个 skill": "Scanned · {n} skills",
    "扫描失败": "Scan failed",
    "{n} skills": "{n} skills",
    "没有匹配的 skill": "No matching skills",
    "（空目录）": "(empty directory)",
    "新建文件": "New file",
    "新建文件夹": "New folder",
    "文件": "File",
    "文件夹": "Folder",
    "新建文件名称": "New file name",
    "新建文件夹名称": "New folder name",
    "重命名": "Rename",
    "重命名为": "Rename to",
    "删除": "Delete",
    "已创建": "Created",
    "已重命名": "Renamed",
    "重命名失败": "Rename failed",
    "已移到废纸篓": "Moved to Trash",
    "将「{n}」移到废纸篓（可在访达恢复）。确定？": "Move “{n}” to Trash (recoverable in Finder)? Confirm?",
    "当前文件有未保存修改，切换将丢失。确定切换？": "The current file has unsaved changes that will be lost. Switch anyway?",
    "读取文件失败": "Failed to read file",
    "读取失败：{e}": "Read failed: {e}",
    "无法打开该 skill": "Cannot open this skill",
    "无法定位 skill 目录": "Cannot locate skill directory",
    "将「{name}」移到废纸篓（可在访达恢复）。确定？": "Move “{name}” to Trash (recoverable in Finder)? Confirm?",
    "仅 macOS 支持移到废纸篓": "Move to Trash is macOS only",
    "已移到废纸篓「{name}」": "Moved “{name}” to Trash",
    "删除失败": "Delete failed",
    "操作失败": "Operation failed",
    "已保存": "Saved",
    "保存失败": "Save failed",
    "标签": "Tags",
    "收起": "Collapse",
    "更多 +{n}": "More +{n}",
    "编辑标签": "Edit tags",
    "编辑标签（用逗号分隔，最多 8 个）：": "Edit tags (comma-separated, up to 8):",
    "标签已更新": "Tags updated",
    "正在自动打标签… {done}/{total}": "Auto-tagging… {done}/{total}",
    "请先在设置里配置 AI（用于自动打标签）": "Configure AI in Settings first (used for auto-tagging)",
    "没有需要分类的 skill": "No skills need tagging",
    "这个 skill 还有 {n} 个同名副本。是否把它们同步为当前内容？（被覆盖的 SKILL.md 会存 .bak，可恢复）": "This skill has {n} other copies with the same name. Sync them to the current content? (Overwritten SKILL.md is saved as .bak, recoverable.)",
    "检测到 {n} 个同名 Skill「{name}」，内容与当前不一致：": "Found {n} same-named skill(s) \"{name}\" whose content differs from the current one:",
    "是否把它们同步为当前内容？（被覆盖的 SKILL.md 会存 .bak，可恢复）": "Sync them to the current content? (Overwritten SKILL.md is saved as .bak, recoverable.)",
    "已同步 {n} 个副本": "Synced {n} copies",
    "同步失败": "Sync failed",
    "已在 Finder 中打开": "Revealed in Finder",
    "当前系统不支持 Finder 打开": "Reveal in Finder not supported on this OS",
    "打开失败": "Open failed",
    "尚未备份": "Not backed up yet",
    "GitHub 仓库": "GitHub repo",
    "GitHub 文件": "GitHub file",
    "本地目录": "Local path",
    "手动": "Manual",
    "未知": "Unknown",
    "不同步": "No sync",
    "仅检查更新": "Check only",
    "手动更新": "Manual update",
    "未设置来源": "No source set",
    "检测到来源": "Source detected",
    "检测到 Git 来源：{url} —— 确认后点保存即采用。": "Detected Git source: {url} — click Save to adopt it.",
    "分支/tag/commit": "branch/tag/commit",
    "备注（可选）": "Note (optional)",
    "复制链接": "Copy link",
    "检查更新": "Check updates",
    "清除来源": "Clear source",
    "已保存来源": "Source saved",
    "已清除来源": "Source cleared",
    "高": "High",
    "中": "Medium",
    "低": "Low",
    "请先在设置里配置 API key 和模型": "Configure API key and model in settings first",
    "AI 优化仅支持 markdown 文件": "AI optimize only supports markdown files",
    "AI 按维度体检中…": "AI is reviewing by dimension…",
    "请先在设置里配置 AI": "Configure AI in settings first",
    "AI 优化失败": "AI optimize failed",
    "{n} 条建议 · 依据优化规则逐维度体检，逐条勾选采纳": "{n} suggestions · reviewed by dimension against the rules; check each to accept",
    "没有发现可优化点 —— 这份 skill 已经不错。": "No improvements found — this skill is already solid.",
    "采纳": "Accept",
    "没有发现可优化点。": "No improvements found.",
    "已采纳 {a}/{total}": "Accepted {a}/{total}",
    "已应用采纳项，记得保存": "Applied accepted items; remember to save",
    "已应用采纳项，{n} 处未能定位，记得保存": "Applied accepted items; {n} could not be located. Remember to save",
    "载入规则失败": "Failed to load rules",
    "已保存优化规则": "Optimize rules saved",
    "上次备份：{t} · 仓库 {repo}": "Last backup: {t} · repo {repo}",
    "尚未配置备份（在下方填写仓库与 Token）": "Backup not configured (fill in repo & token below)",
    "载入备份配置失败": "Failed to load backup config",
    "已保存（留空不改）": "saved (leave empty to keep)",
    "必填": "required",
    "保存中…": "Saving…",
    "已保存备份配置": "Backup config saved",
    "备份中…": "Backing up…",
    "备份完成 ✓": "Backup complete ✓",
    "没有变更": "No changes",
    "备份失败": "Backup failed",
    "恢复中…": "Restoring…",
    "已恢复": "Restored",
    "恢复失败": "Restore failed",
    "本地": "Local",
    "上游最新": "Upstream latest",
    "检查上游更新…": "Checking upstream updates…",
    "检查失败": "Check failed",
    "已是最新版本": "Already up to date",
    "用上游最新内容覆盖本地 SKILL.md？\n（不在 git 仓库时会先备份为 SKILL.md.bak）": "Overwrite local SKILL.md with upstream latest?\n(When not in a git repo, it is backed up as SKILL.md.bak first.)",
    "应用失败": "Apply failed",
    "已应用上游更新": "Upstream update applied",
    "已应用 AI 稿，记得保存": "Applied AI draft; remember to save",
    "冲突管理": "Conflict management",
    "重复管理": "Duplicate management",
    "加载中…": "Loading…",
    "加载失败": "Loading failed",
    "{n} 组同名（内容不同），共 {total} 个副本": "{n} same-name groups (different content), {total} copies total",
    "{n} 组同名（内容一致），共 {total} 个副本": "{n} same-name groups (identical content), {total} copies total",
    "没有发现冲突": "No conflicts found",
    "没有发现重复": "No duplicates found",
    "以此副本为准，覆盖同步同组其它副本（被覆盖的存 .bak）": "Make this copy authoritative and sync over the others in this group (overwritten ones saved as .bak)",
    "以此为准 ›": "Use this ›",
    "打开 ›": "Open ›",
    "{n} 份": "{n} copies",
    "没有数据": "No data",
    "已选 {n}": "{n} selected",
    "已在 Finder 定位 {n} 项": "Located {n} items in Finder",
    "将 {n} 个 skill 目录移到废纸篓（可在访达恢复）。确定？": "Move {n} skill directories to Trash (recoverable in Finder)? Confirm?",
    "已移到废纸篓 {n} 项": "Moved {n} items to Trash",
    "已移到废纸篓 {n} 项，{f} 失败": "Moved {n} items to Trash, {f} failed",
    "副本 A": "Copy A",
    "副本 B": "Copy B",
    "将以选中副本为准，覆盖同步该组其它 {n} 个副本（被覆盖的 SKILL.md 会存 .bak，可恢复）。确定？": "Make the selected copy authoritative and sync over the other {n} copies in this group (overwritten SKILL.md saved as .bak, recoverable). Confirm?",
    "已同步 {n} 个副本，{f} 个失败": "Synced {n} copies, {f} failed",
    "读取配置失败": "Failed to read config",
    "（已配置，可留空）": "(configured, may leave empty)",
    "（未配置）": "(not configured)",
    "已保存设置": "Settings saved",
    "测试中…": "Testing…",
    "未配置 key": "No key configured",
    "连接成功 ✓": "Connected ✓",
    "失败：{m}": "Failed: {m}",
    "测试失败": "Test failed",
    "已配置 AI：将根据描述生成初稿。": "AI configured: a draft will be generated from your description.",
    "未配置 AI：将插入空白脚手架，可在设置里启用 AI。": "AI not configured: a blank scaffold will be inserted; enable AI in settings.",
    "空白脚手架": "Blank scaffold",
    "TODO: 一句话描述这个 skill 何时使用": "TODO: one line describing when to use this skill",
    "TODO: 写下这个 skill 的内容。": "TODO: write the content of this skill.",
    "名称只能用小写字母、数字、连字符": "Name may only use lowercase letters, digits, hyphens",
    "创建中…": "Creating…",
    "AI 生成中…": "AI generating…",
    "已存在同名 skill": "A skill with this name already exists",
    "创建失败": "Create failed",
    "已创建 {name}": "Created {name}",
    "请填 GitHub 链接": "Please enter a GitHub link",
    "克隆中…（可能需要几秒）": "Cloning… (may take a few seconds)",
    "链接非法或非 github.com": "Invalid link or not github.com",
    "该目录下没有 SKILL.md": "No SKILL.md in that directory",
    "克隆仓库失败": "Failed to clone repo",
    "导入失败": "Import failed",
    "已导入 {name}": "Imported {name}",
    "清除该 skill 的来源信息？": "Clear this skill's source info?",
    "已复制来源链接": "Source link copied"
  }
};
let LANG = localStorage.getItem("sb.lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
function t(zh, params) {
  let s = LANG === "en" && I18N.en[zh] != null ? I18N.en[zh] : zh;
  if (params) for (const k in params) s = s.split("{" + k + "}").join(params[k]);
  return s;
}
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((n) => {n.textContent = t(n.getAttribute("data-i18n"));});
  document.querySelectorAll("[data-i18n-ph]").forEach((n) => {n.setAttribute("placeholder", t(n.getAttribute("data-i18n-ph")));});
  document.querySelectorAll("[data-i18n-title]").forEach((n) => {n.setAttribute("title", t(n.getAttribute("data-i18n-title")));});
  document.querySelectorAll("[data-i18n-aria]").forEach((n) => {n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria")));});
}
function langTagText() {return LANG === "zh" ? t("中") : "EN";}
function toggleLang() {
  LANG = LANG === "zh" ? "en" : "zh";
  try {localStorage.setItem("sb.lang", LANG);} catch {/* ignore */}
  const tag = document.querySelector(".lang-tag");if (tag) tag.textContent = langTagText();
  applyI18n();
  renderChips();
  render();
  refreshOpenDetailI18n();
}
// 语言切换后，重渲染已打开详情中由 JS 动态生成、含中文的部分（徽章、路径、来源、预览等）。
function refreshOpenDetailI18n() {
  if (!state.current) return;
  const s = state.current;
  const flag = flagBadge({ conflict: state.conflicts.has(s.name), dup: state.dups.has(s.name), dupCount: state.dupCounts[s.name] || 0 });
  el.sheetBadges.innerHTML = `${platformBadge(s)}${flag}`;
  el.sheetPath.textContent = s.file_path + (s.mtime ? `   ·   ${t("更新于 {t}", { t: fmtTime(s.mtime) })}` : "");
  renderSourceChip();
  renderTree();
  if (state.mode !== "edit") renderPreview();
}

const $ = (s) => document.querySelector(s);
const el = {
  scan: $("#scan"), newSkill: $("#newSkill"), settings: $("#settings"), sidebarHandle: $("#sidebarHandle"),
  q: $("#q"), clear: $("#clear"), searchWrap: $("#searchWrap"),
  chips: $("#chips"), tagSection: $("#tagSection"),
  workbench: $("#workbench"), sidebar: $("#sidebar"), tree: $("#tree"), emptyHero: $("#emptyHero"),
  detailEmpty: $("#detailEmpty"), sheet: $("#sheet"), sheetName: $("#sheetName"),
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"), sheetClose: $("#sheetClose"),
  sourceChip: $("#sourceChip"), sourceModal: $("#sourceModal"), sourceModalBody: $("#sourceModalBody"),
  sheetTags: $("#sheetTags"), editTags: $("#editTags"),
  clsBar: $("#clsBar"), clsBarFill: $("#clsBarFill"), clsBarText: $("#clsBarText"),
  editOptimizer: $("#editOptimizer"), openBackup: $("#openBackup"),
  openTrash: $("#openTrash"), trashModal: $("#trashModal"), trashList: $("#trashList"), trashEmpty: $("#trashEmpty"),
  backupModal: $("#backupModal"), backupStatus: $("#backupStatus"),
  bkList: $("#bkList"), bkEndpoint: $("#bkEndpoint"), bkRegion: $("#bkRegion"),
  bkBucket: $("#bkBucket"), bkPrefix: $("#bkPrefix"), bkKeep: $("#bkKeep"),
  bkAccessKey: $("#bkAccessKey"), bkSecretKey: $("#bkSecretKey"), bkSecretHint: $("#bkSecretHint"),
  bkUseSSL: $("#bkUseSSL"), bkTest: $("#bkTest"), bkSave: $("#bkSave"),
  bkStatus: $("#bkStatus"), bkPush: $("#bkPush"), bkPager: $("#bkPager"),
  optimizeModal: $("#optimizeModal"), optSub: $("#optSub"), optBody: $("#optBody"), optSel: $("#optSel"),
  optAll: $("#optAll"), optNone: $("#optNone"), optApply: $("#optApply"),
  optimizerModal: $("#optimizerModal"), optimizerEd: $("#optimizerEd"), optimizerSave: $("#optimizerSave"),
  editClassifier: $("#editClassifier"), reclassify: $("#reclassify"),
  editScanDirs: $("#editScanDirs"), scanDirsModal: $("#scanDirsModal"), scanDirsBody: $("#scanDirsBody"),
  newDirPath: $("#newDirPath"), newDirName: $("#newDirName"), scanDirsSave: $("#scanDirsSave"),
  classifierModal: $("#classifierModal"), classifierEd: $("#classifierEd"), classifierSave: $("#classifierSave"),
  modeSeg: $("#modeSeg"), preview: $("#preview"), editorWrap: $("#editorWrap"), ed: $("#ed"), sheetMain: $("#sheetMain"), splitGutter: $("#splitGutter"),
  binaryNote: $("#binaryNote"), fileTree: $("#fileTree"), sheetBody: $("#sheetBody"),
  aiOptimize: $("#aiOptimize"), findBtn: $("#findBtn"), reveal: $("#reveal"), favBtn: $("#favBtn"),
  fontBtn: $("#fontBtn"), fontPop: $("#fontPop"), fsVal: $("#fsVal"),
  save: $("#save"), deleteSkill: $("#deleteSkill"), themeToggle: $("#themeToggle"), langToggle: $("#langToggle"),
  groupsModal: $("#groupsModal"), groupsTitle: $("#groupsTitle"), groupsSub: $("#groupsSub"),
  groupsBody: $("#groupsBody"), groupsSel: $("#groupsSel"),
  grpCompare: $("#grpCompare"), grpLocate: $("#grpLocate"), grpTrash: $("#grpTrash"),
  modalScrim: $("#modalScrim"),
  settingsModal: $("#settingsModal"), cfgProvider: $("#cfgProvider"), cfgBaseURL: $("#cfgBaseURL"),
  cfgModel: $("#cfgModel"), cfgKey: $("#cfgKey"), keyHint: $("#keyHint"), cfgSyncInterval: $("#cfgSyncInterval"),
  cfgTest: $("#cfgTest"), cfgStatus: $("#cfgStatus"), cfgSave: $("#cfgSave"),
  newModal: $("#newModal"), newName: $("#newName"), newRecipe: $("#newRecipe"),
  newBrief: $("#newBrief"), newAiHint: $("#newAiHint"), newStatus: $("#newStatus"), newCreate: $("#newCreate"),
  newModeSeg: $("#newModeSeg"), newCreateFields: $("#newCreateFields"), newImportFields: $("#newImportFields"),
  importUrl: $("#importUrl"), importName: $("#importName"), newImport: $("#newImport"),
  diffModal: $("#diffModal"), diffOld: $("#diffOld"), diffNew: $("#diffNew"),
  diffOldLabel: $("#diffOldLabel"), diffNewLabel: $("#diffNewLabel"),
  diffApply: $("#diffApply"), diffDiscard: $("#diffDiscard"),
  toasts: $("#toasts")
};

const CAT_LABEL = { user: "用户级", project: "项目级", plugin: "插件" };
// 平台可插拔：claude/codex 不再写死，由 /api/platforms 扫描发现。
// claude/codex 保留 CSS 专属配色，其余平台用 platColor 派生稳定色。
const PLAT_FIXED_COLOR = { claude: "#e09a6a", codex: "#7aa8ff" };
const PLAT_PALETTE = ["#8b7ff0", "#5bbf9a", "#e0707a", "#d9a441", "#5bb6c9", "#c97ad9", "#6f9bd8", "#cf8a5b"];
// 品牌图标（fill:currentColor，跟随文字色）
const GITHUB_SVG = '<svg class="brand-ico" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
const OPENAI_SVG = '<svg class="brand-ico" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zM13.2599 22.43a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.1419.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z"/></svg>';
const CLAUDE_SVG = '<svg class="brand-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M14.5 12 22 12M14.17 13.25 20.66 17M13.25 14.17 17 20.66M12 14.5 12 22M10.75 14.17 7 20.66M9.83 13.25 3.34 17M9.5 12 2 12M9.83 10.75 3.34 7M10.75 9.83 7 3.34M12 9.5 12 2M13.25 9.83 17 3.34M14.17 10.75 20.66 7"/></svg>';
// platIcon 返回平台品牌图标：Claude→Claude 标，Codex→OpenAI 标；其余无。
function platIcon(id) {
  if (id === "claude") return CLAUDE_SVG;
  if (id === "codex") return OPENAI_SVG;
  return "";
}
// platLabel 返回平台展示名：优先后端给的 label，回退已知名，再回退首字母大写。
function platLabel(id) {
  if (!id) return "";
  const f = (state.platforms || []).find((p) => p.id === id);
  if (f && f.label) return f.label;
  if (id === "claude") return "Claude";
  if (id === "codex") return "Codex";
  return id[0].toUpperCase() + id.slice(1);
}
// platColor 为未知平台从调色板派生稳定颜色（同 id 永远同色）。
function platColor(id) {
  if (!id) return "#9aa0aa";
  if (PLAT_FIXED_COLOR[id]) return PLAT_FIXED_COLOR[id];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLAT_PALETTE[h % PLAT_PALETTE.length];
}
const isKnownPlat = (id) => id === "claude" || id === "codex";
// platIds 返回参与渲染的平台顺序：后端发现的（claude 优先）+ 数据里出现但未列出的兜底。
function platIds() {
  const ids = (state.platforms || []).map((p) => p.id);
  for (const s of state.all) {
    if (s.platform && !ids.includes(s.platform)) ids.push(s.platform);
  }
  return ids;
}
function platformBadge(s) {
  const p = s && s.platform;
  if (!p) return "";
  const label = platLabel(p);
  const title = t("平台：{p}", { p: label });
  if (isKnownPlat(p)) return `<span class="badge plat-${p}" title="${title}">${platIcon(p)}${label}</span>`;
  const c = platColor(p);
  return `<span class="badge" style="color:${c};border-color:${c}66;background:${c}1f;text-transform:none" title="${title}">${label}</span>`;
}
// platDot 渲染左侧树/行内的平台标识：已知平台用品牌图标，其余用内联色圆点。
function platDot(p, title) {
  if (isKnownPlat(p)) return `<span class="plat-ico-wrap" style="color:${platColor(p)}" title="${title || ""}">${platIcon(p)}</span>`;
  return `<span class="plat-dot" style="background:${platColor(p)}" title="${title || ""}"></span>`;
}
function relTime(unix) {
  if (!unix) return "";
  const now = new Date();
  const then = new Date(unix * 1000);
  // 按自然日计算天数差（避免“23 小时前其实是昨天”的歧义）
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);
  const p2 = (n) => String(n).padStart(2, "0");
  if (dayDiff <= 0) return `${p2(then.getHours())}:${p2(then.getMinutes())}`; // 今天：HH:mm
  if (dayDiff < 7) return t("{n}天前", { n: dayDiff }); // 1–6 天前
  if (dayDiff === 7) return t("一周前"); // 恰好一周
  return `${then.getFullYear()}-${p2(then.getMonth() + 1)}-${p2(then.getDate())}`; // 大于一周：yyyy-MM-dd
}
const CAT_ORDER = ["user", "project"]; // plugin 已弃用：不扫描、不展示

const state = {
  all: [], platforms: [], conflicts: new Set(), dups: new Set(), dupCounts: {},
  scanned: false, query: "", cat: "all", view: [], cursor: -1, treeCollapsed: new Set(),
  current: null, editor: null, baseline: "", mode: "view", aiResult: "",
  files: [], filePath: "", fileBinary: false, full: false, aiConfigured: false,
  collapsed: new Set(), linkedSources: new Set(), updates: new Set(), source: null, sourceEditing: false,
  favorites: new Set(), fileTreeCollapsed: false, tagsCollapsed: false, tagsShowAll: false, dirty: false,
  diffMode: "ai", pendingUpdate: null,
  groupKind: "dup", groupSel: new Set(),
  readerSize: 15, readerFont: "sans"
};

const LS = {
  recents: () => readLS("sb.recents", []),
  setRecents: (v) => localStorage.setItem("sb.recents", JSON.stringify(v.slice(0, 8))),
  history: () => readLS("sb.history", []),
  setHistory: (v) => localStorage.setItem("sb.history", JSON.stringify(v.slice(0, 8))),
  favorites: () => readLS("sb.favorites", []),
  setFavorites: (v) => localStorage.setItem("sb.favorites", JSON.stringify(v))
};
function readLS(k, d) {try {return JSON.parse(localStorage.getItem(k)) || d;} catch {return d;}}

/* ---------- helpers ---------- */
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function highlight(name, q) {
  if (!q) return esc(name);
  const i = name.toLowerCase().indexOf(q);
  if (i < 0) return esc(name);
  return esc(name.slice(0, i)) + "<mark>" + esc(name.slice(i, i + q.length)) + "</mark>" + esc(name.slice(i + q.length));
}
function flagBadge(s) {
  if (s.conflict) return `<span class="badge conflict" title="${t("同名但内容不同")}">${t("冲突")}</span>`;
  if (s.dup) return `<span class="badge dup" title="${t("同名且内容一致，重复安装")}">${t("重复 ×{n}", { n: s.dupCount })}</span>`;
  return "";
}
function toast(msg, kind = "ok") {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.innerHTML = `<span class="dot">●</span>${esc(msg)}`;
  el.toasts.appendChild(t);
  setTimeout(() => {t.style.opacity = "0";t.style.transition = "opacity .25s";setTimeout(() => t.remove(), 260);}, 2400);
}

/* ---------- API ---------- */
const J = (r) => r.json();
const API = {
  scan: () => fetch("/api/scan", { method: "POST" }).then(J),
  all: () => fetch("/api/skills").then(J),
  platforms: () => fetch("/api/platforms").then(J),
  get: (id) => fetch("/api/skills/" + id).then(J),
  save: (id, content) => fetch("/api/skills/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  config: () => fetch("/api/config").then(J),
  putConfig: (c) => fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  aiTest: () => fetch("/api/ai/test", { method: "POST" }),
  recipes: () => fetch("/api/recipes").then(J),
  optimize: (content) => fetch("/api/ai/optimize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  create: (name, brief, recipe) => fetch("/api/ai/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, brief, recipe }) }),
  newSkill: (name, content) => fetch("/api/skills/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content }) }),
  reveal: (path) => fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }),
  files: (id) => fetch("/api/skills/" + id + "/files").then(J),
  readFile: (path) => fetch("/api/file?path=" + encodeURIComponent(path)).then(J),
  putFile: (path, content) => fetch("/api/file", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, content }) }),
  newFile: (dir, name) => fetch("/api/file/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir, name }) }),
  newDir: (dir, name) => fetch("/api/dir/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir, name }) }),
  renameEntry: (path, newName) => fetch("/api/file/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, newName }) }),
  deleteEntry: (path) => fetch("/api/file/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }),
  trash: (dirs) => fetch("/api/skills/trash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dirs }) }),
  trashItems: () => fetch("/api/trash").then(J),
  trashRestore: (id) => fetch("/api/trash/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }),
  trashEmptyAll: () => fetch("/api/trash/empty", { method: "POST" }),
  groups: (kind) => fetch("/api/groups?kind=" + kind).then(J),
  sync: (fromId, toIds) => fetch("/api/skills/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromId, toIds }) }),
  getSource: (id) => fetch("/api/skills/" + id + "/source").then(J),
  putSource: (id, s) => fetch("/api/skills/" + id + "/source", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }),
  sources: () => fetch("/api/sources").then(J),
  importSkill: (url, name) => fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, name }) }),
  checkSource: (id) => fetch("/api/skills/" + id + "/source/check", { method: "POST" }),
  applySource: (id, content, targets) => fetch("/api/skills/" + id + "/source/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, targets }) }),
  getSyncConfig: () => fetch("/api/sync-config").then(J),
  browse: (path) => fetch("/api/browse" + (path ? "?path=" + encodeURIComponent(path) : "")).then(J),
  getScanDirs: () => fetch("/api/scan-dirs").then(J),
  putScanDirs: (body) => fetch("/api/scan-dirs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  classify: (force) => fetch("/api/tags/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: !!force }) }),
  classifyStatus: () => fetch("/api/tags/classify/status").then(J),
  setTags: (id, tags) => fetch("/api/skills/" + id + "/tags", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags }) }),
  putSyncConfig: (c) => fetch("/api/sync-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  getOptimizer: () => fetch("/api/optimizer").then(J),
  putOptimizer: (content) => fetch("/api/optimizer", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  getClassifier: () => fetch("/api/classifier").then(J),
  putClassifier: (content) => fetch("/api/classifier", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  backupConfig: () => fetch("/api/backup/config").then(J),
  backupStatus: () => fetch("/api/backup/status").then(J),
  backupList: () => fetch("/api/backup/list").then(J),
  putBackupConfig: (c) => fetch("/api/backup/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  backupTest: () => fetch("/api/backup/test", { method: "POST" }),
  backupPush: () => fetch("/api/backup/push", { method: "POST" }),
  backupRestore: (name) => fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
};

/* ---------- data load ---------- */
async function doScan() {
  el.scan.classList.add("loading");el.scan.disabled = true;
  try {
    const d = await API.scan();await loadAll();toast(t("扫描完成 · {n} 个 skill", { n: d.count ?? 0 }));
    startClassify(false, true); // 扫描后自动为未分类的 skill 打标签（AI 未配置则静默跳过）
  }
  catch {toast(t("扫描失败"), "err");} finally
  {el.scan.classList.remove("loading");el.scan.disabled = false;}
}
async function loadAll() {
  const data = await API.all();
  try {const pd = await API.platforms();state.platforms = pd.platforms || [];state.defaultPlatform = pd.default || "claude";} catch {state.platforms = [];}
  state.conflicts = new Set(data.conflicts || []);
  state.dups = new Set(data.dups || []);
  state.dupCounts = data.dupCounts || {};
  state.all = (data.skills || []).map((s) => ({
    ...s, nameLower: (s.name || "").toLowerCase(), descLower: (s.description || "").toLowerCase(),
    tagText: (s.tags || []).join(" ").toLowerCase(),
    conflict: state.conflicts.has(s.name), dup: state.dups.has(s.name), dupCount: state.dupCounts[s.name] || 0
  }));
  state.scanned = state.all.length > 0;
  try {const sd = await API.sources();state.linkedSources = new Set(sd.linked || []);state.updates = new Set(sd.updates || []);} catch {state.linkedSources = new Set();state.updates = new Set();}
  renderChips();render();
}

/* ---------- ranking ---------- */
function scoreOf(s, q) {
  const n = s.nameLower;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(/[-_ ./]+/).some((w) => w.startsWith(q))) return 2;
  if (n.includes(q)) return 3;
  if ((s.tagText || "").includes(q)) return 4;
  if (s.descLower.includes(q)) return 5;
  return -1;
}
function compute() {
  const q = state.query.trim().toLowerCase();
  let base = state.all;
  if (state.cat === "fav") base = base.filter((s) => state.favorites.has(s.id));else
  if (state.cat === "update") base = base.filter((s) => state.updates.has(s.id));else
  if (state.cat === "conflict") base = base.filter((s) => s.conflict);else
  if (state.cat === "dup") base = base.filter((s) => s.dup);else
  if (state.cat === "linked") base = base.filter((s) => state.linkedSources.has(s.id));else
  if (state.cat === "unlinked") base = base.filter((s) => !state.linkedSources.has(s.id));else
  if (state.cat.startsWith("tag:")) {const tg = state.cat.slice(4);base = base.filter((s) => (s.tags || []).includes(tg));}else
  if (state.cat.startsWith("proj:")) {const pj = state.cat.slice(5);base = base.filter((s) => s.project === pj);}else
  if (platIds().includes(state.cat)) base = base.filter((s) => s.platform === state.cat);else
  if (state.cat !== "all") base = base.filter((s) => s.source === state.cat);
  if (!q) {state.view = base.slice().sort((a, b) => a.name.localeCompare(b.name));return;}
  const scored = [];
  for (const s of base) {const sc = scoreOf(s, q);if (sc >= 0) scored.push([sc, s]);}
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  state.view = scored.map((x) => x[1]);
}

/* ---------- chips ---------- */
function applyFileTreeCollapsed() {
  el.sheetBody.classList.toggle("ft-collapsed", state.fileTreeCollapsed);
}
// file-tree 顶部表头（含收起/展开按钮），随 renderTree 重渲染
function fileTreeHeadHtml() {
  return `<div class="ft-head">` +
    `<button class="ft-act" id="ftNewFile" title="${t("新建文件")}">＋${t("文件")}</button>` +
    `<button class="ft-act" id="ftNewDir" title="${t("新建文件夹")}">＋${t("文件夹")}</button>` +
    `<button class="ft-collapse" title="${t("收起 / 展开文件目录")}" aria-label="${t("收起 / 展开文件目录")}">` +
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>' +
    '</button></div>';
}
function toggleFileTree() {
  state.fileTreeCollapsed = !state.fileTreeCollapsed;
  try { localStorage.setItem("sb.ftCollapsed", state.fileTreeCollapsed ? "1" : "0"); } catch { /* ignore */ }
  applyFileTreeCollapsed();
  invalidatePvAnchors();
  if (state.editor) setTimeout(() => state.editor.refresh(), 60);
}
const STAR_SVG ='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
function isFav(id) { return state.favorites.has(id); }
function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
  LS.setFavorites([...state.favorites]);
  renderChips();
  render();
  if (state.current && state.current.id === id) updateFavBtn();
}
function favCellHtml(id) {
  const on = isFav(id);
  return `<span class="ti-star${on ? " on" : ""}" data-fav="${id}" title="${on ? t("取消收藏") : t("收藏")}">${STAR_SVG}</span>`;
}
function updCell(id) {
  return state.updates.has(id) ? `<span class="ti-upd" title="${t("有可用更新")}">↑</span>` : "";
}
function updateFavBtn() {
  if (!el.favBtn) return;
  const on = state.current && isFav(state.current.id);
  el.favBtn.classList.toggle("on", !!on);
  el.favBtn.title = on ? t("取消收藏") : t("收藏");
}
function renderChips() {
  if (!state.scanned) {el.chips.hidden = true;return;}
  el.chips.hidden = false;
  const counts = { all: state.all.length, user: 0, project: 0, plugin: 0, conflict: 0, dup: 0 };
  for (const s of state.all) {counts[s.source] = (counts[s.source] || 0) + 1;if (s.platform) counts[s.platform] = (counts[s.platform] || 0) + 1;if (s.conflict) counts.conflict++;if (s.dup) counts.dup++;}
  const linked = state.linkedSources.size;
  counts.fav = state.all.filter((s) => state.favorites.has(s.id)).length;
  counts.update = state.all.filter((s) => state.updates.has(s.id)).length;
  const defs = [["all", t("全部")]];
  if (counts.fav) defs.push(["fav", t("收藏")]);
  if (counts.update) defs.push(["update", t("可更新")]);
  for (const pid of platIds()) {if (counts[pid]) defs.push([pid, platLabel(pid)]);}
  // 项目筛选 chip（来自配置的扫描项目目录；全局/用户级 skill 无项目）
  const projCount = {};
  for (const s of state.all) {if (s.project) projCount[s.project] = (projCount[s.project] || 0) + 1;}
  for (const pj of Object.keys(projCount).sort((a, b) => a.localeCompare(b))) {
    const key = "proj:" + pj;counts[key] = projCount[pj];defs.push([key, pj]);
  }
  if (counts.conflict) defs.push(["conflict", t("冲突")]);
  if (counts.dup) defs.push(["dup", t("重复")]);
  if (linked) defs.push(["linked", t("有来源")]);
  defs.push(["unlinked", t("无来源")]);
  counts.linked = linked;counts.unlinked = state.all.length - linked;
  el.chips.innerHTML = defs.map(([k, label]) =>
  `<button class="chip ${state.cat === k ? "active" : ""}" data-cat="${k}">${t(label)}<span class="ct">${counts[k] || 0}</span></button>`).join("");
  renderTagSection();
}
// 标签单独成区：可折叠、按频次排序、紧凑小药丸、超高滚动，避免挤占主筛选。
function renderTagSection() {
  if (!el.tagSection) return;
  const tagCount = {};
  for (const s of state.all) {for (const tg of (s.tags || [])) tagCount[tg] = (tagCount[tg] || 0) + 1;}
  const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a] || a.localeCompare(b));
  if (!tags.length) {el.tagSection.hidden = true;el.tagSection.innerHTML = "";return;}
  el.tagSection.hidden = false;
  const collapsed = state.tagsCollapsed;
  const head = `<button class="tag-sec-head" data-tagtoggle>
    <span class="tw-chev ${collapsed ? "" : "open"}">${CHEV}</span>
    <span class="tag-sec-name">${t("标签")}</span><span class="tag-sec-ct">${tags.length}</span></button>`;
  let body = "";
  if (!collapsed) {
    const LIMIT = 24;
    const showAll = state.tagsShowAll || tags.length <= LIMIT;
    const shown = showAll ? tags : tags.slice(0, LIMIT);
    let chips = shown.map((tg) => {
      const key = "tag:" + tg, active = state.cat === key ? " active" : "";
      return `<button class="chip chip-tag${active}" data-cat="${key}">${esc(tg)}<span class="ct">${tagCount[tg]}</span></button>`;
    }).join("");
    if (tags.length > LIMIT) {
      chips += showAll
        ? `<button class="chip chip-tag chip-more" data-tagmore>${t("收起")}</button>`
        : `<button class="chip chip-tag chip-more" data-tagmore>${t("更多 +{n}", { n: tags.length - LIMIT })}</button>`;
    }
    body = `<div class="tag-chips">${chips}</div>`;
  }
  el.tagSection.innerHTML = head + body;
}

/* ---------- main render switch ---------- */
function render() {
  compute();
  if (!state.scanned) {
    el.tree.innerHTML = "";
    el.emptyHero.hidden = false;
    el.tree.appendChild(el.emptyHero);
    return;
  }
  el.emptyHero.hidden = true;
  renderSidebarTree();
}

/* ---------- 左侧平台→层级→skill 可折叠树 ---------- */
const CHEV = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

function renderSidebarTree() {
  const items = state.view;
  if (!items.length) {el.tree.innerHTML = `<div class="tree-empty">${t("没有匹配的 skill")}</div>`;return;}
  const q = state.query.trim();
  // 搜索态：扁平相关性列表（state.view 已按 全匹配>标题命中>描述命中 排序），不分组、不字母重排。
  if (q) {
    el.tree.innerHTML = `<div class="tree-flat">${items.map((s) => treeItem(s, true)).join("")}</div>`;
    return;
  }
  // 浏览态：按 平台 分组（已隐藏用户级/项目级层级，不再二级分组）
  const byPlat = {};
  for (const s of items) {
    const p = s.platform || "claude";
    (byPlat[p] = byPlat[p] || []).push(s);
  }
  // 平台渲染顺序：已发现平台（claude 优先）+ 数据里出现但未列出的兜底。
  const platOrder = platIds().slice();
  for (const p in byPlat) {if (!platOrder.includes(p)) platOrder.push(p);}
  let html = "";
  for (const p of platOrder) {
    const arr = byPlat[p];if (!arr || !arr.length) continue;
    arr.sort((a, b) => a.name.localeCompare(b.name));
    const pkey = "plat:" + p;
    const pOpen = q ? true : !state.treeCollapsed.has(pkey); // 搜索时强制全展开
    html += `<div class="tree-group">
      <button class="tree-head lvl0" data-tk="${pkey}">
        <span class="tw-chev ${pOpen ? "open" : ""}">${CHEV}</span>
        ${platDot(p)}
        <span class="th-name">${platLabel(p)}</span><span class="th-ct">${arr.length}</span></button>`;
    if (pOpen) html += arr.map((s) => treeItem(s)).join("");
    html += `</div>`;
  }
  el.tree.innerHTML = html;
}
function treeItem(s, flat) {
  const active = state.current && state.current.id === s.id ? " active" : "";
  const q = state.query.trim().toLowerCase();
  const flag = s.conflict ?
  `<span class="ti-flag conflict" title="${t("命名冲突")}">${t("冲突")}</span>` :
  s.dup ? `<span class="ti-flag dup" title="${t("重复 {n} 份", { n: s.dupCount })}">×${s.dupCount}</span>` : "";
  const tm = s.mtime ? `<span class="ti-time" title="${esc(t("更新于 {t}", { t: fmtTime(s.mtime) }))}">${esc(relTime(s.mtime))}</span>` : "";
  if (!flat) {
    return `<button class="tree-item${active}" data-id="${s.id}" title="${esc(s.name)}">
      <span class="ti-name">${highlight(s.name, q)}</span>${updCell(s.id)}${flag}${tm}${favCellHtml(s.id)}</button>`;
  }
  // 扁平搜索项：带平台点 + 标签；名字未命中、仅描述命中时附一行高亮描述片段
  const dot = platDot(s.platform || "claude", platLabel(s.platform));
  const tagPills = (s.tags || []).slice(0, 2).map((tg) => `<span class="ti-tag">${esc(tg)}</span>`).join("");
  const descOnly = q && !s.nameLower.includes(q) && s.descLower.includes(q);
  const sub = descOnly ?
  `<span class="ti-sub">${descSnippet(s.description, q)}</span>` :
  "";
  // 搜索结果不展示时间（更新时间在搜索场景下无意义）
  return `<button class="tree-item flat${active}" data-id="${s.id}" title="${esc(s.name)}">
    <span class="ti-line">${dot}<span class="ti-name">${highlight(s.name, q)}</span>${updCell(s.id)}${flag}${tagPills}${favCellHtml(s.id)}</span>${sub}</button>`;
}
// 截取描述中命中关键词附近的一小段并高亮。
function descSnippet(desc, q) {
  const d = desc || "";
  const i = d.toLowerCase().indexOf(q);
  if (i < 0) return esc(d.slice(0, 60));
  const start = Math.max(0, i - 24);
  const seg = (start > 0 ? "…" : "") + d.slice(start, i + q.length + 36) + (i + q.length + 36 < d.length ? "…" : "");
  return highlight(seg, q);
}
function markActiveTreeItem(id) {
  el.tree.querySelectorAll(".tree-item.active").forEach((n) => n.classList.remove("active"));
  const node = el.tree.querySelector(`.tree-item[data-id="${id}"]`);
  if (node) node.classList.add("active");
}

/* ---------- detail sheet ---------- */
let splitPreviewTimer = null;
function ensureEditor() {
  if (state.editor) return;
  state.editor = CodeMirror.fromTextArea(el.ed, {
    mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true,
    // 查找命中（选区）外，其余相同文本也高亮，便于看清所有匹配
    highlightSelectionMatches: { minChars: 2, showToken: false, delay: 80 }
  });
  state.editor.on("change", () => {
    setDirty(state.editor.getValue() !== state.baseline);
    if (state.mode === "split") {clearTimeout(splitPreviewTimer);splitPreviewTimer = setTimeout(() => {renderPreview();markPreview(currentFindQuery());syncFromEditor();}, 140);}
  });
  // 用 scroller 的 DOM scroll 事件（比 CM 的 "scroll" 事件更可靠，任何滚动都触发）；
  // 用 rAF 把一帧内的多次 scroll 合并为一次同步，避免逐事件重算导致卡顿。
  state.editor.getScrollerElement().addEventListener("scroll", () => scheduleSync(syncFromEditor), { passive: true });
  el.preview.addEventListener("scroll", () => scheduleSync(syncFromPreview), { passive: true });
}
// 双屏同步滚动：基于源码行锚点对齐（不是纯百分比），让两侧看到的是同一段内容。
// 用 setTimeout 清 flag（requestAnimationFrame 在无重绘/后台时可能不触发，导致 flag 卡死）。
let scrollSyncing = false;
function endSync() {setTimeout(() => {scrollSyncing = false;}, 70);}
// rAF 节流：一帧内多次 scroll 只跑一次同步。
let syncScheduled = false;
function scheduleSync(fn) {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(() => {syncScheduled = false;fn();});
}
// 预览块锚点缓存 [{line, top}]：仅在内容/布局变化时重建，滚动时不再测量 DOM。
let pvAnchors = null;
function invalidatePvAnchors() {pvAnchors = null;}
function getPvAnchors() {
  if (pvAnchors) return pvAnchors;
  pvAnchors = [];
  for (const b of el.preview.querySelectorAll(".pv-blk[data-line]")) {
    pvAnchors.push({ line: +b.dataset.line, top: b.offsetTop });
  }
  return pvAnchors;
}
// 编辑器顶部可视行 → 预览中对应的 y（在相邻锚点间线性插值）。
function previewYForLine(line) {
  const a = getPvAnchors();
  if (!a.length) {
    const si = state.editor.getScrollInfo();const d = si.height - si.clientHeight;
    const r = d > 0 ? si.top / d : 0;return r * (el.preview.scrollHeight - el.preview.clientHeight);
  }
  let prev = null;
  for (const cur of a) {
    if (cur.line <= line) {prev = cur;continue;}
    if (!prev) return cur.top;
    const ratio = cur.line > prev.line ? (line - prev.line) / (cur.line - prev.line) : 0;
    return prev.top + ratio * (cur.top - prev.top);
  }
  return prev ? prev.top : 0;
}
// 预览滚动位置 y → 编辑器对应的源码行（插值）。
function lineForPreviewY(y) {
  const a = getPvAnchors();
  if (!a.length) return null;
  let prev = null;
  for (const cur of a) {
    if (cur.top <= y) {prev = cur;continue;}
    if (!prev) return cur.line;
    const span = cur.top - prev.top;
    const ratio = span > 0 ? (y - prev.top) / span : 0;
    return prev.line + ratio * (cur.line - prev.line);
  }
  return prev ? prev.line : 0;
}
function syncFromEditor() {
  if (state.mode !== "split" || scrollSyncing || !state.editor) return;
  const cm = state.editor;
  const top = cm.getScrollInfo().top;
  // 分数行：行内插值，避免 lineAtHeight 在行边界处差一行
  const ln = cm.lineAtHeight(top, "local");
  const y0 = cm.heightAtLine(ln, "local"),y1 = cm.heightAtLine(ln + 1, "local");
  const fracLine = ln + (y1 > y0 ? (top - y0) / (y1 - y0) : 0);
  const y = previewYForLine(fracLine);
  if (y == null) return;
  scrollSyncing = true;
  el.preview.scrollTop = y;
  endSync();
}
function syncFromPreview() {
  if (state.mode !== "split" || scrollSyncing || !state.editor) return;
  const line = lineForPreviewY(el.preview.scrollTop);
  if (line == null) return;
  scrollSyncing = true;
  state.editor.scrollTo(null, state.editor.heightAtLine(Math.max(0, Math.floor(line)), "local"));
  endSync();
}
function splitFrontmatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md || "");
  if (!m) return { fm: null, body: md || "" };
  return { fm: m[1], body: (md || "").slice(m[0].length) };
}
const isMd = (p) => /\.md$/i.test(p || "");
// 语言模式按需加载：按文件名匹配 CodeMirror 模式，未知类型回退纯文本。
if (window.CodeMirror) CodeMirror.modeURL = "https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/%N/%N.min.js";
function applyMode(editor, path) {
  if (isMd(path)) {editor.setOption("mode", "markdown");return;}
  const info = window.CodeMirror && CodeMirror.findModeByFileName ? CodeMirror.findModeByFileName(path) : null;
  if (!info) {editor.setOption("mode", "text/plain");return;}
  editor.setOption("mode", info.mime);
  if (info.mode && info.mode !== "null" && CodeMirror.autoLoadMode) CodeMirror.autoLoadMode(editor, info.mode);
}
// 代码高亮：对预览区内所有 <pre><code> 应用 highlight.js。
function highlightPreview() {
  if (!window.hljs) return;
  el.preview.querySelectorAll("pre code").forEach((b) => {try {hljs.highlightElement(b);} catch {/* 未知语言忽略 */}});
}
// 文件扩展名 → highlight.js 语言名（找不到则交给自动检测）。
function hljsLangFromPath(p) {
  const ext = (p || "").split(".").pop().toLowerCase();
  const map = {
    py: "python", js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript", go: "go", rs: "rust", java: "java", kt: "kotlin",
    c: "c", h: "c", cpp: "cpp", cc: "cpp", hpp: "cpp", cs: "csharp", swift: "swift",
    rb: "ruby", php: "php", sh: "bash", bash: "bash", zsh: "bash", ps1: "powershell",
    json: "json", yaml: "yaml", yml: "yaml", toml: "ini", ini: "ini", xml: "xml",
    html: "xml", htm: "xml", css: "css", scss: "scss", less: "less", sql: "sql",
    dockerfile: "dockerfile", makefile: "makefile"
  };
  return map[ext] || "";
}
function renderPreview() {
  const md = state.editor ? state.editor.getValue() : "";
  if (!isMd(state.filePath)) {
    // 代码/纯文本文件：按语言渲染为高亮代码块（替代原始 <pre> 纯文本）。
    const lang = hljsLangFromPath(state.filePath);
    const cls = lang ? ` class="language-${lang}"` : "";
    el.preview.innerHTML = `<pre class="code-file"><code${cls}>${esc(md)}</code></pre>`;
    highlightPreview();
    invalidatePvAnchors();
    return;
  }
  const { fm, body } = splitFrontmatter(md);
  let html = "";
  if (fm) {
    const rows = fm.split(/\r?\n/).filter((l) => l.trim() && /^[A-Za-z0-9_-]+\s*:/.test(l)).
    map((l) => {const i = l.indexOf(":");return `<div class="fm-row"><span class="fm-k">${esc(l.slice(0, i))}</span>${esc(l.slice(i + 1).trim())}</div>`;}).join("");
    if (rows) html += `<div class="fm-card">${rows}</div>`;
  }
  html += renderBodyWithAnchors(md, body || "");
  el.preview.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
  highlightPreview();
  invalidatePvAnchors();
}
// 双屏查找：在预览（渲染后 HTML）中高亮所有匹配文本。
function currentFindQuery() {
  const inp = state.editor && state.editor.getWrapperElement().querySelector(".CodeMirror-dialog input");
  return inp ? inp.value : "";
}
function clearPreviewMarks() {
  const marks = el.preview.querySelectorAll("mark.pv-find");
  if (!marks.length) return;
  marks.forEach((m) => m.parentNode.replaceChild(document.createTextNode(m.textContent), m));
  el.preview.normalize();
  invalidatePvAnchors();
}
function markPreview(q) {
  clearPreviewMarks();
  q = (q || "").trim();
  if (!q || state.mode !== "split") return;
  const ql = q.toLowerCase();
  const walker = document.createTreeWalker(el.preview, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || n.parentNode.nodeName === "MARK") return NodeFilter.FILTER_REJECT;
      return n.nodeValue.toLowerCase().includes(ql) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const targets = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n);
  for (const node of targets) {
    const text = node.nodeValue, low = text.toLowerCase(), frag = document.createDocumentFragment();
    let i = 0, idx;
    while ((idx = low.indexOf(ql, i)) >= 0) {
      if (idx > i) frag.appendChild(document.createTextNode(text.slice(i, idx)));
      const mk = document.createElement("mark");
      mk.className = "pv-find";
      mk.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mk);
      i = idx + q.length;
    }
    if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)));
    node.parentNode.replaceChild(frag, node);
  }
  invalidatePvAnchors();
}
// 逐顶层 markdown 块包一层 data-line（源码起始行，0-based），供双屏按行对齐滚动。
function renderBodyWithAnchors(md, body) {
  if (!window.marked) return esc(body);
  if (marked.lexer && marked.parser) {
    try {
      const tokens = marked.lexer(body);
      const pre = md.slice(0, md.length - body.length);
      let line = (pre.match(/\n/g) || []).length; // body 起始行
      let out = "";
      for (const tok of tokens) {
        const single = [tok];single.links = tokens.links || {};
        out += `<div class="pv-blk" data-line="${line}">${marked.parser(single)}</div>`;
        line += ((tok.raw || "").match(/\n/g) || []).length;
      }
      return out;
    } catch (e) {/* 回退整体渲染 */}
  }
  return marked.parse(body);
}
function setMode(m) {
  if (state.fileBinary) return;
  state.mode = m;
  el.modeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  el.sheetMain.classList.toggle("split", m === "split");
  if (m === "split") {
    ensureEditor();
    const savedW = (() => {try {return localStorage.getItem("sb.splitW");} catch {return null;}})();
    if (savedW) el.sheetMain.style.setProperty("--split-w", savedW);
    el.editorWrap.hidden = false;el.preview.hidden = false;el.splitGutter.hidden = false;
    renderPreview();markPreview(currentFindQuery());
    setTimeout(() => {state.editor.refresh();syncFromEditor();}, 30);
  } else if (m === "edit") {
    el.splitGutter.hidden = true;
    el.preview.hidden = true;el.editorWrap.hidden = false;ensureEditor();
    setTimeout(() => {state.editor.refresh();state.editor.focus();}, 30);
  } else {
    el.splitGutter.hidden = true;
    el.editorWrap.hidden = true;el.preview.hidden = false;renderPreview();
  }
}
// 双屏中缝拖拽：调整左右宽度，存 localStorage 记住。
(function initSplitGutter() {
  let dragging = false;
  el.splitGutter.addEventListener("mousedown", (e) => {
    dragging = true;el.splitGutter.classList.add("dragging");
    document.body.style.cursor = "col-resize";document.body.style.userSelect = "none";e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = el.sheetMain.getBoundingClientRect();
    let w = (e.clientX - rect.left) / rect.width * 100;
    w = Math.max(20, Math.min(80, w));
    el.sheetMain.style.setProperty("--split-w", w.toFixed(2) + "%");
    invalidatePvAnchors();
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;el.splitGutter.classList.remove("dragging");
    document.body.style.cursor = "";document.body.style.userSelect = "";
    try {localStorage.setItem("sb.splitW", el.sheetMain.style.getPropertyValue("--split-w"));} catch {}
    if (state.editor) {state.editor.refresh();syncFromEditor();}
  });
})();
const FILE_SVG = '<svg class="ft-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
const FOLDER_SVG = '<svg class="ft-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>';
const CHEVRON_SVG = '<svg class="ft-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

async function loadFiles(id) {
  state.collapsed = new Set(); // 每次打开 skill 默认全展开
  try {const d = await API.files(id);state.files = d.files || [];}
  catch {state.files = [];}
  renderTree();
}
// 把后端的扁平 {rel,abs,dir} 列表构建成嵌套树
function buildTree() {
  const root = { name: "", children: {} };
  for (const f of state.files) {
    const parts = f.rel.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i],leaf = i === parts.length - 1;
      if (!node.children[name]) node.children[name] = { name, children: {}, dir: true, rel: parts.slice(0, i + 1).join("/"), abs: null };
      node = node.children[name];
      if (leaf) {node.dir = f.dir;node.abs = f.abs;}
    }
  }
  return root;
}
function cmpNode(a, b) {
  if (a.name === "SKILL.md") return -1;
  if (b.name === "SKILL.md") return 1;
  if (a.dir !== b.dir) return a.dir ? -1 : 1;
  return a.name.localeCompare(b.name);
}
function renderNode(node, depth) {
  const kids = Object.values(node.children).sort(cmpNode);
  let html = "";
  for (const k of kids) {
    const pad = 8 + depth * 14;
    const hasChildren = Object.keys(k.children).length > 0;
    const isMainSkill = !k.dir && k.name === "SKILL.md";
    const ops = (k.abs && !isMainSkill)
      ? `<span class="ft-ops"><button class="ft-rename" data-abs="${esc(k.abs)}" title="${t("重命名")}">✎</button><button class="ft-del" data-abs="${esc(k.abs)}" title="${t("删除")}">🗑</button></span>`
      : "";
    if (k.dir) {
      const collapsed = state.collapsed.has(k.rel);
      const chev = hasChildren ? `<span class="ft-chevwrap${collapsed ? "" : " open"}">${CHEVRON_SVG}</span>` : '<span class="ft-chevwrap"></span>';
      html += `<div class="ft-row dir"${hasChildren ? ` data-toggle="${esc(k.rel)}"` : ""} style="padding-left:${pad}px">${chev}${FOLDER_SVG}<span>${esc(k.name)}</span>${ops}</div>`;
      if (hasChildren && !collapsed) html += renderNode(k, depth + 1);
    } else {
      const active = k.abs === state.filePath ? " active" : "";
      html += `<div class="ft-row file${active}" data-abs="${esc(k.abs)}" title="${esc(k.rel)}" style="padding-left:${pad + 14}px">${FILE_SVG}<span>${esc(k.name)}</span>${ops}</div>`;
    }
  }
  return html;
}
function renderTree() {
  el.fileTree.innerHTML = fileTreeHeadHtml() + (renderNode(buildTree(), 0) || `<div class="ft-row dir" style="padding-left:8px">${t("（空目录）")}</div>`);
}
async function fileOpNew(isDir) {
  if (!state.current) return;
  const name = prompt(isDir ? t("新建文件夹名称") : t("新建文件名称"));
  if (!name) return;
  const r = await (isDir ? API.newDir(state.current.dir, name) : API.newFile(state.current.dir, name));
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已创建")); await loadFiles(state.current.id); }
  else { toast(d.error || t("创建失败"), "err"); }
}
async function fileOpRename(abs) {
  const cur = abs.split("/").pop();
  const name = prompt(t("重命名为"), cur);
  if (!name || name === cur) return;
  const r = await API.renameEntry(abs, name);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已重命名")); if (state.current) await loadFiles(state.current.id); }
  else { toast(d.error || t("重命名失败"), "err"); }
}
async function fileOpDelete(abs) {
  if (!confirm(t("将「{n}」移到废纸篓（可在访达恢复）。确定？", { n: abs.split("/").pop() }))) return;
  const r = await API.deleteEntry(abs);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已移到废纸篓")); if (state.current) await loadFiles(state.current.id); }
  else { toast(d.error || t("删除失败"), "err"); }
}
async function openFile(abs, mode) {
  if (state.dirty && state.filePath && state.filePath !== abs &&
  !confirm(t("当前文件有未保存修改，切换将丢失。确定切换？"))) return;
  let f;
  try {f = await API.readFile(abs);} catch {toast(t("读取文件失败"), "err");return;}
  if (f.error) {toast(t("读取失败：{e}", { e: f.error }), "err");return;}
  state.filePath = f.abs || abs;state.fileBinary = !!f.binary;
  renderTree();
  const segBtns = el.modeSeg.querySelectorAll(".seg-btn");
  if (f.binary) {el.binaryNote.hidden = false;el.preview.hidden = true;el.editorWrap.hidden = true;segBtns.forEach((b) => b.disabled = true);return;}
  el.binaryNote.hidden = true;segBtns.forEach((b) => b.disabled = false);
  ensureEditor();
  state.baseline = f.content || "";
  state.editor.setValue(f.content || "");
  applyMode(state.editor, abs);
  setDirty(false);
  setMode(mode || state.mode || "view");
}
async function openDetail(id, fromSearch) {
  const s = await API.get(id);
  if (!s || s.error) {toast(t("无法打开该 skill"), "err");return;}
  state.current = s;
  updateFavBtn();
  el.sheetName.textContent = s.name;
  const flag = flagBadge({ conflict: state.conflicts.has(s.name), dup: state.dups.has(s.name), dupCount: state.dupCounts[s.name] || 0 });
  el.sheetBadges.innerHTML = `${platformBadge(s)}${flag}`;
  renderSheetTags(s.id);
  el.sheetPath.textContent = s.file_path + (s.mtime ? `   ·   ${t("更新于 {t}", { t: fmtTime(s.mtime) })}` : "");
  setDirty(false);
  el.detailEmpty.hidden = true;el.sheet.hidden = false;el.sheet.setAttribute("aria-hidden", "false");
  markActiveTreeItem(id);
  ensureEditor();
  await loadFiles(id);
  await openFile(s.file_path, "view");
  loadSource(id);
  const recents = LS.recents().filter((r) => r.id !== id);
  recents.unshift({ id, name: s.name, description: s.description });
  LS.setRecents(recents);
  if (fromSearch && state.query.trim()) pushHistory(state.query.trim());
}
function closeSheet() {
  el.sheet.hidden = true;el.sheet.setAttribute("aria-hidden", "true");
  el.detailEmpty.hidden = false;
  state.current = null;
  el.tree.querySelectorAll(".tree-item.active").forEach((n) => n.classList.remove("active"));
}
async function doDelete() {
  const s = state.current;
  if (!s) return;
  if (!s.dir) {toast(t("无法定位 skill 目录"), "err");return;}
  if (!confirm(t("将「{name}」移到废纸篓（可在访达恢复）。确定？", { name: s.name }))) return;
  el.deleteSkill.disabled = true;
  try {
    const res = await API.trash([s.dir]);
    if (res.status === 501) {toast(t("仅 macOS 支持移到废纸篓"), "err");return;}
    const d = await res.json();
    if ((d.trashed || []).length) {
      toast(t("已移到废纸篓「{name}」", { name: s.name }));
      closeSheet();
      await loadAll();
      render();
    } else {
      toast(t("删除失败"), "err");
    }
  } catch {toast(t("操作失败"), "err");} finally
  {el.deleteSkill.disabled = false;}
}
async function doSave() {
  if (!state.current || state.fileBinary || !state.filePath) return;
  const curId = state.current && state.current.id,curName = state.current && state.current.name;
  el.save.disabled = true;
  try {
    const res = await API.putFile(state.filePath, state.editor.getValue());
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      state.baseline = state.editor.getValue();setDirty(false);toast(t("已保存"));
      if (d.reindexed) {
        await loadAll();
        await maybeSyncDuplicates(curId, curName);
      }
    } else toast(t("保存失败"), "err");
  } catch {toast(t("保存失败"), "err");} finally
  {el.save.disabled = false;}
}
// 编辑后，若其它组件（平台/级别）存在同名且内容已不一致的副本，提示一键同步。
async function maybeSyncDuplicates(fromId, name) {
  // 仅当该名字处于“内容有差异的同名组”时提示——全部一致就没必要打扰。
  if (!state.conflicts.has(name)) return;
  const sibs = state.all.filter((s) => s.name === name && s.id !== fromId);
  if (!sibs.length) return;
  const labelOf = (s) => `${platLabel(s.platform) || "?"} · ${t(CAT_LABEL[s.source] || s.source)}`;
  const list = sibs.map((s) => "• " + labelOf(s)).join("\n");
  const msg = t("检测到 {n} 个同名 Skill「{name}」，内容与当前不一致：", { n: sibs.length, name }) +
    "\n" + list + "\n\n" + t("是否把它们同步为当前内容？（被覆盖的 SKILL.md 会存 .bak，可恢复）");
  if (!confirm(msg)) return;
  try {
    const r = await API.sync(fromId, sibs.map((s) => s.id));
    const d = await r.json().catch(() => ({}));
    if (r.ok) {toast(t("已同步 {n} 个副本", { n: d.synced || 0 }));await loadAll();} else
    toast(d.error || t("同步失败"), "err");
  } catch {toast(t("同步失败"), "err");}
}
/* ---------- 标签 ---------- */
// tagsOf 从列表数据里取某 skill 的标签（详情接口不含 tags）。
function tagsOf(id) {
  const item = state.all.find((s) => s.id === id);
  return (item && item.tags) || [];
}
function renderSheetTags(id) {
  if (!el.sheetTags) return;
  const tags = tagsOf(id);
  el.sheetTags.innerHTML = tags.map((tg) => `<span class="tag-pill">${esc(tg)}</span>`).join("");
}
async function editTags() {
  if (!state.current) return;
  const id = state.current.id;
  const cur = tagsOf(id).join(", ");
  const input = prompt(t("编辑标签（用逗号分隔，最多 8 个）："), cur);
  if (input === null) return; // 取消
  const tags = input.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  try {
    const r = await API.setTags(id, tags);
    if (!r.ok) {toast(t("保存失败"), "err");return;}
    toast(t("标签已更新"));
    await loadAll();
    renderSheetTags(id);
  } catch {toast(t("保存失败"), "err");}
}

/* ---------- AI 自动分类（打标签）---------- */
function showClsBar(done, total) {
  if (!el.clsBar) return;
  el.clsBar.hidden = false;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  el.clsBarFill.style.width = pct + "%";
  el.clsBarText.textContent = t("正在自动打标签… {done}/{total}", { done, total });
}
function hideClsBar() {if (el.clsBar) el.clsBar.hidden = true;}
// startClassify 触发分类并轮询进度；silent=true 时 AI 未配置不弹错。
async function startClassify(force, silent) {
  try {
    const r = await API.classify(force);
    if (r.status === 501) {if (!silent) toast(t("请先在设置里配置 AI（用于自动打标签）"), "err");return;}
    const d = await r.json().catch(() => ({}));
    if (!d.running && !d.total) {if (!silent) toast(t("没有需要分类的 skill"));return;}
    if (d.total) showClsBar(d.done || 0, d.total);
    pollClassify();
  } catch {/* ignore */}
}
let clsPollTimer = null;
function pollClassify() {
  if (clsPollTimer) clearTimeout(clsPollTimer);
  clsPollTimer = setTimeout(async () => {
    try {
      const st = await API.classifyStatus();
      if (st.running) {showClsBar(st.done || 0, st.total || 0);pollClassify();}
      else {showClsBar(st.total || 0, st.total || 0);setTimeout(hideClsBar, 1200);await loadAll();}
    } catch {hideClsBar();}
  }, 1000);
}
async function doReveal() {
  const path = state.filePath || state.current && state.current.file_path;
  if (!path) return;
  const res = await API.reveal(path);
  if (res.ok) toast(t("已在 Finder 中打开"));else
  if (res.status === 501) toast(t("当前系统不支持 Finder 打开"), "err");else
  toast(t("打开失败"), "err");
}
function toggleFull() {
  el.workbench.classList.toggle("sidebar-collapsed");
  if (state.editor) setTimeout(() => state.editor.refresh(), 210);
}

/* ---------- 阅读字体 / 字号 ---------- */
const READER_MIN = 12,READER_MAX = 26;
const READER_FONTS = { sans: "var(--font)", serif: 'Georgia,"Songti SC","STSong",serif', mono: "var(--mono)" };
function loadReaderPrefs() {
  try {
    const s = parseInt(localStorage.getItem("sb.readerSize"), 10);
    if (s >= READER_MIN && s <= READER_MAX) state.readerSize = s;
    const f = localStorage.getItem("sb.readerFont");
    if (READER_FONTS[f]) state.readerFont = f;
  } catch {/* ignore */}
}
function applyReader() {
  el.sheet.style.setProperty("--reader-size", state.readerSize + "px");
  el.sheet.style.setProperty("--reader-font", READER_FONTS[state.readerFont]);
  el.fsVal.textContent = state.readerSize;
  el.fontPop.querySelectorAll("[data-ff]").forEach((b) => b.classList.toggle("active", b.dataset.ff === state.readerFont));
  try {localStorage.setItem("sb.readerSize", state.readerSize);localStorage.setItem("sb.readerFont", state.readerFont);} catch {/* ignore */}
  invalidatePvAnchors();
  if (state.editor) state.editor.refresh();
}

/* ---------- source link ---------- */
const KIND_LABEL = { github_repo: "GitHub 仓库", github_file: "GitHub 文件", local_path: "本地目录", manual: "手动", unknown: "未知" };
const SYNC_LABEL = { none: "不同步", check_only: "仅检查更新", manual_update: "手动更新" };
function srcLink(url) {
  if (/^https?:\/\//i.test(url || "")) return `<a class="src-url" href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;
  return `<span class="src-url" style="color:var(--text-dim)">${esc(url || "")}</span>`;
}
const LINK_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
async function loadSource(id) {
  try {state.source = await API.getSource(id);} catch {state.source = null;}
  renderSourceChip();
}
// setDirty 统一控制"有改动"状态：仅用「保存」按钮的显隐表达，
// 未改动时隐藏保存按钮（有变动才显示），不再额外显示脏标记圆点。
function setDirty(dirty) {
  state.dirty = !!dirty;
  el.save.hidden = !dirty;
}
function renderSourceChip() {
  const s = state.source;
  const unset = !s || !s.source_url && !s.inferred;
  el.sourceChip.classList.toggle("unset", unset);
  if (unset) {el.sourceChip.innerHTML = `<span class="src-mut">${t("未设置来源")}</span>`;return;}
  // github 来源用 GitHub 图标，更直观；其余用通用链接图标。
  const isGh = (s.source_kind || "").startsWith("github") || /(^|\/\/)github\.com\//.test(s.source_url || "");
  const ico = isGh ? GITHUB_SVG : LINK_SVG;
  if (s.inferred && s.source_url) {el.sourceChip.innerHTML = `${ico}<span>${t("检测到来源")}</span>`;return;}
  let label = (s.source_url || "").replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  if (label.length > 30) label = label.slice(0, 30) + "…";
  el.sourceChip.innerHTML = `${ico}<span>${esc(label)}</span>`;
}
async function openSourceModal() {
  const s = state.source || {};
  const persisted = s.source_url && !s.inferred;
  const isGithub = s.source_kind === "github_repo";
  const hasToken = !!s.has_token;
  const kindOpts = ["github_repo", "github_file", "local_path", "manual", "unknown"].map((k) => `<option value="${k}" ${s.source_kind === k ? "selected" : ""}>${t(KIND_LABEL[k])}</option>`).join("");
  // 更新目标：默认取已存 targets，否则用该 skill 当前所在平台
  const tset = new Set((s.targets || (state.current && state.current.platform) || "claude").split(",").map((x) => x.trim()).filter(Boolean));
  // 更新目标多选：按发现的平台动态生成（claude 显示为 Claude Code）。
  const targetIds = platIds().length ? platIds() : ["claude", "codex"];
  const targetBoxes = targetIds.map((pid) => {
    const lbl = pid === "claude" ? "Claude Code" : platLabel(pid);
    return `<label><input type="checkbox" class="src-target" value="${esc(pid)}" ${tset.has(pid) ? "checked" : ""}/> ${esc(lbl)}</label>`;
  }).join("");
  el.sourceModalBody.innerHTML = `
    ${s.inferred && s.source_url ? `<div class="modal-note">${t("检测到 Git 来源：{url} —— 确认后点保存即采用。", { url: srcLink(s.source_url) })}</div>` : ""}
    ${persisted && isGithub && s.has_update ? `<div class="modal-note src-update-note">${t("检测到上游有更新，点「检查更新」查看并应用。")}</div>` : ""}
    <div class="src-form" style="width:100%">
      <label class="field"><span>${t("来源链接")}</span><input class="src-in" id="srcUrl" placeholder="https://github.com/owner/repo" value="${esc(s.source_url || "")}" /></label>
      <div class="src-row">
        <select class="src-in" id="srcKind">${kindOpts}</select>
        <input class="src-in" id="srcRef" placeholder="${t("分支/tag/commit")}" value="${esc(s.source_ref || "")}" />
      </div>
      <input class="src-in" id="srcSubpath" placeholder="${t("仓库内子路径（SKILL.md 所在目录，如 cr；根目录留空）")}" value="${esc(s.source_subpath || "")}" />
      <input class="src-in" id="srcNote" placeholder="${t("备注（可选）")}" value="${esc(s.source_note || "")}" />
      <label class="src-check-line"><input type="checkbox" id="srcAuto" ${s.auto_check ? "checked" : ""}/> <span>${t("自动检测更新")}</span></label>
      <div class="src-targets"><span class="src-mut">${t("更新目标")}</span>
        ${targetBoxes}
      </div>
      ${isGithub ? `<div class="src-token-line">
        <span class="src-mut">${t("私有仓库访问令牌")} <i id="srcTokenHint2">${hasToken ? t("（已配置，可留空）") : t("（未配置）")}</i></span>
        <input class="src-in" id="srcToken" type="password" placeholder="${t("私有仓库填；留空不修改")}" />
      </div>` : ""}
    </div>
    <div class="src-row" style="margin-top:14px">
      <button class="src-btn primary" data-act="src-save">${t("保存")}</button>
      ${persisted ? `<button class="src-btn" data-act="src-copy">${t("复制链接")}</button>` : ""}
      ${persisted && isGithub ? `<button class="src-btn" data-act="src-check">${t("检查更新")}</button>` : ""}
      ${persisted ? `<button class="src-btn danger" data-act="src-clear">${t("清除来源")}</button>` : ""}
    </div>`;
  openModal(el.sourceModal);
}
// 读取来源弹窗里勾选的更新目标平台（动态多选）
function readSourceTargets() {
  return Array.from(document.querySelectorAll(".src-target:checked")).map((c) => c.value);
}
async function saveSource(id, payload) {
  try {
    const r = await API.putSource(id, payload);
    if (!r.ok) {toast(t("保存失败"), "err");return;}
    await loadSource(id);
    try {const sd = await API.sources();state.linkedSources = new Set(sd.linked || []);state.updates = new Set(sd.updates || []);renderChips();} catch {/* ignore */}
    closeModal();
    toast(payload.source_url ? t("已保存来源") : t("已清除来源"));
  } catch {toast(t("保存失败"), "err");}
}
// 仅在编辑器可见（编辑 / 双屏）时用 CodeMirror 查找，且不改变当前模式；
// 浏览模式不接管，交给浏览器原生查找（作用于渲染后的预览文本）。
function doFind() {
  if ((state.mode === "edit" || state.mode === "split") && state.editor) {
    state.editor.execCommand("findPersistent");
    // 唤起后把焦点放到查找输入框（并选中已有内容，便于直接改写关键词）
    setTimeout(() => {
      const inp = state.editor.getWrapperElement().querySelector(".CodeMirror-dialog input");
      if (inp) {
        inp.focus();inp.select();
        markPreview(inp.value);
        inp.addEventListener("input", () => markPreview(inp.value));
        inp.addEventListener("keydown", (e) => {if (e.key === "Escape") clearPreviewMarks();});
      }
    }, 0);
    return true;
  }
  return false;
}

/* ---------- AI optimize + diff ---------- */
async function probeAI() {
  try {const c = await API.config();state.aiConfigured = !!c.hasKey;}
  catch {state.aiConfigured = false;}
  el.aiOptimize.title = state.aiConfigured ? t("用 AI 优化这份 skill") : t("未配置 AI —— 点此前往设置填 API key 与模型");
  el.aiOptimize.classList.toggle("unconfigured", !state.aiConfigured);
}
let optSuggestions = [];
const SEV_LABEL = { high: "高", medium: "中", low: "低" };
async function doOptimize() {
  if (!state.current) return;
  if (!state.aiConfigured) {toast(t("请先在设置里配置 API key 和模型"), "err");openModal(el.settingsModal);await fillSettings();return;}
  if (!isMd(state.filePath)) {toast(t("AI 优化仅支持 markdown 文件"), "err");return;}
  el.aiOptimize.disabled = true;el.aiOptimize.classList.add("loading");
  toast(t("AI 按维度体检中…"));
  try {
    const res = await API.optimize(state.editor.getValue());
    if (res.status === 501) {toast(t("请先在设置里配置 AI"), "err");openModal(el.settingsModal);await fillSettings();return;}
    if (!res.ok) {const d = await res.json().catch(() => ({}));toast(d.error || t("AI 优化失败"), "err");return;}
    const d = await res.json();
    optSuggestions = (d.suggestions || []).map((s, i) => ({ ...s, accepted: s.severity === "high", idx: i }));
    renderSuggestions();
    openModal(el.optimizeModal);
  } catch {toast(t("AI 优化失败"), "err");} finally
  {el.aiOptimize.disabled = false;el.aiOptimize.classList.remove("loading");}
}
function renderSuggestions() {
  const n = optSuggestions.length;
  el.optSub.textContent = n ? t("{n} 条建议 · 依据优化规则逐维度体检，逐条勾选采纳", { n }) : t("没有发现可优化点 —— 这份 skill 已经不错。");
  el.optBody.innerHTML = optSuggestions.map((s) =>
  `<div class="sug-card ${s.accepted ? "on" : ""}" data-idx="${s.idx}">
      <div class="sug-head">
        <label class="sug-check"><input type="checkbox" ${s.accepted ? "checked" : ""}/><span>${t("采纳")}</span></label>
        <span class="sug-dim">${esc(s.dimension || "")}</span>
        <span class="sev sev-${s.severity}">${t(SEV_LABEL[s.severity] || s.severity)}</span>
      </div>
      <div class="sug-reason">${esc(s.reason || "")}</div>
      <pre class="sug-before">${esc(s.original || "")}</pre>
      <pre class="sug-after">${esc(s.suggested || "")}</pre>
    </div>`).join("") || `<div class="no-results">${t("没有发现可优化点。")}</div>`;
  updateOptSel();
}
function updateOptSel() {
  const a = optSuggestions.filter((s) => s.accepted).length;
  el.optSel.textContent = a ? t("已采纳 {a}/{total}", { a, total: optSuggestions.length }) : "";
  el.optApply.disabled = a === 0;
}
function applyOptimize() {
  let content = state.editor.getValue(),miss = 0;
  for (const s of optSuggestions) {
    if (!s.accepted) continue;
    if (s.original && content.includes(s.original)) content = content.replace(s.original, s.suggested || "");else
    miss++;
  }
  state.editor.setValue(content);setMode("edit");setDirty(state.editor.getValue() !== state.baseline);
  closeModal();toast(miss ? t("已应用采纳项，{n} 处未能定位，记得保存", { n: miss }) : t("已应用采纳项，记得保存"));
}
/* ---------- optimizer rule editor ---------- */
let optimizerEditor = null;
async function openOptimizer() {
  let content = "";
  try {content = (await API.getOptimizer()).content || "";} catch {toast(t("载入规则失败"), "err");return;}
  openModal(el.optimizerModal);
  if (!optimizerEditor) optimizerEditor = CodeMirror.fromTextArea(el.optimizerEd, { mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true });
  optimizerEditor.setValue(content);
  setTimeout(() => optimizerEditor.refresh(), 50);
}
async function saveOptimizer() {
  try {const r = await API.putOptimizer(optimizerEditor.getValue());if (r.ok) {toast(t("已保存优化规则"));closeModal();} else toast(t("保存失败"), "err");}
  catch {toast(t("保存失败"), "err");}
}
/* ---------- 扫描目录配置 ---------- */
// 编辑态：auto=[{path,short,label,enabled}], extra=[{path,short,name,enabled}]
let scanDirsState = { auto: [], extra: [] };
async function openScanDirs() {
  try {const d = await API.getScanDirs();scanDirsState = { auto: d.auto || [], extra: d.extra || [] };}
  catch {toast(t("读取失败"), "err");return;}
  renderScanDirs();
  openModal(el.scanDirsModal);
  dbLoad(dbState.path || ""); // 左栏浏览器常驻，打开即加载
}
function renderScanDirs() {
  const row = (d, isExtra, idx) => {
    const nameCell = isExtra
      ? `<input class="src-in sd-name" data-idx="${idx}" value="${esc(d.name || "")}" placeholder="${t("项目名")}" style="max-width:130px" />`
      : `<span class="sd-label">${esc(d.label || "")}</span>`;
    const rm = isExtra ? `<button class="icon-btn icon-btn-danger sd-rm" data-idx="${idx}" title="${t("移除")}">✕</button>` : "";
    return `<label class="sd-row">
      <input type="checkbox" class="sd-chk" data-kind="${isExtra ? "extra" : "auto"}" data-idx="${idx}" ${d.enabled ? "checked" : ""}/>
      ${nameCell}
      <span class="sd-path" title="${esc(d.path)}">${esc(d.short || d.path)}</span>
      ${rm}
    </label>`;
  };
  let html = `<div class="sd-group-title">${t("默认目录")}</div>`;
  html += scanDirsState.auto.map((d, i) => row(d, false, i)).join("") || `<div class="src-mut">${t("（无）")}</div>`;
  html += `<div class="sd-group-title">${t("项目目录")}</div>`;
  html += scanDirsState.extra.map((d, i) => row(d, true, i)).join("") || `<div class="src-mut">${t("（暂无，下方添加）")}</div>`;
  el.scanDirsBody.innerHTML = html;
}
// 把当前弹窗里的勾选/命名同步回 scanDirsState
function syncScanDirsFromDom() {
  el.scanDirsBody.querySelectorAll(".sd-chk").forEach((c) => {
    const i = +c.dataset.idx;const arr = c.dataset.kind === "extra" ? scanDirsState.extra : scanDirsState.auto;
    if (arr[i]) arr[i].enabled = c.checked;
  });
  el.scanDirsBody.querySelectorAll(".sd-name").forEach((n) => {const i = +n.dataset.idx;if (scanDirsState.extra[i]) scanDirsState.extra[i].name = n.value;});
}
/* 文件夹浏览器（服务端目录浏览，支持批量勾选） */
let dbState = { path: "", parent: "", dirs: [], selected: new Set() };
async function dbLoad(path) {
  try {
    const d = await API.browse(path);
    dbState.path = d.path;dbState.parent = d.parent || "";dbState.dirs = d.dirs || [];
    renderDirBrowser();
  } catch {toast(t("无法读取目录"), "err");}
}
function renderDirBrowser() {
  if (!document.getElementById("dbList")) return;
  const pin = document.getElementById("dbPathInput");if (pin) pin.value = dbState.path;
  document.getElementById("dbList").innerHTML = dbState.dirs.map((d) =>
    `<div class="db-item">
       <input type="checkbox" class="db-chk" data-path="${esc(d.path)}" ${dbState.selected.has(d.path) ? "checked" : ""}/>
       <button class="db-enter" data-path="${esc(d.path)}" title="${t("进入")}">📁 ${esc(d.name)}</button>
     </div>`).join("") || `<div class="src-mut" style="padding:8px">${t("（无子目录）")}</div>`;
  document.getElementById("dbSel").textContent = t("已选 {n}", { n: dbState.selected.size });
}
// baseName 取路径的文件夹名（去尾部斜杠）。
const baseName = (p) => (p || "").replace(/\/+$/, "").split("/").pop() || p;
function dbAddSelected() {
  if (!dbState.selected.size) {toast(t("未选择目录"), "err");return;}
  const existing = new Set(scanDirsState.extra.map((e) => e.path));
  dbState.selected.forEach((p) => {if (!existing.has(p)) scanDirsState.extra.push({ path: p, name: baseName(p), enabled: true, short: p });});
  dbState.selected.clear();
  toast(t("已添加，记得保存"));
  renderScanDirs();renderDirBrowser();
}

// setupDirAutocomplete 给路径输入框接上"子目录前缀联想"（原生 datalist）+ 回车/选中跳转。
function setupDirAutocomplete() {
  const pin = document.getElementById("dbPathInput");
  const dl = document.getElementById("dbPathOptions");
  if (!pin || !dl) return;
  let acParent = null,acDirs = new Set(),timer = null;
  async function refresh(v) {
    // 取最后一个 / 之前作为父目录，列出其子目录作为候选
    const slash = v.lastIndexOf("/");
    if (slash < 0) return;
    const parent = v.slice(0, slash + 1);
    if (parent === acParent) return; // 父目录没变，沿用候选
    acParent = parent;
    try {
      const d = await API.browse(parent);
      acDirs = new Set((d.dirs || []).map((x) => x.path));
      dl.innerHTML = (d.dirs || []).map((x) => `<option value="${esc(x.path)}"></option>`).join("");
    } catch {acDirs = new Set();dl.innerHTML = "";}
  }
  pin.addEventListener("input", () => {
    const v = pin.value.trim();
    // 选中候选项（值正好是某个已知目录）→ 直接跳转
    if (acDirs.has(v)) {dbLoad(v);return;}
    clearTimeout(timer);timer = setTimeout(() => refresh(v), 150);
  });
  pin.addEventListener("keydown", (e) => {if (e.key === "Enter") {e.preventDefault();const v = pin.value.trim();if (v) dbLoad(v);}});
}

async function saveScanDirs() {
  syncScanDirsFromDom();
  const disabled = [];
  scanDirsState.auto.forEach((d) => {if (!d.enabled) disabled.push(d.path);});
  scanDirsState.extra.forEach((d) => {if (!d.enabled) disabled.push(d.path);});
  const extra = scanDirsState.extra.map((d) => ({ path: d.path, name: (d.name || "").trim() }));
  try {
    const r = await API.putScanDirs({ disabled, extra });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {toast(d.error || t("保存失败"), "err");return;}
    closeModal();toast(t("已保存，点「扫描」生效"));
  } catch {toast(t("保存失败"), "err");}
}

let classifierEditor = null;
async function openClassifier() {
  let content = "";
  try {content = (await API.getClassifier()).content || "";} catch {toast(t("载入规则失败"), "err");return;}
  openModal(el.classifierModal);
  if (!classifierEditor) classifierEditor = CodeMirror.fromTextArea(el.classifierEd, { mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true });
  classifierEditor.setValue(content);
  setTimeout(() => classifierEditor.refresh(), 50);
}
async function saveClassifier() {
  try {const r = await API.putClassifier(classifierEditor.getValue());if (r.ok) {toast(t("已保存分类规则"));closeModal();} else toast(t("保存失败"), "err");}
  catch {toast(t("保存失败"), "err");}
}

/* ---------- S3 备份与恢复 ---------- */
function fmtTime(unix) {
  if (!unix) return t("尚未备份");
  try {
    const d = new Date(unix * 1000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch {return "—";}
}
// 记录后端是否已存有 Secret：用于「自动保存」时判断 Secret 是否为必填
// （已存在时表单留空表示沿用原值，不算缺失）。
let backupHasSecret = false;
// 历史备份分页状态：全部归档缓存在 backupArchives，按 BK_PAGE_SIZE 分页。
let backupArchives = [];
let backupPage = 0;
const BK_PAGE_SIZE = 10;

// focusBackupField 聚焦左栏指定的配置输入框（用于缺项提示后定位）。
function focusBackupField(label) {
  const map = { "Endpoint": el.bkEndpoint, "Bucket": el.bkBucket, "Access Key": el.bkAccessKey, "Secret Key": el.bkSecretKey };
  const node = map[label];
  if (node) node.focus();
}

async function openBackup() {
  openModal(el.backupModal);
  el.bkStatus.textContent = ""; el.bkSecretKey.value = "";
  try {
    const [cfg, st] = await Promise.all([API.backupConfig(), API.backupStatus()]);
    el.bkEndpoint.value = cfg.endpoint || "";
    el.bkRegion.value = cfg.region || "";
    el.bkBucket.value = cfg.bucket || "";
    el.bkPrefix.value = cfg.prefix || "skillbook/";
    el.bkKeep.value = cfg.keepCount || 20;
    el.bkAccessKey.value = cfg.accessKey || "";
    el.bkUseSSL.checked = cfg.useSSL !== false;
    backupHasSecret = !!cfg.hasSecret;
    el.bkSecretHint.textContent = cfg.hasSecret ? t("已保存（留空不改）") : t("必填");
    el.backupStatus.textContent = st.configured ?
      t("上次备份：{t} · 共 {n} 份", { t: st.lastBackup ? fmtTime(st.lastBackup) : "—", n: st.count || 0 }) :
      t("尚未配置备份（在左侧 S3 配置中填写）");
    await loadBackupList(st.configured);
  } catch { el.backupStatus.textContent = t("载入备份配置失败"); }
}

async function loadBackupList(configured) {
  el.bkPager.hidden = true;
  if (!configured) { backupArchives = []; el.bkList.innerHTML = `<div class="bk-empty">${t("配置后可在此查看历史备份")}</div>`; return; }
  el.bkList.innerHTML = `<div class="bk-empty">${t("加载中…")}</div>`;
  try {
    const d = await API.backupList();
    backupArchives = d.archives || [];
    backupPage = 0;
    renderBackupPage();
  } catch { backupArchives = []; el.bkList.innerHTML = `<div class="bk-empty">${t("获取备份列表失败")}</div>`; }
}

// renderBackupPage 渲染当前页的历史备份，并在超过一页时显示分页控件。
function renderBackupPage() {
  const arr = backupArchives;
  if (!arr.length) { el.bkList.innerHTML = `<div class="bk-empty">${t("还没有备份，点击「立即备份」")}</div>`; el.bkPager.hidden = true; return; }
  const pages = Math.ceil(arr.length / BK_PAGE_SIZE);
  backupPage = Math.min(Math.max(backupPage, 0), pages - 1);
  const start = backupPage * BK_PAGE_SIZE;
  const slice = arr.slice(start, start + BK_PAGE_SIZE);
  el.bkList.innerHTML = slice.map((a) => `
      <div class="bk-item">
        <div class="bk-item-main">
          <span class="bk-item-time">${a.time ? fmtTime(a.time) : esc(a.name)}</span>
          <span class="bk-item-meta">${fmtSize(a.size)}${a.fileCount >= 0 ? " · " + t("{n} 个文件", { n: a.fileCount }) : ""}</span>
        </div>
        <button class="btn btn-ghost btn-sm bk-restore" data-name="${esc(a.name)}">${t("恢复")}</button>
      </div>`).join("");
  el.bkList.querySelectorAll(".bk-restore").forEach((b) =>
    b.addEventListener("click", () => doBackupRestore(b.dataset.name, b)));
  if (pages > 1) {
    el.bkPager.hidden = false;
    el.bkPager.innerHTML = `
      <button class="btn btn-ghost btn-sm" id="bkPrev" ${backupPage === 0 ? "disabled" : ""}>${t("上一页")}</button>
      <span class="bk-page-info">${t("第 {c}/{n} 页", { c: backupPage + 1, n: pages })}</span>
      <button class="btn btn-ghost btn-sm" id="bkNext" ${backupPage >= pages - 1 ? "disabled" : ""}>${t("下一页")}</button>`;
    el.bkPager.querySelector("#bkPrev").addEventListener("click", () => { if (backupPage > 0) { backupPage--; renderBackupPage(); } });
    el.bkPager.querySelector("#bkNext").addEventListener("click", () => { if (backupPage < pages - 1) { backupPage++; renderBackupPage(); } });
  } else {
    el.bkPager.hidden = true;
    el.bkPager.innerHTML = "";
  }
}

function fmtSize(n) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

function collectBackupCfg() {
  return {
    endpoint: el.bkEndpoint.value.trim(),
    region: el.bkRegion.value.trim(),
    bucket: el.bkBucket.value.trim(),
    prefix: el.bkPrefix.value.trim(),
    accessKey: el.bkAccessKey.value.trim(),
    secretKey: el.bkSecretKey.value,
    useSSL: el.bkUseSSL.checked,
    keepCount: parseInt(el.bkKeep.value, 10) || 20,
  };
}

// ensureBackupSaved 校验必填项并把当前表单保存到后端。
// 缺失项会给出明确提示并展开配置面板；保存成功返回 true。
// Secret 仅在「后端尚无、表单也为空」时算缺失（已存在时留空表示沿用原值）。
async function ensureBackupSaved() {
  const cfg = collectBackupCfg();
  const missing = [];
  if (!cfg.endpoint) missing.push("Endpoint");
  if (!cfg.bucket) missing.push("Bucket");
  if (!cfg.accessKey) missing.push("Access Key");
  if (!cfg.secretKey && !backupHasSecret) missing.push("Secret Key");
  if (missing.length) { toast(t("请先填写：{f}", { f: missing.join("、") }), "err"); focusBackupField(missing[0]); return false; }
  el.bkStatus.textContent = t("保存中…");
  try {
    const r = await API.putBackupConfig(cfg);
    const d = await r.json().catch(() => ({}));
    el.bkStatus.textContent = "";
    if (!r.ok) { toast(d.error || t("保存失败"), "err"); return false; }
    el.bkSecretKey.value = ""; backupHasSecret = true;
    return true;
  } catch { el.bkStatus.textContent = ""; toast(t("保存失败"), "err"); return false; }
}

async function saveBackupConfig() {
  if (await ensureBackupSaved()) { toast(t("已保存备份配置")); await openBackup(); }
}

async function testBackupConn() {
  if (!(await ensureBackupSaved())) return; // 先保存当前表单，再用已存配置测试
  el.bkTest.classList.add("loading"); el.bkTest.disabled = true; el.bkStatus.textContent = t("测试中…");
  try {
    const r = await API.backupTest();
    const d = await r.json().catch(() => ({}));
    toast(r.ok ? t("连接成功 ✓") : (d.error || t("连接失败")), r.ok ? "ok" : "err");
  } catch { toast(t("连接失败"), "err"); }
  finally { el.bkTest.classList.remove("loading"); el.bkTest.disabled = false; el.bkStatus.textContent = ""; }
}

async function doBackupPush() {
  if (!(await ensureBackupSaved())) return; // 先保存当前表单，避免「填了没保存」直接备份失败
  el.bkPush.classList.add("loading"); el.bkPush.disabled = true; el.bkStatus.textContent = t("备份中…");
  try {
    const r = await API.backupPush();
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast(t("备份完成 ✓")); await openBackup(); }
    else { toast(d.error || t("备份失败"), "err"); }
  } catch { toast(t("备份失败"), "err"); }
  finally { el.bkPush.classList.remove("loading"); el.bkPush.disabled = false; el.bkStatus.textContent = ""; }
}

async function doBackupRestore(name, btn) {
  if (!confirm(t("将用该备份覆盖本地各平台 skills 目录；被覆盖的现有目录会先移到废纸篓（可恢复）。确定继续？"))) return;
  if (btn) { btn.classList.add("loading"); btn.disabled = true; }
  el.bkStatus.textContent = t("恢复中…");
  try {
    const r = await API.backupRestore(name);
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast(d.message || t("已恢复")); closeModal(); doScan(); }
    else { toast(d.error || t("恢复失败"), "err"); }
  } catch { toast(t("恢复失败"), "err"); }
  finally { el.bkStatus.textContent = ""; if (btn) { btn.classList.remove("loading"); btn.disabled = false; } }
}

// openTrash 打开垃圾桶弹窗并加载已删除的 skill 清单。
async function openTrash() {
  openModal(el.trashModal);
  el.trashList.innerHTML = `<div class="bk-empty">${t("加载中…")}</div>`;
  try {
    const d = await API.trashItems();
    const items = d.items || [];
    if (!items.length) { el.trashList.innerHTML = `<div class="bk-empty">${t("回收站是空的")}</div>`; return; }
    el.trashList.innerHTML = items.map((it) => `
      <div class="bk-item">
        <div class="bk-item-main">
          <span class="bk-item-time">${esc(it.name)}</span>
          <span class="bk-item-meta">${esc(it.origPath || "")}${it.deletedAt ? " · " + fmtTime(it.deletedAt) : ""}</span>
        </div>
        <button class="btn btn-ghost btn-sm tr-restore" data-id="${esc(it.id)}">${t("恢复")}</button>
      </div>`).join("");
    el.trashList.querySelectorAll(".tr-restore").forEach((b) =>
      b.addEventListener("click", () => doTrashRestore(b.dataset.id, b)));
  } catch { el.trashList.innerHTML = `<div class="bk-empty">${t("读取回收站失败")}</div>`; }
}

// doTrashRestore 恢复一项已删除的 skill 到原路径。
async function doTrashRestore(id, btn) {
  if (btn) { btn.disabled = true; }
  const r = await API.trashRestore(id);
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已恢复")); await openTrash(); doScan(); }
  else { toast(d.error || t("恢复失败"), "err"); if (btn) btn.disabled = false; }
}

// doTrashEmpty 清空回收站：内容移到系统废纸篓。
async function doTrashEmpty() {
  if (!confirm(t("清空回收站？内容会被移到系统废纸篓（仍可在访达恢复）。"))) return;
  const r = await API.trashEmptyAll();
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(t("已清空回收站")); await openTrash(); }
  else { toast(d.error || t("清空失败"), "err"); }
}

function lineDiff(oldT, newT) {
  const a = (oldT || "").split("\n"),b = (newT || "").split("\n");
  const m = a.length,n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
  dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0,j = 0;const oldH = [],newH = [];
  const line = (cls, t) => `<span class="${cls}">${esc(t) || "&nbsp;"}</span>`;
  while (i < m && j < n) {
    if (a[i] === b[j]) {oldH.push(line("", a[i]));newH.push(line("", b[j]));i++;j++;} else
    if (dp[i + 1][j] >= dp[i][j + 1]) {oldH.push(line("del", a[i]));i++;} else
    {newH.push(line("add", b[j]));j++;}
  }
  while (i < m) oldH.push(line("del", a[i++]));
  while (j < n) newH.push(line("add", b[j++]));
  return { oldHtml: oldH.join("\n"), newHtml: newH.join("\n") };
}
function showDiff(oldT, newT, opts) {
  opts = opts || {};
  const { oldHtml, newHtml } = lineDiff(oldT, newT);
  el.diffOld.innerHTML = oldHtml;el.diffNew.innerHTML = newHtml;
  el.diffOldLabel.textContent = opts.oldLabel || t("原文");
  el.diffNewLabel.textContent = opts.newLabel || t("AI 优化稿");
  el.diffApply.hidden = opts.allowApply === false;
  el.diffDiscard.textContent = opts.allowApply === false ? t("关闭") : t("放弃");
  openModal(el.diffModal);
}
function applyDiff() {
  if (state.diffMode === "update" && state.pendingUpdate) {doApplyUpdate();return;}
  if (state.diffMode === "ai" && state.aiResult) {ensureEditor();state.editor.setValue(state.aiResult);setMode("edit");setDirty(state.editor.getValue() !== state.baseline);toast(t("已应用 AI 稿，记得保存"));}
  closeModal();
}
async function doCheckUpdate(id) {
  toast(t("检查上游更新…"));
  try {
    const res = await API.checkSource(id);
    if (!res.ok) {const d = await res.json().catch(() => ({}));toast(d.error || t("检查失败"), "err");return;}
    const d = await res.json();
    if (!d.has_update) {toast(t("已是最新版本"));return;}
    state.diffMode = "update";state.pendingUpdate = { id, content: d.remote_content };
    showDiff(state.baseline || (state.current ? state.current.body : ""), d.remote_content || "", { oldLabel: t("本地"), newLabel: t("上游最新"), allowApply: true });
  } catch {toast(t("检查失败"), "err");}
}
async function doApplyUpdate() {
  if (!state.pendingUpdate) return;
  const { id, content } = state.pendingUpdate;
  if (!confirm(t("用上游最新内容覆盖本地 SKILL.md？\n（不在 git 仓库时会先备份为 SKILL.md.bak）"))) return;
  const targets = ((state.source && state.source.targets) || "").split(",").map((x) => x.trim()).filter(Boolean);
  try {
    const r = await API.applySource(id, content, targets);
    if (!r.ok) {toast(t("应用失败"), "err");return;}
    toast(t("已应用上游更新"));state.pendingUpdate = null;closeModal();
    await loadAll();
    if (state.current && state.current.id === id) await openDetail(id, false);
  } catch {toast(t("应用失败"), "err");}
}

/* ---------- dup/conflict groups ---------- */
async function openGroups(kind) {
  state.groupKind = kind;state.groupSel = new Set();
  el.groupsTitle.textContent = kind === "conflict" ? t("冲突管理") : t("重复管理");
  el.grpCompare.hidden = kind !== "conflict";
  el.groupsBody.innerHTML = `<div class="no-results">${t("加载中…")}</div>`;
  openModal(el.groupsModal);
  try {const d = await API.groups(kind);state.groupData = d.groups || [];renderGroups();}
  catch {el.groupsBody.innerHTML = `<div class="no-results">${t("加载失败")}</div>`;}
}
function renderGroups() {
  const groups = state.groupData || [];
  el.groupsSub.textContent = groups.length ?
  (state.groupKind === "conflict"
    ? t("{n} 组同名（内容不同），共 {total} 个副本", { n: groups.length, total: groups.reduce((a, g) => a + g.copies.length, 0) })
    : t("{n} 组同名（内容一致），共 {total} 个副本", { n: groups.length, total: groups.reduce((a, g) => a + g.copies.length, 0) })) :
  t("没有发现") + (state.groupKind === "conflict" ? t("冲突") : t("重复"));
  const isConflict = state.groupKind === "conflict";
  el.groupsBody.innerHTML = groups.map((g) => {
    const newest = Math.max(...g.copies.map((c) => c.mtime || 0));
    const rows = g.copies.map((c) => {
      const isNewest = isConflict && c.mtime && c.mtime === newest;
      const syncBtn = isConflict ?
      `<button class="copy-sync" data-sync="${esc(c.id)}" title="${t("以此副本为准，覆盖同步同组其它副本（被覆盖的存 .bak）")}">${t("以此为准 ›")}</button>` :
      "";
      return `<div class="copy-row" data-path="${esc(c.file_path)}" data-dir="${esc(c.dir)}" data-id="${esc(c.id)}">
        <input type="checkbox" ${state.groupSel.has(c.file_path) ? "checked" : ""} />
        <div class="copy-main"><div class="copy-name">${platformBadge(c)}<span class="badge ${c.source}">${t(CAT_LABEL[c.source] || c.source)}</span>${esc(g.name)}${isNewest ? `<span class="newest-tag">${t("最新")}</span>` : ""}<span class="open-link" data-open="${esc(c.id)}">${t("打开 ›")}</span></div>
          <div class="copy-path">${esc(c.file_path)}</div></div>
        <div class="copy-meta">${fmtSize(c.size || 0)} · ${esc(fmtTime(c.mtime))}${syncBtn}</div></div>`;
    }).join("");
    return `<div class="group-card"><div class="group-head"><span class="gname">${esc(g.name)}</span><span class="gcount">${t("{n} 份", { n: g.copies.length })}</span></div>${rows}</div>`;
  }).join("") || `<div class="no-results">${t("没有数据")}</div>`;
  updateGroupSel();
}
function updateGroupSel() {
  const n = state.groupSel.size;
  el.groupsSel.textContent = n ? t("已选 {n}", { n }) : "";
  el.grpLocate.disabled = n === 0;el.grpTrash.disabled = n === 0;
  el.grpCompare.disabled = !(state.groupKind === "conflict" && n === 2);
}
async function grpLocate() {
  for (const p of state.groupSel) await API.reveal(p);
  toast(t("已在 Finder 定位 ") + state.groupSel.size + t(" 项"));
}
async function grpTrash() {
  const dirs = [];
  el.groupsBody.querySelectorAll(".copy-row").forEach((row) => {if (state.groupSel.has(row.dataset.path)) dirs.push(row.dataset.dir);});
  if (!dirs.length) return;
  if (!confirm(t("将 {n} 个 skill 目录移到废纸篓（可在访达恢复）。确定？", { n: dirs.length }))) return;
  el.grpTrash.disabled = true;
  try {
    const res = await API.trash(dirs);
    if (res.status === 501) {toast(t("仅 macOS 支持移到废纸篓"), "err");return;}
    const d = await res.json();
    toast(t("已移到废纸篓 {n} 项", { n: (d.trashed || []).length }) + ((d.failed || []).length ? t("，{n} 失败", { n: d.failed.length }) : ""));
    state.groupSel = new Set();await loadAll();
    const g = await API.groups(state.groupKind);state.groupData = g.groups || [];renderGroups();
  } catch {toast(t("操作失败"), "err");} finally
  {el.grpTrash.disabled = false;}
}
async function grpCompare() {
  const ids = [];
  el.groupsBody.querySelectorAll(".copy-row").forEach((row) => {if (state.groupSel.has(row.dataset.path)) ids.push(row.dataset.id);});
  if (ids.length !== 2) return;
  const [a, b] = await Promise.all([API.get(ids[0]), API.get(ids[1])]);
  state.diffMode = "compare";
  showDiff(a.body || "", b.body || "", { oldLabel: t("副本 A"), newLabel: t("副本 B"), allowApply: false });
}
// 冲突合并：以 fromId 副本为准，覆盖同步同组其它副本。
async function grpSyncFrom(fromId) {
  const grp = (state.groupData || []).find((g) => g.copies.some((c) => c.id === fromId));
  if (!grp) return;
  const toIds = grp.copies.map((c) => c.id).filter((id) => id !== fromId);
  if (!toIds.length) return;
  if (!confirm(t("将以选中副本为准，覆盖同步该组其它 {n} 个副本（被覆盖的 SKILL.md 会存 .bak，可恢复）。确定？", { n: toIds.length }))) return;
  try {
    const r = await API.sync(fromId, toIds);
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      toast(t("已同步 {n} 个副本", { n: d.synced || 0 }) + ((d.failed || []).length ? t("，{n} 个失败", { n: d.failed.length }) : ""));
      await loadAll();
      const g = await API.groups(state.groupKind);state.groupData = g.groups || [];renderGroups();
    } else {toast(d.error || t("同步失败"), "err");}
  } catch {toast(t("同步失败"), "err");}
}

/* ---------- settings ---------- */
async function fillSettings() {
  try {
    const c = await API.config();
    el.cfgProvider.value = c.provider === "anthropic" ? "anthropic" : "openai";
    el.cfgBaseURL.value = c.baseURL || "";
    el.cfgModel.value = c.model || "";
    el.cfgKey.value = "";
    el.keyHint.textContent = c.hasKey ? t("（已配置，可留空）") : t("（未配置）");
    el.cfgStatus.textContent = "";el.cfgStatus.className = "cfg-status";
  } catch {toast(t("读取配置失败"), "err");}
  if (el.cfgSyncInterval) {try {const sc = await API.getSyncConfig();el.cfgSyncInterval.value = String(sc.interval_min || 0);} catch {/* ignore */}}
}
function readSettingsForm() {
  return { provider: el.cfgProvider.value, baseURL: el.cfgBaseURL.value.trim(), model: el.cfgModel.value.trim(), apiKey: el.cfgKey.value };
}
async function saveSettings() {
  el.cfgSave.disabled = true;
  if (el.cfgSyncInterval) {try {await API.putSyncConfig({ interval_min: parseInt(el.cfgSyncInterval.value, 10) || 0 });} catch {/* ignore */}}
  try {const r = await API.putConfig(readSettingsForm());if (r.ok) {toast(t("已保存设置"));await probeAI();closeModal();} else toast(t("保存失败"), "err");}
  catch {toast(t("保存失败"), "err");} finally {el.cfgSave.disabled = false;}
}
async function testConnection() {
  el.cfgStatus.textContent = t("测试中…");el.cfgStatus.className = "cfg-status busy";
  try {
    await API.putConfig(readSettingsForm()); // 先保存当前表单再测
    el.cfgKey.value = "";
    const r = await API.aiTest();
    if (r.status === 501) {el.cfgStatus.textContent = t("未配置 key");el.cfgStatus.className = "cfg-status err";return;}
    const d = await r.json();
    el.cfgStatus.textContent = d.ok ? t("连接成功 ✓") : t("失败：") + (d.message || "");
    el.cfgStatus.className = "cfg-status " + (d.ok ? "ok" : "err");
    el.keyHint.textContent = t("（已配置，可留空）");
    await probeAI();
  } catch {el.cfgStatus.textContent = t("测试失败");el.cfgStatus.className = "cfg-status err";}
}

/* ---------- new skill ---------- */
async function openNew() {
  el.newName.value = "";el.newBrief.value = "";el.newStatus.textContent = "";
  el.importUrl.value = "";el.importName.value = "";setNewMode("create");
  try {
    const [rec, cfg] = await Promise.all([API.recipes(), API.config()]);
    el.newRecipe.innerHTML = (rec.recipes || []).map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("");
    el.newAiHint.textContent = cfg.hasKey ? t("已配置 AI：将根据描述生成初稿。") : t("未配置 AI：将插入空白脚手架，可在设置里启用 AI。");
    el.newCreate.dataset.ai = cfg.hasKey ? "1" : "";
  } catch {el.newRecipe.innerHTML = `<option value="blank">${t("空白脚手架")}</option>`;el.newCreate.dataset.ai = "";}
  openModal(el.newModal);
  setTimeout(() => el.newName.focus(), 60);
}
// 去除 AI 输出整体被 ```markdown ... ``` / ``` ... ``` 包裹的外层围栏，
// 否则整篇 SKILL.md 会被当成一个代码块，预览显示为“原始文本”。
function stripCodeFence(s) {
  const t = (s || "").trim();
  const m = t.match(/^```[a-zA-Z0-9_-]*\r?\n([\s\S]*?)\r?\n```$/);
  return m ? m[1].trim() + "\n" : s;
}
function scaffold(name, brief) {
  return `---\nname: ${name}\ndescription: ${brief || t("TODO: 一句话描述这个 skill 何时使用")}\n---\n\n# ${name}\n\n${brief || t("TODO: 写下这个 skill 的内容。")}\n`;
}
async function createSkill() {
  const name = el.newName.value.trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {el.newStatus.textContent = t("名称只能用小写字母、数字、连字符");el.newStatus.className = "cfg-status err";return;}
  el.newCreate.disabled = true;el.newStatus.textContent = t("创建中…");el.newStatus.className = "cfg-status busy";
  try {
    let content;
    const brief = el.newBrief.value.trim();
    if (el.newCreate.dataset.ai === "1" && brief) {
      el.newStatus.textContent = t("AI 生成中…");
      const r = await API.create(name, brief, el.newRecipe.value);
      if (r.ok) content = stripCodeFence((await r.json()).result) || scaffold(name, brief);else
      content = scaffold(name, brief);
    } else content = scaffold(name, brief);
    const res = await API.newSkill(name, content);
    if (res.status === 409) {el.newStatus.textContent = t("已存在同名 skill");el.newStatus.className = "cfg-status err";return;}
    if (!res.ok) {el.newStatus.textContent = t("创建失败");el.newStatus.className = "cfg-status err";return;}
    const d = await res.json();
    await loadAll();closeModal();toast(t("已创建 ") + name);
    if (d.id) {await openDetail(d.id, false);setMode("edit");}
  } catch {el.newStatus.textContent = t("创建失败");el.newStatus.className = "cfg-status err";} finally
  {el.newCreate.disabled = false;}
}

function setNewMode(m) {
  el.newModeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.nmode === m));
  const imp = m === "import";
  el.newCreateFields.hidden = imp;el.newImportFields.hidden = !imp;
  el.newCreate.hidden = imp;el.newImport.hidden = !imp;
  el.newStatus.textContent = "";
}
async function doImport() {
  const url = el.importUrl.value.trim();
  if (!url) {el.newStatus.textContent = t("请填 GitHub 链接");el.newStatus.className = "cfg-status err";return;}
  el.newImport.disabled = true;el.newStatus.textContent = t("克隆中…（可能需要几秒）");el.newStatus.className = "cfg-status busy";
  try {
    const res = await API.importSkill(url, el.importName.value.trim());
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = { 400: t("链接非法或非 github.com"), 409: t("已存在同名 skill"), 422: t("该目录下没有 SKILL.md"), 502: t("克隆仓库失败") }[res.status] || d.error || t("导入失败");
      el.newStatus.textContent = msg;el.newStatus.className = "cfg-status err";return;
    }
    await loadAll();closeModal();toast(t("已导入 ") + (d.name || ""));
    if (d.id) {await openDetail(d.id, false);}
  } catch {el.newStatus.textContent = t("导入失败");el.newStatus.className = "cfg-status err";} finally
  {el.newImport.disabled = false;}
}

/* ---------- modal helpers ---------- */
// 弹窗栈：从某弹窗（如设置）里打开子弹窗会入栈，关闭只关最上层并返回上一层，
// 避免一按 ESC 把整条链全部关掉。
let openModalEl = null;
const modalStack = [];
function openModal(m) {
  if (openModalEl && openModalEl !== m) {
    modalStack.push(openModalEl);
    openModalEl.classList.remove("show");
    openModalEl.hidden = true;
  }
  openModalEl = m;
  el.modalScrim.hidden = false;m.hidden = false;
  requestAnimationFrame(() => {el.modalScrim.classList.add("show");m.classList.add("show");});
}
function closeModal() {
  if (!openModalEl) return;
  const m = openModalEl;
  m.classList.remove("show");
  const prev = modalStack.pop();
  if (prev) {
    // 返回上一层：立即换回，不整链关闭
    m.hidden = true;
    openModalEl = prev;
    prev.hidden = false;
    requestAnimationFrame(() => prev.classList.add("show"));
    return;
  }
  openModalEl = null;
  el.modalScrim.classList.remove("show");
  setTimeout(() => {el.modalScrim.hidden = true;m.hidden = true;}, 220);
}
// closeAllModals 彻底关闭整条弹窗链（清空栈）。
function closeAllModals() {
  modalStack.length = 0;
  closeModal();
}

/* ---------- history ---------- */
function pushHistory(q) {let h = LS.history().filter((x) => x !== q);h.unshift(q);LS.setHistory(h);}

/* ---------- events ---------- */
let searchTimer = null;
el.q.addEventListener("input", (e) => {
  state.query = e.target.value;el.clear.hidden = !state.query;state.cursor = -1;
  clearTimeout(searchTimer);searchTimer = setTimeout(render, 90);
});
el.q.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && state.view.length) {
    e.preventDefault();
    if (state.query.trim()) pushHistory(state.query.trim());
    // 打开当前结果中名称排序最靠前的一条
    const first = state.view.slice().sort((a, b) => a.name.localeCompare(b.name))[0];
    if (first) openDetail(first.id, true);
  }
});
el.q.addEventListener("focus", () => el.searchWrap.classList.add("focused"));
el.q.addEventListener("blur", () => el.searchWrap.classList.remove("focused"));
el.clear.addEventListener("click", () => {state.query = "";el.q.value = "";el.clear.hidden = true;state.cursor = -1;el.q.focus();render();});

el.chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip");if (!b) return;
  const cat = b.dataset.cat;
  if (cat === "dup" || cat === "conflict") {openGroups(cat);return;}
  state.cat = cat;renderChips();render();
});
if (el.tagSection) el.tagSection.addEventListener("click", (e) => {
  if (e.target.closest("[data-tagtoggle]")) {
    state.tagsCollapsed = !state.tagsCollapsed;
    try {localStorage.setItem("sb.tagsCollapsed", state.tagsCollapsed ? "1" : "0");} catch {/* ignore */}
    renderTagSection();return;
  }
  if (e.target.closest("[data-tagmore]")) {state.tagsShowAll = !state.tagsShowAll;renderTagSection();return;}
  const b = e.target.closest(".chip");if (!b) return;
  state.cat = b.dataset.cat;renderChips();render();
});
// 右上角计数 pill / 左上角 logo：清空搜索与筛选，回到全部。
function resetToAll() {
  state.cat = "all";state.query = "";el.q.value = "";el.clear.hidden = true;
  renderChips();render();
}
const brandEl = document.querySelector(".brand");
if (brandEl) brandEl.addEventListener("click", resetToAll);

// 左侧树：点 group head 折叠/展开，点 skill 项打开详情。
el.tree.addEventListener("click", (e) => {
  const star = e.target.closest(".ti-star[data-fav]");
  if (star) {e.stopPropagation();toggleFavorite(star.dataset.fav);return;}
  const head = e.target.closest(".tree-head[data-tk]");
  if (head) {const k = head.dataset.tk;if (state.treeCollapsed.has(k)) state.treeCollapsed.delete(k);else state.treeCollapsed.add(k);renderSidebarTree();return;}
  const item = e.target.closest(".tree-item[data-id]");
  if (item) openDetail(item.dataset.id, !!state.query.trim());
});

el.scan.addEventListener("click", doScan);
// 主题切换（亮 / 暗），记忆到 localStorage，并同步代码高亮主题
function setTheme(dark) {
  const root = document.documentElement;
  if (dark) root.setAttribute("data-theme", "dark");else root.removeAttribute("data-theme");
  try {localStorage.setItem("sb.theme", dark ? "dark" : "light");} catch {/* ignore */}
  const l = document.getElementById("hljs-light"),d = document.getElementById("hljs-dark");
  if (l && d) {l.disabled = dark;d.disabled = !dark;}
}
el.themeToggle.addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") !== "dark"));
el.langToggle.addEventListener("click", toggleLang);
el.sidebarHandle.addEventListener("click", toggleFull);
el.save.addEventListener("click", doSave);
// 阅读字体/字号面板
el.fontBtn.addEventListener("click", (e) => {e.stopPropagation();el.fontPop.hidden = !el.fontPop.hidden;});
el.fontPop.addEventListener("click", (e) => {
  e.stopPropagation();
  const fs = e.target.closest("[data-fs]");
  if (fs) {
    state.readerSize = Math.max(READER_MIN, Math.min(READER_MAX, state.readerSize + (fs.dataset.fs === "+" ? 1 : -1)));
    applyReader();return;
  }
  const ff = e.target.closest("[data-ff]");
  if (ff) {state.readerFont = ff.dataset.ff;applyReader();}
});
document.addEventListener("click", () => {if (!el.fontPop.hidden) el.fontPop.hidden = true;});
el.reveal.addEventListener("click", doReveal);
el.deleteSkill.addEventListener("click", doDelete);
el.favBtn.addEventListener("click", () => {if (state.current) toggleFavorite(state.current.id);});
if (el.editTags) el.editTags.addEventListener("click", editTags);
el.findBtn.addEventListener("click", doFind);
el.aiOptimize.addEventListener("click", doOptimize);
el.modeSeg.addEventListener("click", (e) => {const b = e.target.closest(".seg-btn");if (b && !b.disabled) setMode(b.dataset.mode);});
el.sourceChip.addEventListener("click", () => {if (state.current) openSourceModal();});
el.sourceModalBody.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]");if (!b || !state.current) return;
  const act = b.dataset.act,id = state.current.id;
  if (act === "src-copy") {if (state.source && navigator.clipboard) navigator.clipboard.writeText(state.source.source_url);toast(t("已复制来源链接"));} else
  if (act === "src-check") {closeModal();doCheckUpdate(id);} else
  if (act === "src-save") {
    const tokEl = $("#srcToken");
    await saveSource(id, { source_url: $("#srcUrl").value.trim(), source_kind: $("#srcKind").value, source_ref: $("#srcRef").value.trim(), source_subpath: $("#srcSubpath") ? $("#srcSubpath").value.trim() : "", source_note: $("#srcNote").value.trim(), auto_check: $("#srcAuto") ? $("#srcAuto").checked : false, targets: readSourceTargets(), token: tokEl ? tokEl.value : "" });
  } else
  if (act === "src-clear") {if (confirm(t("清除该 skill 的来源信息？"))) await saveSource(id, { source_url: "" });}
});
el.fileTree.addEventListener("click", (e) => {
  if (e.target.closest("#ftNewFile")) {fileOpNew(false);return;}
  if (e.target.closest("#ftNewDir")) {fileOpNew(true);return;}
  const renameBtn = e.target.closest(".ft-rename");
  if (renameBtn) {fileOpRename(renameBtn.dataset.abs);return;}
  const delBtn = e.target.closest(".ft-del");
  if (delBtn) {fileOpDelete(delBtn.dataset.abs);return;}
  if (e.target.closest(".ft-collapse")) {toggleFileTree();return;}
  const tog = e.target.closest(".ft-row[data-toggle]");
  if (tog) {const rel = tog.dataset.toggle;if (state.collapsed.has(rel)) state.collapsed.delete(rel);else state.collapsed.add(rel);renderTree();return;}
  const row = e.target.closest(".ft-row[data-abs]");if (row) openFile(row.dataset.abs, state.mode);
});

el.groupsBody.addEventListener("click", (e) => {
  const sync = e.target.closest("[data-sync]");if (sync) {e.stopPropagation();grpSyncFrom(sync.dataset.sync);return;}
  const open = e.target.closest(".open-link");if (open) {closeModal();openDetail(open.dataset.open, false);return;}
  const row = e.target.closest(".copy-row");if (!row) return;
  const path = row.dataset.path;
  if (state.groupSel.has(path)) state.groupSel.delete(path);else state.groupSel.add(path);
  const cb = row.querySelector("input[type=checkbox]");if (cb) cb.checked = state.groupSel.has(path);
  updateGroupSel();
});
el.grpLocate.addEventListener("click", grpLocate);
el.grpTrash.addEventListener("click", grpTrash);
el.grpCompare.addEventListener("click", grpCompare);

el.optBody.addEventListener("click", (e) => {
  const card = e.target.closest(".sug-card");if (!card) return;
  const idx = +card.dataset.idx;const s = optSuggestions.find((x) => x.idx === idx);if (!s) return;
  s.accepted = !s.accepted;
  card.classList.toggle("on", s.accepted);
  const cb = card.querySelector("input[type=checkbox]");if (cb) cb.checked = s.accepted;
  updateOptSel();
});
el.optAll.addEventListener("click", () => {optSuggestions.forEach((s) => s.accepted = true);renderSuggestions();});
el.optNone.addEventListener("click", () => {optSuggestions.forEach((s) => s.accepted = false);renderSuggestions();});
el.optApply.addEventListener("click", applyOptimize);
el.editOptimizer.addEventListener("click", openOptimizer);
if (el.editClassifier) el.editClassifier.addEventListener("click", openClassifier);
if (el.reclassify) el.reclassify.addEventListener("click", () => {closeModal();startClassify(true, false);});
el.optimizerSave.addEventListener("click", saveOptimizer);
if (el.classifierSave) el.classifierSave.addEventListener("click", saveClassifier);
if (el.editScanDirs) el.editScanDirs.addEventListener("click", openScanDirs);
setupDirAutocomplete();
if (el.scanDirsSave) el.scanDirsSave.addEventListener("click", saveScanDirs);
if (el.scanDirsModal) el.scanDirsModal.addEventListener("click", (e) => {
  const add = e.target.closest('[data-act="add-dir"]');
  if (add) {
    syncScanDirsFromDom();
    const p = el.newDirPath.value.trim();if (!p) {toast(t("请输入目录路径"), "err");return;}
    scanDirsState.extra.push({ path: p, name: el.newDirName.value.trim() || baseName(p), enabled: true, short: p });
    el.newDirPath.value = "";el.newDirName.value = "";renderScanDirs();return;
  }
  const rm = e.target.closest(".sd-rm");
  if (rm) {syncScanDirsFromDom();scanDirsState.extra.splice(+rm.dataset.idx, 1);renderScanDirs();return;}
  if (e.target.closest('[data-act="db-up"]')) {if (dbState.parent) dbLoad(dbState.parent);return;}
  if (e.target.closest('[data-act="db-go"]')) {const v = document.getElementById("dbPathInput").value.trim();if (v) dbLoad(v);return;}
  if (e.target.closest('[data-act="db-add-selected"]')) {dbAddSelected();return;}
  const enter = e.target.closest(".db-enter");
  if (enter) {dbLoad(enter.dataset.path);return;}
  const chk = e.target.closest(".db-chk");
  if (chk) {if (chk.checked) dbState.selected.add(chk.dataset.path);else dbState.selected.delete(chk.dataset.path);document.getElementById("dbSel").textContent = t("已选 {n}", { n: dbState.selected.size });}
});
el.openBackup.addEventListener("click", openBackup);
el.openTrash.addEventListener("click", openTrash);
el.trashEmpty.addEventListener("click", doTrashEmpty);
el.bkSave.addEventListener("click", saveBackupConfig);
el.bkTest.addEventListener("click", testBackupConn);
el.bkPush.addEventListener("click", doBackupPush);

el.settings.addEventListener("click", async () => {openModal(el.settingsModal);await fillSettings();});
el.cfgSave.addEventListener("click", saveSettings);
el.cfgTest.addEventListener("click", testConnection);
el.newSkill.addEventListener("click", openNew);
el.newCreate.addEventListener("click", createSkill);
el.newImport.addEventListener("click", doImport);
el.newModeSeg.addEventListener("click", (e) => {const b = e.target.closest(".seg-btn");if (b) setNewMode(b.dataset.nmode);});
el.diffApply.addEventListener("click", applyDiff);
el.diffDiscard.addEventListener("click", closeModal);
el.modalScrim.addEventListener("click", closeModal);
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {if (openModalEl) return closeModal();}
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && !el.sheet.hidden && openModalEl === null) {if (doFind()) e.preventDefault();return;}
  if ((e.key === "/" || e.key === "k" && (e.metaKey || e.ctrlKey)) && el.sheet.hidden && openModalEl === null) {
    if (document.activeElement !== el.q) {e.preventDefault();el.q.focus();el.q.select();}
  }
});

/* ---------- starfield (随机分布) ---------- */
function buildSky() {
  const sky = document.getElementById("sky");
  if (!sky) return;
  const layers = sky.querySelectorAll(".sky-stars");
  if (!layers.length) return;
  const COLORS = ["255,255,255", "255,255,255", "188,212,255", "190,255,214", "255,240,210"];
  // 三层：远(小而密) → 近(大而疏)，做出景深
  const specs = [
  { count: 90, min: 0.6, max: 1.4, glow: 0.05 },
  { count: 55, min: 1.0, max: 2.2, glow: 0.18 },
  { count: 32, min: 1.6, max: 3.0, glow: 0.4 }];

  layers.forEach((layer, li) => {
    const s = specs[li] || specs[0];
    let html = "";
    for (let i = 0; i < s.count; i++) {
      const x = (Math.random() * 100).toFixed(3);
      const y = (Math.random() * 100).toFixed(3);
      const size = (s.min + Math.random() * (s.max - s.min)).toFixed(2);
      const color = COLORS[Math.random() * COLORS.length | 0];
      const alpha = (0.45 + Math.random() * 0.55).toFixed(2);
      const delay = (-Math.random() * 8).toFixed(2); // 闪烁相位随机，避免同步
      const dur = (4 + Math.random() * 5).toFixed(2);
      const glow = Math.random() < s.glow ? `;box-shadow:0 0 ${(+size * 2.5).toFixed(1)}px rgba(${color},${alpha})` : "";
      html += `<i class="star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:rgba(${color},${alpha});animation-delay:${delay}s;animation-duration:${dur}s${glow}"></i>`;
    }
    layer.innerHTML = html;
  });
}

/* ---------- boot ---------- */
window.addEventListener("resize", invalidatePvAnchors, { passive: true });
(async function boot() {
  buildSky();
  state.favorites = new Set(LS.favorites());
  try { state.fileTreeCollapsed = localStorage.getItem("sb.ftCollapsed") === "1"; } catch { /* ignore */ }
  try { state.tagsCollapsed = localStorage.getItem("sb.tagsCollapsed") === "1"; } catch { /* ignore */ }
  applyFileTreeCollapsed();
  applyI18n(); // 应用静态文案的当前语言
  const tag = document.querySelector(".lang-tag");if (tag) tag.textContent = langTagText();
  loadReaderPrefs();
  applyReader();
  try {await loadAll();} catch {/* not scanned yet */}
  probeAI();
  render();el.q.focus();
  resumeClassifyIfRunning(); // 刷新后若分类仍在后台进行，恢复进度条与轮询
})();

// resumeClassifyIfRunning 页面加载时查一次分类状态，正在跑则接管进度展示。
async function resumeClassifyIfRunning() {
  try {
    const st = await API.classifyStatus();
    if (st.running) {showClsBar(st.done || 0, st.total || 0);pollClassify();}
  } catch {/* ignore */}
}