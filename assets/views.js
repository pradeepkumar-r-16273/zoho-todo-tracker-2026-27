/* Kanban, Timeline, Dashboard, Activity views + modals (settings, fields, trash). */

/* ---------- Kanban ---------- */
function renderKanban() {
  const f = F(S.view.kanbanBy) || F("status");
  const rows = filtered();
  let cols = f.type === "people" ? peopleNames() : (f.options || []).map((o) => o.name);
  const groups = new Map(cols.map((c) => [c, []])); groups.set("", []);
  rows.forEach((r) => { const v = r[f.id]; const ks = Array.isArray(v) ? (v.length ? v : [""]) : [v || ""]; ks.forEach((k) => { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }); });
  const keys = [...groups.keys()].filter((k) => groups.get(k).length || (k !== "" && f.type !== "people"));
  const card = (r, k) => {
    const p = progress(r);
    return `<div class="card" draggable="${store.canEdit}" data-card="${r.id}" data-from="${esc(k)}"><div class="id">${esc(r.id)}</div><div class="t">${esc(r.name)}</div><div class="meta">${["module", "status", "phase"].filter((x) => x !== f.id && r[x]).slice(0, 2).map((x) => pill(F(x), r[x])).join("")}${(r.milestone || []).filter(() => f.id !== "milestone").slice(0, 2).map((m) => pill(F("milestone"), m)).join("")}</div>${p != null ? `<div class="prog"><div class="bar"><i class="${p === 100 ? "done" : ""}" style="width:${p}%"></i></div><b>${p}%</b></div>` : ""}<div class="ft">${(r.pm || []).concat(r.dev || []).slice(0, 4).map(avatar).join("")}<span class="spacer"></span>${(r.comments || []).length ? `<span class="cnt-ic has">${ic("chat")}${r.comments.length}</span>` : ""}${(r.attachments || []).length ? `<span class="cnt-ic has">${ic("clip")}${r.attachments.length}</span>` : ""}</div></div>`;
  };
  const c = $(".content"); const sl = c.scrollLeft;
  c.innerHTML = `<div class="kanban">${keys.map((k) => `<section class="kcol" data-col="${esc(k)}"><header>${k ? (f.type === "people" ? person(k) : pill(f, k)) : '<span class="muted">(empty)</span>'}<span class="n">${groups.get(k).length}</span></header><div class="cards">${groups.get(k).map((r) => card(r, k)).join("")}${store.canEdit ? `<button class="tbtn" data-kadd="${esc(k)}">${ic("plus")} Add feature</button>` : ""}</div></section>`).join("")}</div>`;
  c.scrollLeft = sl;
  const multi = f.type !== "singleSelect";
  c.onclick = (e) => {
    const cd = e.target.closest("[data-card]"); if (cd) return openDrawer(cd.dataset.card);
    const a = e.target.closest("[data-kadd]"); if (a) { const k = a.dataset.kadd; newRecord(k ? { [f.id]: multi ? [k] : k } : {}); }
  };
  let drag = null;
  c.ondragstart = (e) => { const cd = e.target.closest("[data-card]"); if (!cd) return; drag = { id: cd.dataset.card, from: cd.dataset.from }; cd.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; };
  c.ondragend = () => { $$(".card.dragging,.kcol.over").forEach((x) => x.classList.remove("dragging", "over")); };
  c.ondragover = (e) => { const col = e.target.closest(".kcol"); if (!col || !drag) return; e.preventDefault(); $$(".kcol.over").forEach((x) => x !== col && x.classList.remove("over")); col.classList.add("over"); };
  c.ondrop = (e) => {
    const col = e.target.closest(".kcol"); if (!col || !drag) return; e.preventDefault();
    const to = col.dataset.col, r = R(drag.id);
    if (to !== drag.from) {
      let v;
      if (!multi) v = to || null;
      else { v = (r[f.id] || []).filter((x) => x !== drag.from); if (to && !v.includes(to)) v.push(to); }
      setField(r.id, f.id, v);
    }
    drag = null;
  };
}

