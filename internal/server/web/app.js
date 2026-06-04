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
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"), sheetClose: $("#sheetClose"),
  modeSeg: $("#modeSeg"), preview: $("#preview"), editorWrap: $("#editorWrap"), ed: $("#ed"),
  aiOptimize: $("#aiOptimize"), findBtn: $("#findBtn"), reveal: $("#reveal"),
  save: $("#save"), dirty: $("#dirty"),
  modalScrim: $("#modalScrim"),
  settingsModal: $("#settingsModal"), cfgProvider: $("#cfgProvider"), cfgBaseURL: $("#cfgBaseURL"),
  cfgModel: $("#cfgModel"), cfgKey: $("#cfgKey"), keyHint: $("#keyHint"),
  cfgTest: $("#cfgTest"), cfgStatus: $("#cfgStatus"), cfgSave: $("#cfgSave"),
  newModal: $("#newModal"), newName: $("#newName"), newRecipe: $("#newRecipe"),
  newBrief: $("#newBrief"), newAiHint: $("#newAiHint"), newStatus: $("#newStatus"), newCreate: $("#newCreate"),
  diffModal: $("#diffModal"), diffOld: $("#diffOld"), diffNew: $("#diffNew"),
  diffApply: $("#diffApply"), diffDiscard: $("#diffDiscard"),
  toasts: $("#toasts"),
};

const ROW_H = 60, OVERSCAN = 6;
const CAT_LABEL = { user: "用户级", project: "项目级", plugin: "插件" };
const CAT_ORDER = ["user", "project", "plugin"];

const state = {
  all: [], conflicts: new Set(), dups: new Set(), dupCounts: {},
  scanned: false, query: "", cat: "all", view: [], cursor: -1, justChanged: false,
  current: null, editor: null, baseline: "", mode: "view", aiResult: "",
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
  const defs = [["all", "全部"], ["user", "用户级"], ["project", "项目级"], ["plugin", "插件"]];
  if (counts.conflict) defs.push(["conflict", "冲突"]);
  if (counts.dup) defs.push(["dup", "重复"]);
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
    ? `<b>${n}</b> 个结果${q ? ` · 关键词「${esc(q)}」精确优先` : ""}${state.cat !== "all" ? ` · ${CAT_LABEL[state.cat] || (state.cat === "dup" ? "重复" : "冲突")}` : ""}`
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
function renderPreview() {
  const md = state.editor ? state.editor.getValue() : (state.current ? state.current.body : "");
  const html = window.marked ? marked.parse(md || "") : esc(md);
  el.preview.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
}
function setMode(m) {
  state.mode = m;
  el.modeSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  if (m === "edit") {
    el.preview.hidden = true; el.editorWrap.hidden = false; ensureEditor();
    setTimeout(() => { state.editor.refresh(); state.editor.focus(); }, 30);
  } else {
    el.editorWrap.hidden = true; el.preview.hidden = false; renderPreview();
  }
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
  state.baseline = s.body || "";
  state.editor.setValue(s.body || "");
  setMode("view");
  const recents = LS.recents().filter((r) => r.id !== id);
  recents.unshift({ id, name: s.name, description: s.description });
  LS.setRecents(recents);
  if (fromSearch && state.query.trim()) pushHistory(state.query.trim());
}
function closeSheet() {
  el.scrim.classList.remove("show"); el.sheet.classList.remove("show"); el.sheet.setAttribute("aria-hidden", "true");
  setTimeout(() => { el.scrim.hidden = true; el.sheet.hidden = true; }, 260);
  state.current = null;
}
async function doSave() {
  if (!state.current) return;
  el.save.disabled = true;
  try {
    const res = await API.save(state.current.id, state.editor.getValue());
    if (res.ok) { state.baseline = state.editor.getValue(); el.dirty.hidden = true; toast("已保存"); await loadAll(); }
    else toast("保存失败", "err");
  } catch { toast("保存失败", "err"); }
  finally { el.save.disabled = false; }
}
async function doReveal() {
  if (!state.current) return;
  const res = await API.reveal(state.current.file_path);
  if (res.ok) toast("已在 Finder 中打开");
  else if (res.status === 501) toast("当前系统不支持 Finder 打开", "err");
  else toast("打开失败", "err");
}
function doFind() { setMode("edit"); setTimeout(() => state.editor.execCommand("find"), 60); }

/* ---------- AI optimize + diff ---------- */
async function doOptimize() {
  if (!state.current) return;
  el.aiOptimize.disabled = true; el.aiOptimize.classList.add("loading");
  try {
    const res = await API.optimize(state.editor.getValue());
    if (res.status === 501) { toast("请先在设置里配置 AI", "err"); openModal(el.settingsModal); await fillSettings(); return; }
    if (!res.ok) { toast("AI 优化失败", "err"); return; }
    const d = await res.json();
    state.aiResult = d.result || "";
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
function showDiff(oldT, newT) {
  const { oldHtml, newHtml } = lineDiff(oldT, newT);
  el.diffOld.innerHTML = oldHtml; el.diffNew.innerHTML = newHtml;
  openModal(el.diffModal);
}
function applyDiff() {
  if (state.aiResult) { ensureEditor(); state.editor.setValue(state.aiResult); setMode("edit"); el.dirty.hidden = state.editor.getValue() === state.baseline; toast("已应用 AI 稿，记得保存"); }
  closeModal();
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
  try { const r = await API.putConfig(readSettingsForm()); if (r.ok) { toast("已保存设置"); closeModal(); } else toast("保存失败", "err"); }
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
  } catch { el.cfgStatus.textContent = "测试失败"; el.cfgStatus.className = "cfg-status err"; }
}

/* ---------- new skill ---------- */
async function openNew() {
  el.newName.value = ""; el.newBrief.value = ""; el.newStatus.textContent = "";
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
  state.cat = b.dataset.cat; state.cursor = -1; renderChips(); render();
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
el.modeSeg.addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (b) setMode(b.dataset.mode); });

el.settings.addEventListener("click", async () => { openModal(el.settingsModal); await fillSettings(); });
el.cfgSave.addEventListener("click", saveSettings);
el.cfgTest.addEventListener("click", testConnection);
el.newSkill.addEventListener("click", openNew);
el.newCreate.addEventListener("click", createSkill);
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
  render(); el.q.focus();
})();
