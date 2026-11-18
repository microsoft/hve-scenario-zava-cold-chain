# UI/UX audit: Zava Cold Chain Monitor

Audited on 18 November 2026 against the `main` branch (commit 2f73bd4 plus the uncommitted copy pass from the same day), running locally with `python -m zava_cold_chain serve` on the `silent-night` night, paused at 08:00.

## How this was inspected

* Every route was rendered in headless Google Chrome at exactly 1440×900, 768×1024 and 390×844, with `reducedMotion: reduce` and the first-visit tour dismissed. That gives 51 screenshots (kept out of the repository) plus layout metrics: horizontal overflow, sidebar visibility, page height and which elements stick out past the viewport.
* A scripted check counted every visible control without an accessible name, controls smaller than 24×24 px, and the height of the sticky top bar.
* Code was read for anything the screenshots couldn't show: action feedback, error handling and CSS breakpoints.
* User-facing copy was reviewed with the humanizer skill. A first copy pass ran earlier the same day; this audit lists only what is left.
* Not verified: real touch devices, Safari and Firefox, screen readers, the printed board pack, and story mode below 820px. The VS Code browser panel couldn't hold a fixed viewport, so all width-specific findings come from headless Chrome.

## What the application is

A training scenario for the Hypervelocity Engineering workshop. Zava, a fictitious grocer, monitors refrigerated display cases in five pilot stores. One simulated night plays on an accelerated clock, and the dashboard shows what an operations team, a food-safety officer and an executive board would see. The audience is mixed: engineers working through the HVE steps, trainers running the room, and executives at the Investment Board. It's projected on a big screen far more often than it's used on a phone.

* Stack: Python 3.9 standard library server (`zava_cold_chain/server.py`), one-page vanilla JavaScript app (`zava_cold_chain/web/app.js`, about 1,050 lines), one stylesheet (`app.css`) and no build step or libraries.
* Design system: Microsoft Fluent 2 colour tokens declared in `:root`, Segoe UI with system fallbacks, a navy sidebar, white cards with 12 px radius, and status colours (blue freezer, green chiller, orange warning, red over limit) that always come with a word or symbol.
* Routes: 17. Business (Business impact, Night Gauntlet, Investment Board), Operations (Chain overview, Live feed, Store, Case, Alarms and incidents), Food safety (Food safety, Ask the assistant), Systems (Commands and audit, Known issues, System health), Help (How to read the monitor) and Trainers (Tour and stories, Workshop issue map, Chaos cards). Story mode and the issue spotlight are overlays on the same routes.
* Main journeys: watch a night unfold; drill from a red store tile to a case and record a food-safety decision; ask the assistant about a case; replay a night as a story; score a fix in the Gauntlet; fund fixes at the Investment Board.

## A. Overall assessment

| Area | Score | Why |
|---|---|---|
| Visual polish | 3 / 5 | The operations screens look like a real console: dense, purposeful, with colour tied to state. Polish breaks in specific places: an invisible budget value, a broken checkbox layout, a two-row header at 1440 px and underlined button links |
| Design consistency | 3 / 5 | One token set and one card language throughout. The business and trainer pages, added later, open with a dark gradient banner while operations pages open with a plain heading. That's a defensible split between modes, but five such banners make those pages feel more template-like |
| Typography | 4 / 5 | Clear scale, tabular numbers on figures, monospace only for times and IDs, and uppercase section labels used consistently. Case IDs break mid-word in narrow table cells |
| Layout and spacing | 3 / 5 | The desktop grids are well proportioned. The top bar wraps at 1440 px and leaves the clock alone on a second row. The overview stacks three banners of different colours before the store cards |
| Usability | 3 / 5 | Primary journeys are short and well labelled. Controls on the case page give no feedback, and silently do nothing when the server rejects a value. The Gauntlet form is hard to use because of the checkbox layout |
| Responsive behaviour | 1 / 5 | Below 820 px the sidebar is hidden with nothing to replace it, so there is no navigation at all. Every page scrolls sideways at 390 px. On mobile the sticky header is 224 px tall, 27% of the screen |
| Content quality | 4 / 5 | Plain, specific and in a consistent voice, after the earlier pass. What remains: "(s)" plurals in feed messages, and a "Hover i" instruction that doesn't work on touch screens |
| Accessibility | 3 / 5 | Every visible control has an accessible name, there is a skip link, colour is never the only signal, and reduced motion is respected. Against that: tooltips appear only on hover or keyboard focus, info icons are 17 px targets, and there is no navigation on small screens |
| Customer-demo readiness | 3 / 5 desktop, 1 / 5 mobile | On a projector at 1440 px it is convincing apart from the bugs on the board and Gauntlet. On a phone or tablet it is not usable |

