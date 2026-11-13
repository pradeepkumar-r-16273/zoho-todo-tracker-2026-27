// Dev helper: serves the app and a minimal fake GitHub Contents API so the
// GitHub save path can be tested without a real repo.
//   node scripts/mock-github.js   ->  http://localhost:8080
// In Settings use owner "demo", repo "tracker", API base "http://localhost:8080/api", any token.
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const files = new Map(); // path -> {content(Buffer), sha}
const sha = (b) => crypto.createHash("sha1").update(b).digest("hex");
const put = (p, buf) => files.set(p, { content: buf, sha: sha(buf) });
put("data/features.json", fs.readFileSync(path.join(root, "data/features.json")));
const commits = [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const send = (code, obj, raw) => { res.writeHead(code, { "Content-Type": raw ? "application/octet-stream" : "application/json", "Access-Control-Allow-Origin": "*" }); res.end(raw || JSON.stringify(obj)); };
  if (u.pathname.startsWith("/api")) {
    if (u.pathname === "/api/user") return send(200, { login: "pradeep-demo", name: "Pradeep Kumar" });
    if (u.pathname === "/api/_commits") return send(200, commits);
    let m = u.pathname.match(/^\/api\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
    if (m) {
      const p = decodeURIComponent(m[1]);
      if (req.method === "GET") {
        const f = files.get(p); if (!f) return send(404, { message: "Not Found" });
        if ((req.headers.accept || "").includes("raw")) return send(200, null, f.content);
        return send(200, { sha: f.sha, encoding: "base64", content: f.content.toString("base64") });
      }
      if (req.method === "PUT") {
        let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
          const j = JSON.parse(body); const f = files.get(p);
          if (f && j.sha !== f.sha) return send(409, { message: `${p} does not match ${j.sha}` });
          const buf = Buffer.from(j.content, "base64"); put(p, buf);
          const c = { sha: sha(buf + Date.now()), message: j.message, path: p, html_url: "http://localhost:8080/commit" }; commits.push(c);
          if (p === "data/features.json") fs.writeFileSync("/tmp/mock-features.json", buf);
          send(200, { content: { sha: files.get(p).sha, path: p }, commit: c });
        });
        return;
      }
    }
    m = u.pathname.match(/\/git\/blobs\/(\w+)$/);
    if (m) { for (const f of files.values()) if (f.sha === m[1]) return send(200, { content: f.content.toString("base64"), encoding: "base64" }); return send(404, {}); }
    return send(404, { message: "Not Found" });
  }
  const fp = path.join(root, u.pathname === "/" ? "index.html" : decodeURIComponent(u.pathname));
  if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(fp)] || "application/octet-stream" }); fs.createReadStream(fp).pipe(res);
}).listen(8080, () => console.log("http://localhost:8080"));
