# Repository assessment for the Workshop Journey

Inspected on 18 November 2026, on `main` at `9077610`, with the local branch `hve-lifecycle/prototype-to-production` for the reference run. HVE Core facts come from the published docs on the same day and from the installed hve-core plugin (`1a1b1147a66`).

## The product today

| Area | What exists | Evidence |
|---|---|---|
| Server | Python 3.9+ standard library only, binds to 127.0.0.1, checks the Host and Origin headers, POST needs a JSON body. Serves any file under `zava_cold_chain/web/` and JSON routes under `/api/` | `zava_cold_chain/server.py` (`_static`, `routes`) |
| Frontend | One page, plain JavaScript, no build step. Views are `views.<name> = {title, mount, update}`, hash routes, polled every second | `zava_cold_chain/web/app.js` (`route()`, about 1,080 lines) |
| Design system | Microsoft Fluent 2 light tokens in `:root`, WCAG 2.2 AA colour pairs, system font stack, 12 px radius, one soft shadow | `zava_cold_chain/web/app.css` lines 4 to 16 |
| Navigation | Sidebar with 18 links in six groups. Below 820 px it becomes a Menu drawer | `zava_cold_chain/web/index.html` |
| Tests | 64 or more `unittest` tests, including a hygiene test that scans every `.md`, `.json`, `.js` and `.css` for hidden Unicode | `tests/`, `tests/test_repo_hygiene.py` |

## The scenario and its workshop material

* The Silent Night: five failures together (silent alarms, uncontrolled commands, no named sender, a steerable assistant, nobody owns it). Five public nights, hidden nights from a seed.
* Business layer: Cost of a Silent Night (€260,411 pilot, about €20.8M chain-wide), assumption sliders, Night Gauntlet with scorecards and a leaderboard, Investment Board with a €150,000 budget and eight fixes, chaos cards.
* `docs/exercises.md`: a one-day workshop in "11 HVE steps": DT, BRD, PRD, repo rules, Security, RAI, Research, Plan, Implement, Review, Evaluate.
* `docs/facilitator.md`: a run sheet from 09:00 to 16:40, five character cards, the case file (the answer), chaos card script, Investment Board script, debrief questions.
* In the monitor: Workshop issue map (`#/workshop`, eight planted issues, each tagged with the step that tackles it), Tour and stories (`#/story`), How to read the monitor (`#/guide`).

Nothing in the repo is a canvas, a multi-day timeline or an artifact view. The screenshot shared with the brief (dark, Discover/Design/Build/Deliver tabs) doesn't come from this repo.

## The reference run

The local branch `hve-lifecycle/prototype-to-production` holds a real run of the lifecycle on this repo, started from a production-readiness problem statement. It's not on `main` and has never been pushed.

| Stage | Files on the branch |
|---|---|
| Design Thinking, methods 1 to 3 and exit 1 | `.copilot-tracking/dt/cold-chain-production-readiness/` (11 method files and `problem-space-handoff.md`) |
| BRD | `docs/project-planning/cold-chain-production-readiness-brd.md`, `.copilot-tracking/brd-sessions/` |
| PRD | `docs/project-planning/cold-chain-production-readiness-prd.md`, `.copilot-tracking/prd-sessions/` |
| Security | `.copilot-tracking/security-plans/cold-chain-production-readiness/security-plan.md` |
| Responsible AI | `.copilot-tracking/rai-plans/cold-chain-production-readiness/rai-plan.md`, plus ADO and GitHub backlog handoffs |
| Repo rules | `.github/instructions/zava-cold-chain.instructions.md`, HVE Builder author and review records |
| RPI on FR-001 | research, plan, plan critique and changes under `.copilot-tracking/` |
| Assessment | `.copilot-tracking/hve-lifecycle/2026-11-15/assessment.md`, Gauntlet before and after |
| Orchestrator | `.github/agents/hve-lifecycle.agent.md`, `.github/agents/subagents/zava-stakeholder-panel.agent.md` |

It traces one requirement all the way through: the DT insight "defrost is routine", BRD goal BG-001, PRD FR-001, security control 8, the instructions rule, the change in `alarms.py`, and the Gauntlet result €768,013 to €454,371.

What it doesn't have: decomposition, sprint planning, delivery or operations artifacts. The security and RAI backlog handoffs are the nearest thing to work items. Those four chapters will show expected paths only.

## Findings that shape the design

