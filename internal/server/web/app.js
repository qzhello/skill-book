/* ===================== SkillBook front-end ===================== */
const $ = (s) => document.querySelector(s);
const el = {
  scan: $("#scan"), q: $("#q"), clear: $("#clear"), searchWrap: $("#searchWrap"),
  count: $("#count"), chips: $("#chips"),
  overview: $("#overview"), emptyHero: $("#emptyHero"),
  resultsView: $("#resultsView"), resultsMeta: $("#resultsMeta"),
  viewport: $("#viewport"), sizer: $("#sizer"), window: $("#window"),
  scrim: $("#scrim"), sheet: $("#sheet"), sheetName: $("#sheetName"),
  sheetBadges: $("#sheetBadges"), sheetPath: $("#sheetPath"),
  sheetClose: $("#sheetClose"), save: $("#save"), dirty: $("#dirty"), ed: $("#ed"),
  toasts: $("#toasts"),
};

const ROW_H = 60, OVERSCAN = 6;
const CAT_LABEL = { user: "用户级", project: "项目级", plugin: "插件" };
const CAT_ORDER = ["user", "project", "plugin"];

const state = {
  all: [],            // enriched skills
  conflicts: new Set(),
  scanned: false,
  query: "",
  cat: "all",         // all | user | project | plugin | conflict
  view: [],           // current filtered+ranked list
  cursor: -1,
  justChanged: false,
  current: null,
  editor: null,
  baseline: "",
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
function toast(msg, kind = "ok") {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.innerHTML = `<span class="dot">●</span>${esc(msg)}`;
  el.toasts.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .25s"; setTimeout(() => t.remove(), 260); }, 2200);
}

/* ---------- API ---------- */
const API = {
  scan: () => fetch("/api/scan", { method: "POST" }).then((r) => r.json()),
  all: () => fetch("/api/skills").then((r) => r.json()),
  get: (id) => fetch("/api/skills/" + id).then((r) => r.json()),
  save: (id, content) => fetch("/api/skills/" + id, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }),
};

