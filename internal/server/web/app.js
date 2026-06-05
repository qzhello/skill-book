/* ===================== SkillBook front-end ===================== */
const $ = (s) => document.querySelector(s);
const el = {
  scan: $("#scan"), newSkill: $("#newSkill"), settings: $("#settings"), sidebarToggle: $("#sidebarToggle"),
  q: $("#q"), clear: $("#clear"), searchWrap: $("#searchWrap"),
  count: $("#count"), chips: $("#chips"),
  workbench: $("#workbench"), sidebar: $("#sidebar"), tree: $("#tree"), emptyHero: $("#emptyHero"),
  detailEmpty: $("#detailEmpty"), sheet: $("#sheet"), sheetName: $("#sheetName"),
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"), sheetClose: $("#sheetClose"),
  sourceChip: $("#sourceChip"), sourceModal: $("#sourceModal"), sourceModalBody: $("#sourceModalBody"),
  editOptimizer: $("#editOptimizer"), openBackup: $("#openBackup"),
  backupModal: $("#backupModal"), backupStatus: $("#backupStatus"), bkRepo: $("#bkRepo"), bkBranch: $("#bkBranch"),
  bkToken: $("#bkToken"), bkTokenHint: $("#bkTokenHint"), bkStatus: $("#bkStatus"),
  bkSave: $("#bkSave"), bkPush: $("#bkPush"), bkRestore: $("#bkRestore"),
  optimizeModal: $("#optimizeModal"), optSub: $("#optSub"), optBody: $("#optBody"), optSel: $("#optSel"),
  optAll: $("#optAll"), optNone: $("#optNone"), optApply: $("#optApply"),
  optimizerModal: $("#optimizerModal"), optimizerEd: $("#optimizerEd"), optimizerSave: $("#optimizerSave"),
  modeSeg: $("#modeSeg"), preview: $("#preview"), editorWrap: $("#editorWrap"), ed: $("#ed"), sheetMain: $("#sheetMain"), splitGutter: $("#splitGutter"),
  binaryNote: $("#binaryNote"), fileTree: $("#fileTree"), sheetFull: $("#sheetFull"),
  aiOptimize: $("#aiOptimize"), findBtn: $("#findBtn"), reveal: $("#reveal"),
  fontBtn: $("#fontBtn"), fontPop: $("#fontPop"), fsVal: $("#fsVal"),
  save: $("#save"), dirty: $("#dirty"),
  groupsModal: $("#groupsModal"), groupsTitle: $("#groupsTitle"), groupsSub: $("#groupsSub"),
  groupsBody: $("#groupsBody"), groupsSel: $("#groupsSel"),
  grpCompare: $("#grpCompare"), grpLocate: $("#grpLocate"), grpTrash: $("#grpTrash"),
  modalScrim: $("#modalScrim"),
  settingsModal: $("#settingsModal"), cfgProvider: $("#cfgProvider"), cfgBaseURL: $("#cfgBaseURL"),
  cfgModel: $("#cfgModel"), cfgKey: $("#cfgKey"), keyHint: $("#keyHint"),
  cfgTest: $("#cfgTest"), cfgStatus: $("#cfgStatus"), cfgSave: $("#cfgSave"),
  newModal: $("#newModal"), newName: $("#newName"), newRecipe: $("#newRecipe"),
  newBrief: $("#newBrief"), newAiHint: $("#newAiHint"), newStatus: $("#newStatus"), newCreate: $("#newCreate"),
  newModeSeg: $("#newModeSeg"), newCreateFields: $("#newCreateFields"), newImportFields: $("#newImportFields"),
  importUrl: $("#importUrl"), importName: $("#importName"), newImport: $("#newImport"),
  diffModal: $("#diffModal"), diffOld: $("#diffOld"), diffNew: $("#diffNew"),
  diffOldLabel: $("#diffOldLabel"), diffNewLabel: $("#diffNewLabel"),
  diffApply: $("#diffApply"), diffDiscard: $("#diffDiscard"),
  toasts: $("#toasts"),
};

const CAT_LABEL = { user: "用户级", project: "项目级", plugin: "插件" };
const PLATFORM_LABEL = { claude: "Claude", codex: "Codex" };
const CHIP_LABEL = { user: "用户级", project: "项目级", plugin: "插件", claude: "Claude", codex: "Codex", conflict: "冲突", dup: "重复", linked: "有来源", unlinked: "无来源" };
function platformBadge(s) {
  const p = s && s.platform;
  if (!p || !PLATFORM_LABEL[p]) return "";
  return `<span class="badge plat-${p}" title="平台：${PLATFORM_LABEL[p]}">${PLATFORM_LABEL[p]}</span>`;
}
function relTime(unix) {
  if (!unix) return "";
  const d = Date.now() / 1000 - unix;
  if (d < 60) return "刚刚";
  if (d < 3600) return Math.floor(d / 60) + " 分钟前";
  if (d < 86400) return Math.floor(d / 3600) + " 小时前";
  if (d < 2592000) return Math.floor(d / 86400) + " 天前";
  try { return new Date(unix * 1000).toLocaleDateString(); } catch { return ""; }
}
const CAT_ORDER = ["user", "project"]; // plugin 已弃用：不扫描、不展示

const state = {
  all: [], conflicts: new Set(), dups: new Set(), dupCounts: {},
  scanned: false, query: "", cat: "all", view: [], cursor: -1, treeCollapsed: new Set(),
  current: null, editor: null, baseline: "", mode: "view", aiResult: "",
  files: [], filePath: "", fileBinary: false, full: false, aiConfigured: false,
  collapsed: new Set(), linkedSources: new Set(), source: null, sourceEditing: false,
  diffMode: "ai", pendingUpdate: null,
  groupKind: "dup", groupSel: new Set(),
  readerSize: 15, readerFont: "sans",
};

const LS = {
  recents: () => readLS("sb.recents", []),
  setRecents: (v) => localStorage.setItem("sb.recents", JSON.stringify(v.slice(0, 8))),
  history: () => readLS("sb.history", []),
  setHistory: (v) => localStorage.setItem("sb.history", JSON.stringify(v.slice(0, 8))),
};
function readLS(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } }

/* ---------- helpers ---------- */
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function highlight(name, q) {
  if (!q) return esc(name);
  const i = name.toLowerCase().indexOf(q);
  if (i < 0) return esc(name);
  return esc(name.slice(0, i)) + "<mark>" + esc(name.slice(i, i + q.length)) + "</mark>" + esc(name.slice(i + q.length));
}
function flagBadge(s) {
  if (s.conflict) return '<span class="badge conflict" title="同名但内容不同">冲突</span>';
  if (s.dup) return `<span class="badge dup" title="同名且内容一致，重复安装">重复 ×${s.dupCount}</span>`;
  return "";
}
function toast(msg, kind = "ok") {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.innerHTML = `<span class="dot">●</span>${esc(msg)}`;
  el.toasts.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .25s"; setTimeout(() => t.remove(), 260); }, 2400);
}

