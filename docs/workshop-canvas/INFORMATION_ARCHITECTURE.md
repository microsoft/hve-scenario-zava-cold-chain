# Workshop Journey: information architecture

## Sitemap

```
/journey                         Overview: the outcome, the three days, the rail, where to start
├── #/day/1  #/day/2  #/day/3    Day view: sessions in time order, breaks, checkpoints
├── #/day/1?track=one-day        The compressed one-day track on the same chapters
├── #/ch/01 … #/ch/11            Chapter workbench, one section at a time
│     ?s=why|do|produce|done|stuck       (section)
└── #/artifacts                  Artifact lineage
      #/artifacts/brd            ...with one artifact selected
```

The monitor stays at `/`. Its sidebar gets one new link, Workshop Journey, in the For trainers group. Every chapter links back into the monitor at the screen it uses, for example `/#/business` or `/#/gauntlet`.

There are four screen types and no others. A separate Scenario screen and a Facilitator resources screen were considered and dropped:

* Scenario context is chapter 01. A copy of it would drift.
* Facilitator resources are the Facilitator lens on every screen, plus the reference run in Artifacts.

## Navigation hierarchy

| Level | Element | Shows | Present on |
|---|---|---|---|
| 0 | Header | Workshop Journey (home), Artifacts, Open the monitor, the role switch | Every screen |
| 1 | Chapter rail | Day labels that open the Day view, and 11 chapters under their day; current chapter, chapters you've ticked off, previous and next | Every screen |
| 2 | Section tabs | Why this matters, Do this, You produce, Done when, If you get stuck | Chapter |

The levels look different on purpose. The header is text links; the rail is a numbered line of stops, the only numbered element on the page because the chapters really are a sequence; the section tabs are an underlined tab row inside the chapter.

The role switch is global and stays where it is. It changes emphasis and order and is saved in the browser, never in the URL. A facilitator can send any link to an attendee, and the attendee opens it in their own role without landing on the reference answer.

The rail marks the current chapter from the clock during a delivery: when `journey.json` has a `delivery_start` date and today is one of the three days, the chapter scheduled now is current. Otherwise the current chapter is the one on screen.

## Chapters mapped to HVE Core

The 11 chapters are the workshop's teaching sequence. HVE Core's nine lifecycle stages and Design Thinking are what they teach.

| Ch | Chapter | HVE Core mapping | Primary tools | The Silent Night at this point | Monitor screen |
|---|---|---|---|---|---|
| 01 | Scenario orientation | Workshop framing, not a stage | None | One morning every freezer in five stores is warm. €260,411 tonight, about €20.8M chain-wide | Business impact, Tour and stories |
| 02 | Setup | Stage 1 Setup | hve-core-installer, git-setup | The repo runs, tests pass, HVE Core is installed, each table has a branch | System health |
| 03 | Design Thinking | DT methods 1 to 3, exit 1 to rpi-research | DT Coach | Interviews with five characters. Every control trusted another control | Live feed, Known issues |
| 04 | Discovery and BRD | Stage 2 Discovery | BRD Builder, rpi-research | The outcome in euros, who owns each assumption, what must not change | Business impact |
| 05 | Product definition | Stage 3 Product Definition | PRD Builder, Security Planner, RAI Planner, adr-creation | Acceptance cases per fix, a threat model, a decision on the store assistant | Commands and audit, Ask the assistant |
| 06 | Decomposition | Stage 4 Decomposition | functional-planner, backlog-manager | FX-1 to FX-8 become work items with acceptance cases | Investment Board (fix catalogue) |
| 07 | Sprint planning | Stage 5 Sprint Planning | backlog-manager, backlog-management | Each table commits to one fix for Day 3 | Workshop issue map |
| 08 | Implementation | Stage 6 Implementation | hve-builder, RPI Agent, rpi-research, rpi-plan, rpi-implement | Repo rules first, then the table's fix, tests first | Case charts, Alarms and incidents |
| 09 | Review | Stage 7 Review | rpi-review, code-review, Night Gauntlet | Every acceptance case checked; the scorecard on hidden nights | Night Gauntlet |
| 10 | Delivery | Stage 8 Delivery | pull-request, git-commit, git-merge | Pull requests, the leaderboard, the board funds a portfolio within €150,000 | Investment Board |
| 11 | Operations | Stage 9 Operations | incident-response (structure only), documentation | A chaos card hits the funded portfolio live. Incident record, runbook change, hotfix if needed | Chaos cards, Alarms and incidents |

How the old "11 HVE steps" fit:

| Old step in `docs/exercises.md` | Becomes |
|---|---|
| 01 Design Thinking | Chapter 03 |
| 02 Business requirements | Chapter 04 |
| 03 Product requirements | Chapter 05 |
| 04 Repo rules | Chapter 08, first session |
| 05 Security | Chapter 05, second session (and threat-model input to chapter 06) |
| 06 Responsible AI | Chapter 05, second session |
| 07 Research, 08 Plan, 09 Implement | Chapter 08 |
| 10 Review | Chapter 09 |
| 11 Evaluate | Chapter 09, Night Gauntlet as acceptance evidence |
| Investment Board | Chapter 10 |
| Chaos cards | Chapter 11 |

Loops the rail draws as small return marks, taken from HVE Core's stage transitions: 04 can skip to 06 when the BRD is enough; 09 back to 08 for rework; 11 back to 08 for a hotfix; 08's research can send a table back to 03 when the problem statement doesn't hold.

## Days mapped to chapters

| Day | Theme | Chapters | Ends with |
|---|---|---|---|
| 1 | Find the real problem | 01, 02, 03, 04 | Checkpoint: executives agree the outcome, its measure and who owns the assumptions |
| 2 | Decide what to build | 05, 06, 07, 08 (first session) | Checkpoint: every table has a ranked work item, a branch, repo rules and research marked ready |
| 3 | Build, prove and ship it | 08, 09, 10, 11 | Debrief and case file reveal |

Session times, which the Day view shows:

| Day | Time | Chapter | Session |
|---|---|---|---|
| 1 | 09:00 | 01 | Replay the Silent Night, walk Business impact and the newspaper |
| 1 | 10:00 | 02 | Check the pre-work: tests pass, HVE Core installed, Session Target is Copilot |
| 1 | 11:00 | 03 | Methods 1 and 2: scope the problem, interview the five characters |
| 1 | 13:15 | 03 | Method 3: synthesize, write the problem statement, prepare the exit 1 handoff |
| 1 | 14:45 | 04 | BRD Builder: Discover, Define, Govern |
| 1 | 16:15 | 04 | Checkpoint with executives |
| 2 | 09:15 | 05 | PRD Builder: acceptance cases per failure |
| 2 | 11:00 | 05 | Security Planner and RAI Planner, split by table |
| 2 | 13:15 | 06 | functional-planner: PRD to work items |
| 2 | 14:15 | 07 | backlog-manager: each table picks one fix, makes a branch |
| 2 | 15:15 | 08 | hve-builder repo rules, then rpi-research |
| 2 | 16:30 | 08 | Checkpoint: research ready |
| 3 | 09:00 | 08 | rpi-plan with critique, tests first |
| 3 | 10:45 | 08 | rpi-implement, one phase at a time |
| 3 | 12:45 | 09 | rpi-review and code-review, then the seed is announced and tables run the Gauntlet |
| 3 | 13:45 | 10 | Pull requests, scorecards, leaderboard, Investment Board |
| 3 | 15:00 | 11 | Chaos card on the funded portfolio, incident record, runbook change |
| 3 | 16:00 | | Debrief and case file reveal |

Breaks, lunch and checkpoints are rows in the Day view, so a facilitator can see the whole day without arithmetic.

The one-day track uses the same chapters, taken from the existing run sheet in `docs/facilitator.md`: 01 at 09:00, 03 at 09:20, 04 at 10:15, 05 at 11:00, 08 at 13:15 with one prepared fix per table, 09 at 15:00, 10 at 16:00, debrief at 16:40. Chapter 02 becomes pre-work; 06 and 07 become the facilitator assigning one failure per table at 10:45; 11 happens through chaos cards during table demonstrations.

## Artifact dependency model

Each artifact has an id, a producer chapter, the artifacts it reads, and the chapters that consume it. Its status comes from one of four sources:

| Kind | Meaning | How status is decided |
|---|---|---|
| Ships with the repo | Part of the repo before the workshop starts | Server checks the path exists |
| Reference run | A finished example from the recorded run, facilitator material | Server checks the file under `workshop/reference-run/` exists |
| You create | A file the chapter's tool writes | Server checks the path or pattern on this computer: "Found on this computer" or "Not found on this computer". Found doesn't mean committed or reviewed |
| Outside the repo | A pull request or a printed board pack | Never checked; you tick it |

The lineage:

```
scenario ──┬─► dt-handoff ─► brd ─┬─► prd ─┬─► work-items ─► sprint-plan ─┐
           │                      ├─► security-plan ─┤                    │
           │                      └─► rai-plan ──────┘                    │
           │                                                              ▼
           │           repo-rules ◄── security-plan, rai-plan         rpi-research
           │                │                                             │
           │                └────────────────────────────────────► rpi-plan ─► rpi-changes
           │                                                              │
           └──────────────────────────────────────────────► scorecard ◄──┤
                                                                rpi-review ◄┘
                                     pull-request ◄── rpi-review, scorecard
                                     board-pack ◄── scorecard, pull-request
                                     incident-record ◄── board-pack, runbook
```

