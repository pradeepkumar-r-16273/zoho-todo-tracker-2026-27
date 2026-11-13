/* Zoho ToDo - Product Development Tracker: core UI (shell, grid, editors, record drawer). */
const store = new ZT.Store();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
const STAGE_IDS = ["analysis", "design", "html", "server", "client", "testing", "mobile"];
const SOLID = { blue: "#2a78d6", cyan: "#1d8fb0", teal: "#1a9a6c", green: "#16a116", yellow: "#c98500", orange: "#e0612e", red: "#e34948", pink: "#d55181", purple: "#6250d6", gray: "#898781" };
const AV = ["#2a78d6", "#eb6834", "#1baf7a", "#c98500", "#d55181", "#008300", "#6250d6", "#e34948"];

const ICONS = {
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  kanban: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
  timeline: '<path d="M3 6h10M7 12h12M5 18h8"/>',
  dash: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  activity: '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
  group: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  clip: '<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  sel: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  people: '<circle cx="9" cy="8" r="4"/><path d="M1 21v-1a7 7 0 0 1 14 0v1M17 11a4 4 0 0 0 0-8M23 21v-1a7 7 0 0 0-4-6.3"/>',
  date: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  fx: '<path d="M10 20c4 0 3-16 8-16M7 12h9"/>',
  long: '<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  dup: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  chevr: '<path d="M9 6l6 6-6 6"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7a5.4 5.4 0 0 0-1.5-3.7 5 5 0 0 0-.1-3.8s-1.2-.3-3.9 1.5a13.4 13.4 0 0 0-7 0C6.3 1.7 5.1 2 5.1 2a5 5 0 0 0-.1 3.8A5.4 5.4 0 0 0 3.5 9.5c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/>',
};
const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[n] || ""}</svg>`;
const TYPE_IC = { text: "text", longText: "long", singleSelect: "sel", multiSelect: "list", people: "people", date: "date", formula: "fx", checklist: "list", sys: "hist" };

/* ---------- helpers ---------- */
const db = () => store.db;
const F = (id) => db().schema.find((f) => f.id === id) || SYS.find((f) => f.id === id);
const R = (id) => db().records.find((r) => r.id === id);
const SYS = [
  { id: "_comments", name: "Comments", type: "sys", width: 96 },
  { id: "_attachments", name: "Attachments", type: "sys", width: 104 },
  { id: "_updated", name: "Last Updated", type: "sys", width: 150 },
];
const optColor = (f, v) => ((f.options || []).find((o) => o.name === v) || {}).color || "gray";
const pill = (f, v) => `<span class="pill c-${optColor(f, v)}" title="${esc(v)}">${esc(v)}</span>`;
const initials = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
const avColor = (n) => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length]; };
const avatar = (n) => `<span class="avatar" style="background:${avColor(n)}" title="${esc(n)}">${esc(initials(n))}</span>`;
const person = (n) => `<span class="person">${avatar(n)}${esc(n.split(" ")[0])}</span>`;
const fmtDate = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "");
function ago(iso) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "d ago";
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
const fullTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
function toast(msg, ms = 2600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function progress(r) {
  if (r.status === "Released") return 100;
  let n = 0, s = 0;
  STAGE_IDS.forEach((k) => { const v = r[k]; if (!v || v === "N/A") return; n++; s += v === "Done" ? 1 : v === "In Progress" ? 0.5 : 0; });
  return n ? Math.round((s / n) * 100) : null;
}
function val(r, fid) {
  if (fid === "progress") return progress(r);
  if (fid === "_comments") return (r.comments || []).length;
  if (fid === "_attachments") return (r.attachments || []).length;
  if (fid === "_updated") return r.updatedAt;
  return r[fid];
}
const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && !v.length);
const peopleNames = () => (db().people || []).map((p) => p.name);
function setField(id, f, v) { store.do({ t: "set", id, f, v }); }

/* ---------- views ---------- */
const PRESETS = [
  { id: "v-all", name: "All features", type: "grid", groupBy: "phase", filters: [], sorts: [], hidden: ["releasedTo", "startDate", "targetDate", "sourceNote", "mobile", "html"] },
  { id: "v-active", name: "Active work", type: "grid", groupBy: "status", filters: [{ f: "phase", op: "any", v: ["Working on", "Roadmap", "Pipeline"] }], sorts: [], hidden: ["releasedTo", "sourceNote", "notes"] },
  { id: "v-released", name: "Released", type: "grid", groupBy: "module", filters: [{ f: "phase", op: "any", v: ["Released"] }], sorts: [], hidden: ["priority", "milestone", "startDate", "targetDate", "sourceNote"] },
  { id: "v-ideas", name: "Ideas / Backlog", type: "grid", groupBy: "module", filters: [{ f: "phase", op: "any", v: ["Ideas / Backlog"] }], sorts: [], hidden: STAGE_IDS.concat(["releasedTo", "milestone", "dev", "progress"]) },
  { id: "v-mine", name: "My items", type: "grid", groupBy: "phase", filters: [{ f: "_mine", op: "me", v: null }], sorts: [], hidden: ["sourceNote"] },
  { id: "k-status", name: "Board by status", type: "kanban", kanbanBy: "status", filters: [{ f: "phase", op: "none", v: ["Ideas / Backlog"] }], sorts: [] },
  { id: "k-milestone", name: "Board by milestone", type: "kanban", kanbanBy: "milestone", filters: [], sorts: [] },
  { id: "k-module", name: "Board by module", type: "kanban", kanbanBy: "module", filters: [], sorts: [] },
  { id: "t-main", name: "Delivery timeline", type: "timeline", groupBy: "phase", filters: [{ f: "phase", op: "none", v: ["Ideas / Backlog", "Released"] }], sorts: [] },
  { id: "d-main", name: "Dashboard", type: "dashboard", filters: [] },
  { id: "a-main", name: "Change timeline", type: "activity", filters: [] },
];
const S = { viewId: ZT.LS.get("viewId", "d-main"), view: null, search: "", sel: null, drawer: null, collapsed: new Set(), sidebar: ZT.LS.get("sidebar", true) };
const allViews = () => PRESETS.concat((db().views || []).map((v) => Object.assign({ team: true }, v)));
function loadView(id) {
  const base = allViews().find((v) => v.id === id) || PRESETS[0];
  const local = ZT.LS.get("vs." + base.id, null);
  S.viewId = base.id; ZT.LS.set("viewId", base.id);
  S.view = Object.assign(ZT.clone(base), local || {});
  S.view.widths = S.view.widths || {};
  S.sel = null;
}
function saveViewState() {
  const { filters, sorts, groupBy, hidden, widths, kanbanBy, zoom } = S.view;
  ZT.LS.set("vs." + S.viewId, { filters, sorts, groupBy, hidden, widths, kanbanBy, zoom });
}
function viewDirty() {
  const base = allViews().find((v) => v.id === S.viewId);
  if (!base) return false;
  const pick = (v) => JSON.stringify([v.filters || [], v.sorts || [], v.groupBy || null, v.hidden || [], v.kanbanBy || null]);
  return pick(base) !== pick(S.view);
}

/* ---------- filtering & sorting ---------- */
const OPS = {
  text: [["contains", "contains"], ["ncontains", "does not contain"], ["empty", "is empty"], ["nempty", "is not empty"]],
  select: [["any", "is any of"], ["none", "is none of"], ["empty", "is empty"], ["nempty", "is not empty"]],
  multi: [["any", "has any of"], ["all", "has all of"], ["none", "has none of"], ["empty", "is empty"], ["nempty", "is not empty"]],
  date: [["before", "is before"], ["after", "is after"], ["empty", "is empty"], ["nempty", "is not empty"]],
  number: [["gte", ">="], ["lte", "<="], ["empty", "is empty"]],
};
const opKind = (f) => (!f ? "text" : f.type === "singleSelect" ? "select" : f.type === "multiSelect" || f.type === "people" ? "multi" : f.type === "date" ? "date" : f.type === "formula" ? "number" : "text");
function matchCond(r, c) {
  if (c.f === "_mine") { const me = store.user.name; return (r.pm || []).includes(me) || (r.dev || []).includes(me); }
  const f = F(c.f); if (!f) return true;
  let v = val(r, c.f);
  const cv = Array.isArray(c.v) ? c.v.map((x) => (x === "@me" ? store.user.name : x)) : c.v;
  switch (c.op) {
    case "empty": return isEmpty(v);
    case "nempty": return !isEmpty(v);
    case "contains": return String(v || "").toLowerCase().includes(String(cv || "").toLowerCase());
    case "ncontains": return !String(v || "").toLowerCase().includes(String(cv || "").toLowerCase());
    case "any": { if (!cv || !cv.length) return true; const a = Array.isArray(v) ? v : [v]; return a.some((x) => cv.includes(x)); }
    case "all": { if (!cv || !cv.length) return true; const a = Array.isArray(v) ? v : [v]; return cv.every((x) => a.includes(x)); }
    case "none": { if (!cv || !cv.length) return true; const a = Array.isArray(v) ? v : [v]; return !a.some((x) => cv.includes(x)); }
    case "before": return !!v && !!cv && v < cv;
    case "after": return !!v && !!cv && v > cv;
    case "gte": return v != null && v >= Number(cv);
    case "lte": return v != null && v <= Number(cv);
  }
  return true;
}
function searchHit(r, q) {
  if (!q) return true;
  q = q.toLowerCase();
  return [r.id, r.name, r.notes, r.module, r.status, r.phase, (r.pm || []).join(" "), (r.dev || []).join(" "), (r.milestone || []).join(" "), (r.subitems || []).map((s) => s.text).join(" ")]
    .join(" ").toLowerCase().includes(q);
}
function filtered(view = S.view) {
  let rows = db().records.filter((r) => (view.filters || []).every((c) => matchCond(r, c)) && searchHit(r, S.search));
  const sorts = view.sorts || [];
  if (sorts.length) {
    rows = rows.slice().sort((a, b) => {
      for (const s of sorts) { const d = cmp(a, b, s.f) * (s.dir === "desc" ? -1 : 1); if (d) return d; }
      return 0;
    });
  }
  return rows;
}
function sortKey(r, fid) {
  const f = F(fid); let v = val(r, fid);
  if (!f) return v;
  if (f.type === "singleSelect") { const i = (f.options || []).findIndex((o) => o.name === v); return v == null ? 9999 : i < 0 ? 999 : i; }
  if (f.type === "multiSelect") { if (!v || !v.length) return 9999; return Math.min(...v.map((x) => { const i = (f.options || []).findIndex((o) => o.name === x); return i < 0 ? 999 : i; })); }
  if (f.type === "people") return v && v.length ? v[0].toLowerCase() : "￿";
  if (f.type === "checklist") return v ? v.length : 0;
  if (v == null || v === "") return f.type === "formula" || f.type === "sys" ? -1 : "￿";
  return typeof v === "string" ? v.toLowerCase() : v;
}
function cmp(a, b, fid) {
  const x = sortKey(a, fid), y = sortKey(b, fid);
  if (fid === "id" || fid === "name") return String(x).localeCompare(String(y), undefined, { numeric: true });
  return x < y ? -1 : x > y ? 1 : 0;
}
function groupRows(rows, fid) {
  const f = F(fid);
  if (!f) return [{ key: null, rows }];
  const map = new Map();
  const order = (f.options || []).map((o) => o.name);
  if (f.type === "people") peopleNames().forEach((n) => order.push(n));
  rows.forEach((r) => {
    let v = r[fid];
    const keys = Array.isArray(v) ? (v.length ? v : [""]) : [v || ""];
    keys.forEach((k) => { if (!map.has(k)) map.set(k, []); map.get(k).push(r); });
  });
  const keys = [...map.keys()].sort((a, b) => {
    if (a === "") return 1; if (b === "") return -1;
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || String(a).localeCompare(b);
  });
  return keys.map((k) => ({ key: k, rows: map.get(k) }));
}

/* ---------- cell rendering ---------- */
function cellHTML(r, f) {
  const v = val(r, f.id);
  switch (f.type) {
    case "singleSelect": return v ? pill(f, v) : "";
    case "multiSelect": return v && v.length ? `<div class="cellpills">${v.map((x) => pill(f, x)).join("")}</div>` : "";
    case "people": return v && v.length ? v.map(person).join("") : "";
    case "date": return esc(fmtDate(v));
    case "formula": return v == null ? '<span class="muted">-</span>' : `<div class="prog"><div class="bar"><i class="${v === 100 ? "done" : ""}" style="width:${v}%"></i></div><b>${v}%</b></div>`;
    case "checklist": { const a = v || []; if (!a.length) return ""; const d = a.filter((x) => x.done).length; return `<span class="cnt-ic has">${ic("list")} ${d}/${a.length}</span>`; }
    case "sys":
      if (f.id === "_comments") return `<span class="cnt-ic ${v ? "has" : ""}">${ic("chat")} ${v}</span>`;
      if (f.id === "_attachments") return `<span class="cnt-ic ${v ? "has" : ""}">${ic("clip")} ${v}</span>`;
      return `<span title="${esc(fullTime(v))}">${esc(ago(v))}</span> <span class="muted">${esc((r.updatedBy || "").split(" ")[0])}</span>`;
    default: return esc(v);
  }
}

/* ---------- popovers ---------- */
let POP = null;
function closePop() { if (POP) { const p = POP; POP = null; p.el.remove(); p.onClose && p.onClose(); } }
function openPop(anchor, html, opts = {}) {
  closePop();
  const el = document.createElement("div"); el.className = "pop"; el.innerHTML = html;
  document.body.appendChild(el);
  const a = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = a.left, y = a.bottom + 4;
  if (opts.minWidth) el.style.minWidth = opts.minWidth + "px";
  if (x + w > innerWidth - 8) x = innerWidth - w - 8;
  if (y + h > innerHeight - 8) y = Math.max(8, a.top - h - 4);
  el.style.left = Math.max(8, x) + "px"; el.style.top = y + "px";
  POP = { el, onClose: opts.onClose };
  setTimeout(() => { const i = el.querySelector("input,textarea"); if (i && opts.focus !== false) i.focus(); }, 0);
  return el;
}
document.addEventListener("mousedown", (e) => { if (POP && !POP.el.contains(e.target) && !e.target.closest("[data-keep-pop]")) closePop(); }, true);

/* option picker for singleSelect / multiSelect / people */
function pickOptions(anchor, f, current, onChange, opts = {}) {
  const multi = f.type !== "singleSelect" || opts.multi;
  let sel = Array.isArray(current) ? current.slice() : current ? [current] : [];
  const isPeople = f.type === "people";
  const list = () => (isPeople ? peopleNames().map((n) => ({ name: n })) : f.options || []);
  const el = openPop(anchor, `<input class="find" placeholder="${isPeople ? "Find a person" : opts.noCreate ? "Find an option" : "Find or create an option"}"><div class="opts"></div>`, { minWidth: 240 });
  const inp = $(".find", el), box = $(".opts", el);
  let hl = 0;
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    const items = list().filter((o) => o.name.toLowerCase().includes(q));
    const canCreate = q && !list().some((o) => o.name.toLowerCase() === q) && store.canEdit && !opts.noCreate;
    hl = Math.min(hl, Math.max(0, items.length - 1 + (canCreate ? 1 : 0)));
    box.innerHTML = items.map((o, i) => `<div class="opt ${i === hl ? "hl" : ""}" data-v="${esc(o.name)}"><span class="ck">${sel.includes(o.name) ? "&#10003;" : ""}</span>${isPeople ? person(o.name) + `<span class="muted" style="font-size:11px">${esc(((db().people || []).find((p) => p.name === o.name) || {}).role || "")}</span>` : pill(f, o.name)}</div>`).join("")
      + (canCreate ? `<div class="opt ${hl === items.length ? "hl" : ""}" data-new="1">${ic("plus")} Create <b>${esc(inp.value.trim())}</b></div>` : "")
      + (!multi && sel.length && !opts.noClear ? `<div class="opt" data-clear="1"><span class="ck"></span><span class="muted">Clear</span></div>` : "")
      + (!items.length && !canCreate ? '<div class="hint">No matches</div>' : "");
  };
  const choose = (name) => {
    if (multi) { sel = sel.includes(name) ? sel.filter((x) => x !== name) : sel.concat(name); onChange(sel.slice()); draw(); }
    else { onChange(name); closePop(); }
  };
  box.addEventListener("mousedown", (e) => e.preventDefault());
  box.addEventListener("click", (e) => {
    const o = e.target.closest(".opt"); if (!o) return;
    if (o.dataset.clear) { onChange(null); closePop(); return; }
    if (o.dataset.new) {
      const name = inp.value.trim();
      if (isPeople) store.do({ t: "person", p: { name, role: "", github: "" } });
      else store.do({ t: "addOption", f: f.id, name, color: ["blue", "cyan", "teal", "green", "yellow", "orange", "red", "pink", "purple"][(f.options || []).length % 9] });
      inp.value = ""; choose(name); return;
    }
    choose(o.dataset.v);
  });
  inp.addEventListener("input", () => { hl = 0; draw(); });
  inp.addEventListener("keydown", (e) => {
    const n = $$(".opt", box).filter((o) => !o.dataset.clear);
    if (e.key === "ArrowDown") { hl = Math.min(hl + 1, n.length - 1); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { hl = Math.max(hl - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === "Enter") { const o = n[hl]; if (o) o.click(); e.preventDefault(); }
    else if (e.key === "Escape") closePop();
  });
  draw();
}

function editLong(anchor, r, f) {
  const el = openPop(anchor, `<h5>${esc(f.name)}</h5><textarea>${esc(r[f.id] || "")}</textarea><div class="row" style="justify-content:flex-end"><span class="muted" style="font-size:11.5px;margin-right:auto">Ctrl+Enter to save</span><button class="btn primary" data-save>Save</button></div>`);
  const ta = $("textarea", el);
  const save = () => { setField(r.id, f.id, ta.value); closePop(); };
  $("[data-save]", el).onclick = save;
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); if (e.key === "Escape") closePop(); });
}
function editDate(anchor, r, f) {
  const el = openPop(anchor, `<h5>${esc(f.name)}</h5><div class="row"><input type="date" value="${esc(r[f.id] || "")}"><button class="btn" data-clear>Clear</button></div>`);
  const i = $("input", el);
  i.addEventListener("change", () => { setField(r.id, f.id, i.value || null); closePop(); });
  $("[data-clear]", el).onclick = () => { setField(r.id, f.id, null); closePop(); };
}
function editText(anchor, r, f) {
  const el = openPop(anchor, `<h5>${esc(f.name)}</h5><input class="find" value="${esc(r[f.id] || "")}" style="width:340px">`);
  const i = $("input", el); i.select();
  i.addEventListener("keydown", (e) => { if (e.key === "Enter") { setField(r.id, f.id, i.value); closePop(); } if (e.key === "Escape") closePop(); });
}
/* open the right editor for a field */
function editField(anchor, r, f) {
  if (!store.canEdit) { readonlyNotice(); return; }
  if (f.type === "singleSelect" || f.type === "multiSelect" || f.type === "people") pickOptions(anchor, f, r[f.id], (v) => setField(r.id, f.id, v));
  else if (f.type === "longText") editLong(anchor, r, f);
  else if (f.type === "date") editDate(anchor, r, f);
  else if (f.type === "text") editText(anchor, r, f);
  else if (f.type === "checklist") openDrawer(r.id, "details");
  else if (f.id === "_comments") openDrawer(r.id, "comments");
  else if (f.id === "_attachments") openDrawer(r.id, "attachments");
  else if (f.id === "_updated") openDrawer(r.id, "history");
}
let roNoticeAt = 0;
function readonlyNotice() { if (Date.now() - roNoticeAt > 4000) { roNoticeAt = Date.now(); toast("Read-only. Connect GitHub (gear icon) or switch to local mode to edit."); } }

/* ---------- shell ---------- */
function renderShell() {
  const views = allViews();
  const typeName = { grid: "Grid", kanban: "Kanban", timeline: "Timeline", dashboard: "Dashboard", activity: "Activity" };
  const counts = {};
  views.forEach((v) => { if (v.type === "grid" || v.type === "kanban") counts[v.id] = filtered(v).length; });
  const sec = (t, label) => {
    const vs = views.filter((v) => v.type === t);
    return vs.length ? `<h4>${label}</h4>` + vs.map((v) => `<button class="sv ${v.id === S.viewId ? "on" : ""}" data-view="${esc(v.id)}">${ic(t === "grid" ? "grid" : t === "kanban" ? "kanban" : t === "timeline" ? "timeline" : t === "dashboard" ? "dash" : "activity")}<span>${esc(v.name)}</span>${counts[v.id] != null ? `<span class="n">${counts[v.id]}</span>` : ""}${v.team ? `<span class="x" data-delview="${esc(v.id)}" title="Delete team view">${ic("x")}</span>` : ""}</button>`).join("") : "";
  };
  $(".sidebar").innerHTML = sec("dashboard", "Overview") + sec("grid", "Grid views") + sec("kanban", "Kanban boards") + sec("timeline", "Timeline") + sec("activity", "History")
    + `<h4>Data</h4><button class="sv" data-act="trash">${ic("trash")}<span>Deleted features</span><span class="n">${(db().deleted || []).length}</span></button>`
    + (store.repoWebUrl() ? `<a class="sv" href="${esc(store.repoWebUrl())}/commits/${esc(store.cfg.branch)}/${esc(store.cfg.dataPath)}" target="_blank" rel="noopener">${ic("github")}<span>Commit history</span></a>` : "");
  const v = S.view;
  $(".viewbar").innerHTML = `<button class="vtab" data-act="sidebar" title="Toggle sidebar">${ic("menu")}</button><span class="sep"></span>`
    + ["dashboard", "grid", "kanban", "timeline", "activity"].map((t) => {
      const first = t === v.type ? v : views.find((x) => x.type === t);
      return `<button class="vtab ${t === v.type ? "on" : ""}" data-view="${esc(first.id)}">${ic(t === "grid" ? "grid" : t === "kanban" ? "kanban" : t === "timeline" ? "timeline" : t === "dashboard" ? "dash" : "activity")}${typeName[t]}</button>`;
    }).join("")
    + `<span class="sep"></span><span style="font-weight:600;white-space:nowrap">${esc(v.name)}</span>`
    + (viewDirty() ? ` <span class="pill c-yellow" style="margin-left:6px">Modified</span> <button class="tbtn" data-act="saveview">Save view</button><button class="tbtn" data-act="resetview">Reset</button>` : "")
    + (v.type === "grid" || v.type === "kanban" || v.type === "timeline" ? `<button class="tbtn" data-act="saveas">Save as new view</button>` : "");
  renderStatus();
}
function renderStatus() {
  const el = $(".sync");
  let cls = store.status, text = "";
  if (store.mode === "readonly") { cls = "readonly"; text = "Read-only"; }
  else if (store.mode === "local") { cls = "local"; text = "Local mode (this browser)"; }
  else if (store.status === "saving") text = "Saving to GitHub...";
  else if (store.status === "dirty") text = `${store.pending.length} unsaved change${store.pending.length > 1 ? "s" : ""}`;
  else if (store.status === "error") text = "Save failed - retrying";
  else text = store.lastCommit ? `Saved ${ago(store.lastCommit.at)} - ${store.lastCommit.sha.slice(0, 7)}` : `Synced with ${store.cfg.owner}/${store.cfg.repo}`;
  el.className = "sync " + cls; el.innerHTML = `<span class="dot"></span>${esc(text)}`;
  el.title = store.lastCommit ? "Open last commit" : "";
  $(".me").innerHTML = `${avatar(store.user.name)}<span>${esc(store.user.name)}</span>`;
  const b = $(".banner-slot");
  b.innerHTML = store.error ? `<div class="banner err">${esc(store.error)}</div>`
    : store.mode === "readonly" ? `<div class="banner">You're viewing read-only. Add your GitHub token in Settings to edit - every change is committed with your name.<button data-act="settings">Connect GitHub</button><button data-act="localmode">Try local mode</button></div>` : "";
}