/* ---------- API ---------- */
const J = (r) => r.json();
const API = {
  scan: () => fetch("/api/scan", { method: "POST" }).then(J),
  all: () => fetch("/api/skills").then(J),
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
  applySource: (id, content) => fetch("/api/skills/" + id + "/source/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  getOptimizer: () => fetch("/api/optimizer").then(J),
  putOptimizer: (content) => fetch("/api/optimizer", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
  backupConfig: () => fetch("/api/backup/config").then(J),
  backupStatus: () => fetch("/api/backup/status").then(J),
  putBackupConfig: (c) => fetch("/api/backup/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }),
  backupPush: () => fetch("/api/backup/push", { method: "POST" }),
  backupRestore: () => fetch("/api/backup/restore", { method: "POST" }),
};

/* ---------- data load ---------- */
async function doScan() {
  el.scan.classList.add("loading"); el.scan.disabled = true;
  try { const d = await API.scan(); await loadAll(); toast(`扫描完成 · ${d.count ?? 0} 个 skill`); }
  catch { toast("扫描失败", "err"); }
  finally { el.scan.classList.remove("loading"); el.scan.disabled = false; }
}
async function loadAll() {
  const data = await API.all();
  state.conflicts = new Set(data.conflicts || []);
  state.dups = new Set(data.dups || []);
  state.dupCounts = data.dupCounts || {};
  state.all = (data.skills || []).map((s) => ({
    ...s, nameLower: (s.name || "").toLowerCase(), descLower: (s.description || "").toLowerCase(),
    conflict: state.conflicts.has(s.name), dup: state.dups.has(s.name), dupCount: state.dupCounts[s.name] || 0,
  }));
  state.scanned = state.all.length > 0;
  el.count.hidden = !state.scanned;
  el.count.textContent = `${state.all.length} skills`;
  try { const sd = await API.sources(); state.linkedSources = new Set(sd.linked || []); } catch { state.linkedSources = new Set(); }
  renderChips(); render();
}

/* ---------- ranking ---------- */
function scoreOf(s, q) {
  const n = s.nameLower;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(/[-_ ./]+/).some((w) => w.startsWith(q))) return 2;
  if (n.includes(q)) return 3;
  if (s.descLower.includes(q)) return 4;
  return -1;
}
function compute() {
  const q = state.query.trim().toLowerCase();
  let base = state.all;
  if (state.cat === "conflict") base = base.filter((s) => s.conflict);
  else if (state.cat === "dup") base = base.filter((s) => s.dup);
  else if (state.cat === "linked") base = base.filter((s) => state.linkedSources.has(s.id));
  else if (state.cat === "unlinked") base = base.filter((s) => !state.linkedSources.has(s.id));
  else if (state.cat === "claude" || state.cat === "codex") base = base.filter((s) => s.platform === state.cat);
  else if (state.cat !== "all") base = base.filter((s) => s.source === state.cat);
  if (!q) { state.view = base.slice().sort((a, b) => a.name.localeCompare(b.name)); return; }
  const scored = [];
  for (const s of base) { const sc = scoreOf(s, q); if (sc >= 0) scored.push([sc, s]); }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  state.view = scored.map((x) => x[1]);
}

/* ---------- chips ---------- */
function renderChips() {
  if (!state.scanned) { el.chips.hidden = true; return; }
  el.chips.hidden = false;
  const counts = { all: state.all.length, user: 0, project: 0, plugin: 0, claude: 0, codex: 0, conflict: 0, dup: 0 };
  for (const s of state.all) { counts[s.source] = (counts[s.source] || 0) + 1; if (s.platform) counts[s.platform] = (counts[s.platform] || 0) + 1; if (s.conflict) counts.conflict++; if (s.dup) counts.dup++; }
  const linked = state.linkedSources.size;
  const defs = [["all", "全部"]];
  if (counts.claude) defs.push(["claude", "Claude"]);
  if (counts.codex) defs.push(["codex", "Codex"]);
  defs.push(["user", "用户级"], ["project", "项目级"]);
  if (counts.plugin) defs.push(["plugin", "插件"]);
  if (counts.conflict) defs.push(["conflict", "冲突"]);
  if (counts.dup) defs.push(["dup", "重复"]);
  if (linked) defs.push(["linked", "有来源"]);
  defs.push(["unlinked", "无来源"]);
  counts.linked = linked; counts.unlinked = state.all.length - linked;
  el.chips.innerHTML = defs.map(([k, label]) =>
    `<button class="chip ${state.cat === k ? "active" : ""}" data-cat="${k}">${label}<span class="ct">${counts[k] || 0}</span></button>`).join("");
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
const PLAT_ORDER = ["claude", "codex"];
const SRC_ORDER = ["user", "project", "plugin"];
const CHEV = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

function renderSidebarTree() {
  const items = state.view;
  if (!items.length) { el.tree.innerHTML = `<div class="tree-empty">没有匹配的 skill</div>`; return; }
  const q = state.query.trim();
  // 搜索态：扁平相关性列表（state.view 已按 全匹配>标题命中>描述命中 排序），不分组、不字母重排。
  if (q) {
    el.tree.innerHTML = `<div class="tree-flat">${items.map((s) => treeItem(s, true)).join("")}</div>`;
    return;
  }
  // 浏览态：按 平台 → 层级 分组
  const byPlat = {};
  for (const s of items) {
    const p = s.platform || "claude";
    (byPlat[p] = byPlat[p] || {});
    (byPlat[p][s.source] = byPlat[p][s.source] || []).push(s);
  }
  let html = "";
  for (const p of PLAT_ORDER) {
    const subs = byPlat[p]; if (!subs) continue;
    const total = Object.values(subs).reduce((a, arr) => a + arr.length, 0);
    const pkey = "plat:" + p;
    const pOpen = q ? true : !state.treeCollapsed.has(pkey); // 搜索时强制全展开
    html += `<div class="tree-group">
      <button class="tree-head lvl0" data-tk="${pkey}">
        <span class="tw-chev ${pOpen ? "open" : ""}">${CHEV}</span>
        <span class="plat-dot plat-${p}"></span>
        <span class="th-name">${PLATFORM_LABEL[p] || p}</span><span class="th-ct">${total}</span></button>`;
    if (pOpen) {
      for (const src of SRC_ORDER) {
        const arr = subs[src]; if (!arr || !arr.length) continue;
        arr.sort((a, b) => a.name.localeCompare(b.name));
        const skey = "src:" + p + ":" + src;
        const sOpen = q ? true : !state.treeCollapsed.has(skey);
        html += `<button class="tree-head lvl1" data-tk="${skey}">
          <span class="tw-chev ${sOpen ? "open" : ""}">${CHEV}</span>
          <span class="th-name">${CAT_LABEL[src] || src}</span><span class="th-ct">${arr.length}</span></button>`;
        if (sOpen) html += arr.map((s) => treeItem(s)).join("");
      }
    }
    html += `</div>`;
  }
  el.tree.innerHTML = html;
}
function treeItem(s, flat) {
  const active = state.current && state.current.id === s.id ? " active" : "";
  const q = state.query.trim().toLowerCase();
  const flag = s.conflict
    ? '<span class="ti-flag conflict" title="命名冲突">冲突</span>'
    : (s.dup ? `<span class="ti-flag dup" title="重复 ${s.dupCount} 份">×${s.dupCount}</span>` : "");
  const t = s.mtime ? `<span class="ti-time" title="更新于 ${esc(fmtTime(s.mtime))}">${esc(relTime(s.mtime))}</span>` : "";
  if (!flat) {
    return `<button class="tree-item${active}" data-id="${s.id}" title="${esc(s.name)}">
      <span class="ti-name">${highlight(s.name, q)}</span>${flag}${t}</button>`;
  }
  // 扁平搜索项：带平台点 + 层级；仅描述命中时附一行描述片段，标注“描述命中”
  const dot = `<span class="plat-dot plat-${s.platform || "claude"}" title="${PLATFORM_LABEL[s.platform] || ""}"></span>`;
  const lvl = `<span class="ti-lvl">${CAT_LABEL[s.source] || s.source}</span>`;
  const descOnly = q && !s.nameLower.includes(q) && s.descLower.includes(q);
  const sub = descOnly
    ? `<span class="ti-sub"><span class="ti-sub-tag">描述命中</span>${descSnippet(s.description, q)}</span>`
    : "";
  return `<button class="tree-item flat${active}" data-id="${s.id}" title="${esc(s.name)}">
    <span class="ti-line">${dot}<span class="ti-name">${highlight(s.name, q)}</span>${flag}${lvl}${t}</span>${sub}</button>`;
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
  state.editor = CodeMirror.fromTextArea(el.ed, { mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true });
  state.editor.on("change", () => {
    el.dirty.hidden = state.editor.getValue() === state.baseline;
    if (state.mode === "split") { clearTimeout(splitPreviewTimer); splitPreviewTimer = setTimeout(() => { renderPreview(); syncFromEditor(); }, 140); }
  });
  // 用 scroller 的 DOM scroll 事件（比 CM 的 "scroll" 事件更可靠，任何滚动都触发）
  state.editor.getScrollerElement().addEventListener("scroll", syncFromEditor, { passive: true });
  el.preview.addEventListener("scroll", syncFromPreview, { passive: true });
}
// 双屏同步滚动：基于源码行锚点对齐（不是纯百分比），让两侧看到的是同一段内容。
// 用 setTimeout 清 flag（requestAnimationFrame 在无重绘/后台时可能不触发，导致 flag 卡死）。
let scrollSyncing = false;
function endSync() { setTimeout(() => { scrollSyncing = false; }, 70); }
// 编辑器顶部可视行 → 预览中对应的 y（在相邻锚点间线性插值）。
function previewYForLine(line) {
  const blks = el.preview.querySelectorAll(".pv-blk[data-line]");
  if (!blks.length) {
    const si = state.editor.getScrollInfo(); const d = si.height - si.clientHeight;
    const r = d > 0 ? si.top / d : 0; return r * (el.preview.scrollHeight - el.preview.clientHeight);
  }
  let prev = null;
  for (const b of blks) {
    const bl = +b.dataset.line;
    if (bl <= line) { prev = b; continue; }
    if (!prev) return b.offsetTop;
    const pl = +prev.dataset.line;
    const ratio = bl > pl ? (line - pl) / (bl - pl) : 0;
    return prev.offsetTop + ratio * (b.offsetTop - prev.offsetTop);
  }
  return prev ? prev.offsetTop : 0;
}
// 预览滚动位置 y → 编辑器对应的源码行（插值）。
function lineForPreviewY(y) {
  const blks = [...el.preview.querySelectorAll(".pv-blk[data-line]")];
  if (!blks.length) return null;
  let prev = null;
  for (const b of blks) {
    if (b.offsetTop <= y) { prev = b; continue; }
    if (!prev) return +b.dataset.line;
    const pl = +prev.dataset.line, bl = +b.dataset.line;
    const span = b.offsetTop - prev.offsetTop;
    const ratio = span > 0 ? (y - prev.offsetTop) / span : 0;
    return pl + ratio * (bl - pl);
  }
  return prev ? +prev.dataset.line : 0;
}
function syncFromEditor() {
  if (state.mode !== "split" || scrollSyncing || !state.editor) return;
  const cm = state.editor;
  const top = cm.getScrollInfo().top;
  // 分数行：行内插值，避免 lineAtHeight 在行边界处差一行
  const ln = cm.lineAtHeight(top, "local");
  const y0 = cm.heightAtLine(ln, "local"), y1 = cm.heightAtLine(ln + 1, "local");
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
function renderPreview() {
  const md = state.editor ? state.editor.getValue() : "";
  if (!isMd(state.filePath)) { el.preview.innerHTML = `<pre>${esc(md)}</pre>`; return; }
  const { fm, body } = splitFrontmatter(md);
  let html = "";
  if (fm) {
    const rows = fm.split(/\r?\n/).filter((l) => l.trim() && /^[A-Za-z0-9_-]+\s*:/.test(l))
      .map((l) => { const i = l.indexOf(":"); return `<div class="fm-row"><span class="fm-k">${esc(l.slice(0, i))}</span>${esc(l.slice(i + 1).trim())}</div>`; }).join("");
    if (rows) html += `<div class="fm-card">${rows}</div>`;
  }
  html += renderBodyWithAnchors(md, body || "");
  el.preview.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
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
        const single = [tok]; single.links = tokens.links || {};
        out += `<div class="pv-blk" data-line="${line}">${marked.parser(single)}</div>`;
        line += ((tok.raw || "").match(/\n/g) || []).length;
      }
      return out;
    } catch (e) { /* 回退整体渲染 */ }
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
    const savedW = (() => { try { return localStorage.getItem("sb.splitW"); } catch { return null; } })();
    if (savedW) el.sheetMain.style.setProperty("--split-w", savedW);
    el.editorWrap.hidden = false; el.preview.hidden = false; el.splitGutter.hidden = false;
    renderPreview();
    setTimeout(() => { state.editor.refresh(); syncFromEditor(); }, 30);
  } else if (m === "edit") {
    el.splitGutter.hidden = true;
    el.preview.hidden = true; el.editorWrap.hidden = false; ensureEditor();
    setTimeout(() => { state.editor.refresh(); state.editor.focus(); }, 30);
  } else {
    el.splitGutter.hidden = true;
    el.editorWrap.hidden = true; el.preview.hidden = false; renderPreview();
  }
}
// 双屏中缝拖拽：调整左右宽度，存 localStorage 记住。
(function initSplitGutter() {
  let dragging = false;
  el.splitGutter.addEventListener("mousedown", (e) => {
    dragging = true; el.splitGutter.classList.add("dragging");
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = el.sheetMain.getBoundingClientRect();
    let w = ((e.clientX - rect.left) / rect.width) * 100;
    w = Math.max(20, Math.min(80, w));
    el.sheetMain.style.setProperty("--split-w", w.toFixed(2) + "%");
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false; el.splitGutter.classList.remove("dragging");
    document.body.style.cursor = ""; document.body.style.userSelect = "";
    try { localStorage.setItem("sb.splitW", el.sheetMain.style.getPropertyValue("--split-w")); } catch { }
    if (state.editor) { state.editor.refresh(); syncFromEditor(); }
  });
})();
const FILE_SVG = '<svg class="ft-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
const FOLDER_SVG = '<svg class="ft-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>';
const CHEVRON_SVG = '<svg class="ft-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

async function loadFiles(id) {
  state.collapsed = new Set(); // 每次打开 skill 默认全展开
  try { const d = await API.files(id); state.files = d.files || []; }
  catch { state.files = []; }
  renderTree();
}
// 把后端的扁平 {rel,abs,dir} 列表构建成嵌套树
function buildTree() {
  const root = { name: "", children: {} };
  for (const f of state.files) {
    const parts = f.rel.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i], leaf = i === parts.length - 1;
      if (!node.children[name]) node.children[name] = { name, children: {}, dir: true, rel: parts.slice(0, i + 1).join("/"), abs: null };
      node = node.children[name];
      if (leaf) { node.dir = f.dir; node.abs = f.abs; }
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
  el.fileTree.innerHTML = renderNode(buildTree(), 0) || '<div class="ft-row dir" style="padding-left:8px">（空目录）</div>';
}
async function openFile(abs, mode) {
  if (!el.dirty.hidden && state.filePath && state.filePath !== abs &&
      !confirm("当前文件有未保存修改，切换将丢失。确定切换？")) return;
  let f;
  try { f = await API.readFile(abs); } catch { toast("读取文件失败", "err"); return; }
  if (f.error) { toast("读取失败：" + f.error, "err"); return; }
  state.filePath = f.abs || abs; state.fileBinary = !!f.binary;
  renderTree();
  const segBtns = el.modeSeg.querySelectorAll(".seg-btn");
  if (f.binary) { el.binaryNote.hidden = false; el.preview.hidden = true; el.editorWrap.hidden = true; segBtns.forEach((b) => (b.disabled = true)); return; }
  el.binaryNote.hidden = true; segBtns.forEach((b) => (b.disabled = false));
  ensureEditor();
  state.baseline = f.content || "";
  state.editor.setValue(f.content || "");
  state.editor.setOption("mode", isMd(abs) ? "markdown" : "text/plain");
  el.dirty.hidden = true;
  setMode(mode || state.mode || "view");
}
async function openDetail(id, fromSearch) {
  const s = await API.get(id);
  if (!s || s.error) { toast("无法打开该 skill", "err"); return; }
  state.current = s;
  el.sheetName.textContent = s.name;
  const flag = flagBadge({ conflict: state.conflicts.has(s.name), dup: state.dups.has(s.name), dupCount: state.dupCounts[s.name] || 0 });
  el.sheetBadges.innerHTML = `${platformBadge(s)}<span class="badge ${s.source}">${CAT_LABEL[s.source] || s.source}</span>${flag}`;
  el.sheetPath.textContent = s.file_path + (s.mtime ? `   ·   更新于 ${fmtTime(s.mtime)}` : "");
  el.dirty.hidden = true;
  el.detailEmpty.hidden = true; el.sheet.hidden = false; el.sheet.setAttribute("aria-hidden", "false");
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
  el.sheet.hidden = true; el.sheet.setAttribute("aria-hidden", "true");
  el.detailEmpty.hidden = false;
  state.current = null;
  el.tree.querySelectorAll(".tree-item.active").forEach((n) => n.classList.remove("active"));
}
async function doSave() {
  if (!state.current || state.fileBinary || !state.filePath) return;
  // 保存前记录：当前 skill 此前是否处于“重复组”（同名同内容），用于保存后提示同步。
  const wasDup = !!(state.current && state.dups.has(state.current.name));
  const curId = state.current && state.current.id, curName = state.current && state.current.name;
  el.save.disabled = true;
  try {
    const res = await API.putFile(state.filePath, state.editor.getValue());
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      state.baseline = state.editor.getValue(); el.dirty.hidden = true; toast("已保存");
      if (d.reindexed) {
        await loadAll();
        if (wasDup) await maybeSyncDuplicates(curId, curName);
      }
    } else toast("保存失败", "err");
  } catch { toast("保存失败", "err"); }
  finally { el.save.disabled = false; }
}
// 编辑了某个重复副本后，提示把改动一键同步到其它同名副本。
async function maybeSyncDuplicates(fromId, name) {
  const sibs = state.all.filter((s) => s.name === name && s.id !== fromId);
  if (!sibs.length) return;
  if (!confirm(`这个 skill 还有 ${sibs.length} 个同名副本。是否把它们同步为当前内容？（被覆盖的 SKILL.md 会存 .bak，可恢复）`)) return;
  try {
    const r = await API.sync(fromId, sibs.map((s) => s.id));
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast(`已同步 ${d.synced || 0} 个副本`); await loadAll(); }
    else toast(d.error || "同步失败", "err");
  } catch { toast("同步失败", "err"); }
}
async function doReveal() {
  const path = state.filePath || (state.current && state.current.file_path);
  if (!path) return;
  const res = await API.reveal(path);
  if (res.ok) toast("已在 Finder 中打开");
  else if (res.status === 501) toast("当前系统不支持 Finder 打开", "err");
  else toast("打开失败", "err");
}
function toggleFull() {
  el.workbench.classList.toggle("sidebar-collapsed");
  if (state.editor) setTimeout(() => state.editor.refresh(), 210);
}

