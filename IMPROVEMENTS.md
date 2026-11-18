# Improvements from the UI/UX audit

Prioritized recommendations from [UI_UX_AUDIT.md](UI_UX_AUDIT.md), with what was changed on `main` and what was deliberately left. Before and after screenshots were taken at 1440, 768 and 390 px during the audit and aren't kept in the repository.

## Done

| ID | Change | Files | Evidence |
|---|---|---|---|
| P0-1 | A Menu button appears below 820 px and slides the existing sidebar in over a dimmed backdrop. It closes on navigation, the backdrop or Escape, sets `aria-expanded`, and moves focus to the first link when opened | `web/index.html`, `web/app.css`, `web/app.js` | Scripted check: opens, focuses "Business impact", closes after navigating and on Escape |
| P0-2 | The top bar controls wrap; wide tables scroll inside their card; KPI rows, case figures and the prediction panel collapse to two columns or one; the workshop cards narrow their fixed columns | `web/app.css`, `web/app.js` (inline grids moved to `k4`/`k5` classes) | Horizontal overflow went from 27 to 170 px on all 17 routes at 390 px, to 0 on all 51 route and width combinations |
| P1-1 | The top bar stops sticking below 820 px and its padding tightens; the title shrinks slightly below 480 px so the Menu button shares its row | `web/app.css` | Mobile header 224 px and sticky before; 221 px and scrolls away after |
| P1-2 | The Investment Board budget input has dark text on white | `web/app.css` | Field looked empty before; shows 150000 after |
| P1-3 | The Gauntlet's fix checkboxes sit in a row next to their labels | `web/app.css` | Checked at 1440 px before and after |
| P1-4 | A `notice()` helper confirms what happened after Set, Defrost, food-safety decisions, alarm acknowledgement and playing a chaos card, and shows the server's reason when it refuses | `web/app.js` | Scripted: "Setpoint changed: ZF-101/F-10 now aims for -18 °C.", "Decision recorded: ZF-101/F-10: hold for testing.", "Not done: Minutes must be positive.", "Not done: The night is over; replay a night first." |
| P1-5 | The night selector is 20 px narrower and the control gaps tighter, so the top bar fits one row at 1440 px | `web/app.css` | Header 109 px before, 65 px after; clock back on the first row |
| P2-1 | Link-styled buttons lose the underline | `web/app.css` | Business impact and Workshop banners |
| P2-2 | The night label in the story bar stays on one line | `web/app.css` | "Night: silent-night" no longer breaks |
| P2-3 | Sidebar item and group spacing tightened by a few pixels | `web/app.css` | All 17 items and the footer are visible at 1440×900 |
| P2-4 | Case links in table cells don't wrap | `web/app.css` | Food safety and audit tables |
| P2-5 | Proper plurals in staff incident messages and the Gauntlet's gate details | `simulator.py`, `gauntlet.py` | "3 cases warm at ZF-121" |
| P2-6 | The overview's Cost of a Silent Night strip is white, with the figure still in red | `web/app.css` | Checked at 1440 px |
| P2-7 | Info tooltips also open on focus, so tapping an i shows it; the copy says "Hover over or tap" | `web/app.css`, `web/app.js` | Overview subtitle and tour step 1 |

## Not done, by choice

| ID | Priority | Recommendation | Why it was left | Complexity |
|---|---|---|---|---|
| P3-1 | P3 | Replace the navy gradient banners on the business and trainer pages | They separate the business and trainer pages from the operations screens. Changing them is a redesign, which the brief rules out | M |
| P3-2 | P3 | Larger touch area around the 17 px info icons | Low impact now that tips open on tap; would need care so table rows don't grow | XS |
| P3-3 | P3 | A story for `silent-night`, the flagship night | Content work: 8 to 10 captioned moments that need checking against the simulation | M |
| P3-4 | P3 | Replace product emoji with text or icons | They help scanning in long lists, and replacing them adds no clarity | XS |
| P3-5 | P3 | Shorter empty state on the board's evidence card before anything is funded | Dead space, but harmless | XS |
| P3-6 | P3 | Copy button or wrapping for the Gauntlet commands | The first command is clipped without a scroll cue on desktop | XS |
| P3-7 | P3 | Format the budget input as €150,000 | It's a number field and parses correctly; formatting while typing adds complexity | S |
| P3-8 | P3 | Keep live feed toasts from appearing under story captions | Existing behaviour unrelated to this audit; it shows only in story mode when events fire mid-frame | S |

## Validation

* `python -m unittest`: all tests pass.
* `node --check zava_cold_chain/web/app.js`: passes.
* 51 headless Chrome renders (17 routes at 1440, 768 and 390 px) before and after: horizontal overflow is 0 everywhere after, the sidebar is visible on desktop, and there are no JavaScript errors.
* Scripted interactions: the menu drawer; success and error notices for setpoint, defrost, decision and chaos card; a door-open story advancing two moments with spotlight and story bar.
* Not checked: real touch devices, Safari and Firefox, screen readers, the printed board pack, and story mode below 820 px.
