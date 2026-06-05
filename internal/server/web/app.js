/* ===================== SkillBook front-end ===================== */
const $ = (s) => document.querySelector(s);
const el = {
  scan: $("#scan"), newSkill: $("#newSkill"), settings: $("#settings"),
  q: $("#q"), clear: $("#clear"), searchWrap: $("#searchWrap"), stage: $("#stage"),
  count: $("#count"), chips: $("#chips"),
  overview: $("#overview"), emptyHero: $("#emptyHero"),
  resultsView: $("#resultsView"), resultsMeta: $("#resultsMeta"),
  viewport: $("#viewport"), sizer: $("#sizer"), window: $("#window"),
  scrim: $("#scrim"), sheet: $("#sheet"), sheetName: $("#sheetName"),
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"), sheetClose: $("#sheetClose"), sourceBox: $("#sourceBox"),
  modeSeg: $("#modeSeg"), preview: $("#preview"), editorWrap: $("#editorWrap"), ed: $("#ed"),
  binaryNote: $("#binaryNote"), fileTree: $("#fileTree"), sheetFull: $("#sheetFull"),
  aiOptimize: $("#aiOptimize"), findBtn: $("#findBtn"), reveal: $("#reveal"),
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

const ROW_H = 60, OVERSCAN = 6;
const CAT_LABEL = { user: "用户级", project: "项目级", plugin: "插件" };
const CHIP_LABEL = { user: "用户级", project: "项目级", plugin: "插件", conflict: "冲突", dup: "重复", linked: "有来源", unlinked: "无来源" };
const CAT_ORDER = ["user", "project", "plugin"];

const state = {
  all: [], conflicts: new Set(), dups: new Set(), dupCounts: {},
  scanned: false, query: "", cat: "all", view: [], cursor: -1, justChanged: false,
  current: null, editor: null, baseline: "", mode: "view", aiResult: "",
  files: [], filePath: "", fileBinary: false, full: false, aiConfigured: false,
  collapsed: new Set(), linkedSources: new Set(), source: null, sourceEditing: false,
  diffMode: "ai", pendingUpdate: null,
  groupKind: "dup", groupSel: new Set(),
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
  getSource: (id) => fetch("/api/skills/" + id + "/source").then(J),
  putSource: (id, s) => fetch("/api/skills/" + id + "/source", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }),
  sources: () => fetch("/api/sources").then(J),
  importSkill: (url, name) => fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, name }) }),
  checkSource: (id) => fetch("/api/skills/" + id + "/source/check", { method: "POST" }),
  applySource: (id, content) => fetch("/api/skills/" + id + "/source/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }),
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
  const counts = { all: state.all.length, user: 0, project: 0, plugin: 0, conflict: 0, dup: 0 };
  for (const s of state.all) { counts[s.source] = (counts[s.source] || 0) + 1; if (s.conflict) counts.conflict++; if (s.dup) counts.dup++; }
  const linked = state.linkedSources.size;
  const defs = [["all", "全部"], ["user", "用户级"], ["project", "项目级"]];
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
  const showOverview = state.scanned && !state.query.trim() && state.cat === "all";
  el.stage.classList.toggle("compact", state.scanned && !showOverview);
  el.overview.hidden = !(showOverview || !state.scanned);
  el.resultsView.hidden = !state.scanned || showOverview;
  if (!state.scanned) { renderEmptyHero(); return; }
  if (showOverview) { renderOverview(); return; }
  renderResults();
}
function renderEmptyHero() { el.emptyHero.hidden = false; el.overview.innerHTML = ""; el.overview.appendChild(el.emptyHero); }

