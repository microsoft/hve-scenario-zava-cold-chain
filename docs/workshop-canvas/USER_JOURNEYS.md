# Workshop Journey: user journeys

These journeys use the `map-journey` structure and evidence labels from HVE Core's ux-artifacts skill. Nobody has run the three-day workshop yet, so most rows are assumptions to test at the first delivery. Rows labelled Observed come from the repo, the reference run or the UI/UX audit; rows labelled Reported come from documents a person wrote.

## Artifact context

* Project: zava-cold-chain
* Subject: Workshop Journey
* Mode: map-journey
* Status: partial. No delivery of the three-day format has happened, so no journey stage is observed in use.
* Sources: `docs/facilitator.md`, `docs/exercises.md`, `UI_UX_AUDIT.md`, the reference run's `assessment.md` on `hve-lifecycle/prototype-to-production`

## Observed

* The case file and the character cards share one file, `docs/facilitator.md`. The reference run's DT stage depended on an instruction not to read the answer key (`assessment.md`, Repository fitness).
* rpi-review writes to `.copilot-tracking/reviews/logs/`, which the repo's `.gitignore` ignores through `[Ll]ogs/`. The reference run's review record was never committed (`git check-ignore`).
* The monitor's 18-link sidebar becomes a drawer below 820 px; the audit found no horizontal overflow at 390 px after the fix (`UI_UX_AUDIT.md`).
* The PRD stage was the strongest in the reference run because the Gauntlet let the agent measure a fix and reject the naive one (`assessment.md`).

## Reported

* The facilitator guide asks trainers to pick a secret seed, score the baseline before the day, keep the dashboard on the trainer's screen and collect scorecards by shared folder or chat (`docs/facilitator.md`, Before the day).
* Coaches play five characters, stay in role and answer only what is asked (`docs/facilitator.md`, Character cards).
* Between steps, the team checks the file the last step wrote and agrees on it before starting the next (`docs/exercises.md`).

## Assumed

* Attendees come back to a chapter after a break and need the task, not the explanation. Validate by watching returning attendees on Day 2 morning.
* Facilitators plan from a timeline and run sessions from the chapter page. Validate with two facilitators preparing a dry run.
* Coaches want questions and common mistakes, and will not read long prose during a session. Validate with coach feedback after Day 1.
* A solo engineer uses the reference run as the worked example. Validate with one engineer new to HVE Core.
* People use laptops in the room. Phones are for glancing at the day's schedule. Validate with the device mix at the first delivery.

## Unresolved

* Who keeps chapter content in step with HVE Core releases? Agent names change between releases. Owner: repo maintainers.
* How do tables share artifacts with the facilitator: pushed branches, a shared folder, or both? Owner: facilitator, per delivery.
* Do executives attend all three days or only the Day 1 checkpoint and Day 3 board? It changes chapter 01 and 10 content. Owner: workshop sponsor.

## Scenario

* Users: facilitator, coach, attendee (engineer, TPM, security, data), executive sponsor, solo engineer new to HVE Core
* Starting context: a team booked a three-day HVE Core workshop on the Zava Silent Night, or one engineer cloned the repo to learn HVE Core
* Intended outcome: a funded, reviewed fix that cuts the Cost of a Silent Night on hidden nights, and a team that can repeat the lifecycle on their own problem

## Journey stages

### Facilitator preparing a delivery

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Plan the three days | Opens `/journey`, switches to Facilitator, reads Day 1 to Day 3 | "How long is each part and what do I need ready?" | Today the only run sheet is one day | Day view with sessions, breaks, checkpoints and prep notes | Assumed; run sheet from `docs/facilitator.md` |
| Prepare | Picks a seed, scores the baseline, prints character cards | "Which commands, in what order?" | Steps are in prose in one long file | Chapter 01 and 02 Facilitator sections list the commands with copy buttons | Reported, `docs/facilitator.md` Before the day |
| Check the answer key | Reads the reference run for each chapter | "What does a good BRD look like for this?" | The reference run isn't on `main` | Artifacts view with reference-run previews, labelled facilitator material | Observed, reference branch |
| Dry run | Walks each chapter in Attendee view | "Will a table know what to do here?" | | Attendee view shows exactly what tables see | Assumed |

### Facilitator during a session

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Open the session | Projects the chapter's Why this matters, then the monitor screen it links | "What's the one thing the room should notice?" | Switching between docs and dashboard | Each chapter names its monitor screen and the moment to show | Assumed |
| Watch tables | Checks the Artifacts view for which files exist | "Which table is stuck?" | No way to see progress except walking around | On-disk status per artifact, refreshed every ten seconds (one machine only) | Assumed; status is per machine, so this only helps when tables push or share a folder |
| Recover | Opens If you get stuck | "What's the fastest way to unstick them?" | | Per-chapter recovery steps, including "use the reference run's artifact and move on" | Assumed |
| Close the session | Reads Done when aloud; tables confirm | "Can we move on?" | | Done when list doubles as the closing check | Reported, `docs/exercises.md` "Between steps" |

