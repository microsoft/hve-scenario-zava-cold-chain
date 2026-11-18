# Reference run: facilitator material

> [!IMPORTANT]
> This folder gives away the answer to the workshop. It's for facilitators and coaches, and for engineers learning HVE Core on their own after the workshop. Don't open it with a table that is still working.

These are the files from one complete run of the HVE Core lifecycle on this repository, recorded on 15 November 2026 on the local branch `hve-lifecycle/prototype-to-production`. They are copied here byte for byte at their original relative paths, so `workshop/reference-run/docs/project-planning/...` is what the run wrote to `docs/project-planning/...`.

They live here, away from their working paths, for three reasons:

* The Workshop Journey checks those working paths to tell a table whether its own file exists. Reference files there would show every table as done.
* DT Coach, BRD Builder and PRD Builder look for existing sessions under `.copilot-tracking/` and offer to resume them.
* `.github/instructions/zava-cold-chain.instructions.md` would apply itself to every Copilot chat in the repo and answer the repo-rules exercise in chapter 08.

## What the run started from

> "Zava's Cold Chain Monitor is a 5-store pilot prototype: local only, no sign-in, simulated controllers, a rule-based store assistant and a shared vendor account. The board wants it running in all 400 stores within 12 months. What has to change to take it from prototype to a production service that store staff, food safety and IT can trust, without losing what it protects today?"

That's a wider question than the workshop's Silent Night, so the run's project slug is `cold-chain-production-readiness`, while the workshop uses `zava-silent-night`.

## How to read it

Start with `.copilot-tracking/hve-lifecycle/2026-11-15/assessment.md`. Its Trace section follows one requirement from a Design Thinking insight to a code change and a Night Gauntlet result.

| Chapter | Files |
|---|---|
| 03 Design Thinking | `.copilot-tracking/dt/cold-chain-production-readiness/` |
| 04 Discovery and BRD | `docs/project-planning/cold-chain-production-readiness-brd.md`, `.copilot-tracking/brd-sessions/` |
| 05 Product definition | `docs/project-planning/cold-chain-production-readiness-prd.md`, `.copilot-tracking/prd-sessions/`, `.copilot-tracking/security-plans/`, `.copilot-tracking/rai-plans/` |
| 08 Implementation | `.github/instructions/zava-cold-chain.instructions.md`, `.copilot-tracking/hve-builder/`, `.copilot-tracking/research/`, `.copilot-tracking/plans/`, `.copilot-tracking/reviews/plans/`, `.copilot-tracking/changes/` |
| 09 Review | `.copilot-tracking/reviews/logs/`, `.copilot-tracking/hve-lifecycle/2026-11-15/gauntlet-before.json` and `gauntlet-after.json` |
| The whole run | `.github/agents/hve-lifecycle.agent.md`, `.github/agents/subagents/zava-stakeholder-panel.agent.md`, `.copilot-tracking/hve-lifecycle/2026-11-15/run-log.md` |

The run produced nothing for chapters 06, 07, 10 and 11.

## Limits

* Every stakeholder answer came from a simulated panel role-playing the character cards in `docs/facilitator.md`. None of it is real stakeholder validation.
* The changes record describes a fix to alarm rule ALM-07 (FR-001). That fix is not applied on `main`: `zava_cold_chain/alarms.py` still has the planted flaw, because tables fix it during the workshop.
* Agent and model names are the ones available on 15 November 2026.

---

Zava, Inc. is a fictitious company, and all data in this scenario is synthetic. Parts of this content were created with the help of AI tools and reviewed by the maintainers.
