"""Builds data/features.json (the tracker database) from the Zoho ToDo
roadmap / work-item notes (Streams posts, Jul 2025 - Nov 2026).

Run once to (re)seed:  python3 scripts/build_seed.py
WARNING: re-seeding overwrites all edits, comments and history in data/features.json.
"""
import json, os, datetime

SEED_AT = "2026-11-13T09:00:00+05:30"
SEED_BY = "Seed import"

NOTES = {
    "RW": "Roadmap & Work Items post (Gayathri, 04 Nov 2026)",
    "GW": "Gayathri work items (03 Nov 2026)",
    "PW": "Pradeep work items - Oct 2026 update (27 Oct 2026)",
    "SS": "Server status for work items (15 Jul 2026, milestones to M293)",
    "IO": "Interoperability notes (Pradeep, 23 Dec 2025)",
    "TO": "Initial feature set to be taken (22 Dec 2025)",
    "ID": "Ideas & potential roadmap (Madhumitha, Jul-Dec 2025)",
}

STAGES = ["analysis", "design", "html", "server", "client", "testing", "mobile"]
STAGE_OPTS = ["Not Started", "In Pipeline", "In Progress", "Done", "On Hold", "N/A"]

def opt(name, color):
    return {"name": name, "color": color}

SCHEMA = [
    {"id": "name", "name": "Feature", "type": "text", "primary": True, "width": 300},
    {"id": "module", "name": "Module", "type": "singleSelect", "width": 150, "options": [
        opt("Task Core", "blue"), opt("Task Views", "cyan"), opt("AI", "purple"),
        opt("Integrations", "teal"), opt("Mail Integration", "orange"), opt("Calendar", "green"),
        opt("Admin Console", "red"), opt("Migration", "yellow"), opt("Mobile", "pink"),
        opt("Platform", "gray"), opt("Issues / Tickets", "gray")]},
    {"id": "phase", "name": "Phase", "type": "singleSelect", "width": 130, "options": [
        opt("Released", "green"), opt("Working on", "blue"), opt("Roadmap", "purple"),
        opt("Pipeline", "cyan"), opt("Ideas / Backlog", "gray")]},
    {"id": "status", "name": "Status", "type": "singleSelect", "width": 140, "options": [
        opt("Released", "green"), opt("Releasing", "teal"), opt("Testing", "cyan"),
        opt("In Progress", "blue"), opt("In Design", "purple"), opt("Analysis Done", "yellow"),
        opt("In Pipeline", "orange"), opt("Yet to Start", "gray"), opt("On Hold", "red"),
        opt("Idea", "gray")]},
    {"id": "priority", "name": "Priority", "type": "singleSelect", "width": 110, "options": [
        opt("P0 - Critical", "red"), opt("P1 - High", "orange"), opt("P2 - Medium", "yellow"),
        opt("P3 - Low", "gray")]},
    {"id": "progress", "name": "Progress", "type": "formula", "width": 120,
     "formula": "stageProgress"},
    {"id": "source", "name": "Requirement Source", "type": "singleSelect", "width": 170, "options": [
        opt("Customer Requirement", "blue"), opt("Competitive Study", "purple"),
        opt("Internal Feedback", "teal"), opt("Support Ticket", "orange")]},
    {"id": "pm", "name": "PM / Analyst", "type": "people", "width": 160},
    {"id": "dev", "name": "Server Owner", "type": "people", "width": 160},
    {"id": "milestone", "name": "Milestone", "type": "multiSelect", "width": 140, "options": [
        opt(m, c) for m, c in [("M287", "gray"), ("M288", "blue"), ("M289", "cyan"), ("M290", "teal"),
                               ("M291", "green"), ("M292", "yellow"), ("M293", "orange"),
                               ("M294", "red"), ("M295", "purple")]]},
] + [
    {"id": s, "name": s.upper() if s == "html" else s.capitalize(), "type": "singleSelect",
     "width": 120, "stage": True, "options": [
        opt("Not Started", "gray"), opt("In Pipeline", "orange"), opt("In Progress", "blue"),
        opt("Done", "green"), opt("On Hold", "red"), opt("N/A", "gray")]}
    for s in STAGES
] + [
    {"id": "releasedTo", "name": "Released To (DC)", "type": "multiSelect", "width": 200, "options": [
        opt(d, "green" if d == "All DC" else "teal") for d in
        ["All DC", "IN", "US", "EU", "AU", "JP", "SA", "CA", "SG", "AE", "CN", "Zoho Corp", "Task Team"]]},
    {"id": "startDate", "name": "Start Date", "type": "date", "width": 120},
    {"id": "targetDate", "name": "Target Date", "type": "date", "width": 120},
    {"id": "subitems", "name": "Sub-items", "type": "checklist", "width": 140},
    {"id": "notes", "name": "Notes", "type": "longText", "width": 320},
    {"id": "sourceNote", "name": "Source Note", "type": "singleSelect", "width": 240, "options": [
        opt(v, "gray") for v in NOTES.values()] + [opt("Added in tracker", "blue")]},
]