/* ---------- overview ---------- */
function renderOverview() {
  el.emptyHero.hidden = true;
  const recents = LS.recents().filter((r) => state.all.some((s) => s.id === r.id));
  const history = LS.history();
  const counts = { user: 0, project: 0, plugin: 0 };
  for (const s of state.all) counts[s.source] = (counts[s.source] || 0) + 1;
  let html = "";
  if (recents.length) {
    html += `<div class="ov-section"><div class="ov-head">最近打开</div>
      <div class="recent-grid">${recents.map((r) =>
        `<div class="recent-card" data-id="${r.id}"><div class="rc-name">${esc(r.name)}</div><div class="rc-desc">${esc(r.description || "—")}</div></div>`).join("")}</div></div>`;
  }
  if (history.length) {
    html += `<div class="ov-section"><div class="ov-head">最近搜索<span class="clear-hist" data-act="clearhist">清除</span></div>
      <div class="hist-row">${history.map((h) =>
        `<button class="hist-tag" data-hist="${esc(h)}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>${esc(h)}</button>`).join("")}</div></div>`;
  }
  const catIcon = {
    user: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    project: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
    plugin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
  };
  html += `<div class="ov-section"><div class="ov-head">按来源分类</div>
    <div class="cat-grid">${CAT_ORDER.map((k) =>
      `<div class="cat-card" data-cat="${k}"><div class="cat-ico ${k}">${catIcon[k]}</div>
        <div class="cat-meta"><div class="cat-name">${CAT_LABEL[k]}</div><div class="cat-count">${counts[k] || 0} 个 skill</div></div></div>`).join("")}</div></div>`;
  el.overview.innerHTML = html;
}

/* ---------- results virtual list ---------- */
function rowHTML(s, idx, animate) {
  const cls = "row" + (idx === state.cursor ? " cursor" : "") + (animate ? " enter" : "");
  const delay = animate ? `style="animation-delay:${Math.min(idx, 14) * 26}ms"` : "";
  return `<div class="${cls}" ${delay} data-idx="${idx}" data-id="${s.id}">
    <div class="row-main"><div class="row-name">${highlight(s.name, state.query.trim().toLowerCase())}
      <span class="badge ${s.source}">${CAT_LABEL[s.source] || s.source}</span>${flagBadge(s)}</div>
      <div class="row-desc">${esc(s.description || "—")}</div></div></div>`;
}
function renderResults() {
  const n = state.view.length, q = state.query.trim();
  el.resultsMeta.innerHTML = n
    ? `<b>${n}</b> 个结果${q ? ` · 关键词「${esc(q)}」精确优先` : ""}${state.cat !== "all" ? ` · ${CHIP_LABEL[state.cat] || state.cat}` : ""}`
    : "";
  el.sizer.style.height = n * ROW_H + "px";
  el.viewport.scrollTop = 0;
  if (!n) { el.window.style.transform = "none"; el.window.innerHTML = `<div class="no-results">没有匹配的 skill。<br>试试更短的关键词或切换分类。</div>`; return; }
  state.justChanged = true; renderWindow();
}
function renderWindow() {
  const n = state.view.length; if (!n) return;
  const top = el.viewport.scrollTop, h = el.viewport.clientHeight;
  const start = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const end = Math.min(n, Math.ceil((top + h) / ROW_H) + OVERSCAN);
  const animate = state.justChanged; state.justChanged = false;
  el.window.style.transform = `translateY(${start * ROW_H}px)`;
  let html = "";
  for (let i = start; i < end; i++) html += rowHTML(state.view[i], i, animate && i < start + 18);
  el.window.innerHTML = html;
}