/* ---------- Timeline ---------- */
const DAY = 86400000;
const toD = (s) => new Date(s + "T00:00:00");
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function renderTimeline() {
  const v = S.view, zoom = v.zoom || "month";
  const px = { week: 30, month: 7, quarter: 2.6 }[zoom];
  const rows = filtered();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let min = new Date(today.getFullYear(), today.getMonth() - 2, 1), max = new Date(today.getFullYear(), today.getMonth() + 10, 1);
  rows.forEach((r) => { [r.startDate, r.targetDate].filter(Boolean).forEach((d) => { const x = toD(d); if (x < min) min = new Date(x.getFullYear(), x.getMonth() - 1, 1); if (x > max) max = new Date(x.getFullYear(), x.getMonth() + 2, 1); }); });
  (db().milestones || []).filter((m) => m.date).forEach((m) => { const x = toD(m.date); if (x < min) min = new Date(x.getFullYear(), x.getMonth() - 1, 1); if (x > max) max = new Date(x.getFullYear(), x.getMonth() + 2, 1); });
  const days = Math.round((max - min) / DAY), W = days * px;
  const X = (d) => Math.round(((toD(d) - min) / DAY) * px);
  let months = "", weeks = "";
  for (let d = new Date(min); d < max; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const n = new Date(d.getFullYear(), d.getMonth() + 1, 1), w = Math.round(((n - d) / DAY) * px);
    months += `<div style="width:${w}px">${d.toLocaleDateString(undefined, { month: zoom === "quarter" ? "short" : "long", year: "numeric" })}</div>`;
  }
  if (zoom !== "quarter") {
    const step = zoom === "week" ? 1 : 7;
    let d = new Date(min); if (step === 7) while (d.getDay() !== 1) d = new Date(d.getTime() + DAY);
    else d = new Date(min);
    const first = Math.round(((d - min) / DAY) * px);
    weeks += `<div style="width:${first}px;border:0"></div>`;
    for (; d < max; d = new Date(d.getTime() + step * DAY)) weeks += `<div style="width:${step * px}px">${zoom === "week" ? d.getDate() : d.getDate() + " " + d.toLocaleDateString(undefined, { month: "short" })}</div>`;
  }
  const groups = v.groupBy ? groupRows(rows, v.groupBy) : [{ key: null, rows }];
  const gf = v.groupBy && F(v.groupBy);
  const sf = F("status");
  let left = `<div class="hdr">Feature</div>`, right = `<div class="hdr"><div class="months">${months}</div><div class="weeks">${weeks}</div></div>`;
  groups.forEach((g) => {
    if (g.key !== null) {
      left += `<div class="lrow grp">${g.key ? (gf.type === "people" ? person(g.key) : pill(gf, g.key)) : '<span class="muted">(empty)</span>'}<span class="muted" style="font-weight:400">${g.rows.length}</span></div>`;
      right += `<div class="rrow grp"></div>`;
    }
    g.rows.slice().sort((a, b) => (a.startDate || "9") < (b.startDate || "9") ? -1 : 1).forEach((r) => {
      left += `<div class="lrow" data-open="${r.id}"><span class="muted" style="font-size:11px;width:46px">${esc(r.id)}</span><span class="nm">${esc(r.name)}</span></div>`;
      let bar = "";
      const s = r.startDate || r.targetDate, e = r.targetDate || r.startDate;
      if (s) {
        const x = X(s), w = Math.max(px, X(e) - x + px);
        bar = `<div class="bar" data-bar="${r.id}" style="left:${x}px;width:${w}px;background:${SOLID[optColor(sf, r.status)]}" data-tip="${esc(r.name)}<br>${esc(fmtDate(r.startDate) || "?")} &rarr; ${esc(fmtDate(r.targetDate) || "?")}<br>${esc(r.status || "")}">${store.canEdit ? '<span class="hd l" data-h="l"></span>' : ""}${esc(r.name)}${store.canEdit ? '<span class="hd r" data-h="r"></span>' : ""}</div>`;
      } else if (store.canEdit) bar = `<div class="ghost" data-sched="${r.id}" style="left:${X(iso(today))}px">+ Schedule</div>`;
      right += `<div class="rrow">${bar}</div>`;
    });
  });
  const ms = (db().milestones || []).filter((m) => m.date).map((m) => `<div class="msline" style="left:${X(m.date)}px"></div><div class="mslab" style="left:${X(m.date)}px" data-tip="Milestone ${esc(m.name)} - ${esc(fmtDate(m.date))}">${esc(m.name)}</div>`).join("");
  const c = $(".content"); const st = c.scrollTop, sl = c.scrollLeft, first = !c.querySelector(".tlv");
  c.innerHTML = `<div class="tlv" style="width:${W + 300}px"><div class="left">${left}</div><div class="right" style="width:${W}px">${right}<div class="today" style="left:${X(iso(today))}px"></div>${ms}</div></div>`
    + `<div class="gridfoot">${rows.filter((r) => r.startDate || r.targetDate).length} of ${rows.length} features scheduled - drag bars to move, drag edges to change dates.${(db().milestones || []).some((m) => m.date) ? "" : " Add milestone dates in Settings to show M288-M295 markers."}</div>`;
  c.scrollTop = st; c.scrollLeft = sl;
  if (first) scrollTimelineToday();
  c.onclick = (e) => {
    const o = e.target.closest("[data-open]"); if (o) return openDrawer(o.dataset.open);
    const sc = e.target.closest("[data-sched]");
    if (sc) { const id = sc.dataset.sched; const t0 = iso(today); store.do({ t: "set", id, f: "startDate", v: t0 }); store.do({ t: "set", id, f: "targetDate", v: iso(new Date(today.getTime() + 13 * DAY)) }); }
  };
  c.onmousedown = (e) => {
    const b = e.target.closest("[data-bar]"); if (!b || !store.canEdit) return;
    e.preventDefault();
    const r = R(b.dataset.bar), mode = e.target.dataset.h || "move";
    const x0 = e.clientX, l0 = b.offsetLeft, w0 = b.offsetWidth; let moved = false;
    const mv = (ev) => {
      const dx = ev.clientX - x0; if (Math.abs(dx) > 3) moved = true;
      if (mode === "move") b.style.left = l0 + dx + "px";
      else if (mode === "l") { b.style.left = Math.min(l0 + dx, l0 + w0 - px) + "px"; b.style.width = Math.max(px, w0 - dx) + "px"; }
      else b.style.width = Math.max(px, w0 + dx) + "px";
    };
    const up = () => {
      document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up);
      if (!moved) return openDrawer(r.id);
      const sd = new Date(min.getTime() + Math.round(b.offsetLeft / px) * DAY), ed = new Date(min.getTime() + (Math.round((b.offsetLeft + b.offsetWidth) / px) - 1) * DAY);
      if (iso(sd) !== r.startDate) store.do({ t: "set", id: r.id, f: "startDate", v: iso(sd) });
      if (iso(ed) !== r.targetDate) store.do({ t: "set", id: r.id, f: "targetDate", v: iso(ed) });
    };
    document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
  };
}
function scrollTimelineToday() { const t = $(".tlv .today"), c = $(".content"); if (t && c) c.scrollLeft = Math.max(0, t.offsetLeft + 300 - c.clientWidth / 3); }