/* ---------- 阅读字体 / 字号 ---------- */
const READER_MIN = 12, READER_MAX = 26;
const READER_FONTS = { sans: "var(--font)", serif: 'Georgia,"Songti SC","STSong",serif', mono: "var(--mono)" };
function loadReaderPrefs() {
  try {
    const s = parseInt(localStorage.getItem("sb.readerSize"), 10);
    if (s >= READER_MIN && s <= READER_MAX) state.readerSize = s;
    const f = localStorage.getItem("sb.readerFont");
    if (READER_FONTS[f]) state.readerFont = f;
  } catch { /* ignore */ }
}
function applyReader() {
  el.sheet.style.setProperty("--reader-size", state.readerSize + "px");
  el.sheet.style.setProperty("--reader-font", READER_FONTS[state.readerFont]);
  el.fsVal.textContent = state.readerSize;
  el.fontPop.querySelectorAll("[data-ff]").forEach((b) => b.classList.toggle("active", b.dataset.ff === state.readerFont));
  try { localStorage.setItem("sb.readerSize", state.readerSize); localStorage.setItem("sb.readerFont", state.readerFont); } catch { /* ignore */ }
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
  try { state.source = await API.getSource(id); } catch { state.source = null; }
  renderSourceChip();
}
function renderSourceChip() {
  const s = state.source;
  const unset = !s || (!s.source_url && !s.inferred);
  el.sourceChip.classList.toggle("unset", unset);
  if (unset) { el.sourceChip.innerHTML = `<span class="src-mut">未设置来源</span>`; return; }
  if (s.inferred && s.source_url) { el.sourceChip.innerHTML = `${LINK_SVG}<span>检测到来源</span>`; return; }
  let label = (s.source_url || "").replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  if (label.length > 30) label = label.slice(0, 30) + "…";
  el.sourceChip.innerHTML = `${LINK_SVG}<span>${esc(label)}</span>`;
}
function openSourceModal() {
  const s = state.source || {};
  const persisted = s.source_url && !s.inferred;
  const isGithub = s.source_kind === "github_repo";
  const kindOpts = ["github_repo", "github_file", "local_path", "manual", "unknown"].map((k) => `<option value="${k}" ${s.source_kind === k ? "selected" : ""}>${KIND_LABEL[k]}</option>`).join("");
  const syncOpts = ["none", "check_only", "manual_update"].map((k) => `<option value="${k}" ${(s.sync_policy || "none") === k ? "selected" : ""}>${SYNC_LABEL[k]}</option>`).join("");
  el.sourceModalBody.innerHTML = `
    ${s.inferred && s.source_url ? `<div class="modal-note">检测到 Git 来源：${srcLink(s.source_url)} —— 确认后点保存即采用。</div>` : ""}
    <div class="src-form" style="width:100%">
      <label class="field"><span>来源链接</span><input class="src-in" id="srcUrl" placeholder="https://github.com/owner/repo" value="${esc(s.source_url || "")}" /></label>
      <div class="src-row">
        <select class="src-in" id="srcKind">${kindOpts}</select>
        <input class="src-in" id="srcRef" placeholder="分支/tag/commit" value="${esc(s.source_ref || "")}" />
        <select class="src-in" id="srcSync">${syncOpts}</select>
      </div>
      <input class="src-in" id="srcNote" placeholder="备注（可选）" value="${esc(s.source_note || "")}" />
    </div>
    <div class="src-row" style="margin-top:14px">
      <button class="src-btn primary" data-act="src-save">保存</button>
      ${persisted ? `<button class="src-btn" data-act="src-copy">复制链接</button>` : ""}
      ${persisted && isGithub ? `<button class="src-btn" data-act="src-check">检查更新</button>` : ""}
      ${persisted ? `<button class="src-btn danger" data-act="src-clear">清除来源</button>` : ""}
    </div>`;
  openModal(el.sourceModal);
}
async function saveSource(id, payload) {
  try {
    const r = await API.putSource(id, payload);
    if (!r.ok) { toast("保存失败", "err"); return; }
    await loadSource(id);
    try { const sd = await API.sources(); state.linkedSources = new Set(sd.linked || []); renderChips(); } catch { /* ignore */ }
    closeModal();
    toast(payload.source_url ? "已保存来源" : "已清除来源");
  } catch { toast("保存失败", "err"); }
}
function doFind() { setMode("edit"); setTimeout(() => state.editor.execCommand("find"), 60); }

