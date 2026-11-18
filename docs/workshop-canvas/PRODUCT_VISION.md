# Workshop Journey: product vision

Status: design proposal, waiting for approval. Nothing here is built yet.

## What it is

The Workshop Journey is a second page served by the Cold Chain Monitor's own server, at `/journey`. It shows how a team runs a three-day HVE Core workshop on the Zava Silent Night, chapter by chapter, from the first replay of the night to a funded fix that survives a live incident.

The monitor stays what it is: the world inside the story. The journey page is the teaching layer above it. Every chapter points back into the monitor at the screen where that chapter's evidence lives.

## Who it serves

| Person | Arrives with | Leaves with |
|---|---|---|
| Facilitator preparing a delivery | `docs/facilitator.md`, a date, a room | A three-day run sheet, what to demo in each session, what a good answer looks like, how to recover when a table stalls |
| Coach at a table | A character card and a table of engineers | The questions to ask at each chapter, the mistakes tables usually make, the moment to step in |
| Attendee | A laptop with the repo cloned | The task for this session, which HVE agent to pick, the prompt to start with, the file they should end up with and how to check it |
| Engineer new to HVE Core, alone | Curiosity, no workshop | How the HVE lifecycle fits together on one real problem, with the reference run as a worked example |

## The outcome it serves

The workshop's business outcome doesn't change: cut the Cost of a Silent Night, measured in euros across nights nobody has seen, without breaking routine operations. Today it is €260,411 in the pilot region and about €20.8M chain-wide. The Gauntlet baseline at seed 2026 is €768,013.

The journey page makes the path to that outcome teachable. A person who has never used HVE Core should be able to answer, for any chapter:

* What happens here, and why now?
* Who does what: facilitator, coach, attendee?
* Which agent or skill do I pick, and what do I type first?
* What file comes out, where does it live, and what reads it next?
* How do I know I'm done?

## Design commitments

1. One scenario, start to end. Every chapter shows the same Silent Night moving forward. No side examples.
2. Honest status. An artifact shows "Found on this computer" only when the server finds the file on disk, and never claims more than that. Checklists are manual and say so. The page never invents a tick or a path.
3. The official model stays visible. HVE Core has nine lifecycle stages and Design Thinking has nine methods. The workshop's 11 chapters are a teaching sequence over them, and the page labels each chapter with the stage it maps to.
4. Teach, don't run. The page explains how to run each workflow in VS Code or the Copilot CLI. It doesn't call agents. Live RPI sessions belong to HVE Core's RPI Workflow Canvas, and chapter 08 links to it.
5. One page, one job each. Overview, day, chapter and artifacts. No fifth screen without a person who needs it.
6. Offline and dependency-free, like the rest of the repo: Python standard library, plain JavaScript, system fonts.

## What it is not

* Not a documentation site. Long explanations stay in `docs/`. The page carries the task, the prompt, the check and the link.
* Not a project tracker. Progress is per browser and per person.
* Not a second RPI canvas.
* Not a replacement for the monitor's Workshop issue map. The issue map shows where the eight planted problems hide; the journey shows how a team works through them.

## How we'll know it works

* A facilitator who hasn't seen the repo can plan a three-day delivery from the journey page and `docs/facilitator.md` alone.
* An attendee returning after lunch finds their session's task in two clicks from `/journey`.
* Every artifact path on the page either exists on disk or is labelled as one you create.
* The page passes the same checks the monitor passed in the UI/UX audit: no horizontal overflow at 390 px, visible focus, keyboard reachable, reduced motion respected.
