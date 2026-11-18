# Workshop Journey redesign

The first version worked but read as a document with navigation bolted on. This note records what was wrong with the rendered page, three directions considered, and the one built.

## What the rendered page got wrong

Screenshots of every screen at 1440, 768 and 390 px, taken before the redesign.

| Problem | Where it showed |
|---|---|
| Three layers of chrome (header, rail, bordered card) before any content | Every screen. At 768 px the rail cut chapter names mid-word |
| About 15 underlined blue links on one chapter page, so nothing stood out | Chapter pages, especially the aside |
| The same facts twice: "Hands to" repeated the Next link, "Uses" repeated "You need" | Chapter aside |
| The task hid behind tabs whose names changed with the role, plus a "Show all sections" link competing with them | Chapter pages |
| Every subsection set at the same weight, so a facilitator's timetable looked like a footnote | Chapter pages |
| A grey prompt box with its copy button floating underneath | Chapter pages |
| Four identical primary buttons on the Overview, then an 11-row table that repeated the rail | Overview |
| A white card on a tinted page, the default SaaS container | Every screen |

## Three directions

### A. Field notebook

A quiet left navigator holds the whole journey as one vertical line, with each chapter placed on it by its time in the room. The page is one reading column with a margin, like an annotated notebook: the task runs down the middle, and the artifact, the story so far and what the chapter uses sit in the margin beside it. No tabs: a chapter reads top to bottom, and the long or role-specific parts fold away.

* Type: a serif for titles and the big chapter numerals, the system sans for everything else, mono for prompts and paths.
* Colour: white page, cool grey navigator, one blue accent.
* Strengths: one navigation system; the journey is always visible with labels that never truncate; the chapter reads in order: why, do, produce, done, next.
* Weaknesses: the navigator takes 280 px on a laptop; on phones it becomes a drawer, so the journey is one tap away instead of always visible.
* Fit: engineers read it like a lab notebook; facilitators see the whole three days in the margin of their eye.

### B. Mission control

A dark, keyboard-first workspace in the spirit of an issue tracker: a slim top progress bar, a command palette for jumping to any chapter, and a split pane with the task list on the left and the artifact preview on the right.

* Strengths: fast for people who live in the keyboard; artifact previews get real space.
* Weaknesses: a facilitator on a projector gets a dense tool, not a story; dark-by-default fights the light monitor it links into; the command palette hides the journey instead of showing it.
* Fit: good for engineers mid-task, poor for teaching.

### C. Story scroll

One long page per day. Each chapter is a full-height spread with a headline, the story so far and the task, and a progress bar fills as you scroll.

* Strengths: strong for the opening and the debrief; feels like a narrative.
* Weaknesses: a returning attendee has to scroll to find their task; deep links land mid-story; long spreads are tiring during a 90-minute session.
* Fit: good for the Overview, poor for doing the work.

## Chosen: A, the field notebook

It answers the brief's six questions on every screen without a second navigation system:

| Question | Where the answer is |
|---|---|
| Where am I? | The navigator marks the current chapter on the three-day line, and the chapter title says it in full |
| What am I learning? | One sentence under the title |
| What should I do next? | The first section, set apart from the rest, in the order your role needs it |
| How does it fit? | The navigator, plus "Uses" in the margin and the Next block at the bottom |
| What do I produce? | The artifact in the margin, with its live status and path |
| How do I move on? | A full-width Next block that says what the next chapter takes from this one |

B and C are not blended in. The one idea taken from C is a short fade when the page changes, so you see that the page moved.

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| Page | `#FFFFFF` | `#0F151B` | Reading surface |
| Rail | `#F3F6F8` | `#141C23` | Navigator |
| Ink | `#16212B` | `#E4EBF1` | Text |
| Slate | `#5A6672` | `#9AA7B3` | Secondary text |
| Line | `#E2E7EB` | `#25313B` | Rules |
| Accent | `#0F6CBD` | `#5AAEEF` | Current chapter, links, primary action |

Semantic colours appear only on artifact status: teal for found, amber for the facilitator's example. Contrast for every text pair is at least 4.5:1, checked in code.

Type: Charter (or Sitka, Cambria, Georgia) for titles and numerals; the system sans at 16 px for body; Cascadia Mono, SF Mono or Menlo for prompts and paths. Body text measures under 72 characters.

## Landing page

`/journey` opens on a landing page before the notebook. It frames the scenario for strategists as well as engineers:

* The night itself, animated from the simulator's real readings for freezer ZF-118/F-12: the clock runs from 22:00 to 08:00, the trace turns hot when it crosses the −12 °C limit, freezer alarms stay at 0, and the cost of the night counts up at 08:00.
* "Everything did its job": five true statements about the night's activity, then the outcome they added up to.
* Outputs against outcomes: what an engineer ships beside what Zava is trying to buy.
* Six numbers the board will ask about, each with its goal.
* Three real, cited cold-chain figures (UNEP and FAO, WHO, FAO and UNEP), kept apart from Zava's synthetic ones.

The copy and the trace live in `workshop/journey.json` under `landing`. Motion is one orchestrated moment (the night) plus one reveal per element as it scrolls into view; with reduced motion the final state shows at once.