/* ---------- AI optimize + diff ---------- */
async function probeAI() {
  try { const c = await API.config(); state.aiConfigured = !!c.hasKey; }
  catch { state.aiConfigured = false; }
  el.aiOptimize.title = state.aiConfigured ? "用 AI 优化这份 skill" : "未配置 AI —— 点此前往设置填 API key 与模型";
  el.aiOptimize.classList.toggle("unconfigured", !state.aiConfigured);
}
let optSuggestions = [];
const SEV_LABEL = { high: "高", medium: "中", low: "低" };
async function doOptimize() {
  if (!state.current) return;
  if (!state.aiConfigured) { toast("请先在设置里配置 API key 和模型", "err"); openModal(el.settingsModal); await fillSettings(); return; }
  if (!isMd(state.filePath)) { toast("AI 优化仅支持 markdown 文件", "err"); return; }
  el.aiOptimize.disabled = true; el.aiOptimize.classList.add("loading");
  toast("AI 按维度体检中…");
  try {
    const res = await API.optimize(state.editor.getValue());
    if (res.status === 501) { toast("请先在设置里配置 AI", "err"); openModal(el.settingsModal); await fillSettings(); return; }
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error || "AI 优化失败", "err"); return; }
    const d = await res.json();
    optSuggestions = (d.suggestions || []).map((s, i) => ({ ...s, accepted: s.severity === "high", idx: i }));
    renderSuggestions();
    openModal(el.optimizeModal);
  } catch { toast("AI 优化失败", "err"); }
  finally { el.aiOptimize.disabled = false; el.aiOptimize.classList.remove("loading"); }
}
function renderSuggestions() {
  const n = optSuggestions.length;
  el.optSub.textContent = n ? `${n} 条建议 · 依据优化规则逐维度体检，逐条勾选采纳` : "没有发现可优化点 —— 这份 skill 已经不错。";
  el.optBody.innerHTML = optSuggestions.map((s) =>
    `<div class="sug-card ${s.accepted ? "on" : ""}" data-idx="${s.idx}">
      <div class="sug-head">
        <label class="sug-check"><input type="checkbox" ${s.accepted ? "checked" : ""}/><span>采纳</span></label>
        <span class="sug-dim">${esc(s.dimension || "")}</span>
        <span class="sev sev-${s.severity}">${SEV_LABEL[s.severity] || s.severity}</span>
      </div>
      <div class="sug-reason">${esc(s.reason || "")}</div>
      <pre class="sug-before">${esc(s.original || "")}</pre>
      <pre class="sug-after">${esc(s.suggested || "")}</pre>
    </div>`).join("") || `<div class="no-results">没有发现可优化点。</div>`;
  updateOptSel();
}
function updateOptSel() {
  const a = optSuggestions.filter((s) => s.accepted).length;
  el.optSel.textContent = a ? `已采纳 ${a}/${optSuggestions.length}` : "";
  el.optApply.disabled = a === 0;
}
function applyOptimize() {
  let content = state.editor.getValue(), miss = 0;
  for (const s of optSuggestions) {
    if (!s.accepted) continue;
    if (s.original && content.includes(s.original)) content = content.replace(s.original, s.suggested || "");
    else miss++;
  }
  state.editor.setValue(content); setMode("edit"); el.dirty.hidden = state.editor.getValue() === state.baseline;
  closeModal(); toast(`已应用采纳项${miss ? `，${miss} 处未能定位` : ""}，记得保存`);
}
/* ---------- optimizer rule editor ---------- */
let optimizerEditor = null;
async function openOptimizer() {
  let content = "";
  try { content = (await API.getOptimizer()).content || ""; } catch { toast("载入规则失败", "err"); return; }
  openModal(el.optimizerModal);
  if (!optimizerEditor) optimizerEditor = CodeMirror.fromTextArea(el.optimizerEd, { mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true });
  optimizerEditor.setValue(content);
  setTimeout(() => optimizerEditor.refresh(), 50);
}
async function saveOptimizer() {
  try { const r = await API.putOptimizer(optimizerEditor.getValue()); if (r.ok) { toast("已保存优化规则"); closeModal(); } else toast("保存失败", "err"); }
  catch { toast("保存失败", "err"); }
}

