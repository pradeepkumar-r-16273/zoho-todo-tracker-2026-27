/* Priority matrix: an add-on page under Overview.
 * Loaded after views.js. It edits no core file: it registers one extra preset view and
 * routes renderDashboard() for that view id.
 * Placement: a feature's "Matrix quadrant" field decides its quadrant. Features with no
 * quadrant set are placed by calculation from Priority, Status and the delivery stages.
 * Dragging a chip onto a quadrant sets its Matrix quadrant and lets you pick its Priority. */
(function () {
  const VIEW_ID = "d-priority";
  if (!PRESETS.some((v) => v.id === VIEW_ID)) {
    const at = PRESETS.findIndex((v) => v.id === "d-main");
    PRESETS.splice(at < 0 ? PRESETS.length : at + 1, 0, { id: VIEW_ID, name: "Priority matrix", type: "dashboard", filters: [] });
  }

  const baseDashboard = renderDashboard;
  renderDashboard = function () { return S.viewId === VIEW_ID ? renderPriorityMatrix() : baseDashboard(); };

  const QFIELD = "cf_matrix_quadrant", SFIELD = "cf_segment";
  const LIVE = ["Working on", "Roadmap", "Pipeline"];
  const IDEAS = "Ideas / Backlog";
  const BACKLOG = ["Pipeline", IDEAS];
  const WAITING = ["In Progress", "In Pipeline", "Not Started"];
  const LOW_EFFORT_STATUS = ["Testing", "Releasing"];
  // Effort weights per delivery stage, used only for features with no Matrix quadrant set.
  const WEIGHT = { analysis: 1, design: 1, html: 1, server: 3, client: 3, testing: 2, mobile: 2 };
  const CORE = ["server", "client", "testing"];
  const LOW_EFFORT_MAX = 3;
  const QUADS = [
    { key: "ship", name: "Ship now", sub: "High impact, low effort left" },
    { key: "bets", name: "Big bets", sub: "High impact, high effort left" },
    { key: "fill", name: "Fill-ins", sub: "Lower impact, low effort left" },
    { key: "prove", name: "Prove first", sub: "Unclear impact, high effort" },
  ];
  const KEY_BY_NAME = Object.fromEntries(QUADS.map((q) => [q.name, q.key]));
  const PMX = { segment: "", module: "", person: "", ideas: !!ZT.LS.get("pmx.ideas", false) };

  const isP0 = (r) => /^P0\b/.test(r.priority || "");
  const impact = (r) => (/^P[01]\b/.test(r.priority || "") ? "high" : /^P[23]\b/.test(r.priority || "") ? "lower" : "unclear");
  function effortLeft(r) {
    return Object.entries(WEIGHT).reduce((sum, [k, w]) => {
      const v = r[k];
      if (v === "Done" || v === "N/A") return sum;
      if (v === "In Progress") return sum + w / 2;
      if (!v) return sum + (CORE.includes(k) ? w : 0);
      return sum + w; // Not Started, In Pipeline, On Hold
    }, 0);
  }
  const lowEffort = (r) => LOW_EFFORT_STATUS.includes(r.status) || effortLeft(r) <= LOW_EFFORT_MAX;
  function calcQuadrant(r) {
    const imp = impact(r), low = lowEffort(r);
    if (imp === "high") return low ? "ship" : "bets";
    if (imp === "lower" && low) return "fill";
    return "prove";
  }
  const storedQuadrant = (r) => (F(QFIELD) && KEY_BY_NAME[r[QFIELD]]) || null;
  const quadrant = (r) => storedQuadrant(r) || calcQuadrant(r);
  const prioRank = (r) => { const m = /^P(\d)/.exec(r.priority || ""); return m ? +m[1] : 9; };
  const prioNames = () => { const o = ((F("priority") || {}).options || []).map((x) => x.name); return o.length ? o : ["P0 - Critical", "P1 - High", "P2 - Medium", "P3 - Low"]; };
  const drillAttr = (filters) => `data-drill='${esc(JSON.stringify(filters))}'`;
  const tipAttr = (html) => `data-tip="${esc(html)}"`;
  const pct = (r) => { const p = progress(r); return p == null ? "-" : p + "%"; };

  function chip(r, draggable) {
    const stored = storedQuadrant(r);
    const tip = `<b>${esc(r.name)}</b> ${esc(r.id)}<br>Priority: ${esc(r.priority || "Not set")}<br>Status: ${esc(r.status || "-")} - ${esc(pct(r))} done`
      + `<br>Segment: ${esc(r[SFIELD] || "Not set")}<br>Module: ${esc(r.module || "-")}`
      + `<br>Placement: ${stored ? "Matrix quadrant field" : `calculated, effort left ${effortLeft(r)} pts`}`;
    return `<button type="button" class="pm-chip ${isP0(r) ? "p0" : ""} ${stored ? "" : "calc"}" data-open="${esc(r.id)}" ${draggable ? 'draggable="true"' : ""} ${tipAttr(tip)}>${esc(r.name)}</button>`;
  }

  function renderPriorityMatrix() {
    const all = db().records;
    const segF = F(SFIELD), qF = F(QFIELD);
    if (!segF) PMX.segment = "";
    const rows = all.filter((r) => (!PMX.segment || r[SFIELD] === PMX.segment) && (!PMX.module || r.module === PMX.module)
      && (!PMX.person || (r.pm || []).includes(PMX.person) || (r.dev || []).includes(PMX.person)));
    const base = [];
    if (PMX.segment) base.push({ f: SFIELD, op: "any", v: [PMX.segment] });
    if (PMX.module) base.push({ f: "module", op: "any", v: [PMX.module] });
    const open = rows.filter((r) => r.phase !== "Released");
    const inMatrix = open.filter((r) => PMX.ideas || r.phase !== IDEAS);
    const notPlanned = PMX.ideas ? [] : open.filter((r) => r.phase === IDEAS).sort((a, b) => prioRank(a) - prioRank(b));
    const live = rows.filter((r) => LIVE.includes(r.phase));
    const prF = F("priority"), stF = F("status"), svF = F("server");
    const canDrag = store.canEdit;
    const nCalc = inMatrix.filter((r) => !storedQuadrant(r)).length;

    const tiles = [
      ["Live items", live.length, "Working on, roadmap and pipeline", [{ f: "phase", op: "any", v: LIVE }]],
      ["P0 items", open.filter(isP0).length, "Not yet released", [{ f: "priority", op: "any", v: [prioNames()[0]] }, { f: "phase", op: "none", v: ["Released"] }]],
      ["Waiting on server", live.filter((r) => WAITING.includes(r.server)).length, "Server in progress, pipeline or not started", [{ f: "phase", op: "any", v: LIVE }, { f: "server", op: "any", v: WAITING }]],
      ["Backlog with no priority", rows.filter((r) => BACKLOG.includes(r.phase) && !r.priority).length, "Pipeline and ideas items", [{ f: "phase", op: "any", v: BACKLOG }, { f: "priority", op: "empty" }]],
    ];

    const groups = Object.fromEntries(QUADS.map((q) => [q.key, []]));
    inMatrix.forEach((r) => groups[quadrant(r)].push(r));
    const matrix = QUADS.map((q) => {
      const list = groups[q.key].slice().sort((a, b) => prioRank(a) - prioRank(b) || effortLeft(a) - effortLeft(b));
      return `<div class="pm-q pm-${q.key}" data-q="${q.key}"><h3>${esc(q.name)}<span>${list.length} item${list.length === 1 ? "" : "s"}</span></h3><div class="sub">${esc(q.sub)}</div>`
        + (list.length ? list.map((r) => chip(r, canDrag)).join("") : '<div class="muted">Nothing here.</div>') + "</div>";
    }).join("");

    const bars = (items, color) => {
      const max = Math.max(1, ...items.map((x) => x.n));
      return items.filter((x) => x.n).map((x) => `<div class="hbar" ${drillAttr(base.concat(x.filters))} ${tipAttr(esc(x.label) + ": " + x.n)}><span class="l">${x.html}</span><span class="track"><i style="width:${(x.n / max) * 100}%;background:${color};border-radius:0 4px 4px 0"></i></span><span class="n">${x.n}</span></div>`).join("") || '<div class="muted">No live items.</div>';
    };
    const liveF = { f: "phase", op: "any", v: LIVE };
    const svOpts = ((svF && svF.options) || []).map((o) => o.name);
    const server = svOpts.map((s) => ({ label: s, html: pill(svF, s), n: live.filter((r) => r.server === s).length, filters: [liveF, { f: "server", op: "any", v: [s] }] }))
      .concat([{ label: "Not set", html: '<span class="muted">Not set</span>', n: live.filter((r) => !r.server).length, filters: [liveF, { f: "server", op: "empty" }] }]);
    const prio = prioNames().map((p) => ({ label: p, html: pill(prF, p), n: live.filter((r) => r.priority === p).length, filters: [liveF, { f: "priority", op: "any", v: [p] }] }))
      .concat([{ label: "Not set", html: '<span class="muted">Not set</span>', n: live.filter((r) => !r.priority).length, filters: [liveF, { f: "priority", op: "empty" }] }]);

    const p0 = open.filter(isP0).sort((a, b) => (KEY_BY_NAME[a[QFIELD]] ? 0 : 1) - (KEY_BY_NAME[b[QFIELD]] ? 0 : 1) || effortLeft(a) - effortLeft(b));
    const sel = (k, label, opts) => `<select data-pmx="${k}"><option value="">${label}: All</option>${opts.map((o) => `<option ${PMX[k] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    const cell = (f, v) => (f && v ? pill(f, v) : '<span class="muted">-</span>');
    const hint = canDrag ? "Drag a feature to another quadrant to move it and set its priority." : "Connect GitHub or use local mode to drag features between quadrants.";
    const placementNote = qF
      ? `A feature sits in the quadrant set in its Matrix quadrant field.${nCalc ? ` ${nCalc} feature${nCalc === 1 ? " has" : "s have"} no quadrant set yet and ${nCalc === 1 ? "is" : "are"} placed by calculation (dashed border): P0 or P1 is high impact, P2 or P3 lower; effort left adds up the stages still to do (Server 3, Client 3, Testing 2, Mobile 2, others 1; In Progress counts half) and is low at ${LOW_EFFORT_MAX} points or fewer, or when the status is Testing or Releasing.` : ""}`
      : "Placed by calculation from Priority and the delivery stages. Add a 'Matrix quadrant' field to place features by hand.";

    $(".content").innerHTML = `<div class="dash">
      <div class="dfilters">${segF ? sel("segment", "Segment", segF.options.map((o) => o.name)) : ""}${sel("module", "Module", F("module").options.map((o) => o.name))}${sel("person", "Person", peopleNames())}
        <label class="pm-toggle"><input type="checkbox" data-pmx-ideas ${PMX.ideas ? "checked" : ""}>Show Ideas / Backlog in matrix</label>
        <span class="muted" style="margin-left:auto">${esc(hint)}</span></div>
      ${tiles.map(([k, v, s, fl]) => `<div class="tile pm-tile" ${drillAttr(base.concat(fl))}><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join("")}
      <div class="panel s12"><h3>Priority matrix</h3><div class="sub">${inMatrix.length} features not yet released${PMX.ideas ? ", including Ideas / Backlog" : ""}. ${esc(placementNote)}</div>
        <div class="legend"><span><i class="pm-key"></i>P0 item</span>${nCalc ? '<span><i class="pm-key-calc"></i>Placed by calculation</span>' : ""}</div><div class="pm-mx">${matrix}</div></div>
      ${PMX.ideas ? "" : `<div class="panel s12 pm-np"><h3>Not planned<span class="pm-count">${notPlanned.length} item${notPlanned.length === 1 ? "" : "s"}</span></h3><div class="sub">Features in the Ideas / Backlog phase. They join the matrix once their phase moves on, or tick "Show Ideas / Backlog in matrix".</div>
        ${notPlanned.length ? notPlanned.map((r) => chip(r, false)).join("") : '<div class="muted">Nothing in Ideas / Backlog.</div>'}</div>`}
      <div class="panel s6"><h3>Server stage of live items</h3><div class="sub">Working on, roadmap and pipeline features by server stage</div>${bars(server, "#2a78d6")}</div>
      <div class="panel s6"><h3>Priority of live items</h3><div class="sub">Working on, roadmap and pipeline features by priority</div>${bars(prio, "#2a78d6")}</div>
      <div class="panel s12"><h3>P0 items</h3><div class="sub">Every unreleased P0</div>
        ${p0.length ? `<div class="pm-tw"><table class="pm-table"><thead><tr><th>Feature</th><th>Quadrant</th><th>Segment</th><th>Status</th><th>Server</th><th>Client</th><th>Progress</th><th>PM / analyst</th></tr></thead><tbody>${p0.map((r) => `<tr data-open="${esc(r.id)}"><td><span class="muted">${esc(r.id)}</span> ${esc(r.name)}</td><td>${esc(QUADS.find((q) => q.key === quadrant(r)).name)}</td><td>${cell(segF, r[SFIELD])}</td><td>${cell(stF, r.status)}</td><td>${cell(svF, r.server)}</td><td>${cell(F("client"), r.client)}</td><td class="pm-num">${esc(pct(r))}</td><td>${(r.pm || []).map(person).join(" ") || '<span class="muted">-</span>'}</td></tr>`).join("")}</tbody></table></div>` : '<div class="muted">No unreleased P0 items.</div>'}
      </div></div>`;

    const c = $(".content");
    c.onclick = (e) => {
      const o = e.target.closest("[data-open]"); if (o) return openDrawer(o.dataset.open);
      const d = e.target.closest("[data-drill]"); if (d) drill(JSON.parse(d.dataset.drill), "Priority matrix drill-down");
    };
    c.onchange = (e) => {
      if (e.target.dataset.pmxIdeas != null) { PMX.ideas = e.target.checked; ZT.LS.set("pmx.ideas", PMX.ideas); return renderPriorityMatrix(); }
      const k = e.target.dataset.pmx; if (k) { PMX[k] = e.target.value; renderPriorityMatrix(); }
    };

    // Drag a chip onto a quadrant, then pick its priority from a small menu.
    let dragId = null;
    const clearOver = () => $$(".pm-q.over", c).forEach((x) => x.classList.remove("over"));
    c.ondragstart = (e) => {
      const ch = e.target.closest(".pm-chip[draggable]"); if (!ch) return;
      dragId = ch.dataset.open; ch.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId);
    };
    c.ondragend = () => { $$(".pm-chip.dragging", c).forEach((x) => x.classList.remove("dragging")); clearOver(); };
    c.ondragover = (e) => {
      const q = e.target.closest(".pm-q[data-q]"); if (!q || !dragId) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      if (!q.classList.contains("over")) { clearOver(); q.classList.add("over"); }
    };
    c.ondrop = (e) => {
      const q = e.target.closest(".pm-q[data-q]"); if (!q || !dragId) return;
      e.preventDefault(); clearOver();
      const id = dragId; dragId = null;
      priorityMenu(R(id), QUADS.find((x) => x.key === q.dataset.q), { left: e.clientX, top: e.clientY, bottom: e.clientY });
    };
  }

  function priorityMenu(r, q, at) {
    if (!r || !q) return;
    if (!store.canEdit) return readonlyNotice();
    const qF = F(QFIELD);
    const opts = prioNames().map((p) => ({ v: p })).concat([{ v: "" }]);
    const el = openPop(at, `<h5>${esc(r.name)} to ${esc(q.name)}: set priority</h5>` + opts.map((o) => `<div class="opt" data-setp="${esc(o.v)}"><span class="ck">${(r.priority || "") === o.v ? "&#10003;" : ""}</span>${o.v ? pill(F("priority"), o.v) : '<span class="muted">No priority</span>'}</div>`).join(""), { minWidth: 220 });
    el.onclick = (e) => {
      const o = e.target.closest("[data-setp]"); if (!o) return;
      const v = o.dataset.setp || null;
      closePop();
      if ((r.priority || null) !== v) setField(r.id, "priority", v);
      if (qF) { if (r[QFIELD] !== q.name) setField(r.id, QFIELD, q.name); return; }
      const now = R(r.id), landed = now && calcQuadrant(now);
      if (landed && landed !== q.key) toast(`${now.name}: priority is ${now.priority || "not set"}. It shows in ${QUADS.find((x) => x.key === landed).name} because effort left is ${lowEffort(now) ? "low" : "high"} (${effortLeft(now)} pts).`, 5000);
    };
  }
})();
