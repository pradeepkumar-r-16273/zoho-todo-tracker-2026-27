// Repository settings for the tracker. Every value can also be overridden per
// browser from the in-app Settings dialog (gear icon).
window.TRACKER_CONFIG = {
  owner: "",                 // GitHub user or org that owns the repo, e.g. "pradeep-zoho"
  repo: "zoho-todo-tracker", // repository name
  branch: "main",
  apiBase: "https://api.github.com", // GitHub Enterprise: "https://<your-host>/api/v3"
  dataPath: "data/features.json",
  attachmentsDir: "data/attachments",
  maxUploadMB: 5,            // per-file upload limit for attachments
  autosaveMs: 2000,          // batch edits for this long before committing
  pollSeconds: 60            // check GitHub for teammates' changes
};
