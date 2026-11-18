# Workshop Journey: UX review of the proposal

The review covers the proposal in this folder, before any code exists, so findings point at documents and sections instead of `file:line`. Two passes: the Vercel Web Interface Guidelines (fetched 18 November 2026 from `vercel-labs/web-interface-guidelines`, `command.md`), then four people reading the design. Every finding ends in a decision, and the decisions are already applied to the other documents unless marked open.

## Pass 1: Web Interface Guidelines

### Accessibility and focus

* WIREFRAMES 6, lineage graph: SVG boxes aren't focusable or named by default. Decision: each box is an `<a>` inside the SVG with an accessible name ("Business requirements, made in chapter 04, not found on this computer"), and the list view is the full equivalent.
* WIREFRAMES 2, section tabs: tabs need the ARIA tabs pattern with arrow keys. Already in TECHNICAL_DESIGN. Keep.
* DESIGN_SYSTEM, rail: the track colour was Frost at 1.4:1, below the 3:1 needed for a graphic that carries meaning. Fixed: track is Slate.
* Copy prompt feedback must reach screen readers. Already through the existing `aria-live="polite"` toast region. Keep.
* Sticky header and rail must not cover a focused element after a tab or anchor jump. Decision: `scroll-margin-top` on headings and the section region equal to header plus rail height.

### Forms and controls

* Role switch is a radio group: label and control must share one hit target. Decision: the whole segment is the label.
* Done when checkboxes: same rule, and Reset needs confirmation or undo. Already: undo toast for 10 seconds. Keep.

### Navigation and state

* "URL reflects state." The proposal put `?role=` in the URL and let it override the saved role. That creates a spoiler: a facilitator copies a link from Facilitator view, an attendee opens it and lands on the reference answer. Decision: the role describes the person, not the content, so it lives in `localStorage` only. Chapter, section, track and artifact selection stay in the URL. Applied to INFORMATION_ARCHITECTURE and TECHNICAL_DESIGN.
* Links are `<a>` elements everywhere, including rail stops and lineage boxes, so middle-click and Cmd-click work. Keep.

### Typography and copy

* The guidelines ask for Title Case on headings and buttons. This repo uses sentence case, and the humanizer and frontend-design rules applied in the UI/UX audit both ask for it. Decision: keep sentence case. This is the one guideline the design rejects on purpose.
* Curly quotes and `…` in UI text. Decision: UI strings use `’`, `“ ”` and `…`, as `app.js` already does in places. Markdown docs keep straight quotes.
* `tabular-nums` on times in the Day view. Already in DESIGN_SYSTEM. Keep.
* `text-wrap: balance` on headings. Already in DESIGN_SYSTEM. Keep.

### Content handling and locale

* Long paths (`.copilot-tracking/security-plans/zava-silent-night/security-plan.md`) will overflow at 390 px. Decision: paths use `overflow-wrap: anywhere` inside their monospace span.
* The "modified" time in artifact status must use `Intl.DateTimeFormat`, not a hand-built string. Applied to TECHNICAL_DESIGN.
* Agent names, slash commands and paths get `translate="no"` so browser translation doesn't mangle `rpi-research`.

### Touch and layout

* The artifact panel becomes a bottom sheet at 390 px: it needs `overscroll-behavior: contain`. Added.
* `touch-action: manipulation` on the rail and tabs. Added.

### Anti-patterns checked

No `transition: all`, no zoom blocking, no `outline: none`, no click handlers on `div`s, no images without dimensions (the page has no images), no autofocus. None found in the proposal; the build has to keep it that way.

## Pass 2: four readers

### An engineer who has never used HVE Core