/* ---------- toolbar ---------- */
function renderToolbar() {
  const v = S.view;
  const tb = $(".toolbar");
  if (v.type === "dashboard" || v.type === "activity") { tb.style.display = "none"; return; }
  tb.style.display = "";
  const nf = (v.filters || []).length, ns = (v.sorts || []).length, nh = (v.hidden || []).length;
  const gf = v.groupBy && F(v.groupBy);
  tb.innerHTML = (v.type === "grid" ? `<button class="tbtn ${nh ? "active" : ""}" data-tb="fields">${ic("eye")}${nh ? nh + " hidden fields" : "Hide fields"}</button>` : "")
    + `<button class="tbtn ${nf ? "active" : ""}" data-tb="filter">${ic("filter")}${nf ? "Filtered by " + nf + " field" + (nf > 1 ? "s" : "") : "Filter"}</button>`
    + (v.type !== "kanban" ? `<button class="tbtn ${gf ? "active" : ""}" data-tb="group">${ic("group")}${gf ? "Grouped by " + esc(gf.name) : "Group"}</button>` : `<button class="tbtn active" data-tb="kanbanBy">${ic("kanban")}Stacked by ${esc((F(v.kanbanBy) || {}).name || "")}</button>`)
    + (v.type !== "timeline" ? `<button class="tbtn ${ns ? "active" : ""}" data-tb="sort">${ic("sort")}${ns ? "Sorted by " + ns + " field" + (ns > 1 ? "s" : "") : "Sort"}</button>` : "")
    + (v.type === "timeline" ? `<span class="tl-ctrl">${["week", "month", "quarter"].map((z) => `<button class="tbtn ${(v.zoom || "month") === z ? "active" : ""}" data-zoom="${z}">${z[0].toUpperCase() + z.slice(1)}</button>`).join("")}<button class="tbtn" data-tb="today">Today</button></span>` : "")
    + `<button class="tbtn" data-tb="csv" title="Export the rows in this view as CSV">${ic("download")}CSV</button>`
    + `<div class="search">${ic("search")}<input placeholder="Search features" value="${esc(S.search)}" data-search></div>`
    + `<button class="tbtn primary" data-tb="new">${ic("plus")}New feature</button>`;
}
function toolbarClick(btn) {
  const k = btn.dataset.tb, v = S.view;
  if (k === "fields") return fieldsPop(btn);
  if (k === "filter") return filterPop(btn);
  if (k === "sort") return sortPop(btn);
  if (k === "group") return groupPop(btn, "groupBy");
  if (k === "kanbanBy") return groupPop(btn, "kanbanBy");
  if (k === "csv") return exportCSV();
  if (k === "today") { scrollTimelineToday(); return; }
  if (k === "new") return newRecord();
}
function fieldsPop(btn) {
  const v = S.view;
  const fields = db().schema.filter((f) => !f.primary).concat(SYS);
  const el = openPop(btn, `<input class="find" placeholder="Find a field"><div class="list"></div><div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:6px"><button class="lnk" data-all="hide">Hide all</button><button class="lnk" data-all="show">Show all</button>${store.canEdit ? `<button class="lnk" data-addfield>${ic("plus")} Add field</button>` : ""}</div>`, { minWidth: 260 });
  const draw = () => {
    const q = $(".find", el).value.toLowerCase();
    $(".list", el).innerHTML = fields.filter((f) => f.name.toLowerCase().includes(q)).map((f) => `<label class="toggle"><input type="checkbox" data-f="${f.id}" ${(v.hidden || []).includes(f.id) ? "" : "checked"}>${ic(TYPE_IC[f.type] || "text")}${esc(f.name)}</label>`).join("");
  };
  draw();
  $(".find", el).oninput = draw;
  el.addEventListener("change", (e) => {
    const id = e.target.dataset.f; if (!id) return;
    v.hidden = (v.hidden || []).filter((x) => x !== id); if (!e.target.checked) v.hidden.push(id);
    saveViewState(); render();
  });
  el.addEventListener("click", (e) => {
    const a = e.target.closest("[data-all]");
    if (a) { v.hidden = a.dataset.all === "hide" ? fields.map((f) => f.id) : []; saveViewState(); render(); draw(); }
    if (e.target.closest("[data-addfield]")) { closePop(); fieldModal(null); }
  });
}
function filterPop(btn) {
  const v = S.view;
  const fields = db().schema.filter((f) => f.type !== "checklist").concat([{ id: "_mine", name: "Assigned to me", type: "me" }]);
  const el = openPop(btn, `<h5>Show features where</h5><div class="conds"></div><div class="row"><button class="lnk" data-add>${ic("plus")} Add condition</button><button class="lnk" data-clear style="margin-left:auto">Clear all</button></div>`, { minWidth: 520 });
  const draw = () => {
    $(".conds", el).innerHTML = (v.filters || []).map((c, i) => {
      const f = F(c.f) || fields.find((x) => x.id === c.f);
      const kind = c.f === "_mine" ? null : opKind(f);
      let vin = "";
      if (kind && !["empty", "nempty"].includes(c.op)) {
        if (kind === "select" || kind === "multi") vin = `<button class="btn" data-vals="${i}" data-keep-pop style="max-width:200px;overflow:hidden">${(c.v || []).length ? esc(c.v.join(", ")) : '<span class="muted">Select...</span>'}</button>`;
        else if (kind === "date") vin = `<input type="date" data-v="${i}" value="${esc(c.v || "")}">`;
        else vin = `<input data-v="${i}" value="${esc(c.v || "")}" placeholder="Value">`;
      }
      return `<div class="row">${i ? '<span class="muted" style="width:34px">and</span>' : '<span class="muted" style="width:34px">Where</span>'}<select data-f="${i}">${fields.map((x) => `<option value="${x.id}" ${x.id === c.f ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>${kind ? `<select data-op="${i}">${OPS[kind].map(([k, l]) => `<option value="${k}" ${k === c.op ? "selected" : ""}>${l}</option>`).join("")}</select>` : ""}${vin}<button class="xbtn" data-del="${i}">${ic("x")}</button></div>`;
    }).join("") || '<div class="hint">No filter conditions are applied.</div>';
  };
  const commit = () => { saveViewState(); render(); };
  draw();
  el.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.f != null) { const c = v.filters[+t.dataset.f]; c.f = t.value; const f = F(c.f); c.op = c.f === "_mine" ? "me" : OPS[opKind(f)][0][0]; c.v = opKind(f) === "select" || opKind(f) === "multi" ? [] : ""; }
    if (t.dataset.op != null) v.filters[+t.dataset.op].op = t.value;
    if (t.dataset.v != null) v.filters[+t.dataset.v].v = t.value;
    draw(); commit();
  });
  el.addEventListener("input", (e) => { if (e.target.dataset.v != null && e.target.type !== "date") { v.filters[+e.target.dataset.v].v = e.target.value; clearTimeout(el._t); el._t = setTimeout(commit, 250); } });
  el.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.add != null) { v.filters = v.filters || []; v.filters.push({ f: "status", op: "any", v: [] }); draw(); commit(); }
    if (t.dataset.clear != null) { v.filters = []; draw(); commit(); }
    if (t.dataset.del != null) { v.filters.splice(+t.dataset.del, 1); draw(); commit(); }
    if (t.dataset.vals != null) {
      const c = v.filters[+t.dataset.vals]; const f = F(c.f);
      const keep = POP; POP = null; // nest: keep filter popover
      const anchorRect = t.getBoundingClientRect();
      const fake = Object.assign({}, f, { options: f.type === "people" ? [{ name: "@me" }].concat(peopleNames().map((n) => ({ name: n }))) : f.options, type: "multiSelect" });
      pickOptions(anchorRect, fake, c.v || [], (vals) => { c.v = vals; commit(); }, { noCreate: true });
      const sub = POP; sub.onClose = () => { POP = keep; draw(); };
      e.stopPropagation();
    }
  });
}
function sortPop(btn) {
  const v = S.view;
  const fields = [{ id: "id", name: "ID" }].concat(db().schema.filter((f) => f.type !== "longText"), SYS);
  const el = openPop(btn, `<h5>Sort by</h5><div class="conds"></div><button class="lnk" data-add>${ic("plus")} Add sort</button>`, { minWidth: 380 });
  const draw = () => {
    $(".conds", el).innerHTML = (v.sorts || []).map((s, i) => `<div class="row"><select data-f="${i}">${fields.map((x) => `<option value="${x.id}" ${x.id === s.f ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select><select data-dir="${i}"><option value="asc" ${s.dir !== "desc" ? "selected" : ""}>A &rarr; Z / first &rarr; last</option><option value="desc" ${s.dir === "desc" ? "selected" : ""}>Z &rarr; A / last &rarr; first</option></select><button class="xbtn" data-del="${i}">${ic("x")}</button></div>`).join("") || '<div class="hint">No sorts applied.</div>';
  };
  draw();
  const commit = () => { saveViewState(); render(); };
  el.addEventListener("change", (e) => { const t = e.target; if (t.dataset.f != null) v.sorts[+t.dataset.f].f = t.value; if (t.dataset.dir != null) v.sorts[+t.dataset.dir].dir = t.value; commit(); });
  el.addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.add != null) { v.sorts = v.sorts || []; v.sorts.push({ f: "name", dir: "asc" }); } if (t.dataset.del != null) v.sorts.splice(+t.dataset.del, 1); draw(); commit(); });
}
function groupPop(btn, key) {
  const v = S.view;
  const fields = db().schema.filter((f) => ["singleSelect", "multiSelect", "people"].includes(f.type));
  const el = openPop(btn, `<h5>${key === "kanbanBy" ? "Stack cards by" : "Group by"}</h5>${key === "groupBy" ? `<div class="opt" data-g=""><span class="ck">${!v.groupBy ? "&#10003;" : ""}</span>No grouping</div>` : ""}${fields.map((f) => `<div class="opt" data-g="${f.id}"><span class="ck">${v[key] === f.id ? "&#10003;" : ""}</span>${ic(TYPE_IC[f.type])}${esc(f.name)}</div>`).join("")}`);
  el.addEventListener("click", (e) => { const o = e.target.closest("[data-g]"); if (!o) return; v[key] = o.dataset.g || null; S.collapsed.clear(); saveViewState(); closePop(); render(); });
}

/* ---------- grid ---------- */
function gridFields() {
  const hidden = new Set(S.view.hidden || []);
  return db().schema.filter((f) => f.primary).concat(db().schema.filter((f) => !f.primary && !hidden.has(f.id)), SYS.filter((f) => !hidden.has(f.id)));
}
function renderGrid() {
  const fields = gridFields();
  const rows = filtered();
  const w = (f) => S.view.widths[f.id] || f.width || 150;
  const groups = S.view.groupBy ? groupRows(rows, S.view.groupBy) : [{ key: null, rows }];
  const gf = S.view.groupBy && F(S.view.groupBy);
  const totalW = 64 + fields.reduce((a, f) => a + w(f), 0);
  let html = `<table class="grid" style="width:${totalW}px"><colgroup><col style="width:64px">${fields.map((f) => `<col data-col="${f.id}" style="width:${w(f)}px">`).join("")}</colgroup>`;
  html += `<thead><tr><th class="rn">#</th>${fields.map((f) => `<th class="${f.primary ? "pri" : ""}" data-hf="${f.id}"><div class="h">${ic(TYPE_IC[f.type] || "text")}<span>${esc(f.name)}</span>${(S.view.sorts || []).some((s) => s.f === f.id) ? ic((S.view.sorts.find((s) => s.f === f.id).dir === "desc") ? "down" : "up") : ""}</div><div class="rz" data-rz="${f.id}"></div></th>`).join("")}</tr></thead><tbody>`;
  let n = 0;
  groups.forEach((g) => {
    const gkey = String(g.key);
    if (g.key !== null) {
      const label = g.key === "" ? '<span class="muted">(empty)</span>' : gf.type === "people" ? person(g.key) : pill(gf, g.key);
      html += `<tr class="grp" data-grp="${esc(gkey)}"><td colspan="${fields.length + 1}">${ic(S.collapsed.has(gkey) ? "chevr" : "chev")} <span class="muted" style="font-weight:400;margin-right:6px">${esc(gf.name)}</span>${label}<span class="cnt">${g.rows.length}</span></td></tr>`;
      if (S.collapsed.has(gkey)) return;
    }
    g.rows.forEach((r) => {
      n++;
      html += `<tr data-id="${r.id}"><td class="rn"><span class="num">${esc(r.id.replace("TD-", ""))}</span><button class="exp" data-exp="${r.id}" title="Expand record">${ic("expand")}</button></td>`
        + fields.map((f) => `<td class="${f.primary ? "pri" : ""} ${f.type === "formula" || f.type === "sys" ? "ro" : ""}" data-f="${f.id}">${cellHTML(r, f)}</td>`).join("") + "</tr>";
    });
    if (store.canEdit) html += `<tr class="addrow" data-addgrp="${esc(gkey)}"><td class="rn">${ic("plus")}</td><td colspan="${fields.length}">Add feature${g.key ? " to " + esc(g.key) : ""}</td></tr>`;
  });
  html += `</tbody></table><div class="gridfoot">${rows.length} feature${rows.length === 1 ? "" : "s"}${rows.length !== db().records.length ? ` of ${db().records.length}` : ""} - click a cell to select, click again or press Enter to edit</div>`;
  if (!rows.length) html += `<div class="empty">No features match this view.</div>`;
  const c = $(".content"); const st = c.scrollTop, sl = c.scrollLeft;
  c.innerHTML = html; c.scrollTop = st; c.scrollLeft = sl;
  if (S.sel) markSel();
}
function markSel() {
  $$(".grid td.sel").forEach((t) => t.classList.remove("sel"));
  if (!S.sel) return;
  const td = $(`.grid tr[data-id="${S.sel.id}"] td[data-f="${S.sel.f}"]`);
  if (td) { td.classList.add("sel"); return td; }
}
function gridClick(e) {
  const t = e.target;
  const exp = t.closest("[data-exp]"); if (exp) return openDrawer(exp.dataset.exp);
  const grp = t.closest("tr.grp"); if (grp) { const k = grp.dataset.grp; S.collapsed.has(k) ? S.collapsed.delete(k) : S.collapsed.add(k); renderGrid(); return; }
  const add = t.closest("tr.addrow"); if (add) { const preset = {}; if (S.view.groupBy && add.dataset.addgrp && add.dataset.addgrp !== "null") { const f = F(S.view.groupBy); preset[f.id] = f.type === "singleSelect" ? add.dataset.addgrp : [add.dataset.addgrp]; } return newRecord(preset); }
  const th = t.closest("th[data-hf]"); if (th && !t.closest(".rz")) return headerMenu(th, F(th.dataset.hf));
  const td = t.closest("td[data-f]"); if (!td) return;
  const id = td.parentElement.dataset.id, f = td.dataset.f;
  const was = S.sel && S.sel.id === id && S.sel.f === f;
  S.sel = { id, f }; markSel();
  if (was || ["_comments", "_attachments"].includes(f)) editField(td, R(id), F(f));
}
function headerMenu(th, f) {
  const sortable = f.type !== "longText";
  const groupable = ["singleSelect", "multiSelect", "people"].includes(f.type);
  const el = openPop(th, `${sortable ? `<div class="opt" data-a="asc">${ic("up")}Sort first &rarr; last</div><div class="opt" data-a="desc">${ic("down")}Sort last &rarr; first</div>` : ""}${groupable ? `<div class="opt" data-a="group">${ic("group")}Group by this field</div>` : ""}${f.type !== "sys" && f.type !== "checklist" ? `<div class="opt" data-a="filter">${ic("filter")}Filter by this field</div>` : ""}${!f.primary ? `<div class="opt" data-a="hide">${ic("eye")}Hide field</div>` : ""}${store.canEdit && f.type !== "sys" && f.type !== "formula" ? `<div class="opt" data-a="edit">${ic("gear")}Edit field</div>` : ""}`);
  el.addEventListener("click", (e) => {
    const a = (e.target.closest("[data-a]") || {}).dataset; if (!a) return;
    const v = S.view;
    if (a.a === "asc" || a.a === "desc") v.sorts = [{ f: f.id, dir: a.a }];
    if (a.a === "group") v.groupBy = f.id;
    if (a.a === "hide") v.hidden = (v.hidden || []).concat(f.id);
    if (a.a === "filter") { v.filters = (v.filters || []).concat({ f: f.id, op: OPS[opKind(f)][0][0], v: ["select", "multi"].includes(opKind(f)) ? [] : "" }); saveViewState(); closePop(); render(); return filterPop($('[data-tb="filter"]')); }
    if (a.a === "edit") { closePop(); return fieldModal(f); }
    saveViewState(); closePop(); render();
  });
}
function gridKeys(e) {
  if (!S.sel || POP || S.drawer || $(".modal") || e.target.matches("input,textarea,select")) return;
  const fields = gridFields().map((f) => f.id);
  const ids = $$(".grid tr[data-id]").map((tr) => tr.dataset.id);
  let ri = ids.indexOf(S.sel.id), ci = fields.indexOf(S.sel.f);
  if (ri < 0 || ci < 0) return;
  const mv = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1], Tab: [0, e.shiftKey ? -1 : 1] }[e.key];
  if (mv) {
    ri = Math.max(0, Math.min(ids.length - 1, ri + mv[0])); ci = Math.max(0, Math.min(fields.length - 1, ci + mv[1]));
    S.sel = { id: ids[ri], f: fields[ci] }; const td = markSel(); if (td) td.scrollIntoView({ block: "nearest", inline: "nearest" }); e.preventDefault(); return;
  }
  const r = R(S.sel.id), f = F(S.sel.f), td = markSel();
  if (e.key === "Enter") { e.preventDefault(); if (e.shiftKey) openDrawer(r.id); else editField(td, r, f); }
  else if (e.key === "Escape") { S.sel = null; markSel(); }
  else if ((e.key === "Delete" || e.key === "Backspace") && store.canEdit && !["formula", "sys", "checklist"].includes(f.type) && !f.primary) setField(r.id, f.id, f.type === "multiSelect" || f.type === "people" ? [] : null);
  else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && (f.type === "text") && store.canEdit) { editText(td, r, f); const i = $(".pop input"); if (i) { i.value = e.key; } e.preventDefault(); }
}
/* column resize */
function startResize(e) {
  const id = e.target.dataset.rz; const col = $(`col[data-col="${id}"]`); if (!col) return;
  e.preventDefault(); e.stopPropagation();
  const x0 = e.clientX, w0 = col.getBoundingClientRect().width || parseInt(col.style.width);
  const tbl = col.closest("table"), tw0 = tbl.offsetWidth;
  const mv = (ev) => { const nw = Math.max(60, w0 + ev.clientX - x0); col.style.width = nw + "px"; tbl.style.width = tw0 + nw - w0 + "px"; };
  const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); S.view.widths[id] = parseInt(col.style.width); saveViewState(); renderGrid(); };
  document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
}

