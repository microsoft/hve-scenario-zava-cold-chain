# Workshop Journey: implementation plan

Nothing in this plan starts until the design in this folder is approved. Work happens on local `main` in small commits; nothing is pushed by the build.

## MVP

The first version ships everything a facilitator needs to run three days and an attendee needs to do each chapter:

* `/journey` with Overview, Day view (three-day and one-day tracks), Chapter workbench with the three roles, and Artifacts with the lineage diagram and list view.
* All 11 chapters' content, including coach prompts, common mistakes and recovery steps, which no document has today.
* On-disk artifact status and read-only previews.
* The reference run under `workshop/reference-run/`.
* Docs, issue map and README moved to the chapter model.

## Deferred, with the reason

| Deferred | Why not now |
|---|---|
| Showing status for every table in the room | Needs a shared folder or pushed branches and a server that reads them. Decide after the first delivery shows how tables share work |
| Reading live RPI sessions | That's the RPI Workflow Canvas's job |
| Content editing in the browser | JSON in the repo is enough for maintainers, and editing would need POST routes and write access |
| A host canvas version for VS Code or the Copilot app | Canvases are a preview feature in HVE Core's docs. Revisit once the page has been used in a delivery |
| Localisation | Content is English only, like the rest of the repo |
| Decomposition and sprint-planning reference artifacts | The reference run didn't produce them. Running functional-planner and backlog-manager on the reference PRD is a separate task |

## Milestones

### M1. Foundations

* Move `:root` tokens from `app.css` to `tokens.css`; link it from `index.html`.
* Add the `.gitignore` exception for review records.
* Bring the reference run into `workshop/reference-run/` with its README.

Done when: the monitor looks identical at 1440 and 390 px before and after (screenshots compared); `git check-ignore` no longer ignores `.copilot-tracking/reviews/logs/x.md`; every reference-run file matches the branch byte for byte; `alarms.py` and the tests are unchanged; all existing tests pass.

### M2. Content

* `workshop/journey.json`: outcome, days, both tracks, 20 artifacts.
* 11 chapter files. Facilitator text comes from `docs/facilitator.md`; attendee steps from `docs/exercises.md` and the HVE Core docs; coach prompts, mistakes and recovery are new and drawn from the character cards and the reference run's assessment.
* Every prompt sets the slug `zava-silent-night` and names the output path.
* Humanizer pass on all content text.

Done when: `tests/test_journey.py` content rules pass; every agent and skill name appears in the installed hve-core plugin; no em dashes or HTML in content.

### M3. Server

* `zava_cold_chain/journey.py` with `content()`, `status()`, `preview()`.
* Three routes and the `/journey` static alias in `server.py`.

Done when: status, preview and server tests in `test_journey.py` pass, including the path-outside-root, unknown-id and disallowed-suffix cases; existing server tests still pass.

### M4. Page shell

* `journey.html`, `journey.css`, `journey.js`: header, role switch, rail (time-scaled, split chapter 08, compact below 820 px), router, Overview, error and empty states, print stylesheet.

Done when: the Overview renders at 1440, 768 and 390 px without horizontal page scroll; the rail is keyboard reachable and announces chapter names; the role survives a reload and never appears in the URL.

### M5. Chapter workbench and Day view

* Chapter header, section tabs with the ARIA pattern, Show all sections, prompt blocks with copy, artifact rows with live status, Done when with ticks and undo, aside, previous and next.
* Day view with both tracks and facilitator prep.

Done when: each chapter opens on the right first section for each role; a file created at a chapter's path turns to "Found on this computer" within 10 seconds; ticks persist and reset with undo; a printed chapter shows all sections.

### M6. Artifacts

* Lineage SVG from data, kind filter, list view, artifact panel with preview and Open in VS Code.

Done when: selecting BRD highlights the DT handoff and scenario as inputs and PRD, security, RAI and work items as readers; every box is reachable by Tab with a full accessible name; the list view shows the same facts; the panel is a bottom sheet at 390 px.

### M7. Alignment and validation

* `docs/exercises.md`: the steps table becomes the chapter table; the day plan points to the Day view and keeps the one-day track. "Step" is replaced by "chapter".
* `docs/facilitator.md`: run sheet marked as the one-day track, three-day timings point to the Day view; character cards and case file stay where they are.
* `app.js` issue map: "Tackle with" chips use chapter names, for example "08 Implementation".
* `index.html`: Workshop Journey link in the For trainers group.
* README: a Workshop Journey section and `/journey` in the routes table.
* Visual validation with headless Chrome at 1440, 768 and 390 px: Overview, a Day, chapters 03, 04 and 08 in all three roles, Artifacts with a selection, and the monitor before and after. Keyboard walk through every screen. Reduced motion on.

Done when: all tests pass; the screenshots show no overflow or overlap; the keyboard walk reaches every control with a visible focus; the four readers' findings in UX_REVIEW are checked off on the built page.

## Acceptance criteria for the feature

1. A person can reach any chapter's task in two clicks from `/journey`.
2. Every chapter names its HVE Core stage, or says it's workshop framing or Design Thinking.
3. Every artifact path shown either exists or says "Not found on this computer". No status is ever invented.
4. The reference run is visible in Facilitator view and collapsed behind a deliberate action in every view.
5. Switching role never changes the URL, and a shared link opens in the recipient's role.
6. The monitor's behaviour and look are unchanged apart from one sidebar link and renamed chips.
7. The planted flaws on `main` are still there: `alarms.py`, `commands.py`, `assistant.py` and `server.py` behaviour is unchanged apart from the new routes.
8. No new dependencies; works offline; Python 3.9 to 3.14.

## Risks

| Risk | Mitigation |
|---|---|
| Content volume: 11 chapters × 3 roles is a lot of text to write well | Strict fields, short entries, humanizer pass; the tests stop broken references, a read-through stops bad prose |
| HVE Core renames an agent | One string per chapter file and the `hve_core_checked` date on the Overview |
| The time-scaled rail confuses attendees | Open question in UX_REVIEW. Fallback is equal widths, a one-line CSS change |
| Lineage layout gets tangled with 20 artifacts | List view always available; layout rules fixed to chapter columns |
| Tables produce files with the wrong slug | Every prompt names the full output path |