### Answers to the product questions

1. **Purpose.** Clear within seconds on desktop: the product name, the live clock, red store tiles and "Cost of a Silent Night €260,411" tell the story.
2. **Credibility.** Yes on the operations screens. The case page in particular reads like a real tool. The two visible bugs on the Investment Board and the Gauntlet would undermine credibility in an executive demo, because those are the screens executives look at.
3. **New users.** Supported well: a guide page, a 26-step tour, info tips on every number and the story mode.
4. **Visual hierarchy.** Strong inside each card. Weaker at page level on the overview, where three banners compete before the stores.
5. **Workflows.** Short. Drill-down from overview to store to case to decision takes three clicks.
6. **Purposeful components.** Almost everything earns its place. Weakest are the empty "What the evidence says" card on the board before anything is funded, and the doubled prediction panel, which is intentional (a Responsible AI talking point).
7. **Consistency.** Good within the operations screens. Business and trainer pages use heavier banners.
8. **Coherent product.** Mostly. The sidebar groups (Business, Operations, Food safety, Systems, Help, Trainers) make the two audiences legible.
9. **Convincing in a demo.** On desktop, once the P1 bugs are fixed.
10. **The three biggest prototype tells:** (1) no navigation and sideways scrolling on any screen under 820 px; (2) visibly broken controls on the two executive screens, the empty budget box and the stacked checkboxes; (3) the two-row top bar with an orphaned clock, which makes every screen look unfinished.

### Is it AI slop?

Less than the brief feared. The operations screens avoid the usual tells: no glassmorphism, no decorative gradients behind content, no stock hero imagery, no "unlock insights" copy, and colour is tied to state rather than decoration. The tells that do exist cluster in the later business and trainer pages:

* Dark navy gradient banners on six pages, each holding a heading, a paragraph and a pair of white buttons. That's the generic SaaS hero pattern.
* KPI cards with a coloured top strip and an "i" on every card. This is a common template, but here each number is real and explained, so it stays.
* Sparkle glyphs (✦) and a purple frame on the prediction panel. These look like AI decoration, but they're deliberate: the scenario wants the AI-made number to look different from the measured ones. Keep them.
* Food emoji next to product names. They look generic but help scanning in long product lists.

## B. Page-by-page review

### Top bar and sidebar (every page)

* Works: the live/paused/ended badge, the large monospace clock, and the remote-session warning that appears only when relevant. The sidebar's groups match the two audiences, and the badges count things that need attention.
* Looks generic: nothing significant.
* Unfinished: at 1440 px the top bar needs 1,217 px but has 1,192, so the clock wraps to a second row and the header grows to 109 px. The night label breaks as "silent-/night". At 900 px height the sidebar hides its last item, Chaos cards, below the fold. Below 820 px the sidebar disappears and nothing replaces it. At 390 px the speed controls don't wrap, so every page scrolls sideways by 27 px and the sticky header is 224 px tall.
* Change: fit the top bar on one row at 1440 px; add a menu button and a slide-in sidebar below 820 px; let the controls wrap and stop the header sticking on small screens; keep the night label on one line; tighten sidebar spacing slightly.
* Keep: the layout, colours, groups and badges.

### Chain overview

* Works: the store tiles. Each case is a coloured block with its temperature, and the red/blue/green state is readable from across a room. Products at risk, ranked by value with a bar, and the compact latest-events list also work well.
* Looks generic: three stacked banners before the stores. They are the pink-tinted Cost of a Silent Night strip, six KPI cards with coloured strips, and the purple prediction panel. Each is justified on its own, but together they push the stores below the fold at 1440×900 and use four accent colours.
* Unfinished: on mobile the KPI grid stays at 3 columns, so "€14,932" is cut to "€14,9", and the prediction panel squeezes into three slivers. The subtitle says "Hover i", which doesn't work on touch.
* Change: make the cost strip neutral (white, with the figure in red) so the KPI row and the prediction panel aren't competing with a third coloured band. Use 2 KPI columns and a single-column prediction panel on small screens. Say "hover or tap".
* Keep: the store cards, the tile design, the products-at-risk list and the prediction panel's deliberately different styling.

### Business impact

* Works: the €260,411 figure with its chain-wide projection, the six-part cost breakdown with plain explanations, and the newspaper headline, which is the most memorable element in the app. The assumptions panel lets an executive change a number and see the effect immediately.
* Looks generic: the navy banner with two white buttons.
* Unfinished: the "Night Gauntlet" and "Investment Board" buttons are underlined, because link-buttons inherit link styling. On mobile the five-column KPI row is fixed by an inline style and the case table overflows by 170 px.
* Change: remove the underline from all link-buttons; let the KPI row collapse on small screens; make wide tables scroll inside their card.
* Keep: everything else. This page is ready for a demo.