for _f in SCHEMA:
    _f["core"] = True

PEOPLE = [
    {"name": "Pradeep Kumar", "role": "Product / Analysis", "github": ""},
    {"name": "Gayathri K", "role": "Product / Analysis", "github": ""},
    {"name": "Madhumitha Krishnamurthi", "role": "Product Lead", "github": ""},
    {"name": "Krishnakumar Krishnamoorthy", "role": "Product Head", "github": ""},
    {"name": "Sivasankari P", "role": "Server", "github": ""},
    {"name": "Anusya Devi S", "role": "Server", "github": ""},
    {"name": "Vignesh R", "role": "Server", "github": ""},
    {"name": "Sankar", "role": "Server", "github": ""},
    {"name": "Praneesh Kumar Kandasamy", "role": "Engineering", "github": ""},
    {"name": "Vasanthakumar V", "role": "Engineering", "github": ""},
    {"name": "Praveen Kumar G", "role": "Engineering", "github": ""},
]

PR, GA, MA = "Pradeep Kumar", "Gayathri K", "Madhumitha Krishnamurthi"
SIVA, ANU, VIG, SAN = "Sivasankari P", "Anusya Devi S", "Vignesh R", "Sankar"

records = []

def add(name, module, phase, status, src=None, pm=None, dev=None, ms=None, note="", notes="",
        st=None, dcs=None, sub=None, links=None, comments=None, prio=None):
    r = {"id": "TD-%03d" % (len(records) + 1), "name": name, "module": module, "phase": phase,
         "status": status, "priority": prio, "source": src, "pm": pm or [], "dev": dev or [],
         "milestone": ms or [], "releasedTo": dcs or [], "startDate": None, "targetDate": None,
         "notes": notes, "sourceNote": NOTES.get(note, note) if note else None,
         "subitems": [{"text": t, "done": d} for t, d in (sub or [])]}
    for s in STAGES:
        r[s] = (st or {}).get(s)
    r["attachments"] = [{"id": "a%d" % i, "kind": "link", "name": n, "url": u, "by": SEED_BY,
                         "at": SEED_AT} for i, (n, u) in enumerate(links or [])]
    r["comments"] = [{"id": "c%d" % i, "by": b, "at": a, "text": t}
                     for i, (b, a, t) in enumerate(comments or [])]
    r["history"] = [{"at": SEED_AT, "by": SEED_BY, "action": "created",
                     "detail": "Imported from: " + (r["sourceNote"] or "notes")}]
    r["createdAt"] = r["updatedAt"] = SEED_AT
    r["updatedBy"] = SEED_BY
    records.append(r)

D, IP, PL, NS, OH, NA = "Done", "In Progress", "In Pipeline", "Not Started", "On Hold", "N/A"
CR, CS, IF, ST = "Customer Requirement", "Competitive Study", "Internal Feedback", "Support Ticket"

