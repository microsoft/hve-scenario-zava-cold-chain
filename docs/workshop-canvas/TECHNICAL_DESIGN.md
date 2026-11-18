# Workshop Journey: technical design

## Shape

```
Browser                                   Python server (existing, stdlib)
/journey ─► journey.html                  _static(): add "/journey" → journey.html
            tokens.css  (shared)          GET /api/journey           content, assembled
            journey.css                   GET /api/journey/status    artifact status from disk
            journey.js  ─── fetch ──────► GET /api/journey/preview   one artifact's text, read only
/        ─► index.html (monitor)          (all existing routes unchanged)
            tokens.css  (shared)
            app.css, app.js
```

New files: `zava_cold_chain/journey.py`, `zava_cold_chain/web/journey.html`, `journey.js`, `journey.css`, `tokens.css`, `workshop/**`, `tests/test_journey.py`.

Changed files: `server.py` (three routes and one static alias), `index.html` (one sidebar link and the tokens stylesheet), `app.css` (the `:root` block moves to `tokens.css`), `.gitignore` (stop ignoring review records), plus the docs alignment in the implementation plan.

No new dependencies. No POST routes. The page never writes to disk.

## Server: `zava_cold_chain/journey.py`

```python
ROOT = repo root
CONTENT = ROOT / "workshop"

def content() -> dict
    # Reads journey.json and chapters/*.json. Adds each artifact's read_by,
    # computed from every artifact's reads. Returns one document.

def status() -> dict
    # For each artifact: {"id", "exists", "matches": [repo-relative paths, max 5],
    #                     "modified": ISO time of newest match or None (shown with Intl.DateTimeFormat),
    #                     "reference_exists": bool}
    # repo:    Path(ROOT, path).exists()
    # create:  ROOT.glob(path), keeping only results inside ROOT
    # outside: {"exists": None}, always manual

def preview(artifact_id: str, which: str) -> dict
    # which is "yours" or "reference". The path comes from the content file,
    # never from the request. Resolves, checks it is inside ROOT (or inside
    # workshop/reference-run for "reference"), allows only .md .json .yml
    # .yaml .txt, reads at most 64 KB as UTF-8, and returns
    # {"path", "text", "truncated", "vscode": "vscode://file/<absolute path>"}.
```

Routes added to the existing `routes` table in `server.py`, behind the same Host check:

| Route | Returns | Notes |
|---|---|---|
| `GET /api/journey` | `journey.content()` | Read on each request so content edits show on reload |
| `GET /api/journey/status` | `journey.status()` | The page polls it every 10 seconds while visible |
| `GET /api/journey/preview?id=brd&which=reference` | `journey.preview(...)` | 404 for an unknown id, a missing file or a disallowed type |

Safety, because the server reads files:

* The request names an artifact id, never a path. A path can only come from `workshop/journey.json`, which is in the repo.
* Every resolved path must sit inside the repo root, checked with `Path.resolve()` the same way `_static()` already does.
* Globs run only for `create` artifacts and only return files inside the root.
* The size cap and file-type allowlist stop the preview from becoming a general file reader.
* The server still binds to 127.0.0.1 and checks the Host header, so nothing here is reachable from another machine.

The `vscode://file/` link exposes the absolute path to the browser on the same machine. That's acceptable for a local training app, and it's the only way to give "Open in VS Code" without an extension.

## Client: `journey.js`

Plain JavaScript in the style of `app.js`: small helpers, views keyed by route, `innerHTML` with `esc()` on every content string. About 600 to 700 lines.

Component tree:

```
Journey
├── Header            title, Day links, Artifacts, Open the monitor, RoleSwitch
├── Rail              chapters on a time scale; compact form below 820 px
└── View (one of)
    ├── Overview      outcome, start-here by role, chapter-to-HVE table
    ├── Day           TrackSwitch, DayRow × n, Prep (facilitator)
    ├── Chapter       ChapterHeader, SectionTabs, Section, Aside (Uses, Hands to), PrevNext
    │                 Section = Steps | Prompt | ToolLine | ArtifactRow | DoneWhen | Stuck
    └── Artifacts     KindFilter, LineageGraph (SVG) | LineageList, ArtifactPanel
```

### Routing

Hash routes, like the monitor, with a query part inside the hash:

| Hash | View |
|---|---|
| `#/` | Overview |
| `#/day/2`, `#/day/1?track=one-day` | Day |
| `#/ch/04`, `#/ch/04?s=done` | Chapter, with section |
| `#/artifacts`, `#/artifacts/brd` | Artifacts, with selection |

Every piece of state a person would want to share is in the URL. The role is the exception: it describes the person, not the content, so it is saved per browser and never put in a link (see UX_REVIEW).