/* ---------- data load ---------- */
async function doScan() {
  el.scan.classList.add("loading"); el.scan.disabled = true;
  try {
    const d = await API.scan();
    await loadAll();
    toast(`扫描完成 · ${d.count ?? 0} 个 skill`);
  } catch (e) {
    toast("扫描失败", "err");
  } finally {
    el.scan.classList.remove("loading"); el.scan.disabled = false;
  }
}
async function loadAll() {
  const data = await API.all();
  state.conflicts = new Set(data.conflicts || []);
  state.all = (data.skills || []).map((s) => ({
    ...s,
    nameLower: (s.name || "").toLowerCase(),
    descLower: (s.description || "").toLowerCase(),
    conflict: state.conflicts.has(s.name),
  }));
  state.scanned = state.all.length > 0;
  el.count.hidden = !state.scanned;
  el.count.textContent = `${state.all.length} skills`;
  renderChips();
  render();
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
  else if (state.cat !== "all") base = base.filter((s) => s.source === state.cat);

  if (!q) {
    state.view = base.slice().sort((a, b) => a.name.localeCompare(b.name));
    return;
  }
  const scored = [];
  for (const s of base) {
    const sc = scoreOf(s, q);
    if (sc >= 0) scored.push([sc, s]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  state.view = scored.map((x) => x[1]);
}

/* ---------- chips ---------- */
function renderChips() {
  if (!state.scanned) { el.chips.hidden = true; return; }
  el.chips.hidden = false;
  const counts = { all: state.all.length, user: 0, project: 0, plugin: 0, conflict: 0 };
  for (const s of state.all) { counts[s.source] = (counts[s.source] || 0) + 1; if (s.conflict) counts.conflict++; }
  const defs = [["all", "全部"], ["user", "用户级"], ["project", "项目级"], ["plugin", "插件"]];
  if (counts.conflict) defs.push(["conflict", "冲突"]);
  el.chips.innerHTML = defs.map(([k, label]) =>
    `<button class="chip ${state.cat === k ? "active" : ""}" data-cat="${k}">${label}<span class="ct">${counts[k] || 0}</span></button>`
  ).join("");
}

/* ---------- main render switch ---------- */
function render() {
  compute();
  const showOverview = state.scanned && !state.query.trim() && state.cat === "all";
  el.overview.hidden = !(showOverview || !state.scanned);
  el.resultsView.hidden = !state.scanned || showOverview;

  if (!state.scanned) { renderEmptyHero(); return; }
  if (showOverview) { renderOverview(); return; }
  renderResults();
}

function renderEmptyHero() {
  el.emptyHero.hidden = false;
  el.overview.innerHTML = "";
  el.overview.appendChild(el.emptyHero);
}

/* ---------- overview: recents + history + categories ---------- */
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
        `<div class="recent-card" data-id="${r.id}">
          <div class="rc-name">${esc(r.name)}</div>
          <div class="rc-desc">${esc(r.description || "—")}</div>
        </div>`).join("")}</div></div>`;
  }
  if (history.length) {
    html += `<div class="ov-section"><div class="ov-head">最近搜索
      <span class="clear-hist" data-act="clearhist">清除</span></div>
      <div class="hist-row">${history.map((h) =>
        `<button class="hist-tag" data-hist="${esc(h)}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          ${esc(h)}</button>`).join("")}</div></div>`;
  }
  const catIcon = {
    user: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    project: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
    plugin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
  };
  html += `<div class="ov-section"><div class="ov-head">按来源分类</div>
    <div class="cat-grid">${CAT_ORDER.map((k) =>
      `<div class="cat-card" data-cat="${k}">
        <div class="cat-ico ${k}">${catIcon[k]}</div>
        <div class="cat-meta"><div class="cat-name">${CAT_LABEL[k]}</div>
          <div class="cat-count">${counts[k] || 0} 个 skill</div></div>
      </div>`).join("")}</div></div>`;

  el.overview.innerHTML = html;
}

/* ---------- results virtual list ---------- */
function rowHTML(s, idx, animate) {
  const conf = s.conflict ? '<span class="badge conflict">冲突</span>' : "";
  const cls = "row" + (idx === state.cursor ? " cursor" : "") + (animate ? " enter" : "");
  const delay = animate ? `style="animation-delay:${Math.min(idx, 14) * 26}ms"` : "";
  return `<div class="${cls}" ${delay} data-idx="${idx}" data-id="${s.id}">
    <div class="row-main">
      <div class="row-name">${highlight(s.name, state.query.trim().toLowerCase())}
        <span class="badge ${s.source}">${CAT_LABEL[s.source] || s.source}</span>${conf}</div>
      <div class="row-desc">${esc(s.description || "—")}</div>
    </div>
  </div>`;
}
function renderResults() {
  const n = state.view.length;
  const q = state.query.trim();
  el.resultsMeta.innerHTML = n
    ? `<b>${n}</b> 个结果${q ? ` · 关键词「${esc(q)}」精确优先` : ""}${state.cat !== "all" ? ` · ${CAT_LABEL[state.cat] || "冲突"}` : ""}`
    : "";
  el.sizer.style.height = n * ROW_H + "px";
  el.viewport.scrollTop = 0;
  if (!n) {
    el.window.style.transform = "none";
    el.window.innerHTML = `<div class="no-results">没有匹配的 skill。<br>试试更短的关键词或切换分类。</div>`;
    return;
  }
  state.justChanged = true;
  renderWindow();
}
function renderWindow() {
  const n = state.view.length;
  if (!n) return;
  const top = el.viewport.scrollTop, h = el.viewport.clientHeight;
  const start = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const end = Math.min(n, Math.ceil((top + h) / ROW_H) + OVERSCAN);
  const animate = state.justChanged;
  state.justChanged = false;
  el.window.style.transform = `translateY(${start * ROW_H}px)`;
  let html = "";
  for (let i = start; i < end; i++) html += rowHTML(state.view[i], i, animate && i < start + 18);
  el.window.innerHTML = html;
}

/* ---------- detail sheet ---------- */
async function openDetail(id, fromSearch) {
  const s = await API.get(id);
  if (!s || s.error) { toast("无法打开该 skill", "err"); return; }
  state.current = s;
  el.sheetName.textContent = s.name;
  const conf = state.conflicts.has(s.name) ? '<span class="badge conflict">同名冲突</span>' : "";
  el.sheetBadges.innerHTML = `<span class="badge ${s.source}">${CAT_LABEL[s.source] || s.source}</span>${conf}`;
  el.sheetPath.textContent = s.file_path;
  el.dirty.hidden = true;

  el.scrim.hidden = false; el.sheet.hidden = false; el.sheet.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => { el.scrim.classList.add("show"); el.sheet.classList.add("show"); });

  if (!state.editor) {
    state.editor = CodeMirror.fromTextArea(el.ed, {
      mode: "markdown", theme: "material-darker", lineNumbers: true, lineWrapping: true,
    });
    state.editor.on("change", () => {
      el.dirty.hidden = state.editor.getValue() === state.baseline;
    });
  }
  state.baseline = s.body || "";
  state.editor.setValue(s.body || "");
  setTimeout(() => state.editor.refresh(), 50);

  // recents
  const recents = LS.recents().filter((r) => r.id !== id);
  recents.unshift({ id, name: s.name, description: s.description });
  LS.setRecents(recents);

  // history
  if (fromSearch && state.query.trim()) pushHistory(state.query.trim());
}
function closeSheet() {
  el.scrim.classList.remove("show"); el.sheet.classList.remove("show");
  el.sheet.setAttribute("aria-hidden", "true");
  setTimeout(() => { el.scrim.hidden = true; el.sheet.hidden = true; }, 260);
  state.current = null;
}
async function doSave() {
  if (!state.current) return;
  el.save.disabled = true;
  try {
    const res = await API.save(state.current.id, state.editor.getValue());
    if (res.ok) {
      state.baseline = state.editor.getValue();
      el.dirty.hidden = true;
      toast("已保存" + (state.current.source === "user" ? "（如在 git 仓库内已提交）" : ""));
      await loadAll();
    } else { toast("保存失败", "err"); }
  } catch { toast("保存失败", "err"); }
  finally { el.save.disabled = false; }
}

function pushHistory(q) {
  let h = LS.history().filter((x) => x !== q);
  h.unshift(q);
  LS.setHistory(h);
}

/* ---------- events ---------- */
let searchTimer = null;
el.q.addEventListener("input", (e) => {
  state.query = e.target.value;
  el.clear.hidden = !state.query;
  state.cursor = -1;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 90);
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
el.clear.addEventListener("click", () => {
  state.query = ""; el.q.value = ""; el.clear.hidden = true; state.cursor = -1;
  el.q.focus(); render();
});

el.chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  state.cat = b.dataset.cat; state.cursor = -1;
  renderChips(); render();
});

el.overview.addEventListener("click", (e) => {
  const card = e.target.closest(".recent-card"); if (card) { openDetail(card.dataset.id, false); return; }
  const cat = e.target.closest(".cat-card"); if (cat) { state.cat = cat.dataset.cat; renderChips(); render(); return; }
  const hist = e.target.closest(".hist-tag"); if (hist) { state.query = hist.dataset.hist; el.q.value = state.query; el.clear.hidden = false; render(); el.q.focus(); return; }
  const clr = e.target.closest('[data-act="clearhist"]'); if (clr) { e.stopPropagation(); LS.setHistory([]); renderOverview(); }
});

el.window.addEventListener("click", (e) => {
  const row = e.target.closest(".row"); if (!row) return;
  openDetail(row.dataset.id, !!state.query.trim());
});
el.viewport.addEventListener("scroll", () => requestAnimationFrame(renderWindow), { passive: true });
window.addEventListener("resize", () => { if (!el.resultsView.hidden) renderWindow(); });

function moveCursor(d) {
  const n = state.view.length; if (!n) return;
  state.cursor = (state.cursor + d + n) % n;
  state.justChanged = false;
  // ensure visible
  const y = state.cursor * ROW_H;
  if (y < el.viewport.scrollTop) el.viewport.scrollTop = y;
  else if (y + ROW_H > el.viewport.scrollTop + el.viewport.clientHeight)
    el.viewport.scrollTop = y + ROW_H - el.viewport.clientHeight;
  renderWindow();
}

el.scan.addEventListener("click", doScan);
el.save.addEventListener("click", doSave);
el.sheetClose.addEventListener("click", closeSheet);
el.scrim.addEventListener("click", closeSheet);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !el.sheet.hidden) { closeSheet(); return; }
  if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && el.sheet.hidden) {
    if (document.activeElement !== el.q) { e.preventDefault(); el.q.focus(); el.q.select(); }
  }
});

/* ---------- boot ---------- */
(async function boot() {
  try { await loadAll(); } catch { /* not scanned yet */ }
  render();
  el.q.focus();
})();