/* ---------- GitHub 备份与恢复 ---------- */
function fmtTime(unix) {
  if (!unix) return "尚未备份";
  try { return new Date(unix * 1000).toLocaleString(); } catch { return "—"; }
}
async function openBackup() {
  openModal(el.backupModal);
  el.bkStatus.textContent = ""; el.bkToken.value = "";
  try {
    const [cfg, st] = await Promise.all([API.backupConfig(), API.backupStatus()]);
    el.bkRepo.value = cfg.repoURL || "";
    el.bkBranch.value = cfg.branch || "main";
    el.bkTokenHint.textContent = cfg.hasToken ? "已保存（留空不改）" : "必填";
    el.backupStatus.textContent = st.configured
      ? `上次备份：${fmtTime(st.lastBackup)} · 仓库 ${cfg.repoURL || "—"}`
      : "未配置——填好仓库与 token 后即可一键备份";
  } catch { el.backupStatus.textContent = "载入备份配置失败"; }
}
async function saveBackupConfig() {
  const repoURL = el.bkRepo.value.trim();
  if (!repoURL) { toast("请填写备份仓库地址", "err"); return; }
  el.bkStatus.textContent = "保存中…";
  try {
    const r = await API.putBackupConfig({ repoURL, branch: el.bkBranch.value.trim(), token: el.bkToken.value });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { el.bkStatus.textContent = ""; el.bkToken.value = ""; toast("已保存备份配置"); await openBackup(); }
    else { el.bkStatus.textContent = ""; toast(d.error || "保存失败", "err"); }
  } catch { el.bkStatus.textContent = ""; toast("保存失败", "err"); }
}
async function doBackupPush() {
  el.bkPush.classList.add("loading"); el.bkPush.disabled = true; el.bkStatus.textContent = "备份中…";
  try {
    const r = await API.backupPush();
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast(d.changed ? "备份完成 ✓" : (d.message || "没有变更")); await openBackup(); }
    else { toast(d.error || "备份失败", "err"); }
  } catch { toast("备份失败", "err"); }
  finally { el.bkPush.classList.remove("loading"); el.bkPush.disabled = false; el.bkStatus.textContent = ""; }
}
async function doBackupRestore() {
  if (!confirm("将用备份仓库的内容覆盖本地 ~/.claude/skills 与 ~/.codex/skills；被覆盖的现有目录会先移到废纸篓（可恢复）。确定继续？")) return;
  el.bkRestore.classList.add("loading"); el.bkRestore.disabled = true; el.bkStatus.textContent = "恢复中…";
  try {
    const r = await API.backupRestore();
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast(d.message || "已恢复"); closeModal(); doScan(); }
    else { toast(d.error || "恢复失败", "err"); }
  } catch { toast("恢复失败", "err"); }
  finally { el.bkRestore.classList.remove("loading"); el.bkRestore.disabled = false; el.bkStatus.textContent = ""; }
}
function lineDiff(oldT, newT) {
  const a = (oldT || "").split("\n"), b = (newT || "").split("\n");
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0; const oldH = [], newH = [];
  const line = (cls, t) => `<span class="${cls}">${esc(t) || "&nbsp;"}</span>`;
  while (i < m && j < n) {
    if (a[i] === b[j]) { oldH.push(line("", a[i])); newH.push(line("", b[j])); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { oldH.push(line("del", a[i])); i++; }
    else { newH.push(line("add", b[j])); j++; }
  }
  while (i < m) oldH.push(line("del", a[i++]));
  while (j < n) newH.push(line("add", b[j++]));
  return { oldHtml: oldH.join("\n"), newHtml: newH.join("\n") };
}
function showDiff(oldT, newT, opts) {
  opts = opts || {};
  const { oldHtml, newHtml } = lineDiff(oldT, newT);
  el.diffOld.innerHTML = oldHtml; el.diffNew.innerHTML = newHtml;
  el.diffOldLabel.textContent = opts.oldLabel || "原文";
  el.diffNewLabel.textContent = opts.newLabel || "AI 优化稿";
  el.diffApply.hidden = opts.allowApply === false;
  el.diffDiscard.textContent = opts.allowApply === false ? "关闭" : "放弃";
  openModal(el.diffModal);
}
function applyDiff() {
  if (state.diffMode === "update" && state.pendingUpdate) { doApplyUpdate(); return; }
  if (state.diffMode === "ai" && state.aiResult) { ensureEditor(); state.editor.setValue(state.aiResult); setMode("edit"); el.dirty.hidden = state.editor.getValue() === state.baseline; toast("已应用 AI 稿，记得保存"); }
  closeModal();
}
async function doCheckUpdate(id) {
  toast("检查上游更新…");
  try {
    const res = await API.checkSource(id);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error || "检查失败", "err"); return; }
    const d = await res.json();
    if (!d.has_update) { toast("已是最新版本"); return; }
    state.diffMode = "update"; state.pendingUpdate = { id, content: d.remote_content };
    showDiff(state.baseline || (state.current ? state.current.body : ""), d.remote_content || "", { oldLabel: "本地", newLabel: "上游最新", allowApply: true });
  } catch { toast("检查失败", "err"); }
}
async function doApplyUpdate() {
  if (!state.pendingUpdate) return;
  const { id, content } = state.pendingUpdate;
  if (!confirm("用上游最新内容覆盖本地 SKILL.md？\n（不在 git 仓库时会先备份为 SKILL.md.bak）")) return;
  try {
    const r = await API.applySource(id, content);
    if (!r.ok) { toast("应用失败", "err"); return; }
    toast("已应用上游更新"); state.pendingUpdate = null; closeModal();
    await loadAll();
    if (state.current && state.current.id === id) await openDetail(id, false);
  } catch { toast("应用失败", "err"); }
}

