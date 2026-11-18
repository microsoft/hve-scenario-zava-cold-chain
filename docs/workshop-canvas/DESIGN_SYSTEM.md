# Workshop Journey: design system

> [!NOTE]
> The page was redesigned after the first build. [REDESIGN.md](REDESIGN.md) records the current layout, navigation and tokens. This document is the first version's design and is kept for its reasoning.

The journey page is related to the monitor without copying it. It shares the monitor's brand blue, focus style and Fluent status colours, so moving between the two feels like one product. It uses its own type and layout because its job is different: the monitor is read at a glance during a night; the journey is read with care during a session.

The direction is a field guide for the cold chain: a book a team carries through three days, with one honest timeline down its spine.

## First plan, and what changed after review

The first plan, written before review:

* Serif headings throughout, hairline rules between every section, uppercase day labels on the rail, a meta line under each chapter title joined with middle dots, chapter content in white cards with the monitor's shadow.

Checked against the generic patterns the frontend-design skill lists, three parts were defaults rather than choices:

| First plan | Why it was a default | Revised |
|---|---|---|
| Serif headings and hairline rules everywhere | Reads as the broadsheet template, whatever the subject | Serif only for the screen title. Rules only where they carry time: the rail and the Day view |
| Uppercase tracked labels for days and sections | Template chrome on every heading | Sentence case. Day names carry the day's theme instead |
| "Stage 3 · Day 2 · 3 h 15" meta strings | Middle-dot meta string | A short labelled list: HVE Core stage, day, time in the room |
| Chapter sections in shadowed white cards | The SaaS card kit | One paper surface per screen. Sections are separated by space and a heading, not boxes |

## The one bold element: a rail drawn to time

The rail is where the design spends its boldness. Each chapter's width on the rail is proportional to its time in the room, across the three days. Design Thinking is visibly long and Setup is visibly short, so the rail tells a facilitator something true at a glance, and attendees see where the time goes before they read a word.

Everything else stays quiet: no gradients, no decorative icons, no shadows except on the artifact panel when it floats over the lineage on small screens.

## Colour

| Name | Hex | Use | Contrast |
|---|---|---|---|
| Ice | `#F6F9FB` | Page background. Cool, so it doesn't drift toward cream | |
| Paper | `#FFFFFF` | The one reading surface per screen | |
| Ink | `#1B2733` | Text, rail stops | 15.2:1 on Paper, 14.3:1 on Ice |
| Slate | `#55616D` | Secondary text, times, paths, the rail track | 6.3:1 on Paper, 6.0:1 on Ice |
| Chain blue | `#0F6CBD` | Links, current chapter, focus ring partner. Same as the monitor's `--brand` | 5.4:1 on Paper, 5.1:1 on Ice |
| Frost | `#D5DEE6` | Table rules and dividers only. At 1.4:1 it is too faint for anything that carries meaning | Decorative |

Status colours appear only on artifact kinds, where they mean something:

| Kind | Text on fill | Source |
|---|---|---|
| Ships with the repo, or found on this computer | `#026467` on `#F0FAFA`, 6.5:1 | Monitor `--teal` and `--teal-bg` |
| Reference run (facilitator material) | `#835B00` on `#FCEFD3`, 5.3:1 | Monitor `--defrost-ink` and `--defrost` |
| You create | Ink on Paper, 1 px Slate outline | |
| Outside the repo | Slate on Paper, 1 px dashed Slate outline | |

Each kind also has a word, never colour alone.

## Type

All fonts are already on the machine. The repo works offline and loads nothing from the internet.

| Role | Stack | Size and line height |
|---|---|---|
| Screen title (h1 only) | `Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif` | 34/1.15, weight 600 on Windows Sitka, 700 on Charter |
| Headings h2, h3 | `"Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, sans-serif` | 21/1.3 and 17/1.35, weight 600 |
| Body | `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif` | 15.5/1.6 |
| Small text | Body stack | 13.5/1.45, Slate |
| Prompts, paths, commands | `"Cascadia Mono", "SF Mono", Menlo, Consolas, monospace` | 13.5/1.55 |