### Night Gauntlet

* Works: the plain-language intro and the two copyable commands.
* Unfinished: the "Fixes this code claims" box is broken. Each checkbox sits above its label in a tall column, because `.runf label { display: grid }` also matches the checkbox labels. The first command is clipped inside its box with no visible scroll cue.
* Change: scope the grid style to the form's own field labels so the fix checkboxes sit in a row.
* Keep: the leaderboard design, the empty state and the run form fields.

### Investment Board

* Works: the budget bar, the five failure chips that turn green when covered, the fix cards with build and run costs plus a warning about side effects, and the final assistant decision with its reveal.
* Unfinished: the budget field looks empty. The value €150,000 is there, but in white text on a white field, because the input inherits the banner's text colour. This is the first thing an executive sees on the page.
* Change: give the budget input dark text.
* Keep: the layout and the cards.

### Live feed

* Works: the filters by type and store, the "warnings and alerts only" toggle, and the colour-coded type chips with tooltips.
* Unfinished: messages say "3 case(s) warm at ZF-121". The same "(s)" comes from the simulator into incidents and the overview.
* Change: use proper plurals.
* Keep: the rest.

### Store

* Works: the per-case cards with sparklines and the night cover panel. No issues found.
* Keep: as is.

### Case detail

* Works: the strongest screen. The temperature chart with defrost and door bands, the four headline figures, the decision buttons, the assistant, notes, alarms and commands are all on one page.
* Unfinished: the Set and Defrost buttons give no confirmation, and an invalid setpoint is rejected by the server with no message. On mobile the four figure tiles overflow by 94 px.
* Change: show a short confirmation or error after each control action; use two figure columns on small screens.
* Keep: the layout and chart.

### Alarms and incidents

* Works: the alarm life cycle as a timeline. The empty state is specific: "No active alarms. But 5 incidents were found by staff with no alarm."
* Keep: as is.

### Food safety

* Works: one row per case, with time above limit, the assistant's answer in quotes, and discard and hold buttons in the row.
* Unfinished: case IDs break mid-word ("ZF-/104/F-11") because the products column squeezes the first column. On mobile the table overflows by 152 px.
* Change: keep case IDs on one line; let the table scroll inside its card on small screens.
* Keep: the row design.

### Ask the assistant, Commands and audit, Known issues, System health, How to read the monitor

* Work as intended. The audit table's "unknown" sender and "no end time" are highlighted without extra decoration. The guide is long but well structured.
* Unfinished: on mobile the audit table overflows by 111 px, which is the same scroll fix as above.
* Keep: as is.

### Tour and stories, Workshop issue map, Chaos cards

* Work: the issue map is excellent trainer tooling, with numbered problems, the evidence, which HVE step tackles each, and "Circle it on screen". The story cards show their moments on a timeline.
* Looks generic: the navy banner again.
* Unfinished: "Replay a night as a story" is underlined (the link-button bug). The flagship `silent-night` night has no story; stories cover `mass-defrost` instead. Chaos cards give no on-screen confirmation beyond the "Played tonight" list below the fold.
* Change: fix the underline; confirm a played card with a short notice.
* Keep: the content and structure.

## C. Prioritized improvements

Complexity: XS is under 10 lines, S under 40 lines, M under 100 lines.