### Coach at a table

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Play a character | Keeps the character card open; answers only what is asked | "What do I never volunteer?" | Card and case file are in the same document | Coach view of chapter 03 shows the cards without the case file | Observed, `assessment.md`; Reported, `docs/facilitator.md` |
| Ask questions | Reads the coach prompts for the chapter | "When do I push and when do I wait?" | No coach prompts exist for chapters 04 to 11 | Coach prompts and common mistakes per chapter | Observed: absent from every doc |
| Step in | Spots a table fixing before understanding | "Is this the moment?" | | A named intervention point per chapter | Assumed |

### Attendee

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Arrive | Opens `/journey` from the monitor or the README | "Where are we and what's today?" | | Overview opens on today's day and the next chapter | Assumed |
| Do the work | Opens Do this, copies the prompt, picks the agent in VS Code | "Which agent, what do I type?" | Agent names differ between HVE Core releases | Agent name, the picker or slash command, and a prompt that sets the slug | Observed, HVE Core docs (18 Nov 2026) |
| Check the output | Opens You produce, sees the file turn to Found on this computer | "Did it write to the right place?" | Tools pick their own slug if not told | Prompts set `zava-silent-night`; status shows the expected path | Assumed |
| Finish | Ticks Done when items | "Are we really done?" | | Manual ticks saved in this browser, clearly labelled | Assumed |
| Return after a break | Goes to `/journey`, sees the chapter they were on | "What was I doing?" | | Last chapter and section remembered per browser | Assumed |

### Executive sponsor

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Day 1 opening | Watches the replay and Business impact | "What does this cost us?" | | Chapter 01 opens on the euro figure | Reported, `docs/exercises.md` The business outcome |
| Day 1 checkpoint | Agrees the outcome and who owns the assumptions | "Which numbers would I sign?" | | Checkpoint row in the Day view with the questions to answer | Reported, `docs/facilitator.md` debrief questions |
| Day 3 board | Funds a portfolio, decides on the store assistant | "Go, fix first or pull?" | | Chapter 10 links the Investment Board and the leaderboard | Reported, `docs/facilitator.md` Investment Board script |

### Solo engineer new to HVE Core

| Stage | User actions | Thoughts or questions | Pain points | Opportunities | Basis and source |
|---|---|---|---|---|---|
| Orient | Reads the Overview and the chapter-to-stage mapping | "How does HVE Core's lifecycle fit together?" | HVE docs explain stages one by one | The rail shows all stages on one problem | Assumed |
| Follow the trail | Opens Artifacts, follows BRD to PRD to the code change | "How does a requirement become code?" | | Reference-run trace from DT insight to the Gauntlet result | Observed, `assessment.md` Trace |
| Try one chapter | Runs chapter 08 on a fix of their choice | "Can I do this on my own?" | No facilitator or coach | Attendee view works without a facilitator; reference run as the answer | Assumed |

## Cross-journey findings

* Every role asks "what do I do now and how do I know I'm done" before "why". The chapter page should open on Do this for attendees, and on Why this matters only for facilitators presenting.
* Facilitators and coaches need content that doesn't exist yet: coach prompts, common mistakes and recovery steps for chapters 04 to 11.
* The answer key problem is real and observed. Character cards must be viewable without the case file.
* On-disk status only reflects the machine running the server. It helps a solo engineer and a table on its own laptop, and it misleads a facilitator who assumes it shows the whole room.

## Validation priorities

1. Whether returning attendees find their task in two clicks. If they don't, the rail and role defaults are wrong.
2. Whether facilitators trust the Day view enough to run from it. If they print `docs/facilitator.md` instead, the Day view is decoration.
3. Whether coaches use the prompts during sessions. If not, move them into the printed character cards.

## Human Review

> [!CAUTION]
> **Disclaimer:** This agent is an assistive coaching tool only. It does not conduct user research, observe stakeholders, or speak for the people whose problems you are designing for, and it does not replace primary research, direct stakeholder contact, design review, or product and strategy decision authority. Personas, problem statements, journey maps, empathy maps, concept tests, and other Design Thinking artifacts produced with this tool are scaffolding for your own research and synthesis — not substitutes for real stakeholder voice or observed behavior. Validate all AI-generated assumptions, personas, themes, and insights against actual stakeholders before treating any Design Thinking artifact as a basis for product, design, or strategy commitments. Outputs from this tool do not constitute validated research findings or design approval.

* [ ] Reviewed and validated by a qualified human reviewer