/* ---------- dup/conflict groups ---------- */
function fmtSize(n) { if (n < 1024) return n + " B"; if (n < 1048576) return (n / 1024).toFixed(1) + " KB"; return (n / 1048576).toFixed(1) + " MB"; }
function fmtTime(u) { if (!u) return ""; try { return new Date(u * 1000).toLocaleDateString(); } catch { return ""; } }
async function openGroups(kind) {
  state.groupKind = kind; state.groupSel = new Set();
  el.groupsTitle.textContent = kind === "conflict" ? "冲突管理" : "重复管理";
  el.grpCompare.hidden = kind !== "conflict";
  el.groupsBody.innerHTML = '<div class="no-results">加载中…</div>';
  openModal(el.groupsModal);
  try { const d = await API.groups(kind); state.groupData = d.groups || []; renderGroups(); }
  catch { el.groupsBody.innerHTML = '<div class="no-results">加载失败</div>'; }
}
function renderGroups() {
  const groups = state.groupData || [];
  el.groupsSub.textContent = groups.length
    ? `${groups.length} 组同名${state.groupKind === "conflict" ? "（内容不同）" : "（内容一致）"}，共 ${groups.reduce((a, g) => a + g.copies.length, 0)} 个副本`
    : "没有发现" + (state.groupKind === "conflict" ? "冲突" : "重复");
  const isConflict = state.groupKind === "conflict";
  el.groupsBody.innerHTML = groups.map((g) => {
    const newest = Math.max(...g.copies.map((c) => c.mtime || 0));
    const rows = g.copies.map((c) => {
      const isNewest = isConflict && c.mtime && c.mtime === newest;
      const syncBtn = isConflict
        ? `<button class="copy-sync" data-sync="${esc(c.id)}" title="以此副本为准，覆盖同步同组其它副本（被覆盖的存 .bak）">以此为准 ›</button>`
        : "";
      return `<div class="copy-row" data-path="${esc(c.file_path)}" data-dir="${esc(c.dir)}" data-id="${esc(c.id)}">
        <input type="checkbox" ${state.groupSel.has(c.file_path) ? "checked" : ""} />
        <div class="copy-main"><div class="copy-name">${platformBadge(c)}<span class="badge ${c.source}">${CAT_LABEL[c.source] || c.source}</span>${esc(g.name)}${isNewest ? '<span class="newest-tag">最新</span>' : ""}<span class="open-link" data-open="${esc(c.id)}">打开 ›</span></div>
          <div class="copy-path">${esc(c.file_path)}</div></div>
        <div class="copy-meta">${fmtSize(c.size || 0)} · ${esc(fmtTime(c.mtime))}${syncBtn}</div></div>`;
    }).join("");
    return `<div class="group-card"><div class="group-head"><span class="gname">${esc(g.name)}</span><span class="gcount">${g.copies.length} 份</span></div>${rows}</div>`;
  }).join("") || '<div class="no-results">没有数据</div>';
  updateGroupSel();
}
function updateGroupSel() {
  const n = state.groupSel.size;
  el.groupsSel.textContent = n ? `已选 ${n}` : "";
  el.grpLocate.disabled = n === 0; el.grpTrash.disabled = n === 0;
  el.grpCompare.disabled = !(state.groupKind === "conflict" && n === 2);
}
async function grpLocate() {
  for (const p of state.groupSel) await API.reveal(p);
  toast("已在 Finder 定位 " + state.groupSel.size + " 项");
}
async function grpTrash() {
  const dirs = [];
  el.groupsBody.querySelectorAll(".copy-row").forEach((row) => { if (state.groupSel.has(row.dataset.path)) dirs.push(row.dataset.dir); });
  if (!dirs.length) return;
  if (!confirm(`将 ${dirs.length} 个 skill 目录移到废纸篓（可在访达恢复）。确定？`)) return;
  el.grpTrash.disabled = true;
  try {
    const res = await API.trash(dirs);
    if (res.status === 501) { toast("仅 macOS 支持移到废纸篓", "err"); return; }
    const d = await res.json();
    toast(`已移到废纸篓 ${(d.trashed || []).length} 项` + ((d.failed || []).length ? `，${d.failed.length} 失败` : ""));
    state.groupSel = new Set(); await loadAll();
    const g = await API.groups(state.groupKind); state.groupData = g.groups || []; renderGroups();
  } catch { toast("操作失败", "err"); }
  finally { el.grpTrash.disabled = false; }
}
async function grpCompare() {
  const ids = [];
  el.groupsBody.querySelectorAll(".copy-row").forEach((row) => { if (state.groupSel.has(row.dataset.path)) ids.push(row.dataset.id); });
  if (ids.length !== 2) return;
  const [a, b] = await Promise.all([API.get(ids[0]), API.get(ids[1])]);
  state.diffMode = "compare";
  showDiff(a.body || "", b.body || "", { oldLabel: "副本 A", newLabel: "副本 B", allowApply: false });
}
// 冲突合并：以 fromId 副本为准，覆盖同步同组其它副本。
async function grpSyncFrom(fromId) {
  const grp = (state.groupData || []).find((g) => g.copies.some((c) => c.id === fromId));
  if (!grp) return;
  const toIds = grp.copies.map((c) => c.id).filter((id) => id !== fromId);
  if (!toIds.length) return;
  if (!confirm(`将以选中副本为准，覆盖同步该组其它 ${toIds.length} 个副本（被覆盖的 SKILL.md 会存 .bak，可恢复）。确定？`)) return;
  try {
    const r = await API.sync(fromId, toIds);
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      toast(`已同步 ${d.synced || 0} 个副本` + ((d.failed || []).length ? `，${d.failed.length} 个失败` : ""));
      await loadAll();
      const g = await API.groups(state.groupKind); state.groupData = g.groups || []; renderGroups();
    } else { toast(d.error || "同步失败", "err"); }
  } catch { toast("同步失败", "err"); }
}