The scale steps by about 1.25. Body text measures 60 to 72 characters. Headings use `text-wrap: balance`. Numbers in the Day view use `font-variant-numeric: tabular-nums`. Monospace appears only for text a person types or a file path, never for decorative labels.

## Layout

* Content is left aligned. Nothing is centred except the empty state.
* Header: 56 px, Ice, no border. Rail: 64 px, directly below.
* Chapter screen at 1440 px: a 72-character reading column on Paper, and a 280 px aside for Uses and Hands to. At 768 px the aside moves under the sections. At 390 px everything is one column.
* Spacing steps of 4: 4, 8, 12, 16, 24, 32, 48. Sections are 32 apart, items within a section 12.
* Radius: 8 px on interactive surfaces and the artifact panel, 4 px on status labels, 0 on the Paper surface's top edge where it meets the rail.

## Components

| Component | What it is | Notes |
|---|---|---|
| Header | Title, Artifacts, Open the monitor, role switch | Links, not buttons. The days are reached from the rail |
| Role switch | Three radio buttons styled as a segmented control; a native select labelled "View as" below 600 px | `fieldset` with a legend "View as", arrow keys move between options. Saved per browser, never in the URL |
| Rail | Ordered list of chapter links on a line, widths set from minutes | Current: filled Chain blue stop with the chapter name below. Ticked: Ink tick. Day boundaries: a gap and the day name, which links to the Day view. A chapter that runs on two days, like 08, is drawn once in each. Return loops: small arcs under the line, explained in a hover and focus tooltip |
| Chapter header | Number, title, a short list: HVE Core stage, day and time | The number is the only numeral display on the page |
| Section tabs | ARIA tablist with five tabs, plus Show all sections | Underline indicator, no pills |
| Prompt block | Monospace text with Copy | Copy confirms in place and through the existing toast live region |
| Tool line | Agent or skill name, how to open it (picker or `/command`), one line on what it's for | Plain text, no chips |
| Artifact row | Name, kind label, status, path, Preview | Status reads "Ships with the repo", "Found on this computer", "Not found on this computer", "Reference run" or "Outside the repo". Paths wrap with `overflow-wrap: anywhere` and carry `translate="no"` |
| Done when | Checkbox list | Label and box share one hit target. Footnote: saved in this browser only |
| Hands to | Next chapter and the artifacts it reads from this one | Doubles as the next link |
| Day row | Time, duration, chapter, what happens | Breaks and checkpoints are rows with their own style |
| Lineage graph | SVG, artifacts as labelled boxes in chapter columns, edges for "reads" | Keyboard: Tab moves through artifacts in chapter order; the list view is the accessible equivalent |
| Artifact panel | Owner chapter, kind, status, reads, read by, preview | Docked right at 1440, a bottom sheet at 390 |

## Motion

* No motion that the person didn't start.
* Rail tick fill and lineage highlight fade: 150 ms, opacity and transform only.
* `prefers-reduced-motion: reduce` turns both off.

## Writing

The journey follows the same rules applied to the monitor's copy: sentence case, plain verbs, no em dashes, no "not X but Y" framing, real plurals. A button says what happens: Copy prompt, Open in VS Code, Show all sections. A status says what's true: "Not found on this computer", never "Pending" or "In progress", because the page can't know that.

## Accessibility floor

* WCAG 2.2 AA contrast for all text, as the table above shows.
* Visible focus everywhere, using the monitor's `:focus-visible` ring.
* Targets at least 24 by 24 px, and 44 px high on the rail below 820 px.
* Every rail stop and artifact has a text name. The lineage graph has a list equivalent.
* Headings in order on every screen; skip link to content; the toast region stays `aria-live="polite"`.
* No horizontal page scroll at 390 px. The rail scrolls inside itself, with the current chapter scrolled into view.
* `scroll-margin-top` on headings and the section region, so the sticky header and rail never cover the focused element.
* `touch-action: manipulation` on the rail and tabs; `overscroll-behavior: contain` on the bottom sheet.

## Print

A print stylesheet hides the header, rail and role switch, shows all five sections of a chapter in order, prints paths in full and prints link targets for repo files. A facilitator can print a chapter or a day as a handout.