# ---------------- Released ----------------
add("Generate Subtask and Description", "AI", "Released", "Released", CS, [GA],
    dcs=["IN", "US", "EU", "AU", "JP", "SA", "CA"], note="RW",
    notes="SG and AE pending. Will not be released in CN.",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": D})
add("Notification Email Template (Import & Export)", "Task Core", "Released", "Released", IF, [GA],
    dcs=["All DC"], note="GW", notes="Released to all DCs. Corrections have been informed.",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": D})
add("Notification Email Template (Reminder)", "Task Core", "Released", "Released", IF, [GA, PR], [ANU],
    ["M289", "M290"], dcs=["IN", "SG", "CA", "EU", "US", "AU", "JP", "CN"], note="RW",
    notes="Roadmap post (04 Nov) lists IN, SG, CA, EU, US, AU, JP, CN; Gayathri's 03 Nov note lists IN DC only - confirm. "
          "Server: Zoho logo change + reminder template (M289, completed in M290). Pradeep's Oct note: Notification Email template design completed.",
    st={"analysis": D, "design": D, "server": D, "client": D})
add("Task Dashboard", "Task Core", "Released", "Released", CR, [GA], [SIVA], ["M289"],
    dcs=["Zoho Corp"], note="RW", notes="Server: Progress stats & Priority chart sections (M289 - completed).",
    st={"analysis": D, "design": D, "server": D, "client": D})
add("Task Merge", "Task Core", "Released", "Released", CS, [GA], [VIG], ["M289"], dcs=["Zoho Corp"],
    note="RW", notes="Server: Task merge assignee (M289 - completed). Merge notification provided; testing with notification changes pending.",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": IP},
    sub=[("Merge assignee (server)", True), ("Notification case testing", False)])
add("Task RHS Widget Integration", "Task Core", "Released", "Released", CS, [GA], dcs=["Task Team"], note="RW",
    notes="Released to Task Team. RHS NLP nearly completed (fine-tuning results); RHS feedback changes nearly completed; NLP & design-change test cases in testing.",
    st={"analysis": D, "design": D, "server": D, "client": IP, "testing": IP},
    sub=[("RHS NLP fine-tuning", False), ("RHS feedback changes", False)])
add("Flagged Email View Integration", "Mail Integration", "Released", "Released", CR, [PR], dcs=["All DC"],
    note="PW", notes="Flagged Email View - All DC released. Flagged email mobile support in progress (see Mobile item).",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": D, "mobile": IP})
add("Task Dependency", "Task Core", "Released", "Released", CR, [PR], ms=["M291"], dcs=["Task Team"], note="RW",
    notes="Released for team members; notification issues in testing. Server: failure entity IDs handled (M291); inter-group dependency handled.",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": IP, "mobile": IP},
    sub=[("Failure entity IDs (server)", True), ("Inter-group dependency", True), ("Notification issue fixes", False), ("Mobile support", False)])
add("My Day", "Task Views", "Released", "Released", CR, [PR], dcs=["All DC"], note="RW",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": D})
add("Trash View", "Task Views", "Released", "Released", None, [GA], dcs=["All DC"], note="GW",
    st={"server": D, "client": D, "testing": D})
add("Copy and Move", "Task Core", "Released", "Released", None, [GA], dcs=["All DC"], note="GW",
    st={"server": D, "client": D, "testing": D})
add("Microsoft To Do Migration", "Migration", "Released", "Released", None, [GA], dcs=["All DC"], note="GW",
    st={"server": D, "client": D, "testing": D})
add("Show All Subtasks", "Task Views", "Released", "Released", None, [GA], dcs=["All DC"], note="GW",
    st={"server": D, "client": D, "testing": D})
add("Created By (Manage Fields)", "Task Views", "Released", "Released", None, [GA], dcs=["All DC"], note="GW",
    notes="Analysis document available.", st={"analysis": D, "server": D, "client": D, "testing": D})
add("Overdue Tasks in Calendar", "Calendar", "Released", "Released", None, [PR], dcs=["All DC"], note="PW",
    st={"server": D, "client": D, "testing": D})
add("Tomorrow View in Agenda", "Calendar", "Released", "Released", None, [PR], note="PW",
    notes="Client pipeline: completed.", st={"client": D})
add("CORS API", "Platform", "Released", "Released", None, [PR], [SIVA], ["M288"], note="SS",
    notes="Was in localzoho; change included. M288 - completed.", st={"server": D})
add("Multi-account Calendar", "Calendar", "Working on", "Releasing", None, [PR], note="PW",
    notes="Release in progress.", st={"server": D, "client": D, "testing": D})
add("Webinar V2", "Calendar", "Working on", "Testing", None, [PR], note="PW",
    notes="Testing in progress.", st={"testing": IP})

# ---------------- Working on ----------------
add("Task Export Enhancement", "Task Core", "Working on", "In Progress", CR, [GA], [SIVA], ["M289", "M292"], note="RW",
    notes="Currently in HTML implementation; server API to be checked and taken for client implementation. "
          "First set of APIs shared; additional APIs & settings requested (M289). Zoho Sheet export pending on other-team dependency (M292).",
    st={"analysis": D, "design": D, "html": IP, "server": IP, "client": NS},
    sub=[("Export history", True), ("Export permission", True), ("Tag view export", False), ("Export to Zoho Sheet (M292)", False)])
add("Task View Enhancement", "Task Views", "Working on", "In Progress", CR, [GA], [SIVA], ["M291"], note="RW",
    notes="Umbrella for view & preference work. Group by none should work with filter/sort preference & category (M291). Filter by Task owner released; group by owner to be taken.",
    st={"analysis": D, "design": D, "server": IP, "client": IP},
    sub=[("Custom priority (see separate item)", False), ("Filter & sort unification / consistent group by", False),
         ("Group by none & Created by", False), ("Expand / collapse", False), ("Hide section", False),
         ("Preference handling", False), ("Filter by task owner", True), ("Group by task owner", False)])
add("Custom Priority", "Task Views", "Working on", "In Progress", CR, [GA], [ANU], ["M291", "M292"], note="GW",
    notes="Analysis doc with POC available. Server & design in progress. Also covers default priority, default status and priority sorting.",
    st={"analysis": D, "design": IP, "server": IP, "client": NS},
    sub=[("Default priority", False), ("Default status", False), ("Sort by priority", False)])
add("TickTick Migration", "Migration", "Working on", "Testing", CR, [GA], note="RW",
    notes="Implementation nearly completed - about to be released. DPIA document done. Testing: WS case notification.",
    st={"analysis": D, "design": D, "server": D, "client": D, "testing": IP})
add("AI Agents - Reporting Agent", "AI", "Working on", "In Progress", CS, [GA], [ANU], ["M292"], note="GW",
    notes="V1 currently implemented via Agent Playground. Design in progress.",
    st={"analysis": D, "design": IP, "server": IP, "client": IP})
add("AI Agents - Task Assistant", "AI", "Working on", "In Progress", CS, [GA], [SIVA], ["M291", "M292"], note="SS",
    notes="Server: group-wise assignee count API (M291), group distribution cases (M292). Client in progress.",
    st={"server": IP, "client": IP},
    sub=[("Group-wise assignee count API (M291)", False), ("Group distribution cases (M292)", False)])
add("Voice to Text with NLP", "AI", "Working on", "In Progress", CS, [GA], note="RW",
    notes="Client team exploring voice-to-text implementations and NLP parsing libraries. Related: NLP & '/' command input creation (server, similar approach to Quick Add).",
    st={"analysis": D, "client": IP})
add("Workflow / Basic Automation", "Task Core", "Working on", "In Progress", CR, [PR], ms=["M287", "M288", "M289", "M290"], note="PW",
    notes="Workflow / Blueprint analysis completed. Server framework in progress (287/288); workflow issues M289 (completed in M290). Client in progress. Design: mail component.",
    st={"analysis": D, "design": IP, "server": IP, "client": IP})
add("AI Dashboard", "AI", "Working on", "In Progress", CS, [GA], note="RW",
    notes="Related server work: insights multiple filter API (task count).")
add("Print Tasks", "Task Core", "Working on", "In Progress", CR, [PR], note="RW",
    notes="Server print enhancement completed; permission/group-level cases & Save as PDF API to be shared. Analysis completed and moved to design. Client in pipeline.",
    st={"analysis": D, "design": IP, "server": D, "client": PL},
    sub=[("Permission / group level cases", False), ("Save as PDF", False)])
add("Reminder & Recurrence Enhancements", "Task Core", "Working on", "Testing", CR, [PR], [SIVA], ["M289", "M290"], note="RW",
    notes="Recurring: Timeline & Periodic (M289, completed M290). Reminder: email reminder to check; custom name ETA pending; notification owner/method TBD. Recurring test cases yet to be shared.",
    st={"analysis": D, "design": D, "server": IP, "client": D, "testing": IP},
    sub=[("Recurring - Timeline & Periodic", True), ("Email reminder", False), ("Custom name", False), ("Recurring test cases shared", False)])
add("Group Tags", "Task Core", "Working on", "Testing", CR, [PR], [SIVA], ["M288"], note="RW",
    notes="Custom group label support & filter support completed (M288). Client completed - issue fixes in testing. Group & personal tags filter/sort option to be discussed later.",
    st={"server": D, "client": D, "testing": IP})
add("My Day V2 / Enhancements", "Task Views", "Working on", "In Progress", CR, [PR], note="RW",
    notes="Analysis completed; server in progress. Support ticket: current due date separation (in pipeline).",
    st={"analysis": D, "server": IP, "client": PL, "mobile": IP},
    sub=[("Current due date separation (support ticket)", False), ("My Day in mobile", False)])

# ---------------- Roadmap ----------------
add("GitHub / GitLab Integration", "Integrations", "Roadmap", "Analysis Done", CS, [GA], note="RW",
    notes="Analysis document done; server implementation to be taken. Design in progress.",
    st={"analysis": D, "design": IP, "server": NS})
add("Unified External Integrations", "Integrations", "Roadmap", "In Pipeline", CS, [PR], [SAN], ["M292", "M293"], note="RW", prio="P1 - High",
    notes="Flagged as priority. Owner meeting scheduled; server M293. Interoperability approach: API & auth, one-way read-only import, 2-way sync (Asana/Jira/ClickUp), connector partners (Zapier, IFTTT, Integrately, Power Automate, Unito), rules/event webhooks (Mail, CRM, external), ToDo marketplace.",
    st={"analysis": D, "server": PL},
    sub=[("API & auth implementation", False), ("One-way sync (read-only import)", False), ("2-way sync", False),
         ("Connector partners (Zapier, IFTTT, Integrately, Power Automate, Unito)", False),
         ("Rules / event-based webhooks", False), ("Marketplace for Zoho ToDo", False)],
    links=[("Asana OAuth docs", "https://developers.asana.com/docs/oauth"),
           ("Asana webhooks", "https://developers.asana.com/reference/webhooks"),
           ("Todoist Sync API v9", "https://developer.todoist.com/sync/v9/"),
           ("Todoist webhooks", "https://developer.todoist.com/guides/#webhooks"),
           ("Trello webhooks guide", "https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/"),
           ("ClickUp API - Get tasks", "https://developer.clickup.com/reference/gettasks"),
           ("ClickUp webhooks", "https://developer.clickup.com/reference/getwebhooks")])
add("Notification Customisation", "Task Core", "Roadmap", "In Progress", CR, [PR], [SIVA], ["M291", "M292"], note="PW",
    notes="Analysis & design completed. Server in progress - pending other-team dependency, to be provided in dev-task (M292). Client in progress. Idea: digest email reports by reportee/group.",
    st={"analysis": D, "design": D, "server": IP, "client": IP})
add("Approval Workflow", "Task Core", "Roadmap", "Analysis Done", CR, [PR], note="RW",
    notes="Approval flow analysis completed. Server & design in pipeline.",
    st={"analysis": D, "design": PL, "server": PL})
add("User Role & Permissions Management", "Admin Console", "Roadmap", "Analysis Done", CR, [PR], note="RW",
    notes="Analysis completed. Security-side permissions; server to assess customisation scope. Includes role customisation within group (assign / change status by role).",
    st={"analysis": D, "design": PL, "server": PL})
add("Task Admin Console & Enhancements", "Admin Console", "Roadmap", "In Pipeline", CS, [PR], note="RW",
    notes="Server in pipeline. Ideas: admin controls, audit logs.", st={"server": PL})
add("Task Create Form & Quick Add Enhancement", "Task Core", "Roadmap", "In Design", CR, [PR], ms=["M289"], note="PW",
    notes="Server analysis M289 (reminder, recurring task, create/view expanded); REST API can be used. Design analysis completed with few fixes. Quick Add in design.",
    st={"analysis": D, "design": IP, "server": IP, "client": PL},
    sub=[("Reminder", False), ("Recurring task", True), ("Create / View (expanded)", False), ("Quick Add", False)])
add("Unified Agenda Task", "Task Views", "Roadmap", "In Pipeline", CR, [PR], note="RW",
    notes="Client in pipeline. Server to be taken up; discuss with integration team.", st={"server": NS, "client": PL})
add("Calendar View", "Task Views", "Roadmap", "In Design", CS, [GA], note="RW",
    notes="Design completed. View to be discussed with Krishna and taken up for implementation if needed.",
    st={"design": D, "client": NS})
add("Table View", "Task Views", "Roadmap", "In Design", CS, [GA], note="RW", notes="Design in progress.",
    st={"design": IP})
add("Publish Task V2", "Task Core", "Roadmap", "Analysis Done", CR, [PR], note="RW",
    notes="Analysis completed; server in pipeline.", st={"analysis": D, "server": PL})
add("Group Summary", "Task Core", "Roadmap", "Yet to Start", CS, note="RW")
add("Zoho Mail - ToDo Integration", "Mail Integration", "Roadmap", "In Progress", IF, [PR], note="RW",
    notes="Analysis in progress (tight integration for task & productivity management).", st={"analysis": IP})
add("Books Integration in Unified Task", "Integrations", "Roadmap", "On Hold", CR, [PR], note="RW",
    notes="In pipeline - on hold.", st={"analysis": OH})
add("Time Logging", "Task Core", "Roadmap", "In Progress", CS, [PR], note="RW",
    notes="POC in progress. Related idea: work time tracking.", st={"analysis": IP})
add("Task Insights & Rebalancing", "AI", "Roadmap", "In Pipeline", CS, [GA], note="RW",
    notes="Server exploring sub-group for rebalancing; implementation doc to be shared. Insights multiple filter API for task count.",
    st={"analysis": IP, "server": IP})
add("Task Import - New Design", "Task Core", "Roadmap", "In Design", IF, [GA], note="RW",
    notes="HTML available. Client implementation listed.", st={"design": D, "html": D, "client": PL})
add("Task Templates", "Task Core", "Roadmap", "In Design", CS, [PR], ms=["M293"], note="RW", prio="P1 - High",
    notes="Analysis completed; design in progress; server M293 (API not yet provided). Idea: industry templates (medicare, IT, finance services).",
    st={"analysis": D, "design": IP, "server": PL})

# ---------------- Pipeline (other tracked items) ----------------
add("Individual Task Summary", "AI", "Pipeline", "On Hold", None, [GA], note="GW",
    notes="Taken under implementation then kept on hold. Design completed. Server API shared; refinement requested.",
    st={"analysis": D, "design": D, "server": IP, "client": OH})
add("Feature Stats (ClickHouse)", "Platform", "Pipeline", "In Progress", IF, [GA, PR], [ANU], ["M291"], note="SS",
    notes="Central QA to enable for test account.", st={"server": IP},
    comments=[(MA, "2026-07-21T10:54:00+05:30", "Vignesh R in which milestone are we pushing ClickHouse stats? cc Pradeep Kumar. (Update: got it - in 290)")])
add("Sign-up Flow", "Platform", "Pipeline", "In Progress", None, [PR], ms=["M293"], note="SS",
    notes="Server in progress, M293.", st={"server": IP})
add("Group Task Sync in Calendar", "Calendar", "Pipeline", "In Progress", None, [PR], note="PW", st={"analysis": IP})
add("Timeline Issue Enhancements", "Issues / Tickets", "Pipeline", "In Progress", ST, [PR], note="PW", st={"analysis": IP})
add("POC Setup - ToDo", "Platform", "Pipeline", "In Progress", None, [PR], note="PW", st={"analysis": IP})
add("Task Sync in Calendar (Mobile API)", "Mobile", "Pipeline", "Yet to Start", None, [PR], note="PW",
    notes="Yet to be shared.", st={"mobile": NS})
add("Saved Search (Mobile)", "Mobile", "Pipeline", "Yet to Start", ST, [PR], note="PW",
    notes="Mobile support ticket - yet to be taken. Related idea: smart lists / saved filter views.", st={"mobile": NS})
add("Flagged Email - Mobile Support", "Mobile", "Pipeline", "In Progress", None, [PR], note="PW", st={"mobile": IP})
add("My Day View - Mobile Support", "Mobile", "Pipeline", "In Progress", None, [PR], note="PW", st={"mobile": IP})
add("Dependency Task - Mobile Support", "Mobile", "Pipeline", "In Progress", None, [PR], note="PW", st={"mobile": IP})
add("Bulk Copy / Move - Change Category", "Task Core", "Pipeline", "In Progress", None, [GA], note="GW", st={"client": IP})
add("Small Enhancements - Description / Hidden Groups / Parent Task Indication", "Task Views", "Pipeline", "Yet to Start", None, [GA], note="GW",
    notes="HTML available for all three; yet to take.", st={"html": D, "client": NS},
    sub=[("Description indication", False), ("Hidden groups", False), ("Parent task indication", False)])
add("Quick Navigation", "Task Views", "Pipeline", "On Hold", None, [GA], note="GW",
    notes="On hold due to expand / collapse.", st={"client": OH})
add("Listing Field Preference - Manage Field", "Task Views", "Pipeline", "In Progress", None, [PR], note="SS",
    notes="Check if My Day / Flagged shown in list; also check custom fields (Pradeep).")
add("Mandatory Custom Field Issues", "Issues / Tickets", "Pipeline", "In Progress", ST, [PR], note="SS",
    notes="Work in progress with issues; ticket to be shared (Pradeep).")
add("Project V3 Migration / Project Dependency Issues", "Issues / Tickets", "Pipeline", "Yet to Start", None, note="SS")
add("Preference Changes Issues", "Issues / Tickets", "Pipeline", "Yet to Start", None, note="SS",
    notes="Will be checked and shared.")
add("Trash Reminder Issue", "Issues / Tickets", "Pipeline", "Yet to Start", None, note="SS", notes="Live; to be checked.")
add("NLP & '/' Command Input Creation", "AI", "Pipeline", "Yet to Start", CS, note="SS",
    notes="Similar approach to Quick Add.")

# ---------------- Ideas / Backlog ----------------
ideas = [
    ("Keyboard Shortcuts", "Task Core", "", None),
    ("Custom Fields - Better Options & AI Fields", "Task Core", "", None),
    ("Smart Lists / Saved Filter Views", "Task Views", "Multiple filters saved as filter views.", None),
    ("AI-generated Custom Filter Views", "AI", "Today focus tasks, high priority this week, my delegated tasks.", None),
    ("Recent Tasks", "Task Views", "", None),
    ("Progress Stats & AI Reports", "AI", "Progress stats on current/custom fields; generate report/summary on progress and blockers.", None),
    ("Activity Log for Group / View", "Task Core", "", None),
    ("Daily Digest Mails", "Task Core", "Digest email reports by reportee, groups etc.", "TO"),
    ("Time Blocking / Auto-block Time in Calendar", "Calendar", "Calendar task-sync based view with auto block time.", "TO"),
    ("Drag & Drop Tasks to Calendar", "Calendar", "CX requested.", None),
    ("Subtask Sync within Calendar", "Calendar", "Not yet done.", None),
    ("Task Voting & Poll", "Task Core", "Need to check.", None),
    ("Focus Session - Pomodoro (flexible intervals)", "Task Core", "", None),
    ("Collaborative Goal Tracking", "Task Core", "", None),
    ("Checklists", "Task Core", "", None),
    ("SLA-based Task Reminder", "Task Core", "Improve SLA-based reminders.", None),
    ("Shift-based Task Management", "Task Core", "E.g. doctors.", None),
    ("Developer Focus Insights (distraction alerts, deep-work score)", "AI", "AI-based distraction alerts; weekly deep-work score for devs.", None),
    ("Outlook Mail - ToDo Integration", "Integrations", "Flagged email in Outlook; drag a mail onto ToDo icon to create task; flagged names synced.", None),
    ("OneNote - ToDo Integration", "Integrations", "Task creation from notes; tasks linked to note sections.", None),
    ("MS Teams - ToDo Integration", "Integrations", "Create/assign tasks in Teams; shared lists linked to channels; notifications in Teams.", None),
    ("Slack / Jira Deep Integration & Sync", "Integrations", "Trigger tasks from Git events; auto-generated build/deploy failure tasks.", None),
    ("WhatsApp Integration", "Integrations", "", None),
    ("Tight Integration with Cliq", "Integrations", "", None),
    ("WorkDrive File Management Integration", "Integrations", "Tie up documents with tasks.", None),
    ("Comment-based Entity Association", "Integrations", "Associate Streams, posts, note comments with tasks.", None),
    ("Browser Extension", "Platform", "", "TO"),
    ("Plugin", "Platform", "", "TO"),
    ("Compliance Readiness", "Platform", "Keep compliance ready (noted Dec 2025).", None),
]
for n, m, nt, src in ideas:
    links = [("Todoist - email to Todoist (AI)", "https://www.todoist.com/help/articles/email-to-todoist-powered-by-ai-march-13-mqcbjiN6q")] if n.startswith("Outlook") else None
    add(n, m, "Ideas / Backlog", "Idea", None, [MA], note=src or "ID", notes=nt, links=links)

db = {
    "version": 1,
    "base": {"name": "Zoho ToDo - Product Development Tracker", "seededAt": SEED_AT},
    "schema": SCHEMA,
    "people": PEOPLE,
    "nextId": len(records) + 1,
    "records": records,
}
out = os.path.join(os.path.dirname(__file__), "..", "data", "features.json")
with open(out, "w") as f:
    json.dump(db, f, indent=1, ensure_ascii=False)
print("records:", len(records))