/* ---------- detail sheet ---------- */
function ensureEditor() {
  if (state.editor) return;
  state.editor = CodeMirror.fromTextArea(el.ed, { mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true });
  state.editor.on("change", () => { el.dirty.hidden = state.editor.getValue() === state.baseline; });
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
  const bodyHtml = window.marked ? marked.parse(body || "") : esc(body);
  html += window.DOMPurify ? DOMPurify.sanitize(bodyHtml) : bodyHtml;
  el.preview.innerHTML = html;
}
function setMode(m) {
  if (state.fileBinary) return;
  state.mode = m;
  el.modeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  if (m === "edit") {
    el.preview.hidden = true; el.editorWrap.hidden = false; ensureEditor();
    setTimeout(() => { state.editor.refresh(); state.editor.focus(); }, 30);
  } else {
    el.editorWrap.hidden = true; el.preview.hidden = false; renderPreview();
  }
}
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
  el.sheetBadges.innerHTML = `<span class="badge ${s.source}">${CAT_LABEL[s.source] || s.source}</span>${flag}`;
  el.sheetPath.textContent = s.file_path;
  el.dirty.hidden = true;
  el.scrim.hidden = false; el.sheet.hidden = false; el.sheet.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => { el.scrim.classList.add("show"); el.sheet.classList.add("show"); });
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
  el.scrim.classList.remove("show"); el.sheet.classList.remove("show"); el.sheet.setAttribute("aria-hidden", "true");
  setTimeout(() => { el.scrim.hidden = true; el.sheet.hidden = true; }, 260);
  state.current = null; state.full = false; el.sheet.classList.remove("full");
  if (!el.overview.hidden) renderOverview(); // 回到首页时刷新“最近打开”
}
async function doSave() {
  if (!state.current || state.fileBinary || !state.filePath) return;
  el.save.disabled = true;
  try {
    const res = await API.putFile(state.filePath, state.editor.getValue());
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      state.baseline = state.editor.getValue(); el.dirty.hidden = true; toast("已保存");
      if (d.reindexed) await loadAll();
    } else toast("保存失败", "err");
  } catch { toast("保存失败", "err"); }
  finally { el.save.disabled = false; }
}
async function doReveal() {
  const path = state.filePath || (state.current && state.current.file_path);
  if (!path) return;
  const res = await API.reveal(path);
  if (res.ok) toast("已在 Finder 中打开");
  else if (res.status === 501) toast("当前系统不支持 Finder 打开", "err");
  else toast("打开失败", "err");
}
function toggleFull() { state.full = !state.full; el.sheet.classList.toggle("full", state.full); if (state.editor) setTimeout(() => state.editor.refresh(), 50); }