/* ---------- settings ---------- */
async function fillSettings() {
  try {
    const c = await API.config();
    el.cfgProvider.value = c.provider === "anthropic" ? "anthropic" : "openai";
    el.cfgBaseURL.value = c.baseURL || "";
    el.cfgModel.value = c.model || "";
    el.cfgKey.value = "";
    el.keyHint.textContent = c.hasKey ? "（已配置，可留空）" : "（未配置）";
    el.cfgStatus.textContent = ""; el.cfgStatus.className = "cfg-status";
  } catch { toast("读取配置失败", "err"); }
}
function readSettingsForm() {
  return { provider: el.cfgProvider.value, baseURL: el.cfgBaseURL.value.trim(), model: el.cfgModel.value.trim(), apiKey: el.cfgKey.value };
}
async function saveSettings() {
  el.cfgSave.disabled = true;
  try { const r = await API.putConfig(readSettingsForm()); if (r.ok) { toast("已保存设置"); await probeAI(); closeModal(); } else toast("保存失败", "err"); }
  catch { toast("保存失败", "err"); } finally { el.cfgSave.disabled = false; }
}
async function testConnection() {
  el.cfgStatus.textContent = "测试中…"; el.cfgStatus.className = "cfg-status busy";
  try {
    await API.putConfig(readSettingsForm());      // 先保存当前表单再测
    el.cfgKey.value = "";
    const r = await API.aiTest();
    if (r.status === 501) { el.cfgStatus.textContent = "未配置 key"; el.cfgStatus.className = "cfg-status err"; return; }
    const d = await r.json();
    el.cfgStatus.textContent = d.ok ? "连接成功 ✓" : ("失败：" + (d.message || ""));
    el.cfgStatus.className = "cfg-status " + (d.ok ? "ok" : "err");
    el.keyHint.textContent = "（已配置，可留空）";
    await probeAI();
  } catch { el.cfgStatus.textContent = "测试失败"; el.cfgStatus.className = "cfg-status err"; }
}

/* ---------- new skill ---------- */
async function openNew() {
  el.newName.value = ""; el.newBrief.value = ""; el.newStatus.textContent = "";
  el.importUrl.value = ""; el.importName.value = ""; setNewMode("create");
  try {
    const [rec, cfg] = await Promise.all([API.recipes(), API.config()]);
    el.newRecipe.innerHTML = (rec.recipes || []).map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("");
    el.newAiHint.textContent = cfg.hasKey ? "已配置 AI：将根据描述生成初稿。" : "未配置 AI：将插入空白脚手架，可在设置里启用 AI。";
    el.newCreate.dataset.ai = cfg.hasKey ? "1" : "";
  } catch { el.newRecipe.innerHTML = '<option value="blank">空白脚手架</option>'; el.newCreate.dataset.ai = ""; }
  openModal(el.newModal);
  setTimeout(() => el.newName.focus(), 60);
}
function scaffold(name, brief) {
  return `---\nname: ${name}\ndescription: ${brief || "TODO: 一句话描述这个 skill 何时使用"}\n---\n\n# ${name}\n\n${brief || "TODO: 写下这个 skill 的内容。"}\n`;
}
async function createSkill() {
  const name = el.newName.value.trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) { el.newStatus.textContent = "名称只能用小写字母、数字、连字符"; el.newStatus.className = "cfg-status err"; return; }
  el.newCreate.disabled = true; el.newStatus.textContent = "创建中…"; el.newStatus.className = "cfg-status busy";
  try {
    let content;
    const brief = el.newBrief.value.trim();
    if (el.newCreate.dataset.ai === "1" && brief) {
      el.newStatus.textContent = "AI 生成中…";
      const r = await API.create(name, brief, el.newRecipe.value);
      if (r.ok) content = (await r.json()).result || scaffold(name, brief);
      else content = scaffold(name, brief);
    } else content = scaffold(name, brief);
    const res = await API.newSkill(name, content);
    if (res.status === 409) { el.newStatus.textContent = "已存在同名 skill"; el.newStatus.className = "cfg-status err"; return; }
    if (!res.ok) { el.newStatus.textContent = "创建失败"; el.newStatus.className = "cfg-status err"; return; }
    const d = await res.json();
    await loadAll(); closeModal(); toast("已创建 " + name);
    if (d.id) { await openDetail(d.id, false); setMode("edit"); }
  } catch { el.newStatus.textContent = "创建失败"; el.newStatus.className = "cfg-status err"; }
  finally { el.newCreate.disabled = false; }
}

function setNewMode(m) {
  el.newModeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.nmode === m));
  const imp = m === "import";
  el.newCreateFields.hidden = imp; el.newImportFields.hidden = !imp;
  el.newCreate.hidden = imp; el.newImport.hidden = !imp;
  el.newStatus.textContent = "";
}
async function doImport() {
  const url = el.importUrl.value.trim();
  if (!url) { el.newStatus.textContent = "请填 GitHub 链接"; el.newStatus.className = "cfg-status err"; return; }
  el.newImport.disabled = true; el.newStatus.textContent = "克隆中…（可能需要几秒）"; el.newStatus.className = "cfg-status busy";
  try {
    const res = await API.importSkill(url, el.importName.value.trim());
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = { 400: "链接非法或非 github.com", 409: "已存在同名 skill", 422: "该目录下没有 SKILL.md", 502: "克隆仓库失败" }[res.status] || d.error || "导入失败";
      el.newStatus.textContent = msg; el.newStatus.className = "cfg-status err"; return;
    }
    await loadAll(); closeModal(); toast("已导入 " + (d.name || ""));
    if (d.id) { await openDetail(d.id, false); }
  } catch { el.newStatus.textContent = "导入失败"; el.newStatus.className = "cfg-status err"; }
  finally { el.newImport.disabled = false; }
}

/* ---------- modal helpers ---------- */
let openModalEl = null;
function openModal(m) {
  if (openModalEl) openModalEl.hidden = true;
  openModalEl = m;
  el.modalScrim.hidden = false; m.hidden = false;
  requestAnimationFrame(() => { el.modalScrim.classList.add("show"); m.classList.add("show"); });
}
function closeModal() {
  if (!openModalEl) return;
  const m = openModalEl; openModalEl = null;
  el.modalScrim.classList.remove("show"); m.classList.remove("show");
  setTimeout(() => { el.modalScrim.hidden = true; m.hidden = true; }, 220);
}

/* ---------- history ---------- */
function pushHistory(q) { let h = LS.history().filter((x) => x !== q); h.unshift(q); LS.setHistory(h); }

/* ---------- events ---------- */
let searchTimer = null;
el.q.addEventListener("input", (e) => {
  state.query = e.target.value; el.clear.hidden = !state.query; state.cursor = -1;
  clearTimeout(searchTimer); searchTimer = setTimeout(render, 90);
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
el.clear.addEventListener("click", () => { state.query = ""; el.q.value = ""; el.clear.hidden = true; state.cursor = -1; el.q.focus(); render(); });

el.chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  const cat = b.dataset.cat;
  if (cat === "dup" || cat === "conflict") { openGroups(cat); return; }
  state.cat = cat; renderChips(); render();
});
// 右上角计数 pill / 左上角 logo：清空搜索与筛选，回到全部。
function resetToAll() {
  state.cat = "all"; state.query = ""; el.q.value = ""; el.clear.hidden = true;
  renderChips(); render();
}
el.count.addEventListener("click", () => { if (state.scanned) resetToAll(); });
const brandEl = document.querySelector(".brand");
if (brandEl) brandEl.addEventListener("click", resetToAll);

