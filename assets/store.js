/* Data layer: GitHub-as-database with an operation log.
 *
 * Every edit is an "op" (set field, add comment, attach file...). Ops are
 * applied locally right away, then batched into one commit to data/features.json
 * via the GitHub Contents API. If a teammate committed in between (sha
 * mismatch), the latest file is fetched and the pending ops are replayed on top
 * of it, so concurrent edits to different fields/records never clobber each other.
 */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("zt." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("zt." + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem("zt." + k); } catch {} },
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const now = () => new Date().toISOString();
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    return bytesToB64(bytes);
  }
  function bytesToB64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\n/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const fmtVal = (v) => {
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "(empty)";
    if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? (x.done ? "[x] " : "[ ] ") + x.text : x)).join(", ");
    return String(v);
  };

  /* ---------- pure op application ---------- */
  function applyOp(db, op) {
    const rec = op.id ? db.records.find((r) => r.id === op.id) : null;
    const hist = (r, h) => { r.history = r.history || []; r.history.push(Object.assign({ at: op.at, by: op.by }, h)); r.updatedAt = op.at; r.updatedBy = op.by; };
    switch (op.t) {
      case "set": {
        if (!rec) return;
        const from = rec[op.f];
        if (JSON.stringify(from) === JSON.stringify(op.v)) return;
        rec[op.f] = clone(op.v);
        const field = db.schema.find((f) => f.id === op.f);
        hist(rec, { action: "edit", field: field ? field.name : op.f, from: fmtVal(from), to: fmtVal(op.v) });
        return;
      }
      case "create": {
        if (db.records.some((r) => r.id === op.rec.id)) {
          // id collision with a teammate's new record: renumber ours
          op.rec.id = "TD-" + String(db.nextId).padStart(3, "0");
        }
        const n = parseInt(op.rec.id.slice(3), 10);
        db.nextId = Math.max(db.nextId || 1, n + 1);
        const r = clone(op.rec);
        r.history = [{ at: op.at, by: op.by, action: "created", detail: op.detail || "Created" }];
        r.createdAt = r.updatedAt = op.at; r.updatedBy = op.by;
        db.records.push(r);
        return;
      }
      case "delete": {
        if (!rec) return;
        db.records = db.records.filter((r) => r !== rec);
        hist(rec, { action: "deleted" });
        db.deleted = db.deleted || [];
        db.deleted.push(rec);
        return;
      }
      case "restore": {
        db.deleted = db.deleted || [];
        const d = db.deleted.find((r) => r.id === op.id);
        if (!d) return;
        db.deleted = db.deleted.filter((r) => r !== d);
        hist(d, { action: "restored" });
        db.records.push(d);
        return;
      }
      case "comment": {
        if (!rec) return;
        rec.comments = rec.comments || [];
        if (rec.comments.some((c) => c.id === op.c.id)) return;
        rec.comments.push(clone(op.c));
        hist(rec, { action: "comment", detail: op.c.text.slice(0, 140) });
        return;
      }
      case "uncomment": {
        if (!rec) return;
        rec.comments = (rec.comments || []).filter((c) => c.id !== op.cid);
        hist(rec, { action: "comment-deleted" });
        return;
      }
      case "attach": {
        if (!rec) return;
        rec.attachments = rec.attachments || [];
        rec.attachments.push(clone(op.a));
        hist(rec, { action: "attach", detail: op.a.name });
        return;
      }
      case "detach": {
        if (!rec) return;
        const a = (rec.attachments || []).find((x) => x.id === op.aid);
        rec.attachments = (rec.attachments || []).filter((x) => x.id !== op.aid);
        hist(rec, { action: "detach", detail: a ? a.name : "" });
        return;
      }
      case "addOption": {
        const f = db.schema.find((x) => x.id === op.f);
        if (!f) return;
        f.options = f.options || [];
        if (!f.options.some((o) => o.name === op.name)) f.options.push({ name: op.name, color: op.color || "gray" });
        return;
      }
      case "person": {
        db.people = db.people || [];
        const p = db.people.find((x) => x.name === op.p.name);
        if (p) Object.assign(p, op.p); else db.people.push(clone(op.p));
        return;
      }
      case "view": {
        db.views = db.views || [];
        const i = db.views.findIndex((v) => v.id === op.v.id);
        if (i >= 0) db.views[i] = clone(op.v); else db.views.push(clone(op.v));
        return;
      }
      case "unview": { db.views = (db.views || []).filter((v) => v.id !== op.vid); return; }
      case "addField": {
        if (db.schema.some((f) => f.id === op.field.id)) return;
        db.schema.push(clone(op.field));
        return;
      }
      case "updField": {
        const f = db.schema.find((x) => x.id === op.f);
        if (!f) return;
        Object.assign(f, clone(op.patch));
        const ren = op.rename || {};
        if (Object.keys(ren).length) {
          db.records.forEach((r) => {
            const v = r[op.f];
            if (Array.isArray(v)) r[op.f] = v.map((x) => ren[x] || x);
            else if (v && ren[v]) r[op.f] = ren[v];
          });
        }
        return;
      }
      case "delField": { db.schema = db.schema.filter((f) => f.id !== op.f || f.core); return; }
      case "milestone": {
        db.milestones = db.milestones || [];
        const m = db.milestones.find((x) => x.name === op.name);
        if (m) m.date = op.date; else db.milestones.push({ name: op.name, date: op.date });
        return;
      }
    }
  }

  function describe(op, db) {
    const r = op.id ? op.id : "";
    switch (op.t) {
      case "set": { const f = db.schema.find((x) => x.id === op.f); return `${r} ${f ? f.name : op.f} -> ${fmtVal(op.v).slice(0, 40)}`; }
      case "create": return `Add ${op.rec.id} ${op.rec.name}`;
      case "delete": return `Delete ${r}`;
      case "restore": return `Restore ${r}`;
      case "comment": return `Comment on ${r}`;
      case "uncomment": return `Remove comment on ${r}`;
      case "attach": return `Attach "${op.a.name}" to ${r}`;
      case "detach": return `Remove attachment from ${r}`;
      case "addOption": return `Add option "${op.name}"`;
      case "person": return `Update person ${op.p.name}`;
      case "view": return `Save view "${op.v.name}"`;
      case "unview": return `Delete view`;
      case "addField": return `Add field "${op.field.name}"`;
      case "updField": return `Edit field ${op.f}`;
      case "delField": return `Delete field ${op.f}`;
      case "milestone": return `Milestone ${op.name} date ${op.date || "cleared"}`;
    }
    return op.t;
  }

  /* ---------- GitHub client ---------- */
  class GitHub {
    constructor(cfg, token) { this.cfg = cfg; this.token = token; }
    url(p) { const c = this.cfg; return `${c.apiBase.replace(/\/$/, "")}/repos/${c.owner}/${c.repo}/${p}`; }
    async req(url, opt = {}) {
      const res = await fetch(url, Object.assign({}, opt, {
        headers: Object.assign({ Authorization: "Bearer " + this.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, opt.headers || {}),
        cache: "no-store",
      }));
      if (!res.ok) {
        let msg = res.status + " " + res.statusText;
        try { const j = await res.json(); if (j.message) msg = res.status + " " + j.message; } catch {}
        const e = new Error(msg); e.status = res.status; throw e;
      }
      return res;
    }
    async user() { return (await this.req(this.cfg.apiBase.replace(/\/$/, "") + "/user")).json(); }
    async getFile(path) {
      const j = await (await this.req(this.url(`contents/${path}?ref=${encodeURIComponent(this.cfg.branch)}&t=${Date.now()}`))).json();
      let content = j.content;
      if (!content || j.encoding === "none") {
        content = (await (await this.req(this.url(`git/blobs/${j.sha}`))).json()).content; // >1MB files
      }
      return { sha: j.sha, text: b64decode(content) };
    }
    async headSha(path) {
      const j = await (await this.req(this.url(`contents/${path}?ref=${encodeURIComponent(this.cfg.branch)}&t=${Date.now()}`), { headers: { Accept: "application/vnd.github.object" } })).json();
      return j.sha;
    }
    async putFile(path, b64, message, sha) {
      const body = { message, content: b64, branch: this.cfg.branch };
      if (sha) body.sha = sha;
      return (await this.req(this.url(`contents/${path}`), { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })).json();
    }
    async getBlobUrl(path, type) {
      const res = await this.req(this.url(`contents/${path}?ref=${encodeURIComponent(this.cfg.branch)}`), { headers: { Accept: "application/vnd.github.raw" } });
      const blob = await res.blob();
      return URL.createObjectURL(type ? new Blob([blob], { type }) : blob);
    }
    repoUrl() {
      const web = this.cfg.apiBase.includes("api.github.com") ? "https://github.com" : this.cfg.apiBase.replace(/\/api\/v3\/?$/, "");
      return `${web}/${this.cfg.owner}/${this.cfg.repo}`;
    }
  }

  /* ---------- Store ---------- */
  class Store {
    constructor() {
      const base = Object.assign({}, window.TRACKER_CONFIG || {});
      this.cfg = Object.assign(base, LS.get("cfg", {}));
      this.token = LS.get("token", "");
      this.mode = "readonly"; // github | readonly | local
      this.user = { name: LS.get("me", "") || "Guest", login: "" };
      this.db = null; this.base = null; this.sha = null;
      this.pending = []; this.saving = false; this.status = "idle"; this.lastCommit = null; this.error = "";
      this.listeners = [];
      this.timer = null;
    }
    on(fn) { this.listeners.push(fn); }
    emit(kind) { this.listeners.forEach((f) => f(kind)); }
    saveCfg(cfg, token) {
      this.cfg = Object.assign({}, window.TRACKER_CONFIG, cfg);
      LS.set("cfg", cfg);
      if (token !== undefined) { this.token = token; token ? LS.set("token", token) : LS.del("token"); }
    }
    setMe(name) { LS.set("me", name); this.user.name = name; this.emit("user"); }
    get canEdit() { return this.mode === "github" || this.mode === "local"; }
    get gh() { return new GitHub(this.cfg, this.token); }

    async load() {
      this.error = "";
      const wantLocal = LS.get("localMode", false);
      if (this.token && this.cfg.owner && !wantLocal) {
        try {
          const gh = this.gh;
          const u = await gh.user();
          this.user.login = u.login;
          if (!LS.get("me", "")) this.user.name = u.name || u.login;
          const f = await gh.getFile(this.cfg.dataPath);
          this.sha = f.sha; this.base = JSON.parse(f.text);
          this.mode = "github";
        } catch (e) {
          this.error = "GitHub: " + e.message + " - opened read-only.";
        }
      }
      if (!this.base) {
        if (wantLocal && LS.get("localDb", null)) {
          this.base = LS.get("localDb"); this.mode = "local";
        } else {
          try {
            const res = await fetch(this.cfg.dataPath + "?t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) throw new Error(res.status);
            this.base = await res.json();
          } catch (e) {
            this.base = LS.get("localDb", null);
            if (!this.base) throw new Error("Could not load " + this.cfg.dataPath + ". Serve the folder over http (see README).");
          }
          this.mode = wantLocal ? "local" : "readonly";
        }
      }
      this.normalize(this.base);
      this.db = clone(this.base);
      this.pending.forEach((op) => applyOp(this.db, op));
      this.status = "saved";
      this.emit("load");
      this.startPolling();
    }

    normalize(db) {
      db.views = db.views || [];
      db.milestones = db.milestones || [];
      db.deleted = db.deleted || [];
      db.people = db.people || [];
      (db.schema.find((f) => f.id === "milestone") || { options: [] }).options.forEach((o) => {
        if (!db.milestones.some((m) => m.name === o.name)) db.milestones.push({ name: o.name, date: null });
      });
    }

    setLocalMode(on) { LS.set("localMode", !!on); if (on && this.db) LS.set("localDb", this.db); }

    /* dispatch an op */
    do(op) {
      if (!this.canEdit) { this.emit("readonly"); return false; }
      op.at = op.at || now();
      op.by = op.by || this.user.name;
      applyOp(this.db, op);
      if (this.mode === "local") { LS.set("localDb", this.db); this.status = "saved"; this.emit("change"); return true; }
      this.pending.push(op);
      this.status = "dirty";
      this.emit("change");
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), this.cfg.autosaveMs || 2000);
      return true;
    }

    async flush() {
      if (this.mode !== "github" || this.saving || !this.pending.length) return;
      this.saving = true; this.status = "saving"; this.emit("status");
      const batch = this.pending.slice();
      const ids = [...new Set(batch.map((o) => o.id).filter(Boolean))];
      const summary = batch.length === 1 ? describe(batch[0], this.db) : `${batch.length} changes${ids.length ? " (" + ids.slice(0, 6).join(", ") + (ids.length > 6 ? ", ..." : "") + ")" : ""}`;
      const message = `${this.user.name}: ${summary}\n\n` + batch.map((o) => "- " + describe(o, this.db)).join("\n");
      try {
        for (let attempt = 0; attempt < 4; attempt++) {
          const next = clone(this.base);
          batch.forEach((op) => applyOp(next, op));
          try {
            const res = await this.gh.putFile(this.cfg.dataPath, b64encode(JSON.stringify(next, null, 1)), message, this.sha);
            this.sha = res.content.sha; this.base = next;
            this.lastCommit = { sha: res.commit.sha, url: res.commit.html_url, at: now() };
            break;
          } catch (e) {
            if ((e.status === 409 || e.status === 422) && attempt < 3) {
              const f = await this.gh.getFile(this.cfg.dataPath); // teammate committed: rebase
              this.sha = f.sha; this.base = JSON.parse(f.text); this.normalize(this.base);
              continue;
            }
            throw e;
          }
        }
        this.pending = this.pending.slice(batch.length);
        this.db = clone(this.base);
        this.pending.forEach((op) => applyOp(this.db, op));
        this.status = this.pending.length ? "dirty" : "saved"; this.error = "";
        this.emit("synced");
      } catch (e) {
        this.status = "error"; this.error = "Save failed: " + e.message + " (changes kept - retrying)";
        this.emit("status");
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), 15000);
      } finally {
        this.saving = false;
        if (this.pending.length && this.status !== "error") { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 500); }
      }
    }

    async refresh() {
      if (this.mode === "local") return;
      if (this.mode === "github") {
        await this.flush();
        const f = await this.gh.getFile(this.cfg.dataPath);
        if (f.sha !== this.sha) {
          this.sha = f.sha; this.base = JSON.parse(f.text); this.normalize(this.base);
          this.db = clone(this.base); this.pending.forEach((op) => applyOp(this.db, op));
          this.emit("remote");
        }
      } else {
        const res = await fetch(this.cfg.dataPath + "?t=" + Date.now(), { cache: "no-store" });
        this.base = await res.json(); this.normalize(this.base); this.db = clone(this.base); this.emit("remote");
      }
    }

    startPolling() {
      clearInterval(this.poll);
      if (this.mode !== "github") return;
      this.poll = setInterval(async () => {
        if (this.saving || this.pending.length || document.hidden) return;
        try { const s = await this.gh.headSha(this.cfg.dataPath); if (s && s !== this.sha) await this.refresh(); } catch {}
      }, (this.cfg.pollSeconds || 60) * 1000);
    }

    /* attachments */
    async uploadFile(recId, file) {
      const max = (this.cfg.maxUploadMB || 5) * 1024 * 1024;
      if (file.size > max) throw new Error(`File is larger than ${this.cfg.maxUploadMB} MB.`);
      const buf = new Uint8Array(await file.arrayBuffer());
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const a = { id: uid("a"), kind: "file", name: file.name, size: file.size, type: file.type || "", by: this.user.name, at: now() };
      if (this.mode === "github") {
        const path = `${this.cfg.attachmentsDir}/${recId}/${Date.now()}-${safe}`;
        await this.gh.putFile(path, bytesToB64(buf), `${this.user.name}: upload ${file.name} to ${recId}`);
        a.path = path;
      } else if (this.mode === "local") {
        if (file.size > 1024 * 1024) throw new Error("Local mode keeps files in the browser: limit 1 MB.");
        a.dataUrl = `data:${file.type || "application/octet-stream"};base64,` + bytesToB64(buf);
      } else throw new Error("Read-only: connect GitHub in Settings to upload.");
      this.do({ t: "attach", id: recId, a });
      return a;
    }
    async attachmentUrl(a) {
      if (a.kind === "link") return a.url;
      if (a.dataUrl) return a.dataUrl;
      if (this.mode === "github") return this.gh.getBlobUrl(a.path, a.type);
      return a.path; // served next to the app (GitHub Pages)
    }

    nextId() {
      const used = new Set([...this.db.records, ...(this.db.deleted || [])].map((r) => r.id));
      let n = this.db.nextId || this.db.records.length + 1;
      while (used.has("TD-" + String(n).padStart(3, "0"))) n++;
      return "TD-" + String(n).padStart(3, "0");
    }
    repoWebUrl() { return this.cfg.owner ? this.gh.repoUrl() : ""; }
  }

  window.ZT = { Store, LS, uid, clone, fmtVal, b64encode };
})();
