# Workshop Journey: wireframes

> [!NOTE]
> The page was redesigned after the first build. [REDESIGN.md](REDESIGN.md) records the current layout, navigation and tokens. This document is the first version's design and is kept for its reasoning.

Low fidelity, drawn with real content. Widths are 1440 px unless marked. These versions include the changes from UX_REVIEW.

The rail is drawn to time, so chapter widths differ. The day names on the rail are the links to each Day view; the header has no day links. Chapter 08 runs on Day 2 and Day 3, so it appears in both.

## 1. Journey overview

Why it exists: the one place that answers "what is this workshop and where do I start?" It opens on today's day when a delivery date is set in the content file, or on Day 1 otherwise.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Workshop Journey            Artifacts  Open the monitor  View as [Attendee|Coach|Facilitator]│
├────────────────────────────────────────────────────────────────────────────────────┤
│ Day 1 Find the real problem    Day 2 Decide what to build   Day 3 Build, prove, ship │
│ 01─02──03─────────04──────     05────────06────07──08───     08──────09───10───11── │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  The Silent Night, in three days                                    (serif title)  │
│                                                                                    │
│  One morning every freezer in Zava's five pilot stores is warm, and the only        │
│  alarms were for other cases. Over three days your team finds why, decides          │
│  what to fix, builds it with HVE Core and proves it on nights nobody has seen.      │
│                                                                                    │
│  The outcome        Cut the Cost of a Silent Night: €260,411 in the pilot region    │
│                     today, about €20.8M across 400 stores                           │
│  How it's measured  Night Gauntlet, euros protected on hidden nights                │
│  What must not      A scheduled defrost that ends on time raises no alarm           │
│  change                                                                             │
│                                                                                    │
│  Start here                                                                         │
│  Attendee:     Chapter 02 Setup, before Day 1 starts        [Open chapter 02]      │
│  Facilitator:  Day 1 run sheet and what to prepare           [Open Day 1]          │
│  New to HVE:   Follow one requirement from interview to code [Open Artifacts]      │
│                                                                                    │
│  How the 11 chapters map to HVE Core                                               │
│  ┌──────┬───────────────────────────┬──────────────────────────────┐               │
│  │ Ch   │ Chapter                   │ HVE Core                     │               │
│  │ 01   │ Scenario orientation      │ Workshop framing             │               │
│  │ 02   │ Setup                     │ Stage 1 Setup                │               │
│  │ 03   │ Design Thinking           │ DT methods 1 to 3, exit 1    │               │
│  │ ...  │                           │                              │               │
│  └──────┴───────────────────────────┴──────────────────────────────┘               │
│  HVE Core has nine lifecycle stages. Chapters 01 and 03 add the scenario and        │
│  Design Thinking, which feeds the lifecycle.                                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Chapter workbench, Attendee view