| Id | Artifact | Made in | Kind | Where |
|---|---|---|---|---|
| scenario | Cost of a Silent Night baseline | 01 | Ships with the repo | `data/business.json`, `data/fixes.json`, Business impact screen |
| setup-check | Tests pass, HVE Core installed | 02 | Outside the repo | Your terminal |
| dt-handoff | Problem-space handoff | 03 | You create | `.copilot-tracking/dt/zava-silent-night/problem-space-handoff.md` |
| brd | Business requirements | 04 | You create | `docs/project-planning/zava-silent-night-brd.md` |
| prd | Product requirements | 05 | You create | `docs/project-planning/zava-silent-night-prd.md` |
| security-plan | Security plan and backlog handoff | 05 | You create | `.copilot-tracking/security-plans/zava-silent-night/` |
| rai-plan | Responsible AI plan and backlog handoff | 05 | You create | `.copilot-tracking/rai-plans/zava-silent-night/` |
| adr | Architecture decision, optional | 05 | You create | `docs/planning/adrs/` |
| work-items | Work-item handoff | 06 | You create | `.copilot-tracking/github-issues/prds/*/` |
| sprint-plan | Table commitments | 07 | You create | `.copilot-tracking/github-issues/sprint/*/` |
| repo-rules | Instructions for coding agents | 08 | You create | `.github/instructions/zava-cold-chain.instructions.md` |
| rpi-research | Research | 08 | You create | `.copilot-tracking/research/*/*-research.md` |
| rpi-plan | Plan and critique | 08 | You create | `.copilot-tracking/plans/*/*-plan.md` |
| rpi-changes | Changes record, code and tests | 08 | You create | `.copilot-tracking/changes/*/*-changes.md`, the table's branch |
| rpi-review | Review record | 09 | You create | `.copilot-tracking/reviews/logs/*/*-review.md` |
| scorecard | Night Gauntlet scorecard | 09 | You create | `scorecards/<table>.json` |
| pull-request | Pull request | 10 | Outside the repo | GitHub |
| board-pack | Investment Board decision | 10 | Outside the repo | Printed from the Investment Board |
| incident-record | Incident record and root cause | 11 | You create | `docs/incident-response/*.md` |
| runbook | Night cover runbook | 11 | Ships with the repo | `data/runbook.md`, changed by the table |

The project slug is `zava-silent-night` for every table, and the chapter prompts say so, so the tools write to the paths the page checks. Each table works on its own branch, so the same paths don't collide.

Eleven of the 20 artifacts have a reference-run counterpart: dt-handoff, brd, prd, security-plan, rai-plan, repo-rules, rpi-research, rpi-plan, rpi-changes, rpi-review, and scorecard (the Gauntlet before and after files). Of the other nine, scenario and runbook already ship in the repo and the rest show only the expected path. The reference run's slug is `cold-chain-production-readiness`, and the page says so beside each one.

## Interaction model

| Action | Result | Feedback |
|---|---|---|
| Select a rail stop | Opens that chapter on its default section for your role | Rail stop fills; page title and heading change; focus moves to the heading |
| Select a section tab | Shows that section, URL updates | Tab underline moves; arrow keys move between tabs |
| Show all sections | All five sections stack in reading order, for printing or reading | Button text changes to Show one section |
| Switch role | Same screen, re-ordered for that role; choice saved in this browser, not in the URL | The switch shows the role; a short note on what changed ("Showing coach prompts first") |
| Copy a prompt | Prompt text goes to the clipboard | Button says Copied for two seconds; a polite live region announces it |
| Tick a Done when item | Saved in this browser | When all are ticked, the rail stop shows a tick. A note under the list says ticks are saved in this browser only |
| Reset my ticks | Clears ticks for this chapter or all chapters | Asks first, with Undo in the toast for ten seconds |
| Select an artifact | Lineage highlights what it reads and what reads it; detail panel shows owner, kind, status, path | Unrelated nodes fade; Escape clears |
| Preview an artifact | Shows the first part of the file in the panel, read only | Shows the path and Open in VS Code |
| Open in VS Code | `vscode://file/<absolute path>` | Works only when VS Code is installed, and the link says so |
| Open the monitor screen | Opens `/#/<screen>` in the same tab | Back returns to the same chapter section |

The page polls `/api/journey/status` every ten seconds while visible, so a file a table just created turns to "Found on this computer" during the session without a reload. The poll stops while the tab is hidden. Nothing else moves on its own.
