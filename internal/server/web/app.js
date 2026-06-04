const $ = (s) => document.querySelector(s);
let editor = null, current = null, conflicts = new Set();

async function load(q = "") {
  const res = await fetch("/api/skills?q=" + encodeURIComponent(q));
  const data = await res.json();
  conflicts = new Set(data.conflicts || []);
  renderList(data.skills || []);
}

function renderList(skills) {
  const el = $("#list");
  if (!skills.length) { el.innerHTML = '<p class="empty">无结果。点「扫描」或调整搜索。</p>'; return; }
  el.innerHTML = "";
  for (const s of skills) {
    const card = document.createElement("div");
    card.className = "card";
    const conf = conflicts.has(s.name) ? '<span class="badge conflict">冲突</span>' : "";
    card.innerHTML = `<div class="name">${esc(s.name)}</div>
      <div class="meta"><span class="badge ${s.source}">${s.source}</span>${conf}${esc(s.description || "")}</div>`;
    card.onclick = () => open(s.id);
    el.appendChild(card);
  }
}

async function open(id) {
  const res = await fetch("/api/skills/" + id);
  const s = await res.json();
  current = s;
  const conf = conflicts.has(s.name) ? '<span class="badge conflict">同名冲突</span>' : "";
  $("#detail").innerHTML = `<h2>${esc(s.name)} ${conf}</h2>
    <div class="path">${esc(s.file_path)}</div>
    <div class="actions"><button id="save">保存并提交</button></div>
    <textarea id="ed"></textarea>`;
  editor = CodeMirror.fromTextArea($("#ed"), { mode: "markdown", lineNumbers: true, lineWrapping: true });
  editor.setValue(s.body || "");
  $("#save").onclick = save;
}

async function save() {
  if (!current) return;
  const res = await fetch("/api/skills/" + current.id, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: editor.getValue() }),
  });
  toast(res.ok ? "已保存并提交" : "保存失败");
  if (res.ok) load($("#q").value);
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function esc(s){return (s||"").replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

$("#scan").onclick = async () => {
  $("#scan").disabled = true;
  const res = await fetch("/api/scan", { method: "POST" });
  const d = await res.json();
  $("#scan").disabled = false;
  toast("扫描到 " + (d.count ?? 0) + " 个 skill");
  load();
};
$("#q").addEventListener("input", (e) => load(e.target.value));
load();