1. The `.gitignore` drops RPI review records. Its Visual Studio section ignores `[Ll]ogs/`, and rpi-review writes to `.copilot-tracking/reviews/logs/`. The reference run's review record exists on disk but was never committed, although the assessment cites it. Every attendee's review record would vanish the same way. Fix: add `!.copilot-tracking/reviews/logs/` and the reference-run equivalent to `.gitignore`.
2. The reference run can't live at its working paths. If the BRD sat at `docs/project-planning/`, the on-disk check would mark every table's BRD as done; DT Coach and the BRD and PRD Builders detect existing sessions in `.copilot-tracking/` and would offer to resume them; and `.github/instructions/zava-cold-chain.instructions.md` would apply itself to every attendee's chat and answer the repo-rules exercise. Fix: keep the reference run under `workshop/reference-run/`, mirroring its original paths, where no agent looks.
3. Two 11-step models would compete. `docs/exercises.md`, the issue map's step chips and the facilitator run sheet all use the old steps. Once the chapters are agreed, all three move to the chapter names.
4. Setup has to come before Design Thinking. DT Coach is an HVE Core agent, so HVE Core must be installed first.
5. The monitor already owns `#/workshop`. The new page lives at `/journey` and is called Workshop Journey, so "workshop" keeps meaning the issue map inside the monitor.
6. The monitor's sidebar is full. Eleven chapters there would be a second navigation system inside the first. The journey gets its own page and one link from the sidebar's For trainers group.
7. Spoilers: the reference run and the case file both reveal the answer. Both are facilitator material and the page labels them that way. The repo is public, so the label is a courtesy, not a lock, which matches how `docs/facilitator.md` already works.

## HVE Core, as published

Nine lifecycle stages, with the tools each stage page lists:

| Stage | Name | Tools |
|---|---|---|
| 1 | Setup | hve-core-installer, git-setup |
| 2 | Discovery | rpi-research, brd-builder, security-planner, sssc-planner, rai-planner |
| 3 | Product Definition | prd-builder, requirements-author, adr-creation, architecture-diagrams, security-planner, sssc-planner, rai-planner |
| 4 | Decomposition | functional-planner, backlog-manager |
| 5 | Sprint Planning | backlog-manager, backlog-management |
| 6 | Implementation | RPI Agent, rpi-plan, rpi-implement, hve-builder |
| 7 | Review | rpi-review, code-review, hve-builder |
| 8 | Delivery | git-merge, backlog-management |
| 9 | Operations | documentation, hve-builder, incident-response |

The HVE Guide index page also lists dt-coach in Discovery and pull-request and git-commit in Delivery; the lifecycle overview leaves them out. The journey follows the stage pages and shows those three as supporting tools.

Transitions that the journey must show, because a straight line would teach the wrong thing:

* All three Design Thinking exits feed rpi-research in Discovery.
* Discovery can skip straight to Decomposition when the BRD is enough.
* Review sends work back to Implementation for rework, Delivery to Implementation for the next sprint, and Operations to Implementation for a hotfix.
* rpi-research can send work back to DT Coach when the problem statement doesn't hold.

Design Thinking has nine methods in three spaces: Problem (scope conversations, design research, input synthesis), Solution (brainstorming, user concepts, low-fidelity prototypes) and Implementation (high-fidelity prototypes, user testing, iteration at scale). Each space has an exit to rpi-research. Handoffs mark findings `validated`, `assumed`, `unknown` or `conflicting`.

RPI is Research when the evidence is missing, then Plan with a critique, Implement, Review and Follow-up. Entry points are `/rpi`, RPI Agent and the phase skills. The RPI Workflow Canvas is a host panel that shows one live RPI session's `.copilot-tracking/` files and sends your answers to the agent. The journey doesn't repeat it.

Every tool named above is in the installed plugin. Output paths checked in the plugin source:

| Tool | Writes to |
|---|---|
| DT Coach | `.copilot-tracking/dt/{project}/` |
| BRD Builder | `docs/project-planning/` and `.copilot-tracking/brd-sessions/` |
| PRD Builder | `docs/project-planning/` and `.copilot-tracking/prd-sessions/` |
| adr-creation | `.copilot-tracking/adr-plans/{slug}/`, then `docs/planning/adrs/` |
| functional-planner | `.copilot-tracking/github-issues/prds/` (or `workitems/`, `jira-issues/`) |
| backlog-manager | `.copilot-tracking/github-issues/sprint/{milestone}/` (or the `workitems/` equivalent) |
| rpi-research, rpi-plan, rpi-implement, rpi-review | `.copilot-tracking/research/`, `plans/`, `changes/`, `reviews/logs/` |
| incident-response | `docs/incident-response/` |

One mismatch: incident-response is written for Azure services. This app runs locally, so chapter 11 uses its triage, diagnosis, mitigation and root-cause structure and skips its Azure tooling.

## Reuse and gaps

| Reuse as is | Reuse with a small change | Build new |
|---|---|---|
| Server, routing pattern, `get()`/`esc()` helpers style, Fluent tokens, focus styles, toast region, Menu drawer pattern | Move the `:root` tokens into `tokens.css` so both pages share them; add one sidebar link; rename the issue map's step chips | `/journey` page and its script; `/api/journey` with the on-disk check; chapter content files; reference-run folder |
| Character cards, case file, run sheet, chaos card and board scripts in `docs/facilitator.md` | Run sheet becomes the one-day track; steps table in `docs/exercises.md` becomes the chapter table | Coach prompts and common mistakes per chapter, which no document has yet |
| Business impact, Gauntlet, Investment Board and chaos cards as the evidence screens | | Decomposition and sprint-planning activities, which the current workshop skips |