/* ---------- records ---------- */
function newRecord(preset = {}) {
  if (!store.canEdit) return readonlyNotice();
  const id = store.nextId();
  const rec = { id, name: "Untitled feature", module: null, phase: "Pipeline", status: "Yet to Start", priority: null, source: null, pm: [store.user.name].filter((n) => peopleNames().includes(n)), dev: [], milestone: [], releasedTo: [], startDate: null, targetDate: null, notes: "", sourceNote: "Added in tracker", subitems: [], attachments: [], comments: [] };
  STAGE_IDS.forEach((s) => (rec[s] = null));
  (S.view.filters || []).forEach((c) => { const f = F(c.f); if (f && c.op === "any" && c.v && c.v.length) rec[c.f] = f.type === "singleSelect" ? c.v[0] : c.v.slice(); });
  Object.assign(rec, preset);
  store.do({ t: "create", rec, detail: "Created in tracker" });
  openDrawer(id, "details", true);
}
function duplicateRecord(r) {
  const id = store.nextId();
  const rec = ZT.clone(r); rec.id = id; rec.name = r.name + " (copy)"; rec.comments = []; rec.attachments = (r.attachments || []).filter((a) => a.kind === "link"); delete rec.history;
  store.do({ t: "create", rec, detail: "Duplicated from " + r.id });
  openDrawer(id);
}