| ID | Priority | Page or component | File | Problem | Recommended change | Expected improvement | Complexity |
|---|---|---|---|---|---|---|---|
| P0-1 | P0 | Navigation below 820 px | `web/index.html`, `web/app.css`, `web/app.js` | Sidebar hidden with no replacement; tablet and mobile users can't reach any other screen | Add a Menu button to the top bar below 820 px that slides the existing sidebar in; close on navigation, Escape or the backdrop | The app becomes navigable on tablets and phones | S |
| P0-2 | P0 | Every page at 390 px | `web/app.css` | Horizontal scroll on all 17 routes (27 to 170 px) | Wrap the top bar controls; make wide tables scroll inside their card; collapse fixed multi-column grids (KPIs, case figures, business KPIs, prediction panel) | No sideways scrolling | S |
| P1-1 | P1 | Top bar on small screens | `web/app.css` | Sticky header is 224 px tall at 390 px, covering 27% of the screen | Stop it sticking below 820 px and tighten its spacing | Content gets the screen | XS |
| P1-2 | P1 | Investment Board budget | `web/app.css` | Budget value invisible (white on white) | Dark text and a white field for that input | Executives can see and edit the budget | XS |
| P1-3 | P1 | Night Gauntlet fix checkboxes | `web/app.css` | Each checkbox sits above its label in a tall column | Scope the grid label rule to the form's own fields | The form reads as a form | XS |
| P1-4 | P1 | Case controls, decisions, alarm acknowledge, chaos cards | `web/app.js` | No confirmation after actions; server errors are swallowed | One small notice helper: show what was done, or the server's error | Users know their action worked, or why it didn't | S |
| P1-5 | P1 | Top bar at 1440 px | `web/app.css` | Wraps to two rows by 25 px, orphaning the clock and doubling the header to 109 px | Trim the night selector width and control gaps | One-row header on standard laptops | XS |
| P2-1 | P2 | Link-styled buttons | `web/app.css` | `a.btn` keeps the link underline | `text-decoration: none` on `.btn` | Buttons look like buttons | XS |
| P2-2 | P2 | Night label in the story bar | `web/app.css` | "Night: silent-night" breaks onto three lines | Keep the label on one line | Tidy story bar | XS |
| P2-3 | P2 | Sidebar at 900 px height | `web/app.css` | Last item (Chaos cards) hidden below the fold | Slightly tighter item and group spacing | Whole menu visible on a 900 px screen | XS |
| P2-4 | P2 | Food safety and audit tables | `web/app.css` | Case IDs break mid-ID | Keep links in the first column on one line | IDs stay readable | XS |
| P2-5 | P2 | Feed, incidents and Gauntlet gates | `simulator.py`, `gauntlet.py` | "3 case(s)", "alarm(s)" | Proper singular and plural | Reads like a person wrote it | XS |
| P2-6 | P2 | Overview cost strip | `web/app.css` | Pink gradient strip adds a fourth accent above KPIs and the purple panel | Neutral white strip with the figure in red | Calmer page, stores sooner | XS |
| P2-7 | P2 | Info tooltips and "Hover i" | `web/app.css`, `web/app.js` | Tooltips need hover or keyboard focus; text says "Hover" | Show tips on focus too (a tap focuses them) and say "hover or tap" | Tips work on touch screens | XS |
| P3-1 | P3 | Navy banners on six pages | `web/app.css` | Generic SaaS banner pattern | Leave: it separates the business and trainer pages from operations, and changing it is a redesign | None now | M |
| P3-2 | P3 | Info icon size | `web/app.css` | 17 px touch targets | Enlarge the tappable area without enlarging the icon | Easier tapping | XS |
| P3-3 | P3 | Stories | `web/app.js` | No story for the flagship `silent-night` | Write an 8 to 10 step story | Trainers can demo the main night in story mode | M |
| P3-4 | P3 | Product emoji | `web/app.js` | Slightly generic decoration | Leave: they help scanning | None | XS |
| P3-5 | P3 | Investment Board evidence card | `web/app.js` | Large empty card before funding | Shorter empty state | Less dead space | XS |
| P3-6 | P3 | Night Gauntlet command box | `web/app.css` | First command clipped without a visible scroll cue | Wrap at spaces, or add a copy button | Full command readable | XS |

Out of scope on purpose: no new libraries, no framework, no redesign of the colour system or card language, and no changes to the simulation, scoring or the deliberately planted scenario problems.

## D. After the fixes

Scores after applying P0, P1 and the low-risk P2 items listed in [IMPROVEMENTS.md](IMPROVEMENTS.md):

| Area | Before | After | What moved it |
|---|---|---|---|
| Visual polish | 3 | 4 | Budget value visible, checkbox row fixed, one-row header, no underlined buttons |
| Design consistency | 3 | 3 | Unchanged on purpose: the banner pattern on business and trainer pages stays |
| Typography | 4 | 4 | IDs no longer break mid-word |
| Layout and spacing | 3 | 4 | Calmer overview, whole sidebar visible at 900 px height |
| Usability | 3 | 4 | Every action confirms or explains a refusal |
| Responsive behaviour | 1 | 3 | Navigation and no sideways scrolling at 768 and 390 px. Still dense on phones: the header takes 221 px before it scrolls away, and wide tables scroll sideways inside their cards |
| Content quality | 4 | 4 | Plurals fixed, touch-friendly wording |
| Accessibility | 3 | 4 | Navigation on small screens, tips on tap or focus, `aria-expanded` on the menu, focus moved into the drawer |
| Customer-demo readiness | 3 desktop, 1 mobile | 4 desktop, 3 mobile | The executive screens no longer show bugs; tablets and phones work |

Remaining biggest prototype tells: the repeated navy banners on six pages, no story for the flagship `silent-night`, and phone layouts that work but stay dense, which suits a dashboard meant mainly for a projector.