/* ---------- Dashboard ---------- */
// Categorical palette (validated, fixed order) for phases; sequential blue ramp for heat.
const CAT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const SEQ = ["#f4f8fd", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
const DS = { module: "", pm: "", phase: "" };
function drill(filters, name) {
  loadView("v-all"); S.view.filters = filters; S.view.groupBy = null; S.view.name = name || "Filtered features"; S.search = "";
  saveViewState(); render();
}
function renderDashboard() {
  const all = db().records;
  let rows = all.filter((r) => (!DS.module || r.module === DS.module) && (!DS.pm || (r.pm || []).includes(DS.pm) || (r.dev || []).includes(DS.pm)) && (!DS.phase || r.phase === DS.phase));
  const base = [];
  if (DS.module) base.push({ f: "module", op: "any", v: [DS.module] });
  if (DS.phase) base.push({ f: "phase", op: "any", v: [DS.phase] });
  const cnt = (fn) => rows.filter(fn).length;
  const active = rows.filter((r) => ["Working on", "Roadmap", "Pipeline"].includes(r.phase));
  const prs = active.map(progress).filter((p) => p != null);
  const avg = prs.length ? Math.round(prs.reduce((a, b) => a + b, 0) / prs.length) : 0;
  const tiles = [
    ["Total features", rows.length, "in this tracker", []],
    ["Released", cnt((r) => r.phase === "Released"), cnt((r) => r.status === "Released") + " fully released", [{ f: "phase", op: "any", v: ["Released"] }]],
    ["Working on", cnt((r) => r.phase === "Working on"), cnt((r) => r.phase === "Working on" && r.status === "Testing") + " in testing", [{ f: "phase", op: "any", v: ["Working on"] }]],
    ["Roadmap + pipeline", cnt((r) => r.phase === "Roadmap" || r.phase === "Pipeline"), cnt((r) => r.status === "Analysis Done") + " analysis done", [{ f: "phase", op: "any", v: ["Roadmap", "Pipeline"] }]],
    ["On hold", cnt((r) => r.status === "On Hold"), "need a decision", [{ f: "status", op: "any", v: ["On Hold"] }]],
    ["Avg. progress", avg + "%", "across " + active.length + " active features", [{ f: "phase", op: "any", v: ["Working on", "Roadmap", "Pipeline"] }]],
  ];
  const phases = F("phase").options.map((o) => o.name);
  const pColor = (p) => CAT[phases.indexOf(p) % CAT.length];
  // module x phase stacked
  const mods = F("module").options.map((o) => o.name).filter((m) => rows.some((r) => r.module === m));
  const modMax = Math.max(1, ...mods.map((m) => cnt((r) => r.module === m)));
  const modHTML = `<div class="legend">${phases.map((p) => `<span><i style="background:${pColor(p)}"></i>${esc(p)}</span>`).join("")}</div>` + mods.map((m) => {
    const tot = cnt((r) => r.module === m);
    const segs = phases.map((p) => { const n = cnt((r) => r.module === m && r.phase === p); return n ? `<i style="width:${(n / modMax) * 100}%;background:${pColor(p)}" data-tip="<b>${esc(m)}</b><br>${esc(p)}: ${n}" data-drill='${esc(JSON.stringify([{ f: "module", op: "any", v: [m] }, { f: "phase", op: "any", v: [p] }]))}'></i>` : ""; }).join("");
    return `<div class="hbar" data-drill='${esc(JSON.stringify(base.filter((b) => b.f !== "module").concat({ f: "module", op: "any", v: [m] })))}'><span class="l">${esc(m)}</span><span class="track">${segs}</span><span class="n">${tot}</span></div>`;
  }).join("");
  // status bars (single series)
  const sts = F("status").options.map((o) => o.name).filter((s) => rows.some((r) => r.status === s));
  const stMax = Math.max(1, ...sts.map((s) => cnt((r) => r.status === s)));
  const stHTML = sts.map((s) => { const n = cnt((r) => r.status === s); return `<div class="hbar" data-drill='${esc(JSON.stringify(base.concat({ f: "status", op: "any", v: [s] })))}' data-tip="${esc(s)}: ${n} feature${n > 1 ? "s" : ""}"><span class="l">${pill(F("status"), s)}</span><span class="track"><i style="width:${(n / stMax) * 100}%;background:#2a78d6;border-radius:0 4px 4px 0"></i></span><span class="n">${n}</span></div>`; }).join("");
  // stage heatmap
  const svals = ["Not Started", "In Pipeline", "In Progress", "Done", "On Hold"];
  const stageF = db().schema.filter((f) => f.stage);
  const hv = stageF.map((f) => svals.map((s) => cnt((r) => r[f.id] === s)));
  const hmax = Math.max(1, ...hv.flat());
  const heat = `<table class="heat"><tr><th class="rl"></th>${svals.map((s) => `<th>${esc(s)}</th>`).join("")}</tr>${stageF.map((f, i) => `<tr><th class="rl">${esc(f.name)}</th>${hv[i].map((n, j) => { const k = n ? Math.min(SEQ.length - 1, 1 + Math.floor((n / hmax) * (SEQ.length - 2))) : 0; return `<td style="background:${SEQ[k]};color:${k >= 4 ? "#fff" : "#0b0b0b"}" data-tip="${esc(f.name)} - ${esc(svals[j])}: ${n}" data-drill='${esc(JSON.stringify(base.concat({ f: f.id, op: "any", v: [svals[j]] })))}'>${n || ""}</td>`; }).join("")}</tr>`).join("")}</table>`;
  // milestone vbars
  const mss = F("milestone").options.map((o) => o.name);
  const mv = mss.map((m) => cnt((r) => (r.milestone || []).includes(m)));
  const mMax = Math.max(1, ...mv);
  const msHTML = `<div class="vbars">${mss.map((m, i) => `<div class="c" data-drill='${esc(JSON.stringify(base.concat({ f: "milestone", op: "any", v: [m] })))}' data-tip="${esc(m)}: ${mv[i]} feature${mv[i] === 1 ? "" : "s"}${(db().milestones.find((x) => x.name === m) || {}).date ? "<br>Date: " + esc(fmtDate(db().milestones.find((x) => x.name === m).date)) : ""}"><b>${mv[i] || ""}</b><i style="height:${(mv[i] / mMax) * 130}px"></i></div>`).join("")}</div><div class="vlabels">${mss.map((m) => `<div>${esc(m)}</div>`).join("")}</div>`;
  // workload
  const ppl = peopleNames().map((n) => [n, active.filter((r) => (r.pm || []).includes(n)).length, active.filter((r) => (r.dev || []).includes(n)).length]).filter((x) => x[1] + x[2]).sort((a, b) => b[1] + b[2] - a[1] - a[2]);
  const wMax = Math.max(1, ...ppl.map((x) => x[1] + x[2]));
  const wHTML = `<div class="legend"><span><i style="background:${CAT[0]}"></i>As PM / analyst</span><span><i style="background:${CAT[1]}"></i>As server owner</span></div>` + ppl.map(([n, a, b]) => `<div class="hbar" data-drill='${esc(JSON.stringify([{ f: "phase", op: "any", v: ["Working on", "Roadmap", "Pipeline"] }, { f: a >= b ? "pm" : "dev", op: "any", v: [n] }]))}'><span class="l">${person(n)}${esc(n.split(" ").slice(1).join(" "))}</span><span class="track">${a ? `<i style="width:${(a / wMax) * 100}%;background:${CAT[0]}" data-tip="${esc(n)}<br>PM / analyst on ${a} active">` + "</i>" : ""}${b ? `<i style="width:${(b / wMax) * 100}%;background:${CAT[1]}" data-tip="${esc(n)}<br>Server owner on ${b} active"></i>` : ""}</span><span class="n">${a + b}</span></div>`).join("");
  // source
  const srcs = F("source").options.map((o) => o.name).concat([""]);
  const sv = srcs.map((s) => cnt((r) => (r.source || "") === s));
  const sMax = Math.max(1, ...sv);
  const srcHTML = srcs.map((s, i) => sv[i] ? `<div class="hbar" data-drill='${esc(JSON.stringify(base.concat(s ? { f: "source", op: "any", v: [s] } : { f: "source", op: "empty" })))}' data-tip="${esc(s || "Not set")}: ${sv[i]}"><span class="l">${s ? esc(s) : '<span class="muted">Not set</span>'}</span><span class="track"><i style="width:${(sv[i] / sMax) * 100}%;background:#2a78d6;border-radius:0 4px 4px 0"></i></span><span class="n">${sv[i]}</span></div>` : "").join("");
  // feeds
  const evs = [];
  all.forEach((r) => (r.history || []).forEach((h) => { if (h.by !== "Seed import") evs.push({ r, h }); }));
  evs.sort((a, b) => (a.h.at < b.h.at ? 1 : -1));
  const cms = [];
  all.forEach((r) => (r.comments || []).forEach((c) => cms.push({ r, c })));
  cms.sort((a, b) => (a.c.at < b.c.at ? 1 : -1));
  const feed = evs.slice(0, 8).map(({ r, h }) => `<div class="it" data-open="${r.id}">${avatar(h.by)}<div class="tx"><b>${esc(r.name)}</b> <span class="muted">${esc(r.id)}</span><br>${histText(h)}<div class="w">${esc(h.by)} - ${esc(ago(h.at))}</div></div></div>`).join("") || '<div class="muted">No changes yet - edits made in the tracker show up here.</div>';
  const cfeed = cms.slice(0, 6).map(({ r, c }) => `<div class="it" data-open="${r.id}" data-tab="comments">${avatar(c.by)}<div class="tx"><b>${esc(r.name)}</b><br>${mentionify(c.text.slice(0, 160))}<div class="w">${esc(c.by)} - ${esc(ago(c.at))}</div></div></div>`).join("") || '<div class="muted">No comments yet.</div>';
  const sel = (id, label, opts) => `<select data-ds="${id}"><option value="">${label}: All</option>${opts.map((o) => `<option ${DS[id] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  $(".content").innerHTML = `<div class="dash">
    <div class="dfilters">${sel("phase", "Phase", phases)}${sel("module", "Module", F("module").options.map((o) => o.name))}${sel("pm", "Person", peopleNames())}<span class="muted" style="margin-left:auto">Click any bar, cell or tile to open the matching features.</span></div>
    ${tiles.map(([k, v, s, fl]) => `<div class="tile" data-drill='${esc(JSON.stringify(base.concat(fl)))}'><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join("")}
    <div class="panel s7"><h3>Features by module</h3><div class="sub">Count of features, split by phase</div>${modHTML}</div>
    <div class="panel s5"><h3>Status breakdown</h3><div class="sub">Current status of every feature</div>${stHTML}</div>
    <div class="panel s7"><h3>Delivery stage pipeline</h3><div class="sub">How many features sit at each state, per stage (darker = more)</div>${heat}</div>
    <div class="panel s5"><h3>Milestone load</h3><div class="sub">Features tagged to each server milestone</div>${msHTML}</div>
    <div class="panel s6"><h3>Active workload by person</h3><div class="sub">Working on, roadmap and pipeline features</div>${wHTML || '<div class="muted">No assignments.</div>'}</div>
    <div class="panel s6"><h3>Requirement source</h3><div class="sub">Where the ask came from</div>${srcHTML}</div>
    <div class="panel s6"><h3>Recent changes</h3><div class="sub">Latest edits across all features</div><div class="feed">${feed}</div></div>
    <div class="panel s6"><h3>Recent comments</h3><div class="sub">Discussion on features</div><div class="feed">${cfeed}</div></div></div>`;
  const c = $(".content");
  c.onclick = (e) => {
    const o = e.target.closest("[data-open]"); if (o) return openDrawer(o.dataset.open, o.dataset.tab || "details");
    const d = e.target.closest("[data-drill]"); if (d) drill(JSON.parse(d.dataset.drill), "Dashboard drill-down");
  };
  c.onchange = (e) => { const s = e.target.dataset.ds; if (s != null) { DS[s] = e.target.value; renderDashboard(); } };
}

/* ---------- Activity (change timeline) ---------- */
const AS = { who: "", type: "", seed: false, limit: 150 };
function renderActivity() {
  const evs = [];
  db().records.concat(db().deleted || []).forEach((r) => (r.history || []).forEach((h) => evs.push({ r, h })));
  const typeOf = (a) => (a === "edit" ? "edit" : a.startsWith("comment") ? "comment" : a === "attach" || a === "detach" ? "attach" : "lifecycle");
  let list = evs.filter(({ h }) => (AS.seed || h.by !== "Seed import") && (!AS.who || h.by === AS.who) && (!AS.type || typeOf(h.action) === AS.type)
    && (!S.search || (h.field + " " + h.from + " " + h.to + " " + h.detail).toLowerCase().includes(S.search.toLowerCase())));
  list.sort((a, b) => (a.h.at < b.h.at ? 1 : -1));
  const total = list.length; list = list.slice(0, AS.limit);
  const who = [...new Set(evs.map((e) => e.h.by))].sort();
  let html = `<div class="activity"><h2 style="margin:0 0 4px">Change timeline</h2><div class="muted" style="margin-bottom:12px">Every field change, comment and attachment, newest first.${store.repoWebUrl() ? ` Each save is also a Git commit - <a href="${esc(store.repoWebUrl())}/commits/${esc(store.cfg.branch)}/${esc(store.cfg.dataPath)}" target="_blank" rel="noopener">open commit history on GitHub</a>.` : ""}</div>
    <div class="dfilters" style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"><select data-as="who"><option value="">Everyone</option>${who.map((w) => `<option ${AS.who === w ? "selected" : ""}>${esc(w)}</option>`).join("")}</select>
    <select data-as="type"><option value="">All activity</option>${[["edit", "Field changes"], ["comment", "Comments"], ["attach", "Attachments"], ["lifecycle", "Created / deleted"]].map(([k, l]) => `<option value="${k}" ${AS.type === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <label class="toggle"><input type="checkbox" data-as="seed" ${AS.seed ? "checked" : ""}>Include initial import</label><input placeholder="Search changes" data-asq value="${esc(S.search)}" style="border:1px solid var(--line-2);border-radius:6px;padding:5px 8px;margin-left:auto"></div>`;
  let day = "";
  list.forEach(({ r, h }) => {
    const d = new Date(h.at).toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    if (d !== day) { day = d; html += `<div class="day">${esc(d)}</div>`; }
    html += `<div class="row" data-open="${r.id}">${avatar(h.by)}<div class="tx"><b>${esc(h.by)}</b> on <b>${esc(r.name)}</b> <span class="muted">${esc(r.id)}</span><br>${histText(h)}</div><span class="w">${esc(new Date(h.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</span></div>`;
  });
  if (!list.length) html += `<div class="empty">No activity yet. Edits, comments and attachments made in the tracker appear here.${AS.seed ? "" : " Tick 'Include initial import' to see the seeded records."}</div>`;
  if (total > list.length) html += `<button class="btn" data-more style="margin:10px auto;display:block">Show more (${total - list.length})</button>`;
  $(".content").innerHTML = html + "</div>";
  const c = $(".content");
  c.onclick = (e) => { const o = e.target.closest("[data-open]"); if (o) return openDrawer(o.dataset.open, "history"); if (e.target.closest("[data-more]")) { AS.limit += 200; renderActivity(); } };
  c.onchange = (e) => { const k = e.target.dataset.as; if (!k) return; AS[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; renderActivity(); };
  c.oninput = (e) => { if (e.target.dataset.asq != null) { S.search = e.target.value; clearTimeout(AS.t); AS.t = setTimeout(() => { renderActivity(); const i = $("[data-asq]"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); } };
}

/* ---------- tooltips ---------- */
function initTooltips() {
  const tip = document.createElement("div"); tip.className = "tip"; tip.style.display = "none"; document.body.appendChild(tip);
  document.addEventListener("mouseover", (e) => { const t = e.target.closest("[data-tip]"); if (!t) { tip.style.display = "none"; return; } tip.innerHTML = t.dataset.tip; tip.style.display = "block"; });
  document.addEventListener("mousemove", (e) => { if (tip.style.display === "none") return; let x = e.clientX + 14, y = e.clientY + 14; if (x + tip.offsetWidth > innerWidth - 8) x = e.clientX - tip.offsetWidth - 10; if (y + tip.offsetHeight > innerHeight - 8) y = e.clientY - tip.offsetHeight - 10; tip.style.left = x + "px"; tip.style.top = y + "px"; });
  document.addEventListener("mousedown", () => (tip.style.display = "none"));
}

/* ---------- modals ---------- */
function openModal(html) {
  closeModal();
  const s = document.createElement("div"); s.className = "scrim"; s.dataset.modalScrim = "1"; s.onclick = closeModal;
  const m = document.createElement("div"); m.className = "modal"; m.innerHTML = html;
  document.body.append(s, m); return m;
}
function closeModal() { $$(".modal,[data-modal-scrim]").forEach((x) => x.remove()); }

function settingsModal(firstRun) {
  const c = store.cfg;
  const names = peopleNames();
  const m = openModal(`<h2>Settings</h2><div class="muted">${firstRun ? "Welcome! Pick your name so comments and changes are attributed to you. " : ""}Data is stored in a GitHub repo - every save is a commit, so the full timeline of changes is kept.</div>
    <h3>Who are you?</h3><select data-me>${names.map((n) => `<option ${n === store.user.name ? "selected" : ""}>${esc(n)}</option>`).join("")}<option value="__other" ${names.includes(store.user.name) ? "" : "selected"}>Someone else...</option></select>
    <input data-meother placeholder="Your full name" value="${names.includes(store.user.name) ? "" : esc(store.user.name === "Guest" ? "" : store.user.name)}" style="margin-top:6px;${names.includes(store.user.name) ? "display:none" : ""}">
    <h3>GitHub connection</h3>
    <div class="two"><div><label>Owner (user or org)</label><input data-c="owner" value="${esc(c.owner)}" placeholder="e.g. pradeep-zoho"></div><div><label>Repository</label><input data-c="repo" value="${esc(c.repo)}"></div></div>
    <div class="two"><div><label>Branch</label><input data-c="branch" value="${esc(c.branch)}"></div><div><label>API base (GitHub Enterprise: https://host/api/v3)</label><input data-c="apiBase" value="${esc(c.apiBase)}"></div></div>
    <label>Personal access token (fine-grained, this repo only, Contents: Read and write)</label><input data-token type="password" value="${esc(store.token)}" placeholder="github_pat_...">
    <div class="muted" style="margin-top:4px">Stored only in this browser. Mode now: <b>${esc(store.mode)}</b>${store.user.login ? " as @" + esc(store.user.login) : ""}.</div>
    <div class="msg" data-msg></div>
    <div class="actions"><button class="btn" data-test>Test connection</button>${store.token ? '<button class="btn danger" data-disc>Disconnect</button>' : ""}<button class="btn" data-local>${ZT.LS.get("localMode", false) ? "Leave local mode" : "Use local mode (no GitHub)"}</button><button class="btn primary" data-save>Save & reload</button></div>
    <h3>Milestone dates (shown on the timeline)</h3><table>${(db().milestones || []).map((x) => `<tr><td style="width:90px">${esc(x.name)}</td><td><input type="date" data-ms="${esc(x.name)}" value="${esc(x.date || "")}" ${store.canEdit ? "" : "disabled"}></td></tr>`).join("")}</table>
    <h3>Team members</h3><table>${(db().people || []).map((p) => `<tr><td>${person(p.name)}${esc(p.name)}</td><td><input data-prole="${esc(p.name)}" value="${esc(p.role || "")}" placeholder="Role" ${store.canEdit ? "" : "disabled"}></td><td><input data-pgh="${esc(p.name)}" value="${esc(p.github || "")}" placeholder="GitHub login" ${store.canEdit ? "" : "disabled"}></td></tr>`).join("")}</table>
    ${store.canEdit ? `<div class="formrow"><input data-pnew placeholder="Add a teammate's full name" style="flex:1"><button class="btn" data-padd>Add</button></div>` : ""}
    <h3>Data</h3><div class="actions" style="justify-content:flex-start;margin-top:0"><button class="btn" data-exp>${ic("download")}Export JSON backup</button><button class="btn" data-csv>${ic("download")}Export all as CSV</button>${store.mode === "local" ? `<button class="btn" data-imp>${ic("upload")}Import JSON</button><input type="file" accept=".json" hidden data-impf>` : ""}</div>`);
  const msg = (t, err) => { const el = $("[data-msg]", m); el.textContent = t; el.style.color = err ? "var(--danger)" : "var(--good)"; };
  const read = () => { const o = {}; $$("[data-c]", m).forEach((i) => (o[i.dataset.c] = i.value.trim())); return o; };
  const meSel = $("[data-me]", m), meO = $("[data-meother]", m);
  meSel.onchange = () => { meO.style.display = meSel.value === "__other" ? "" : "none"; };
  const saveMe = () => { const n = meSel.value === "__other" ? meO.value.trim() : meSel.value; if (n) store.setMe(n); return n; };
  m.addEventListener("click", async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.test != null) {
      const cfg = Object.assign({}, window.TRACKER_CONFIG, read()); const gh = new (store.gh.constructor)(cfg, $("[data-token]", m).value.trim());
      msg("Testing...");
      try { const u = await gh.user(); await gh.getFile(cfg.dataPath); msg(`Connected as @${u.login}. ${cfg.dataPath} found in ${cfg.owner}/${cfg.repo}.`); }
      catch (er) { msg("Failed: " + er.message + (er.status === 404 ? " - check owner/repo/branch and that the token can access this repo." : ""), true); }
    }
    if (t.dataset.save != null) { saveMe(); store.saveCfg(read(), $("[data-token]", m).value.trim()); ZT.LS.set("localMode", false); if (store.pending.length) await store.flush(); location.reload(); }
    if (t.dataset.disc != null) { store.saveCfg(read(), ""); location.reload(); }
    if (t.dataset.local != null) { saveMe(); store.setLocalMode(!ZT.LS.get("localMode", false)); location.reload(); }
    if (t.dataset.padd != null) { const n = $("[data-pnew]", m).value.trim(); if (n) { store.do({ t: "person", p: { name: n, role: "", github: "" } }); settingsModal(); } }
    if (t.dataset.exp != null) download(new Blob([JSON.stringify(db(), null, 1)], { type: "application/json" }), "zoho-todo-tracker-backup-" + new Date().toISOString().slice(0, 10) + ".json");
    if (t.dataset.csv != null) { const keep = S.view; S.view = Object.assign({}, PRESETS[0], { filters: [], hidden: [], name: "all-features" }); const q = S.search; S.search = ""; exportCSV(); S.view = keep; S.search = q; }
    if (t.dataset.imp != null) $("[data-impf]", m).click();
  });
  m.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.dataset.ms) store.do({ t: "milestone", name: t.dataset.ms, date: t.value || null });
    if (t.dataset.prole) store.do({ t: "person", p: { name: t.dataset.prole, role: t.value } });
    if (t.dataset.pgh) store.do({ t: "person", p: { name: t.dataset.pgh, github: t.value.trim() } });
    if (t === meSel || t === meO) saveMe();
    if (t.dataset.impf != null && t.files[0]) {
      try { const j = JSON.parse(await t.files[0].text()); if (!j.records || !j.schema) throw new Error("Not a tracker backup"); ZT.LS.set("localDb", j); location.reload(); }
      catch (er) { msg("Import failed: " + er.message, true); }
    }
  });
}

function trashModal() {
  const d = db().deleted || [];
  const m = openModal(`<h2>Deleted features</h2><div class="muted">Deleted features keep their comments, attachments and history and can be restored.</div><div style="margin-top:12px">${d.length ? d.map((r) => `<div class="att"><div class="ic">${esc(r.id.slice(3))}</div><div class="nm"><b>${esc(r.name)}</b><div class="s">Deleted ${esc(ago(r.updatedAt))} by ${esc(r.updatedBy)}</div></div>${store.canEdit ? `<button class="btn" data-restore="${esc(r.id)}">Restore</button>` : ""}</div>`).join("") : '<div class="empty" style="padding:30px">Nothing deleted.</div>'}</div><div class="actions"><button class="btn" data-x>Close</button></div>`);
  m.onclick = (e) => { const b = e.target.closest("[data-restore]"); if (b) { store.do({ t: "restore", id: b.dataset.restore }); trashModal(); } if (e.target.closest("[data-x]")) closeModal(); };
}

function saveTeamView(asNew) {
  if (!store.canEdit) return readonlyNotice();
  const base = allViews().find((v) => v.id === S.viewId);
  if (!asNew && base && !base.team) { asNew = true; }
  let name = base && base.team && !asNew ? base.name : prompt("Name for this team view (visible to everyone):", (S.view.name || "") + (asNew ? " (copy)" : ""));
  if (!name) return;
  const v = { id: asNew ? ZT.uid("tv-") : S.viewId, name, type: S.view.type, filters: S.view.filters || [], sorts: S.view.sorts || [], groupBy: S.view.groupBy || null, hidden: S.view.hidden || [], kanbanBy: S.view.kanbanBy || null, zoom: S.view.zoom || null, widths: S.view.widths || {} };
  store.do({ t: "view", v });
  ZT.LS.del("vs." + v.id); loadView(v.id); render(); toast(`Saved team view "${name}"`);
}

function fieldModal(f) {
  const isNew = !f;
  f = f ? ZT.clone(f) : { id: "", name: "", type: "singleSelect", width: 150, options: [] };
  const colors = ["blue", "cyan", "teal", "green", "yellow", "orange", "red", "pink", "purple", "gray"];
  const hasOpts = () => ["singleSelect", "multiSelect"].includes(f.type);
  const m = openModal(`<h2>${isNew ? "Add a field" : "Edit field"}</h2><label>Field name</label><input data-fn value="${esc(f.name)}">
    ${isNew ? `<label>Type</label><select data-ft>${[["text", "Single line text"], ["longText", "Long text"], ["singleSelect", "Single select"], ["multiSelect", "Multiple select"], ["people", "People"], ["date", "Date"]].map(([k, l]) => `<option value="${k}" ${f.type === k ? "selected" : ""}>${l}</option>`).join("")}</select>` : `<div class="muted" style="margin-top:6px">Type: ${esc(f.type)}</div>`}
    <div data-opts></div><div class="msg" data-msg></div>
    <div class="actions">${!isNew && !f.core ? '<button class="btn danger" data-del>Delete field</button>' : ""}<button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>${isNew ? "Add field" : "Save"}</button></div>`);
  const orig = (f.options || []).map((o) => o.name);
  const drawOpts = () => {
    $("[data-opts]", m).innerHTML = hasOpts() ? `<h3>Options</h3><table>${(f.options || []).map((o, i) => `<tr><td><input data-on="${i}" value="${esc(o.name)}"></td><td style="width:130px"><select data-oc="${i}">${colors.map((c) => `<option ${o.color === c ? "selected" : ""}>${c}</option>`).join("")}</select></td><td style="width:80px">${pill({ options: [o] }, o.name)}</td><td style="width:30px"><button class="xbtn" data-od="${i}">${ic("x")}</button></td></tr>`).join("")}</table><div class="formrow"><input data-onew placeholder="New option" style="flex:1"><button class="btn" data-oadd>Add option</button></div>` : "";
  };
  drawOpts();
  m.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.ft) { f.type = t.value; drawOpts(); }
    if (t.dataset.oc != null) { f.options[+t.dataset.oc].color = t.value; drawOpts(); }
    if (t.dataset.on != null) f.options[+t.dataset.on].name = t.value.trim();
  });
  m.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.oadd != null) { const n = $("[data-onew]", m).value.trim(); if (n) { f.options = f.options || []; f.options.push({ name: n, color: colors[f.options.length % 9] }); drawOpts(); } }
    if (t.dataset.od != null) { f.options.splice(+t.dataset.od, 1); orig.splice(+t.dataset.od, 1); drawOpts(); }
    if (t.dataset.x != null) closeModal();
    if (t.dataset.del != null && confirm(`Delete field "${f.name}"? Values stay in the data file but are hidden.`)) { store.do({ t: "delField", f: f.id }); closeModal(); }
    if (t.dataset.ok != null) {
      f.name = $("[data-fn]", m).value.trim();
      if (!f.name) return;
      if (isNew) {
        f.id = "cf_" + f.name.toLowerCase().replace(/\W+/g, "_").slice(0, 24) + "_" + Date.now().toString(36).slice(-3);
        if (!hasOpts()) delete f.options;
        store.do({ t: "addField", field: f });
      } else {
        const rename = {}; (f.options || []).forEach((o, i) => { if (orig[i] && orig[i] !== o.name) rename[orig[i]] = o.name; });
        store.do({ t: "updField", f: f.id, patch: { name: f.name, options: f.options }, rename });
      }
      closeModal();
    }
  });
}