* "Agent picker", "Session Target", "skill", "`/rpi-research`" and "`.copilot-tracking`" appear in chapter 04 with no explanation. Decision: chapter 02 Setup carries a short "Words used in this workshop" list, and the first use of each term on any chapter links to it. No glossary screen.
* "Stage", "step" and "chapter" all appear across the repo's docs. Decision: "chapter" means the workshop's 11; "stage" means HVE Core's nine; "step" is retired from the workshop docs and the issue map. Applied in the implementation plan's docs alignment.
* "In this repo" as a status is wrong for a file the engineer just created on their branch and hasn't committed: it's on the computer, not in the repo. Decision: statuses are "Ships with the repo" (kind repo), "Found on this computer" and "Not found on this computer" (kind create), "Outside the repo" (kind outside). Applied to INFORMATION_ARCHITECTURE and DESIGN_SYSTEM.

### An experienced FDE running a customer workshop

* They'll adapt times and drop a chapter for a shorter delivery. JSON content allows it, and the tests catch broken references. Keep.
* They'll want to print. Tabs hide four of five sections from a printout. Decision: a print stylesheet shows all sections, hides the rail and header, and prints paths in full.
* They'll project the page. Facilitator view on a projector shows the reference answer to the room. Decision: the Facilitator view's reference-run previews start collapsed too, with "Show the example" so it's a choice in front of the room.

### A facilitator preparing the three days

* The header had Day 1, Day 2, Day 3 links and the rail had the same days as group labels: two controls for one destination, which the brief warned against. Decision: the day labels on the rail are the links to the Day view; the header keeps only the title, Artifacts, Open the monitor and the role switch. Applied to INFORMATION_ARCHITECTURE and WIREFRAMES.
* Chapter 08 runs across Day 2 and Day 3. A rail grouped by day can't put it in one place. Decision: the rail draws a chapter as one segment per day it runs in, all linking to the same chapter. 08 appears at the end of Day 2 and the start of Day 3.
* There's no single list of everything to prepare. Decision: the Overview in Facilitator view shows "Before Day 1" collected from every chapter's `facilitator.before`, grouped by day.

### An attendee coming back to an exercise

* After lunch they want the chapter they were on. "Carry on with 04" on the Overview covers it, if it's the same browser. On another laptop, ticks and last place are gone. Decision: accepted and labelled. The rail's current chapter during a delivery comes from the clock, not from ticks: when the content has a `delivery_start` date and today is one of the three days, the rail marks the chapter scheduled now.
* On a phone the role switch was drawn as `[A][C][F]`. Single letters aren't understandable. Decision: below 600 px the role switch is a native select labelled "View as".

## Missing states, now specified

| State | What the page shows |
|---|---|
| Content file has a JSON error | "The workshop content didn't load: `workshop/chapters/04-discovery.json`, line 12. Run `python -m unittest tests.test_journey` for details." The rest of the page doesn't render |
| Status endpoint fails | Statuses show "Unknown" with a Retry button. Never "Not found", which would be a false statement |
| Reference file missing | "The reference run doesn't have this file" in place of Preview |
| Nothing ticked yet | Done when shows the list with no ticks. No empty-state message needed |
| Unknown chapter or artifact in the URL | "There's no chapter 12. The workshop has chapters 01 to 11." with a link to the Overview |
| Preview over 64 KB | The first 64 KB, then "Preview stops here. Open in VS Code to read the rest." |
| No JavaScript | A `<noscript>` line pointing to `docs/exercises.md` and `docs/facilitator.md` |

## Simplified or removed

* Day links in the header, removed (duplicate of the rail).
* Role in the URL, removed (spoiler risk).
* A separate Scenario screen and Facilitator resources screen, never added (IA).
* Lineage diagram on the chapter screen, never added. The aside lists Uses and Hands to as text.
* The status poll runs only while the tab is visible, using `document.visibilityState`.

## Open

* Whether the rail's time scale reads clearly to attendees or only to facilitators. Test it in the first dry run: ask two attendees what the widths mean, without explaining.
* Whether coaches will use the Coach view or the printed cards. See validation priority 3 in USER_JOURNEYS.