Why it exists: this is where the work happens. It opens on Do this, because attendees need the task before the reasoning.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ header + rail (04 current, 01 to 03 ticked)                                         │
├────────────────────────────────────────────────────────────────────────────────────┤
│  04                                                                                 │
│  Discovery and business requirements                              (serif title)    │
│  HVE Core   Stage 2 Discovery     Day 1, 14:45 to 16:45     2 hours                │
│                                                                                    │
│  Why this matters  [Do this]  You produce  Done when  If you get stuck   Show all  │
│  ───────────────── ═════════                                                        │
│                                                  ┌─────────────────────────────┐   │
│  1. Open GitHub Copilot Chat and pick BRD Builder │ Uses                        │   │
│     in the agent picker.                         │ Problem-space handoff, 03   │   │
│                                                  │ Business impact screen      │   │
│  2. Start with this prompt:                      │   Open in the monitor       │   │
│  ┌────────────────────────────────────────────┐  │                             │   │
│  │ Create a BRD for zava-silent-night. Start  │  │ Hands to                    │   │
│  │ from .copilot-tracking/dt/zava-silent-     │  │ 05 Product definition reads │   │
│  │ night/problem-space-handoff.md. The        │  │ the BRD's goals and rules   │   │
│  │ outcome is the Cost of a Silent Night ...  │  │   Next: 05 Product          │   │
│  └───────────────────────────────[Copy prompt]┘  │   definition                │   │
│                                                  └─────────────────────────────┘   │
│  3. Answer its Discover questions from Business                                    │
│     impact. Move the sliders before you agree a                                    │
│     target, and write down who owns each one.                                      │
│  4. ...                                                                            │
│                                                                                    │
│  Tools      BRD Builder (agent picker): runs Discover, Define, Govern               │
│             rpi-research (/rpi-research): only if a claim needs checking            │
│                                                                                    │
│  ← 03 Design Thinking                                     05 Product definition → │
└────────────────────────────────────────────────────────────────────────────────────┘
```

The arrows in the bottom row are a wireframe convention. The built page uses the chapter names as link text with no arrow characters.

The You produce section:

```
│  Business requirements                                                             │
│  docs/project-planning/zava-silent-night-brd.md   Not found on this computer       │
│  Made by BRD Builder. Read by 05 Product definition and 06 Decomposition.           │
│  Reference run  workshop/reference-run/docs/project-planning/                      │
│                 cold-chain-production-readiness-brd.md   [Preview] (facilitator)   │
```

In Attendee view the reference-run line is collapsed behind "Show the facilitator's example", so nobody opens the answer by accident.

## 3. Chapter workbench, Facilitator view

Why it exists: the same chapter, ordered for someone running the room. It opens on Run this session.

```
│  04 Discovery and business requirements                                             │
│  Run this session  Why this matters  What tables do  Done when  If a table stalls   │
│  ════════════════                                                                   │
│  Before        Replay silent-night to 08:00 on the trainer's screen so Business    │
│                impact shows the whole night. Reset the sliders.                     │
│  14:45  15 min Show the euro figure. Ask: "Which of these would you sign?"          │
│  15:00  60 min Tables run BRD Builder. Walk the room at 15:20 and 15:40.            │
│  16:00  15 min Each table reads its business goal aloud. Write them on the wall.    │
│  16:15  30 min Checkpoint with executives (see Day 1).                              │
│                                                                                     │
│  A good answer  A goal with a number, a date and a measure. The reference run's     │
│                 BG-001: bring the Cost of a Silent Night from €260,411 to under     │
│                 €50,000 by month 6.                              [Preview]          │
│                                                                                     │
│  Watch for     A table writes a fix ("add an alarm") as the goal. Send them back    │
│                to the problem statement.                                            │
```

## 4. Chapter workbench, Coach view

Why it exists: coaches need questions and timing, not instructions. It opens on Ask this.

```
│  03 Design Thinking                                                                 │
│  Ask this  Your character  Common mistakes  When to step in  Done when              │
│  ════════                                                                           │
│  • "Who would notice first if a freezer warmed up at 02:00?"                        │
│  • "What did you do when the screen said defrost?"                                  │
│  • "Who told you that? Have you checked?"                                           │
│                                                                                     │
│  Your character  Refrigeration technician          (card only, no case file)        │
│                  Knows: the controllers ... Line: "The controller has a default."   │
```

## 5. Day view

Why it exists: a facilitator plans and runs a day from time, not from chapters. It's the run sheet with breaks and checkpoints in place.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ header + rail (Day 1 chapters emphasised)                                           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Day 1  Find the real problem                                     (serif title)    │
│  Three-day track ◉   One-day track ○                                               │
│                                                                                    │
│  09:00  60 min  01 Scenario orientation   Replay silent-night at ×60. Stop on the   │
│                                           newspaper at 08:00                        │
│  10:00  45 min  02 Setup                  Check pre-work: tests pass, HVE Core      │
│                                           installed, Session Target is Copilot      │
│  10:45  15 min  Break                                                               │
│  11:00  90 min  03 Design Thinking        Methods 1 and 2: interview the five       │
│                                           characters                                │
│  12:30  45 min  Lunch                                                               │
│  13:15  75 min  03 Design Thinking        Method 3: synthesis, problem statement,   │
│                                           exit 1 handoff                            │
│  14:30  15 min  Break                                                               │
│  14:45  90 min  04 Discovery and BRD      BRD Builder, Discover to Govern           │
│  16:15  30 min  Checkpoint                Executives agree the outcome, its         │
│                                           measure and who owns the assumptions      │
│                                                                                    │
│  Prepare the night before (Facilitator view only)                                  │
│  • Pick a secret seed. Score the baseline:                                         │
│    python -m zava_cold_chain gauntlet --seed <seed> --baseline        [Copy]       │
│  • Print character cards                                                           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Each chapter name links to its chapter page. The one-day track switch rewrites the rows from the one-day run sheet and keeps the same chapter links.

## 6. Artifact journey

Why it exists: the lineage is the point of the workshop, and it's the one thing a list can't show. Columns are chapters in order; boxes are artifacts; lines mean "reads".

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ header + rail                                                                       │
├────────────────────────────────────────────────────────────────────────────────────┤
│  How one night becomes a funded fix                               (serif title)    │
│  Show: ☑ Ships with repo ☑ You create ☑ Reference run ☑ Outside repo     List view │
│                                                                                    │
│  01        03          04      05            06, 07     08          09, 10    11   │
│ ┌────────┐ ┌─────────┐ ┌────┐ ┌───┐         ┌───────┐  ┌────────┐  ┌──────┐ ┌────┐│
│ │scenario├─┤DT       ├─┤BRD ├─┤PRD├────┬────┤work   ├──┤research├──┤review│ │inc-││
│ └────────┘ │handoff  │ └─┬──┘ └───┘    │    │items  │  ├────────┤  ├──────┤ │ident│
│            └─────────┘   │  ┌────────┐ │    └───────┘  │plan    │  │score-│ └────┘│
│                          ├──┤security├─┤               ├────────┤  │card  │       │
│                          │  └────────┘ │               │changes │  ├──────┤       │
│                          │  ┌────────┐ │  ┌──────────┐ └────────┘  │PR    │       │
│                          └──┤RAI plan├─┴──┤repo rules│             │board │       │
│                             └────────┘    └──────────┘             └──────┘       │
│                                                         ┌──────────────────────┐   │
│                                                         │ Business requirements│   │
│                                                         │ Made in 04 by BRD    │   │
│                                                         │ Builder              │   │
│                                                         │ Reads: DT handoff,   │   │
│                                                         │ scenario             │   │
│                                                         │ Read by: PRD,        │   │
│                                                         │ security, RAI, work  │   │
│                                                         │ items                │   │
│                                                         │ Yours: Not found on  │   │
│                                                         │ this computer        │   │
│                                                         │ Reference: [Preview] │   │
│                                                         └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Selecting BRD dims everything that doesn't read it or isn't read by it. List view shows the same content as a table, which is also what a screen reader gets.

## 7. Mobile, 390 px

Why it matters: people check the day's schedule on a phone. The chapter page must still work there.

```
┌──────────────────────────────┐
│ Workshop Journey      ☰ Menu │
│ View as [Attendee        ▾]  │
├──────────────────────────────┤
│ ◀  04 of 11 · Day 1       ▶  │   (the rail collapses to this; tap the
│ ═════════●───────────────    │    middle to open the full chapter list)
├──────────────────────────────┤
│ 04                           │
│ Discovery and business       │
│ requirements                 │
│ Stage 2 Discovery            │
│ Day 1, 14:45, 2 hours        │
│                              │
│ Section  [Do this        ▾]  │   (tabs become a select below 600 px)
│                              │
│ 1. Pick BRD Builder ...      │
│ ┌──────────────────────────┐ │
│ │ Create a BRD for zava-   │ │
│ │ silent-night ...         │ │
│ └─────────────[Copy prompt]┘ │
│                              │
│ Uses                         │
│ Problem-space handoff, 03    │
│ Hands to                     │
│ 05 Product definition        │
└──────────────────────────────┘
```

The "04 of 11 · Day 1" text is the compact rail label, where the middle dot separates two facts the person needs together. It's the only place the page uses one.

The Artifacts view at 390 px opens in list view; the diagram is available but needs horizontal scrolling inside its own frame.
