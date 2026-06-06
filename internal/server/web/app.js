/* ===================== SkillBook front-end ===================== */
/* ---------- i18n（中文即 key + 英文字典） ---------- */
const I18N = {
  en: {
    // 模态提示（整段，路径以纯文本内联）
    "key 仅保存在本机 ~/.skillbook/config.json，不会上传、不回显。": "Key is stored locally in ~/.skillbook/config.json — never uploaded or echoed back.",
    "key 与令牌仅保存在本机 ~/.skillbook/（0600），不会上传、不回显。": "Key and token are stored locally in ~/.skillbook/ (0600) — never uploaded or echoed back.",
    "来源访问令牌（私有仓库）": "Source access token (private repos)",
    "留空则不修改；私有仓库需 repo 读取权限的 GitHub token": "Leave blank to keep; private repos need a GitHub token with repo read scope",
    "克隆公共仓库的该 skill 目录到 ~/.claude/skills，并自动填好来源链接。仅支持 github.com。": "Clones that skill directory from the public repo into ~/.claude/skills and fills in the source link. Only github.com is supported.",
    "保存在本机 ~/.skillbook/optimizer.md": "Stored locally in ~/.skillbook/optimizer.md",
    "备份范围：自动发现的各平台用户级 skills 目录。Token 仅写入本机 ~/.skillbook/backup.json（0600），不回显、不上传、不入备份内容。需要对该仓库有写权限的 repo scope。": "Backup scope: auto-discovered per-platform user-level skills directories (~/.<tool>/skills). Token is written only to ~/.skillbook/backup.json (0600) — not echoed, uploaded, or included in backups. Requires a token with repo write scope.",
    // 来源自动检测 / 更新
    "自动检测来源更新": "Auto-check source updates",
    "关闭": "Off",
    "每 6 小时": "Every 6 hours",
    "每天": "Daily",
    "每 3 天": "Every 3 days",
    "每周": "Weekly",
    "自动检测更新": "Auto-check for updates",
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
    "备份仓库": "Backup repo",
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
    "全部重新分类": "Re-tag all",
    "分类规则（AI 打标签依据）": "Tagging rules (AI labeling basis)",
    "保存在本机 ~/.skillbook/classifier.md；留空恢复默认。{vocab} 会替换为已有标签。": "Stored locally in ~/.skillbook/classifier.md; empty restores default. {vocab} is replaced with existing tags.",
    "已保存分类规则": "Tagging rules saved",
    "备份与同步": "Backup & Sync",
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
    "备份仓库 ": "Backup repo ",
    "私有仓库，需先在 GitHub 建好": "private repo, create it on GitHub first",
    "分支 ": "Branch ",
    "默认 main": "default main",
    "GitHub Token ": "GitHub Token ",
    "留空则不修改已存的 token": "leave empty to keep saved token",
    "备份范围：": "Backup scope: ",
    " 与 ": " and ",
    "。Token 仅写入本机 ": ". Token is written only on this machine at ",
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
    "未配置——填好仓库与 token 后即可一键备份": "Not configured — fill in repo and token to back up in one click",
    "载入备份配置失败": "Failed to load backup config",
    "已保存（留空不改）": "saved (leave empty to keep)",
    "必填": "required",
    "请填写备份仓库地址": "Please enter the backup repo URL",
    "保存中…": "Saving…",
    "已保存备份配置": "Backup config saved",
    "备份中…": "Backing up…",
    "备份完成 ✓": "Backup complete ✓",
    "没有变更": "No changes",
    "备份失败": "Backup failed",
    "将用备份仓库的内容覆盖本地各平台 skills 目录；被覆盖的现有目录会先移到废纸篓（可恢复）。确定继续？": "This overwrites local per-platform skills directories with the backup repo; existing directories are moved to Trash first (recoverable). Continue?",
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
  scan: $("#scan"), newSkill: $("#newSkill"), settings: $("#settings"), sidebarToggle: $("#sidebarToggle"),
  q: $("#q"), clear: $("#clear"), searchWrap: $("#searchWrap"),
  chips: $("#chips"), tagSection: $("#tagSection"),
  workbench: $("#workbench"), sidebar: $("#sidebar"), tree: $("#tree"), emptyHero: $("#emptyHero"),
  detailEmpty: $("#detailEmpty"), sheet: $("#sheet"), sheetName: $("#sheetName"),
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"), sheetClose: $("#sheetClose"),
  sourceChip: $("#sourceChip"), sourceModal: $("#sourceModal"), sourceModalBody: $("#sourceModalBody"),
  sheetTags: $("#sheetTags"), editTags: $("#editTags"),
  clsBar: $("#clsBar"), clsBarFill: $("#clsBarFill"), clsBarText: $("#clsBarText"),
  editOptimizer: $("#editOptimizer"), openBackup: $("#openBackup"),
  backupModal: $("#backupModal"), backupStatus: $("#backupStatus"), bkRepo: $("#bkRepo"), bkBranch: $("#bkBranch"),
  bkToken: $("#bkToken"), bkTokenHint: $("#bkTokenHint"), bkStatus: $("#bkStatus"),
  bkSave: $("#bkSave"), bkPush: $("#bkPush"), bkRestore: $("#bkRestore"),
  optimizeModal: $("#optimizeModal"), optSub: $("#optSub"), optBody: $("#optBody"), optSel: $("#optSel"),
  optAll: $("#optAll"), optNone: $("#optNone"), optApply: $("#optApply"),
  optimizerModal: $("#optimizerModal"), optimizerEd: $("#optimizerEd"), optimizerSave: $("#optimizerSave"),
  editClassifier: $("#editClassifier"), reclassify: $("#reclassify"),
  classifierModal: $("#classifierModal"), classifierEd: $("#classifierEd"), classifierSave: $("#classifierSave"),
  modeSeg: $("#modeSeg"), preview: $("#preview"), editorWrap: $("#editorWrap"), ed: $("#ed"), sheetMain: $("#sheetMain"), splitGutter: $("#splitGutter"),
  binaryNote: $("#binaryNote"), fileTree: $("#fileTree"), sheetBody: $("#sheetBody"),
  aiOptimize: $("#aiOptimize"), findBtn: $("#findBtn"), reveal: $("#reveal"), favBtn: $("#favBtn"),
  fontBtn: $("#fontBtn"), fontPop: $("#fontPop"), fsVal: $("#fsVal"),
  save: $("#save"), dirty: $("#dirty"), deleteSkill: $("#deleteSkill"), themeToggle: $("#themeToggle"), langToggle: $("#langToggle"),
  groupsModal: $("#groupsModal"), groupsTitle: $("#groupsTitle"), groupsSub: $("#groupsSub"),
  groupsBody: $("#groupsBody"), groupsSel: $("#groupsSel"),
  grpCompare: $("#grpCompare"), grpLocate: $("#grpLocate"), grpTrash: $("#grpTrash"),
  modalScrim: $("#modalScrim"),
  settingsModal: $("#settingsModal"), cfgProvider: $("#cfgProvider"), cfgBaseURL: $("#cfgBaseURL"),
  cfgModel: $("#cfgModel"), cfgKey: $("#cfgKey"), keyHint: $("#keyHint"), cfgSyncInterval: $("#cfgSyncInterval"),
  cfgSrcToken: $("#cfgSrcToken"), srcTokenHint: $("#srcTokenHint"),
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
  if (isKnownPlat(p)) return `<span class="badge plat-${p}" title="${title}">${label}</span>`;
  const c = platColor(p);
  return `<span class="badge" style="color:${c};border-color:${c}66;background:${c}1f;text-transform:none" title="${title}">${label}</span>`;
}
// platDot 渲染左侧树/行内的平台小圆点（已知平台走 CSS，其余内联色）。
function platDot(p, title) {
  if (isKnownPlat(p)) return `<span class="plat-dot plat-${p}" title="${title || ""}"></span>`;
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
  favorites: new Set(), fileTreeCollapsed: false, tagsCollapsed: false, tagsShowAll: false,
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
  trash: (dirs) => fetch("/api/skills/trash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dirs }) }),
  groups: (kind) => fetch("/api/groups?kind=" + kind).then(J),
  sync: (fromId, toIds) => fetch("/api/skills/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromId, toIds }) }),
  getSource: (id) => fetch("/api/skills/" + id + "/source").then(J),
  putSource: (id, s) => fetch("/api/skills/" + id + "/source", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }),
  sources: () => fetch("/api/sources").then(J),
  importSkill: (url, name) => fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, name }) }),
  checkSource: (id) => fetch("/api/skills/" + id + "/source/check", { method: "POST" }),
  applySource: (id, content, targets) => fetch("/api/skills/" + id + "/source/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, targets }) }),
  getSyncConfig: () => fetch("/api/sync-config").then(J),
  getSourceAuth: () => fetch("/api/source-auth").then(J),
  putSourceAuth: (body) => fetch("/api/source-auth", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
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
  putBackupConfig: (c) => fetch("/api/backup/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  backupPush: () => fetch("/api/backup/push", { method: "POST" }),
  backupRestore: () => fetch("/api/backup/restore", { method: "POST" })
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
  return `<div class="ft-head"><button class="ft-collapse" title="${t("收起 / 展开文件目录")}" aria-label="${t("收起 / 展开文件目录")}">` +
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
    el.dirty.hidden = state.editor.getValue() === state.baseline;
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
    if (k.dir) {
      const collapsed = state.collapsed.has(k.rel);
      const chev = hasChildren ? `<span class="ft-chevwrap${collapsed ? "" : " open"}">${CHEVRON_SVG}</span>` : '<span class="ft-chevwrap"></span>';
      html += `<div class="ft-row dir"${hasChildren ? ` data-toggle="${esc(k.rel)}"` : ""} style="padding-left:${pad}px">${chev}${FOLDER_SVG}<span>${esc(k.name)}</span></div>`;
      if (hasChildren && !collapsed) html += renderNode(k, depth + 1);
    } else {
      const active = k.abs === state.filePath ? " active" : "";
      html += `<div class="ft-row file${active}" data-abs="${esc(k.abs)}" title="${esc(k.rel)}" style="padding-left:${pad + 14}px">${FILE_SVG}<span>${esc(k.name)}</span></div>`;
    }
  }
  return html;
}
function renderTree() {
  el.fileTree.innerHTML = fileTreeHeadHtml() + (renderNode(buildTree(), 0) || `<div class="ft-row dir" style="padding-left:8px">${t("（空目录）")}</div>`);
}
async function openFile(abs, mode) {
  if (!el.dirty.hidden && state.filePath && state.filePath !== abs &&
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
  el.dirty.hidden = true;
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
  el.dirty.hidden = true;
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
      state.baseline = state.editor.getValue();el.dirty.hidden = true;toast(t("已保存"));
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
function renderSourceChip() {
  const s = state.source;
  const unset = !s || !s.source_url && !s.inferred;
  el.sourceChip.classList.toggle("unset", unset);
  if (unset) {el.sourceChip.innerHTML = `<span class="src-mut">${t("未设置来源")}</span>`;return;}
  if (s.inferred && s.source_url) {el.sourceChip.innerHTML = `${LINK_SVG}<span>${t("检测到来源")}</span>`;return;}
  let label = (s.source_url || "").replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  if (label.length > 30) label = label.slice(0, 30) + "…";
  el.sourceChip.innerHTML = `${LINK_SVG}<span>${esc(label)}</span>`;
}
function openSourceModal() {
  const s = state.source || {};
  const persisted = s.source_url && !s.inferred;
  const isGithub = s.source_kind === "github_repo";
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
      <input class="src-in" id="srcNote" placeholder="${t("备注（可选）")}" value="${esc(s.source_note || "")}" />
      <label class="src-check-line"><input type="checkbox" id="srcAuto" ${s.auto_check ? "checked" : ""}/> <span>${t("自动检测更新")}</span></label>
      <div class="src-targets"><span class="src-mut">${t("更新目标")}</span>
        ${targetBoxes}
      </div>
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
  state.editor.setValue(content);setMode("edit");el.dirty.hidden = state.editor.getValue() === state.baseline;
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

/* ---------- GitHub 备份与恢复 ---------- */
function fmtTime(unix) {
  if (!unix) return t("尚未备份");
  try {
    const d = new Date(unix * 1000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch {return "—";}
}
async function openBackup() {
  openModal(el.backupModal);
  el.bkStatus.textContent = "";el.bkToken.value = "";
  try {
    const [cfg, st] = await Promise.all([API.backupConfig(), API.backupStatus()]);
    el.bkRepo.value = cfg.repoURL || "";
    el.bkBranch.value = cfg.branch || "main";
    el.bkTokenHint.textContent = cfg.hasToken ? t("已保存（留空不改）") : t("必填");
    el.backupStatus.textContent = st.configured ?
    t("上次备份：{t} · 仓库 {repo}", { t: fmtTime(st.lastBackup), repo: cfg.repoURL || "—" }) : t("未配置——填好仓库与 token 后即可一键备份");

  } catch {el.backupStatus.textContent = t("载入备份配置失败");}
}
async function saveBackupConfig() {
  const repoURL = el.bkRepo.value.trim();
  if (!repoURL) {toast(t("请填写备份仓库地址"), "err");return;}
  el.bkStatus.textContent = t("保存中…");
  try {
    const r = await API.putBackupConfig({ repoURL, branch: el.bkBranch.value.trim(), token: el.bkToken.value });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {el.bkStatus.textContent = "";el.bkToken.value = "";toast(t("已保存备份配置"));await openBackup();} else
    {el.bkStatus.textContent = "";toast(d.error || t("保存失败"), "err");}
  } catch {el.bkStatus.textContent = "";toast(t("保存失败"), "err");}
}
async function doBackupPush() {
  el.bkPush.classList.add("loading");el.bkPush.disabled = true;el.bkStatus.textContent = t("备份中…");
  try {
    const r = await API.backupPush();
    const d = await r.json().catch(() => ({}));
    if (r.ok) {toast(d.changed ? t("备份完成 ✓") : d.message || t("没有变更"));await openBackup();} else
    {toast(d.error || t("备份失败"), "err");}
  } catch {toast(t("备份失败"), "err");} finally
  {el.bkPush.classList.remove("loading");el.bkPush.disabled = false;el.bkStatus.textContent = "";}
}
async function doBackupRestore() {
  if (!confirm(t("将用备份仓库的内容覆盖本地各平台 skills 目录；被覆盖的现有目录会先移到废纸篓（可恢复）。确定继续？"))) return;
  el.bkRestore.classList.add("loading");el.bkRestore.disabled = true;el.bkStatus.textContent = t("恢复中…");
  try {
    const r = await API.backupRestore();
    const d = await r.json().catch(() => ({}));
    if (r.ok) {toast(d.message || t("已恢复"));closeModal();doScan();} else
    {toast(d.error || t("恢复失败"), "err");}
  } catch {toast(t("恢复失败"), "err");} finally
  {el.bkRestore.classList.remove("loading");el.bkRestore.disabled = false;el.bkStatus.textContent = "";}
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
  if (state.diffMode === "ai" && state.aiResult) {ensureEditor();state.editor.setValue(state.aiResult);setMode("edit");el.dirty.hidden = state.editor.getValue() === state.baseline;toast(t("已应用 AI 稿，记得保存"));}
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
function fmtSize(n) {if (n < 1024) return n + " B";if (n < 1048576) return (n / 1024).toFixed(1) + " KB";return (n / 1048576).toFixed(1) + " MB";}
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
  if (el.cfgSrcToken) {
    el.cfgSrcToken.value = "";
    try {const sa = await API.getSourceAuth();el.srcTokenHint.textContent = sa.hasToken ? t("（已配置，可留空）") : t("（未配置）");} catch {el.srcTokenHint.textContent = "";}
  }
}
function readSettingsForm() {
  return { provider: el.cfgProvider.value, baseURL: el.cfgBaseURL.value.trim(), model: el.cfgModel.value.trim(), apiKey: el.cfgKey.value };
}
async function saveSettings() {
  el.cfgSave.disabled = true;
  if (el.cfgSyncInterval) {try {await API.putSyncConfig({ interval_min: parseInt(el.cfgSyncInterval.value, 10) || 0 });} catch {/* ignore */}}
  if (el.cfgSrcToken && el.cfgSrcToken.value.trim()) {try {await API.putSourceAuth({ token: el.cfgSrcToken.value.trim() });} catch {/* ignore */}}
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
let openModalEl = null;
function openModal(m) {
  if (openModalEl) openModalEl.hidden = true;
  openModalEl = m;
  el.modalScrim.hidden = false;m.hidden = false;
  requestAnimationFrame(() => {el.modalScrim.classList.add("show");m.classList.add("show");});
}
function closeModal() {
  if (!openModalEl) return;
  const m = openModalEl;openModalEl = null;
  el.modalScrim.classList.remove("show");m.classList.remove("show");
  setTimeout(() => {el.modalScrim.hidden = true;m.hidden = true;}, 220);
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
el.sidebarToggle.addEventListener("click", toggleFull);
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
  if (act === "src-save") {await saveSource(id, { source_url: $("#srcUrl").value.trim(), source_kind: $("#srcKind").value, source_ref: $("#srcRef").value.trim(), source_note: $("#srcNote").value.trim(), auto_check: $("#srcAuto") ? $("#srcAuto").checked : false, targets: readSourceTargets() });} else
  if (act === "src-clear") {if (confirm(t("清除该 skill 的来源信息？"))) await saveSource(id, { source_url: "" });}
});
el.fileTree.addEventListener("click", (e) => {
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
el.openBackup.addEventListener("click", openBackup);
el.bkSave.addEventListener("click", saveBackupConfig);
el.bkPush.addEventListener("click", doBackupPush);
el.bkRestore.addEventListener("click", doBackupRestore);

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