/* ---------- drawer ---------- */
function openDrawer(id, tab = "details", focusTitle = false) {
  closePop();
  S.drawer = { id, tab: tab || "details", focusTitle };
  history.replaceState(null, "", "#rec=" + id);
  renderDrawer();
}
function closeDrawer() { S.drawer = null; $(".drawer-slot").innerHTML = ""; history.replaceState(null, "", location.pathname + location.search); }
function renderDrawer() {
  const slot = $(".drawer-slot");
  if (!S.drawer) { slot.innerHTML = ""; return; }
  let r = R(S.drawer.id);
  const deleted = !r && (db().deleted || []).find((x) => x.id === S.drawer.id);
  if (!r && !deleted) { closeDrawer(); return; }
  r = r || deleted;
  const tab = S.drawer.tab;
  const nC = (r.comments || []).length, nA = (r.attachments || []).length, nH = (r.history || []).length;
  const prevBody = $(".drawer .body"); const scroll = prevBody ? prevBody.scrollTop : 0;
  const composing = $(".composer textarea"); const draft = composing ? composing.value : "";
  slot.innerHTML = `<div class="scrim" data-close></div><aside class="drawer" role="dialog" aria-label="Feature ${esc(r.id)}">
    <header><div class="top"><span>${esc(r.id)}</span>${r.status ? pill(F("status"), r.status) : ""}<span>Updated ${esc(ago(r.updatedAt))} by ${esc(r.updatedBy || "")}</span><span class="spacer"></span>
      <button class="xbtn" data-dact="link" title="Copy link">${ic("link")}</button>${store.canEdit && !deleted ? `<button class="xbtn" data-dact="dup" title="Duplicate">${ic("dup")}</button><button class="xbtn" data-dact="del" title="Delete">${ic("trash")}</button>` : ""}<button class="xbtn" data-close title="Close (Esc)">${ic("x")}</button></div>
      ${deleted ? `<div class="banner err" style="margin:8px 0">This feature was deleted. <button data-dact="restore">Restore</button></div>` : ""}
      <input class="title" value="${esc(r.name)}" ${store.canEdit && !deleted ? "" : "readonly"} data-title>
      <div class="tabs">${[["details", "Details"], ["comments", "Comments", nC], ["attachments", "Attachments", nA], ["history", "History", nH]].map(([k, l, n]) => `<button class="${tab === k ? "on" : ""}" data-tab="${k}">${l}${n != null ? `<span class="badge">${n}</span>` : ""}</button>`).join("")}</div></header>
    <div class="body">${tab === "details" ? drawerDetails(r) : tab === "comments" ? drawerComments(r) : tab === "attachments" ? drawerAttachments(r) : drawerHistory(r)}</div></aside>`;
  $(".drawer .body").scrollTop = scroll;
  const ta = $(".composer textarea"); if (ta && draft) ta.value = draft;
  if (S.drawer.focusTitle) { S.drawer.focusTitle = false; const t = $("[data-title]"); t.focus(); t.select(); }
}
function drawerDetails(r) {
  const fs = db().schema;
  const row = (f) => {
    const ro = !store.canEdit || f.type === "formula";
    const inner = f.type === "longText" ? (r[f.id] ? esc(r[f.id]) : '<span class="muted">Add notes...</span>') : (cellHTML(r, f) || '<span class="muted">-</span>');
    return `<div class="lab">${ic(TYPE_IC[f.type] || "text")}${esc(f.name)}</div><div class="val ${f.type === "longText" ? "long" : ""} ${ro ? "ro" : ""}" data-df="${f.id}">${inner}</div>`;
  };
  const stage = fs.filter((f) => f.stage);
  const main = fs.filter((f) => !f.primary && !f.stage && f.type !== "checklist" && !["notes", "releasedTo", "startDate", "targetDate", "sourceNote"].includes(f.id));
  const subs = r.subitems || [];
  return `<div class="fgrid">${main.map(row).join("")}
    <div class="sec">Delivery stages</div><div style="grid-column:1/-1"><div class="stagebar">${stage.map((f) => `<div class="stage" data-df="${f.id}"><div class="sn">${esc(f.name)}</div>${r[f.id] ? pill(f, r[f.id]) : '<span class="muted" style="font-size:12px">-</span>'}</div>`).join("")}</div></div>
    <div class="sec">Schedule & release</div>${["startDate", "targetDate", "releasedTo"].map((id) => F(id)).filter(Boolean).map(row).join("")}
    <div class="sec">Sub-items (${subs.filter((s) => s.done).length}/${subs.length})</div><div style="grid-column:1/-1">${subs.map((s, i) => `<div class="chk ${s.done ? "done" : ""}"><input type="checkbox" data-sub="${i}" ${s.done ? "checked" : ""} ${store.canEdit ? "" : "disabled"}><input class="t" data-subt="${i}" value="${esc(s.text)}" ${store.canEdit ? "" : "readonly"}>${store.canEdit ? `<button class="xbtn" data-subdel="${i}">${ic("x")}</button>` : ""}</div>`).join("")}
      ${store.canEdit ? `<div class="addline"><input placeholder="Add a sub-item and press Enter" data-subadd></div>` : ""}</div>
    <div class="sec">Notes</div>${row(F("notes"))}${F("sourceNote") ? row(F("sourceNote")) : ""}
    ${fs.filter((f) => !f.core && !main.includes(f) && !f.stage && !["notes", "releasedTo", "startDate", "targetDate", "sourceNote", "subitems"].includes(f.id) && !f.primary).map(row).join("")}</div>`;
}
const mentionify = (t) => { let h = esc(t); peopleNames().sort((a, b) => b.length - a.length).forEach((n) => { h = h.split("@" + esc(n)).join(`<span class="mention">@${esc(n)}</span>`); }); return h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); };
function drawerComments(r) {
  const cs = (r.comments || []).slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  return (cs.length ? cs.map((c) => `<div class="comment">${avatar(c.by)}<div style="flex:1;min-width:0"><div class="meta"><b>${esc(c.by)}</b><span title="${esc(fullTime(c.at))}">${esc(ago(c.at))}</span>${store.canEdit && c.by === store.user.name ? ` <button class="lnk" data-cdel="${esc(c.id)}" style="font-size:11.5px">Delete</button>` : ""}</div><div class="txt">${mentionify(c.text)}</div></div></div>`).join("") : '<div class="muted" style="padding:12px 0">No comments yet. Start the discussion for this feature.</div>')
    + (store.canEdit ? `<div class="composer"><textarea placeholder="Write a comment... use @ to mention a teammate" data-ctext></textarea><div class="bar"><span>Ctrl+Enter to post - commenting as ${esc(store.user.name)}</span><button class="btn primary" data-cpost>Comment</button></div></div>` : "");
}
function fileBadge(a) {
  if (a.kind === "link") return ic("link");
  const ext = (a.name.split(".").pop() || "").slice(0, 4).toUpperCase();
  return esc(ext || "FILE");
}
const fmtSize = (b) => (b == null ? "" : b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB");
function drawerAttachments(r) {
  const as = r.attachments || [];
  return (as.length ? as.map((a) => `<div class="att"><div class="ic">${fileBadge(a)}</div><div class="nm">${a.kind === "link" ? `<a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">${esc(a.name)}</a>` : `<button data-aopen="${esc(a.id)}">${esc(a.name)}</button>`}<div class="s">${a.kind === "link" ? esc(a.url) : esc(fmtSize(a.size))} - added by ${esc(a.by)} ${esc(ago(a.at))}</div></div>${store.canEdit ? `<button class="xbtn" data-adel="${esc(a.id)}" title="Remove">${ic("trash")}</button>` : ""}</div>`).join("") : '<div class="muted" style="padding:12px 0">No attachments yet - add analysis docs, designs, Cliq threads or files.</div>')
    + (store.canEdit ? `<h4 style="margin:18px 0 4px;font-size:13px">Add a link</h4><div class="formrow"><input placeholder="Name (e.g. Analysis document)" data-lname style="flex:1"><input placeholder="https://..." data-lurl style="flex:1.4"><button class="btn primary" data-ladd>Add</button></div>
      <div class="drop" data-drop>${ic("upload")} Drag files here or <button class="lnk" data-pick>browse</button> - up to ${store.mode === "local" ? 1 : store.cfg.maxUploadMB || 5} MB each${store.mode === "github" ? ", stored in the repo under " + esc(store.cfg.attachmentsDir) + "/" + esc(r.id) : ""}<input type="file" multiple hidden data-file></div>` : "");
}
function drawerHistory(r) {
  const hs = (r.history || []).slice().reverse();
  return `<div class="tl">${hs.map((h) => `<div class="ev ${esc(h.action)}"><div class="w">${esc(fullTime(h.at))} - ${esc(h.by)}</div><div class="d">${histText(h)}</div></div>`).join("")}</div>`
    + (store.repoWebUrl() ? `<p class="muted" style="margin-top:16px">Every save is also a Git commit - <a href="${esc(store.repoWebUrl())}/commits/${esc(store.cfg.branch)}/${esc(store.cfg.dataPath)}" target="_blank" rel="noopener">view the full commit history</a>.</p>` : "");
}
function histText(h) {
  switch (h.action) {
    case "edit": return `Changed <b>${esc(h.field)}</b> <span class="from">${esc(h.from)}</span> &rarr; <span class="to">${esc(h.to)}</span>`;
    case "created": return `Created - ${esc(h.detail || "")}`;
    case "comment": return `Commented: "${esc(h.detail || "")}"`;
    case "comment-deleted": return "Deleted a comment";
    case "attach": return `Attached <b>${esc(h.detail || "")}</b>`;
    case "detach": return `Removed attachment <b>${esc(h.detail || "")}</b>`;
    case "deleted": return "Deleted this feature";
    case "restored": return "Restored this feature";
  }
  return esc(h.action);
}
async function drawerClick(e) {
  const t = e.target;
  if (t.closest("[data-close]")) return closeDrawer();
  const r = R(S.drawer.id) || (db().deleted || []).find((x) => x.id === S.drawer.id);
  const tabB = t.closest("[data-tab]"); if (tabB) { S.drawer.tab = tabB.dataset.tab; return renderDrawer(); }
  const act = t.closest("[data-dact]");
  if (act) {
    const a = act.dataset.dact;
    if (a === "link") { const u = location.href.split("#")[0] + "#rec=" + r.id; navigator.clipboard && navigator.clipboard.writeText(u); toast("Link copied"); }
    if (a === "dup") duplicateRecord(r);
    if (a === "del" && confirm(`Delete ${r.id} "${r.name}"? It can be restored from Deleted features.`)) { store.do({ t: "delete", id: r.id }); closeDrawer(); }
    if (a === "restore") { store.do({ t: "restore", id: r.id }); }
    return;
  }
  const df = t.closest("[data-df]");
  if (df && !df.classList.contains("ro") && !t.closest("a")) return editField(df, r, F(df.dataset.df));
  if (t.closest("[data-subdel]")) { const s = (r.subitems || []).slice(); s.splice(+t.closest("[data-subdel]").dataset.subdel, 1); return setField(r.id, "subitems", s); }
  if (t.closest("[data-cpost]")) return postComment(r);
  const cdel = t.closest("[data-cdel]"); if (cdel && confirm("Delete this comment?")) return store.do({ t: "uncomment", id: r.id, cid: cdel.dataset.cdel });
  if (t.closest("[data-ladd]")) {
    const n = $("[data-lname]").value.trim(), u = $("[data-lurl]").value.trim();
    if (!/^https?:\/\//i.test(u)) return toast("Enter a link that starts with http:// or https://");
    return store.do({ t: "attach", id: r.id, a: { id: ZT.uid("a"), kind: "link", name: n || u, url: u, by: store.user.name, at: new Date().toISOString() } });
  }
  if (t.closest("[data-pick]")) return $("[data-file]").click();
  const adel = t.closest("[data-adel]"); if (adel && confirm("Remove this attachment from the feature?")) return store.do({ t: "detach", id: r.id, aid: adel.dataset.adel });
  const aopen = t.closest("[data-aopen]");
  if (aopen) {
    const a = r.attachments.find((x) => x.id === aopen.dataset.aopen);
    try { const u = await store.attachmentUrl(a); const w = window.open(u, "_blank"); if (!w) { const l = document.createElement("a"); l.href = u; l.download = a.name; l.click(); } }
    catch (err) { toast("Could not open file: " + err.message); }
  }
}
function postComment(r) {
  const ta = $("[data-ctext]"); const text = ta.value.trim(); if (!text) return;
  ta.value = "";
  store.do({ t: "comment", id: r.id, c: { id: ZT.uid("c"), by: store.user.name, at: new Date().toISOString(), text } });
}
async function uploadFiles(files) {
  const r = R(S.drawer.id);
  for (const f of files) {
    toast("Uploading " + f.name + "...");
    try { await store.uploadFile(r.id, f); toast("Attached " + f.name); } catch (e) { toast("Upload failed: " + e.message, 4000); }
  }
}
function drawerEvents(slot) {
  slot.addEventListener("click", drawerClick);
  slot.addEventListener("change", (e) => {
    const t = e.target, r = R(S.drawer.id); if (!r) return;
    if (t.dataset.sub != null) { const s = ZT.clone(r.subitems || []); s[+t.dataset.sub].done = t.checked; setField(r.id, "subitems", s); }
    if (t.dataset.subt != null) { const s = ZT.clone(r.subitems || []); if (s[+t.dataset.subt].text !== t.value) { s[+t.dataset.subt].text = t.value; setField(r.id, "subitems", s); } }
    if (t.dataset.file != null) uploadFiles([...t.files]);
    if (t.dataset.title != null && t.value.trim() && t.value !== r.name) setField(r.id, "name", t.value.trim());
  });
  slot.addEventListener("keydown", (e) => {
    const t = e.target, r = R(S.drawer && S.drawer.id);
    if (!r) return;
    if (t.dataset.subadd != null && e.key === "Enter" && t.value.trim()) { setField(r.id, "subitems", (r.subitems || []).concat({ text: t.value.trim(), done: false })); setTimeout(() => { const i = $("[data-subadd]"); i && i.focus(); }, 0); }
    if (t.dataset.title != null && e.key === "Enter") t.blur();
    if (t.dataset.ctext != null && e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment(r);
    if (t.dataset.lurl != null && e.key === "Enter") $("[data-ladd]").click();
  });
  slot.addEventListener("input", (e) => { if (e.target.dataset.ctext != null) mentionAssist(e.target); });
  slot.addEventListener("dragover", (e) => { const d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  slot.addEventListener("dragleave", (e) => { const d = e.target.closest("[data-drop]"); if (d) d.classList.remove("over"); });
  slot.addEventListener("drop", (e) => { const d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.remove("over"); uploadFiles([...e.dataTransfer.files]); } });
}
function mentionAssist(ta) {
  const before = ta.value.slice(0, ta.selectionStart);
  const m = before.match(/@([\w .]{0,20})$/);
  if (!m) { if (POP && POP.mention) closePop(); return; }
  const q = m[1].toLowerCase();
  const hits = peopleNames().filter((n) => n.toLowerCase().startsWith(q) || n.toLowerCase().split(" ").some((p) => p.startsWith(q))).slice(0, 6);
  if (!hits.length) { closePop(); return; }
  const rect = ta.getBoundingClientRect();
  const el = openPop({ left: rect.left + 10, bottom: rect.top - 4 - hits.length * 32, top: rect.top }, hits.map((n) => `<div class="opt" data-m="${esc(n)}">${person(n)}${esc(n)}</div>`).join(""), { focus: false });
  POP.mention = true;
  el.addEventListener("mousedown", (e) => {
    const o = e.target.closest("[data-m]"); if (!o) return; e.preventDefault();
    const start = before.length - m[0].length;
    ta.value = ta.value.slice(0, start) + "@" + o.dataset.m + " " + ta.value.slice(ta.selectionStart);
    closePop(); ta.focus();
  });
}

/* ---------- CSV ---------- */
function exportCSV() {
  const fields = [{ id: "id", name: "ID", type: "text" }].concat(gridFields().filter((f) => f.id !== "_updated"));
  const cell = (r, f) => {
    let v = f.id === "id" ? r.id : val(r, f.id);
    if (f.type === "checklist") v = (v || []).map((s) => (s.done ? "[x] " : "[ ] ") + s.text).join("; ");
    else if (Array.isArray(v)) v = v.join("; ");
    v = v == null ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const csv = [fields.map((f) => cell({ id: f.name }, { id: "id" })).join(",")].concat(filtered().map((r) => fields.map((f) => cell(r, f)).join(","))).join("\n");
  download(new Blob(["﻿" + csv], { type: "text/csv" }), (S.view.name || "features").replace(/\W+/g, "-").toLowerCase() + ".csv");
}
function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

/* ---------- render ---------- */
function render() {
  if (!S.view) loadView(S.viewId);
  renderShell(); renderToolbar();
  const c = $(".content");
  ["onclick", "onmousedown", "onchange", "oninput", "ondragstart", "ondragend", "ondragover", "ondrop"].forEach((k) => (c[k] = null));
  const t = S.view.type;
  if (t === "grid") renderGrid();
  else if (t === "kanban") renderKanban();
  else if (t === "timeline") renderTimeline();
  else if (t === "dashboard") renderDashboard();
  else if (t === "activity") renderActivity();
  renderDrawer();
}

/* ---------- boot ---------- */
function boot() {
  document.body.innerHTML = `<div id="app" class="${S.sidebar ? "" : "nosidebar"}">
    <div class="topbar"><div class="logo">ZT</div><div><h1>Zoho ToDo - Product Development Tracker</h1></div><span class="sub">Roadmap 2026/27 - features, delivery stages & milestones</span><span class="spacer"></span>
      <span class="sync"></span><button class="tb-btn" data-act="refresh" title="Pull latest from GitHub">${ic("sync")}</button><span class="me"></span><button class="tb-btn" data-act="settings" title="Settings">${ic("gear")}Settings</button></div>
    <div class="viewbar"></div><nav class="sidebar"></nav>
    <main><div class="banner-slot"></div><div class="toolbar"></div><div class="content"><div class="empty">Loading tracker...</div></div></main></div>
    <div class="drawer-slot"></div>`;
  document.addEventListener("click", (e) => {
    const vb = e.target.closest("[data-view]");
    if (vb && !e.target.closest("[data-delview]")) { loadView(vb.dataset.view); S.search = ""; closeDrawer(); render(); return; }
    const dv = e.target.closest("[data-delview]");
    if (dv) { if (confirm("Delete this team view for everyone?")) { store.do({ t: "unview", vid: dv.dataset.delview }); if (S.viewId === dv.dataset.delview) loadView("v-all"); render(); } return; }
    const a = e.target.closest("[data-act]");
    if (a) {
      const k = a.dataset.act;
      if (k === "sidebar") { S.sidebar = !S.sidebar; ZT.LS.set("sidebar", S.sidebar); $("#app").classList.toggle("nosidebar", !S.sidebar); }
      if (k === "settings") settingsModal();
      if (k === "refresh") store.refresh().then(() => toast("Up to date")).catch((er) => toast("Refresh failed: " + er.message));
      if (k === "trash") trashModal();
      if (k === "localmode") { store.setLocalMode(true); location.reload(); }
      if (k === "saveview") saveTeamView(false);
      if (k === "saveas") saveTeamView(true);
      if (k === "resetview") { ZT.LS.del("vs." + S.viewId); loadView(S.viewId); render(); }
      return;
    }
    const tb = e.target.closest("[data-tb]"); if (tb) return toolbarClick(tb);
    const z = e.target.closest("[data-zoom]"); if (z) { S.view.zoom = z.dataset.zoom; saveViewState(); render(); return; }
    if (e.target.closest(".sync") && store.lastCommit) window.open(store.lastCommit.url, "_blank");
  });
  $(".content").addEventListener("click", (e) => { if (S.view.type === "grid") gridClick(e); });
  $(".content").addEventListener("dblclick", (e) => { if (S.view.type !== "grid") return; const td = e.target.closest("td[data-f]"); if (td) editField(td, R(td.parentElement.dataset.id), F(td.dataset.f)); });
  $(".content").addEventListener("mousedown", (e) => { if (e.target.dataset.rz) startResize(e); });
  document.addEventListener("input", (e) => { if (e.target.dataset.search != null) { S.search = e.target.value; clearTimeout(S._st); S._st = setTimeout(() => { const pos = e.target.selectionStart; render(); const i = $("[data-search]"); i.focus(); i.setSelectionRange(pos, pos); }, 180); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (POP) return closePop(); if ($(".modal")) return closeModal(); if (S.drawer && !e.target.matches("textarea")) return closeDrawer(); }
    if (S.view && S.view.type === "grid") gridKeys(e);
  });
  drawerEvents($(".drawer-slot"));
  initTooltips();
  store.on((kind) => {
    if (kind === "status" || kind === "user") return renderStatus();
    if (kind === "readonly") return readonlyNotice();
    if (kind === "synced") { renderStatus(); if (!S.view || S.view.type === "activity") render(); return; }
    if (!S.view) loadView(S.viewId);
    if (kind === "remote") toast("Updated with teammates' latest changes");
    if (POP && kind === "change") { renderStatus(); renderShell(); rerenderMainOnly(); return; }
    render();
  });
  store.load().then(() => {
    const m = location.hash.match(/rec=(TD-\d+)/);
    if (m) S.drawer = { id: m[1], tab: "details" };
    if (!ZT.LS.get("me", "") && store.mode !== "readonly") setTimeout(() => settingsModal(true), 300);
  }).catch((e) => { $(".content").innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
  setInterval(() => { if (store.lastCommit) renderStatus(); }, 30000);
  window.addEventListener("beforeunload", (e) => { if (store.pending.length) { store.flush(); e.preventDefault(); e.returnValue = ""; } });
}
function rerenderMainOnly() {
  const t = S.view.type;
  if (t === "grid") renderGrid(); else if (t === "kanban") renderKanban(); else if (t === "timeline") renderTimeline(); else if (t === "dashboard") renderDashboard(); else renderActivity();
  if (S.drawer) { const keep = POP; POP = null; renderDrawer(); POP = keep; }
}
document.addEventListener("DOMContentLoaded", boot);