/* ---------- source link ---------- */
const KIND_LABEL = { github_repo: "GitHub 仓库", github_file: "GitHub 文件", local_path: "本地目录", manual: "手动", unknown: "未知" };
const SYNC_LABEL = { none: "不同步", check_only: "仅检查更新", manual_update: "手动更新" };
function srcLink(url) {
  if (/^https?:\/\//i.test(url || "")) return `<a class="src-url" href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;
  return `<span class="src-url" style="color:var(--text-dim)">${esc(url || "")}</span>`;
}
async function loadSource(id) {
  state.sourceEditing = false;
  try { state.source = await API.getSource(id); } catch { state.source = null; }
  renderSource();
}
function sourceForm(s) {
  s = s || {};
  return `<div class="src-form">
    <input class="src-in" id="srcUrl" placeholder="来源链接 https://github.com/owner/repo" value="${esc(s.source_url || "")}" />
    <div class="src-row">
      <select class="src-in" id="srcKind">${["github_repo", "github_file", "local_path", "manual", "unknown"].map((k) => `<option value="${k}" ${s.source_kind === k ? "selected" : ""}>${KIND_LABEL[k]}</option>`).join("")}</select>
      <input class="src-in" id="srcRef" placeholder="分支/tag/commit" value="${esc(s.source_ref || "")}" />
      <select class="src-in" id="srcSync">${["none", "check_only", "manual_update"].map((k) => `<option value="${k}" ${(s.sync_policy || "none") === k ? "selected" : ""}>${SYNC_LABEL[k]}</option>`).join("")}</select>
    </div>
    <input class="src-in" id="srcNote" placeholder="备注（可选）" value="${esc(s.source_note || "")}" />
    <div class="src-row">
      <button class="src-btn primary" data-act="src-save">保存</button>
      <button class="src-btn" data-act="src-cancel">取消</button>
      ${s.source_url && !s.inferred ? `<button class="src-btn danger" data-act="src-clear">清除来源</button>` : ""}
    </div></div>`;
}
function renderSource() {
  const s = state.source;
  if (state.sourceEditing) { el.sourceBox.innerHTML = sourceForm(s); return; }
  if (!s || (!s.source_url && !s.inferred)) {
    el.sourceBox.innerHTML = `<span class="src-mut">未设置来源</span><button class="src-btn" data-act="src-edit">+ 添加来源</button>`;
    return;
  }
  if (s.inferred && s.source_url) {
    el.sourceBox.innerHTML = `<span class="src-tag infer">检测到 Git 来源</span>${srcLink(s.source_url)}<button class="src-btn primary" data-act="src-adopt">采用</button><button class="src-btn" data-act="src-edit">编辑</button>`;
    return;
  }
  const checkBtn = s.source_kind === "github_repo" ? `<button class="src-btn" data-act="src-check">检查更新</button>` : "";
  el.sourceBox.innerHTML = `<span class="src-tag">${esc(KIND_LABEL[s.source_kind] || s.source_kind)}</span>${srcLink(s.source_url)}${s.source_ref ? `<span class="src-mut">@${esc(s.source_ref)}</span>` : ""}<span class="src-mut">· ${esc(SYNC_LABEL[s.sync_policy] || s.sync_policy)}</span>${checkBtn}<button class="src-btn" data-act="src-copy">复制</button><button class="src-btn" data-act="src-edit">编辑</button>${s.source_note ? `<div class="src-note">${esc(s.source_note)}</div>` : ""}`;
}
async function saveSource(id, payload) {
  try {
    const r = await API.putSource(id, payload);
    if (!r.ok) { toast("保存失败", "err"); return; }
    state.sourceEditing = false;
    await loadSource(id);
    try { const sd = await API.sources(); state.linkedSources = new Set(sd.linked || []); renderChips(); } catch { /* ignore */ }
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
async function doOptimize() {
  if (!state.current) return;
  if (!state.aiConfigured) { toast("请先在设置里配置 API key 和模型", "err"); openModal(el.settingsModal); await fillSettings(); return; }
  if (!isMd(state.filePath)) { toast("AI 优化仅支持 markdown 文件", "err"); return; }
  el.aiOptimize.disabled = true; el.aiOptimize.classList.add("loading");
  try {
    const res = await API.optimize(state.editor.getValue());
    if (res.status === 501) { toast("请先在设置里配置 AI", "err"); openModal(el.settingsModal); await fillSettings(); return; }
    if (!res.ok) { toast("AI 优化失败", "err"); return; }
    const d = await res.json();
    state.aiResult = d.result || "";
    state.diffMode = "ai";
    showDiff(state.editor.getValue(), state.aiResult);
  } catch { toast("AI 优化失败", "err"); }
  finally { el.aiOptimize.disabled = false; el.aiOptimize.classList.remove("loading"); }
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
  el.groupsBody.innerHTML = groups.map((g) => {
    const rows = g.copies.map((c) =>
      `<div class="copy-row" data-path="${esc(c.file_path)}" data-dir="${esc(c.dir)}" data-id="${esc(c.id)}">
        <input type="checkbox" ${state.groupSel.has(c.file_path) ? "checked" : ""} />
        <div class="copy-main"><div class="copy-name"><span class="badge ${c.source}">${CAT_LABEL[c.source] || c.source}</span>${esc(g.name)}<span class="open-link" data-open="${esc(c.id)}">打开 ›</span></div>
          <div class="copy-path">${esc(c.file_path)}</div></div>
        <div class="copy-meta">${fmtSize(c.size || 0)} · ${fmtTime(c.mtime)}</div></div>`).join("");
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
    const idx = state.cursor >= 0 ? state.cursor : 0;
    if (state.query.trim()) pushHistory(state.query.trim());
    openDetail(state.view[idx].id, true);
  } else if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
});
el.q.addEventListener("focus", () => el.searchWrap.classList.add("focused"));
el.q.addEventListener("blur", () => el.searchWrap.classList.remove("focused"));
el.clear.addEventListener("click", () => { state.query = ""; el.q.value = ""; el.clear.hidden = true; state.cursor = -1; el.q.focus(); render(); });

el.chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  const cat = b.dataset.cat;
  if (cat === "dup" || cat === "conflict") { openGroups(cat); return; }
  state.cat = cat; state.cursor = -1; renderChips(); render();
});
el.overview.addEventListener("click", (e) => {
  const card = e.target.closest(".recent-card"); if (card) return openDetail(card.dataset.id, false);
  const cat = e.target.closest(".cat-card"); if (cat) { state.cat = cat.dataset.cat; renderChips(); render(); return; }
  const hist = e.target.closest(".hist-tag"); if (hist) { state.query = hist.dataset.hist; el.q.value = state.query; el.clear.hidden = false; render(); el.q.focus(); return; }
  const clr = e.target.closest('[data-act="clearhist"]'); if (clr) { e.stopPropagation(); LS.setHistory([]); renderOverview(); }
});
el.window.addEventListener("click", (e) => { const row = e.target.closest(".row"); if (row) openDetail(row.dataset.id, !!state.query.trim()); });
el.viewport.addEventListener("scroll", () => requestAnimationFrame(renderWindow), { passive: true });
window.addEventListener("resize", () => { if (!el.resultsView.hidden) renderWindow(); });

function moveCursor(d) {
  const n = state.view.length; if (!n) return;
  state.cursor = (state.cursor + d + n) % n; state.justChanged = false;
  const y = state.cursor * ROW_H;
  if (y < el.viewport.scrollTop) el.viewport.scrollTop = y;
  else if (y + ROW_H > el.viewport.scrollTop + el.viewport.clientHeight) el.viewport.scrollTop = y + ROW_H - el.viewport.clientHeight;
  renderWindow();
}

el.scan.addEventListener("click", doScan);
el.save.addEventListener("click", doSave);
el.sheetClose.addEventListener("click", closeSheet);
el.scrim.addEventListener("click", closeSheet);
el.reveal.addEventListener("click", doReveal);
el.findBtn.addEventListener("click", doFind);
el.aiOptimize.addEventListener("click", doOptimize);
el.modeSeg.addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (b && !b.disabled) setMode(b.dataset.mode); });
el.sheetFull.addEventListener("click", toggleFull);
el.sourceBox.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !state.current) return;
  const act = b.dataset.act, id = state.current.id;
  if (act === "src-edit") { state.sourceEditing = true; renderSource(); }
  else if (act === "src-cancel") { state.sourceEditing = false; renderSource(); }
  else if (act === "src-copy") { if (state.source && navigator.clipboard) navigator.clipboard.writeText(state.source.source_url); toast("已复制来源链接"); }
  else if (act === "src-check") { doCheckUpdate(id); }
  else if (act === "src-adopt") { await saveSource(id, { source_url: state.source.source_url, source_kind: state.source.source_kind, source_ref: state.source.source_ref || "", source_note: "", sync_policy: "check_only" }); }
  else if (act === "src-save") { await saveSource(id, { source_url: $("#srcUrl").value.trim(), source_kind: $("#srcKind").value, source_ref: $("#srcRef").value.trim(), sync_policy: $("#srcSync").value, source_note: $("#srcNote").value.trim() }); }
  else if (act === "src-clear") { if (confirm("清除该 skill 的来源信息？")) await saveSource(id, { source_url: "" }); }
});
el.fileTree.addEventListener("click", (e) => {
  const tog = e.target.closest(".ft-row[data-toggle]");
  if (tog) { const rel = tog.dataset.toggle; if (state.collapsed.has(rel)) state.collapsed.delete(rel); else state.collapsed.add(rel); renderTree(); return; }
  const row = e.target.closest(".ft-row[data-abs]"); if (row) openFile(row.dataset.abs, state.mode);
});

el.groupsBody.addEventListener("click", (e) => {
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

/* ---------- boot ---------- */
(async function boot() {
  try { await loadAll(); } catch { /* not scanned yet */ }
  probeAI();
  render(); el.q.focus();
})();
