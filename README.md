# Zoho ToDo – Product Development Tracker

An Airtable-style tracker for Zoho ToDo's 2026/27 roadmap and execution. It is a static web app (no server, no build step). **The GitHub repo is the database**: every edit is committed to `data/features.json` under the editor's GitHub account, so the full history of changes is kept in Git and in the app's own change timeline.

Seeded with 99 features compiled from the team's Streams notes (Jul 2025 – Nov 2026): what's released, what's in progress, the roadmap, the server milestones (M288–M293), owners, and the ideas backlog.

## What's in it

| View | What it does |
|---|---|
| **Grid** | Spreadsheet-style editing: click a cell to select it, click again or press Enter to edit. Pill selects, people, dates, progress. Filter, sort, group, hide or resize columns, search, CSV export. |
| **Kanban** | Boards stacked by status, milestone, module or any select/people field. Drag a card to change its value. |
| **Timeline** | Gantt view of start and target dates, with week, month and quarter zoom. Drag a bar to move it, drag its edges to change the dates. Milestone markers and a today line. |
| **Dashboard** | KPI tiles; features by module and phase; status breakdown; a delivery-stage heatmap; milestone load; workload per person; requirement source; recent changes and comments. Click any tile, bar or cell to open the matching features. |
| **Change timeline** | Every field change, comment and attachment, newest first. You can filter by person or by type. |
| **Record panel** | All fields, the 7 delivery stages (Analysis, Design, HTML, Server, Client, Testing, Mobile), a sub-item checklist, notes, plus **Comments** (with @mentions), **Attachments** (links and file uploads) and a per-feature **History**. |

You can also save team views (shared filters and groupings), add custom fields, add or recolour select options, restore deleted features, set milestone dates, and export a JSON backup.

## Setup (about 5 minutes)

1. **Create the repo.** Push this folder to a GitHub repo. A private repo is recommended.
2. **Set the owner.** Edit `config.js` and set `owner` (and `repo`/`branch` if yours differ). On GitHub Enterprise, also set `apiBase` to `https://<host>/api/v3`.
3. **Host the app.** Pick one:
   - **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root). A private repo needs a paid GitHub plan for Pages. The site can be visible to anyone who has the link, but it only shows data the viewer can reach. Editors always read and write through the API with their own token.
   - **Run it locally.** Run `python3 -m http.server 8000` in the folder, then open http://localhost:8000.
4. **Give each editor a token.** Each editor creates a **fine-grained personal access token**: GitHub → Settings → Developer settings → Fine-grained tokens. Give it access to *only this repository* with **Contents: Read and write**. In the app, open **Settings**, paste the token, pick your name, then click **Test connection** and **Save & reload**.

   The token is stored only in that browser's localStorage. Anyone without a token gets read-only access.

## How saving works

- Edits apply instantly in the browser. They are batched for about 2 seconds, then committed with a message such as `Gayathri K: TD-020 Status -> Testing`.
- If a teammate committed in the meantime, the app pulls the latest file and replays your changes on top of it. Edits to different features or fields never overwrite each other. If two people change the *same* field, the last save wins, and both values stay in History.
- The app checks GitHub every 60 seconds for teammates' changes. The refresh button pulls them right away.
- Attachments are committed to `data/attachments/<feature-id>/`. The limit is 5 MB per file and can be changed in `config.js`. Links (WorkDrive, Cliq threads, design files, analysis docs) cost nothing.
- **Local mode** (no GitHub) keeps everything in the browser. It's useful for trying the app out. Use **Export JSON** to keep a copy.

## Files

```
index.html            app shell
config.js             repo settings (owner, repo, branch, API base, limits)
assets/store.js       GitHub data layer: op log, commit, conflict replay, uploads
assets/app.js         shell, grid, editors, record panel
assets/views.js       kanban, timeline, dashboard, change timeline, settings
assets/styles.css
data/features.json    the database (schema, people, views, milestones, records)
data/attachments/     uploaded files
scripts/build_seed.py regenerates the seed data from the source notes (overwrites edits!)
scripts/mock-github.js local fake GitHub API for testing the save path
```

## Data notes

- Where the source notes disagree, the newer note wins, and the difference is recorded in the feature's Notes field. For example, Notification Email Template (Reminder) has different DC lists in the 3 Nov and 4 Nov notes.
- The source notes had no start or target dates, so the Timeline starts empty. Use **+ Schedule** on a row, or set dates in the record panel. Add milestone dates under Settings.
- Many "Link" references in the notes had no URL. Attach the real Analysis, Design, Task and Cliq links in each feature's Attachments tab.