// 左侧树：点 group head 折叠/展开，点 skill 项打开详情。
el.tree.addEventListener("click", (e) => {
  const head = e.target.closest(".tree-head[data-tk]");
  if (head) { const k = head.dataset.tk; if (state.treeCollapsed.has(k)) state.treeCollapsed.delete(k); else state.treeCollapsed.add(k); renderSidebarTree(); return; }
  const item = e.target.closest(".tree-item[data-id]");
  if (item) openDetail(item.dataset.id, !!state.query.trim());
});

el.scan.addEventListener("click", doScan);
el.sidebarToggle.addEventListener("click", toggleFull);
el.save.addEventListener("click", doSave);
// 阅读字体/字号面板
el.fontBtn.addEventListener("click", (e) => { e.stopPropagation(); el.fontPop.hidden = !el.fontPop.hidden; });
el.fontPop.addEventListener("click", (e) => {
  e.stopPropagation();
  const fs = e.target.closest("[data-fs]");
  if (fs) {
    state.readerSize = Math.max(READER_MIN, Math.min(READER_MAX, state.readerSize + (fs.dataset.fs === "+" ? 1 : -1)));
    applyReader(); return;
  }
  const ff = e.target.closest("[data-ff]");
  if (ff) { state.readerFont = ff.dataset.ff; applyReader(); }
});
document.addEventListener("click", () => { if (!el.fontPop.hidden) el.fontPop.hidden = true; });
el.reveal.addEventListener("click", doReveal);
el.findBtn.addEventListener("click", doFind);
el.aiOptimize.addEventListener("click", doOptimize);
el.modeSeg.addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (b && !b.disabled) setMode(b.dataset.mode); });
el.sheetFull.addEventListener("click", toggleFull);
el.sourceChip.addEventListener("click", () => { if (state.current) openSourceModal(); });
el.sourceModalBody.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !state.current) return;
  const act = b.dataset.act, id = state.current.id;
  if (act === "src-copy") { if (state.source && navigator.clipboard) navigator.clipboard.writeText(state.source.source_url); toast("已复制来源链接"); }
  else if (act === "src-check") { closeModal(); doCheckUpdate(id); }
  else if (act === "src-save") { await saveSource(id, { source_url: $("#srcUrl").value.trim(), source_kind: $("#srcKind").value, source_ref: $("#srcRef").value.trim(), sync_policy: $("#srcSync").value, source_note: $("#srcNote").value.trim() }); }
  else if (act === "src-clear") { if (confirm("清除该 skill 的来源信息？")) await saveSource(id, { source_url: "" }); }
});
el.fileTree.addEventListener("click", (e) => {
  const tog = e.target.closest(".ft-row[data-toggle]");
  if (tog) { const rel = tog.dataset.toggle; if (state.collapsed.has(rel)) state.collapsed.delete(rel); else state.collapsed.add(rel); renderTree(); return; }
  const row = e.target.closest(".ft-row[data-abs]"); if (row) openFile(row.dataset.abs, state.mode);
});

el.groupsBody.addEventListener("click", (e) => {
  const sync = e.target.closest("[data-sync]"); if (sync) { e.stopPropagation(); grpSyncFrom(sync.dataset.sync); return; }
  const open = e.target.closest(".open-link"); if (open) { closeModal(); openDetail(open.dataset.open, false); return; }
  const row = e.target.closest(".copy-row"); if (!row) return;
  const path = row.dataset.path;
  if (state.groupSel.has(path)) state.groupSel.delete(path); else state.groupSel.add(path);
  const cb = row.querySelector("input[type=checkbox]"); if (cb) cb.checked = state.groupSel.has(path);
  updateGroupSel();
});
el.grpLocate.addEventListener("click", grpLocate);
el.grpTrash.addEventListener("click", grpTrash);
el.grpCompare.addEventListener("click", grpCompare);

el.optBody.addEventListener("click", (e) => {
  const card = e.target.closest(".sug-card"); if (!card) return;
  const idx = +card.dataset.idx; const s = optSuggestions.find((x) => x.idx === idx); if (!s) return;
  s.accepted = !s.accepted;
  card.classList.toggle("on", s.accepted);
  const cb = card.querySelector("input[type=checkbox]"); if (cb) cb.checked = s.accepted;
  updateOptSel();
});
el.optAll.addEventListener("click", () => { optSuggestions.forEach((s) => (s.accepted = true)); renderSuggestions(); });
el.optNone.addEventListener("click", () => { optSuggestions.forEach((s) => (s.accepted = false)); renderSuggestions(); });
el.optApply.addEventListener("click", applyOptimize);
el.editOptimizer.addEventListener("click", openOptimizer);
el.optimizerSave.addEventListener("click", saveOptimizer);
el.openBackup.addEventListener("click", openBackup);
el.bkSave.addEventListener("click", saveBackupConfig);
el.bkPush.addEventListener("click", doBackupPush);
el.bkRestore.addEventListener("click", doBackupRestore);

el.settings.addEventListener("click", async () => { openModal(el.settingsModal); await fillSettings(); });
el.cfgSave.addEventListener("click", saveSettings);
el.cfgTest.addEventListener("click", testConnection);
el.newSkill.addEventListener("click", openNew);
el.newCreate.addEventListener("click", createSkill);
el.newImport.addEventListener("click", doImport);
el.newModeSeg.addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (b) setNewMode(b.dataset.nmode); });
el.diffApply.addEventListener("click", applyDiff);
el.diffDiscard.addEventListener("click", closeModal);
el.modalScrim.addEventListener("click", closeModal);
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (openModalEl) return closeModal(); if (!el.sheet.hidden) return closeSheet(); }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && !el.sheet.hidden && openModalEl === null) { e.preventDefault(); doFind(); return; }
  if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && el.sheet.hidden && openModalEl === null) {
    if (document.activeElement !== el.q) { e.preventDefault(); el.q.focus(); el.q.select(); }
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
    { count: 32, min: 1.6, max: 3.0, glow: 0.4 },
  ];
  layers.forEach((layer, li) => {
    const s = specs[li] || specs[0];
    let html = "";
    for (let i = 0; i < s.count; i++) {
      const x = (Math.random() * 100).toFixed(3);
      const y = (Math.random() * 100).toFixed(3);
      const size = (s.min + Math.random() * (s.max - s.min)).toFixed(2);
      const color = COLORS[(Math.random() * COLORS.length) | 0];
      const alpha = (0.45 + Math.random() * 0.55).toFixed(2);
      const delay = (-Math.random() * 8).toFixed(2);      // 闪烁相位随机，避免同步
      const dur = (4 + Math.random() * 5).toFixed(2);
      const glow = Math.random() < s.glow ? `;box-shadow:0 0 ${(+size * 2.5).toFixed(1)}px rgba(${color},${alpha})` : "";
      html += `<i class="star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:rgba(${color},${alpha});animation-delay:${delay}s;animation-duration:${dur}s${glow}"></i>`;
    }
    layer.innerHTML = html;
  });
}

/* ---------- boot ---------- */
(async function boot() {
  buildSky();
  loadReaderPrefs();
  applyReader();
  try { await loadAll(); } catch { /* not scanned yet */ }
  probeAI();
  render(); el.q.focus();
})();