### State

| State | Where | Lifetime |
|---|---|---|
| Content | Memory, from `/api/journey` | Page load |
| Artifact status | Memory, from `/api/journey/status` | Refreshed every 10 seconds while `document.visibilityState` is visible; shows Unknown with Retry if the call fails |
| Route, section, track, selection | URL hash | Shareable |
| Role | `localStorage["zj-role"]`, default attendee | Per browser |
| Ticks | `localStorage["zj-done:<chapter>:<index>"]` | Per browser |
| Last place | `localStorage["zj-last"]` | Per browser; Overview offers "Carry on with 04" |

Ticks key on the item's position, so editing an item's wording keeps the tick and reordering items resets them. The content file says so in a comment field.

### Rendering details

* The rail computes widths from `chapter.minutes` with a minimum width so short chapters stay tappable. Day gaps are fixed width.
* Section tabs follow the ARIA tabs pattern: arrow keys move, Home and End jump, the URL updates.
* The lineage graph is laid out from data: columns are producer chapters in order, and two neighbouring chapters share a column when together they make four artifacts or fewer (01 with 02, 03 with 04, 06 with 07, 09 with 10). That keeps the diagram to seven columns, which fits a 1440 px screen. Edges are cubic paths drawn under the boxes. No layout library. If the layout gets hard to read with real data, the fallback is the list view, which is always available.
* A print stylesheet in `journey.css` shows every section and hides the header and rail.
* Inline markup: a function turns `` `code` `` into `<code>` and `[label](target)` into `<a>` after escaping. Targets that start with `/#/` open the monitor; `http` targets open in a new tab with `rel="noopener"`; repo paths get Preview when they match an artifact.

## Shared tokens

`app.css` lines 4 to 16 hold the Fluent tokens in `:root`. They move to `zava_cold_chain/web/tokens.css`, linked first by both `index.html` and `journey.html`. The monitor's rendering doesn't change; the check is a before and after screenshot of the monitor at 1440 and 390 px. The journey adds its own variables (`--ice`, `--paper`, `--ink`, `--slate`, `--frost`) in `journey.css`.

## The reference run

Copy, don't merge. The files come from `hve-lifecycle/prototype-to-production` into `workshop/reference-run/`, keeping their relative paths, with `git checkout <branch> -- <path>` followed by a move, so their content is byte for byte what the run produced. The review record that `.gitignore` dropped comes from the working folder, where it still exists.

What comes across: the DT files and handoff, BRD and PRD plus their session state, security and RAI plans with backlog handoffs, the instructions file and its HVE Builder records, the orchestrator agent and stakeholder panel, the RPI research, plan, critique, changes and review, and the assessment with both Gauntlet files.

What doesn't: any code change. `alarms.py` and the tests stay as they are on `main`, so the planted flaw in ALM-07 is still there for tables to fix.

`workshop/reference-run/README.md` explains the run: the problem statement it started from, the slug `cold-chain-production-readiness`, that every stakeholder answer came from a simulated panel, that the FR-001 change it describes isn't applied on `main`, and that it reveals the answer.

## `.gitignore`

Add after the Visual Studio `[Ll]ogs/` rule:

```
# HVE Core RPI review records are workshop artifacts, not build logs
!.copilot-tracking/reviews/logs/
!workshop/reference-run/.copilot-tracking/reviews/logs/
```

The test suite checks this with `git check-ignore` when git is available, and skips the check when it isn't.

## The RPI Workflow Canvas

The journey doesn't read RPI session state and doesn't open host canvases. Chapter 08's attendee steps say: pick RPI Agent, and if your host shows canvases, use the RPI Workflow canvas beside the chat to follow the phases and answer decisions. The link goes to HVE Core's canvas docs. The journey's job ends where a live RPI session begins.

## Performance

Content is about 60 to 80 KB of JSON, loaded once. The status call globs about 20 patterns under `.copilot-tracking/`, `docs/` and `scorecards/`. That's milliseconds on a workshop laptop, and it only runs every 10 seconds while the tab is visible.

## Tests

| Test | Checks |
|---|---|
| `test_journey.py` content rules | The eight rules in the content model |
| Status | A temporary file at a `create` path turns `exists` true; a path outside the root never appears |
| Preview | Unknown id is 404; a disallowed suffix is 404; a reference preview returns text and `truncated` when over 64 KB |
| Server | `/journey` serves the page; `/api/journey` returns 11 chapters; an unknown Host still gets 400 |
| `.gitignore` | A review record path isn't ignored |
| Existing suites | Unchanged and passing, including hygiene |

Front-end behaviour is checked in the visual validation pass with headless Chrome, the same way the UI/UX audit was done, not with a JavaScript test framework the repo doesn't have.
