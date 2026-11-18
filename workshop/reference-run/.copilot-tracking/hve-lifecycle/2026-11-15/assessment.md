<!-- markdownlint-disable-file -->
# HVE lifecycle assessment: prototype to production

## 1. Run summary

* Problem statement: Zava's Cold Chain Monitor is a 5-store pilot prototype: local only, no sign-in, simulated controllers, a rule-based store assistant and a shared vendor account. The board wants it running in all 400 stores within 12 months. What has to change to take it from prototype to a production service that store staff, food safety and IT can trust, without losing what it protects today?
* Orchestrator: .github/agents/hve-lifecycle.agent.md (HVE Builder review Pass after one correction batch), emulated from a Copilot SDK session with per-dispatch models
* Branch: hve-lifecycle/prototype-to-production (commits 2f73bd4 prototype baseline, 03d3de7 lifecycle artifacts and repo rules, 0a32969 FR-001 fix)
* Date: 2026-11-15 · rpiScope: slice · autonomy: auto with orchestrator gates
* Stakeholder evidence: every interview answer came from the simulated Zava Stakeholder Panel (Claude Haiku 4.5, role-play from docs/facilitator.md character cards). None of it is real stakeholder validation.
* Overall verdict: **Pass**. Every stage met its gate, and stage 7 met the `slice` gate. Limitations below are disclosed, not waived.

## 2. Stages

| # | Stage | Agent | Model that ran | Panel rounds | Gate | Retries | Artifacts |
|---|---|---|---|---|---|---|---|
| 0 | Orchestrator authoring | hve-builder (this session) + HVE Builder Reviewer | session model; reviewer inherited | – | Pass (Revise, then Pass after 4 accepted findings) | 1 correction batch | .github/agents/hve-lifecycle.agent.md, .github/agents/subagents/zava-stakeholder-panel.agent.md, .copilot-tracking/hve-builder/2026-11-15/hve-lifecycle-*.md |
| 1 | Design Thinking | DT Coach | claude-sonnet-5 | 2 (11 + 7 questions) | Pass | 0 | .copilot-tracking/dt/cold-chain-production-readiness/problem-space-handoff.md (+11 method files) |
| 2 | Business requirements | BRD Builder | claude-sonnet-5 | 1 (6 questions) | Pass | 0 | docs/project-planning/cold-chain-production-readiness-brd.md; .copilot-tracking/brd-sessions/ |
| 3 | Product requirements | PRD Builder | claude-sonnet-5 | 0 | Pass | 0 | docs/project-planning/cold-chain-production-readiness-prd.md; .copilot-tracking/prd-sessions/ |
| 4 | Security | Security Planner | claude-sonnet-5 | 0 | Pass | 0 | .copilot-tracking/security-plans/cold-chain-production-readiness/ |
| 5 | Responsible AI | RAI Planner | claude-sonnet-5 | 0 | Pass | 0 | .copilot-tracking/rai-plans/cold-chain-production-readiness/ |
| 6 | Repository rules | hve-builder skill + HVE Builder Reviewer | claude-haiku-5.5 | 0 | Pass (Revise, then Pass; 1 finding accepted, 3 rejected and verified by orchestrator) | 1 correction | .github/instructions/zava-cold-chain.instructions.md; .copilot-tracking/hve-builder/2026-11-15/zava-cold-chain-instructions-*.md |
| 7a | Research | rpi-research | claude-sonnet-5 | 0 | Ready | 0 | .copilot-tracking/research/2026-11-15/fr-001-defrost-alarm-gap-research.md |
| 7b | Plan | rpi-plan + plan critique | claude-sonnet-5 | 0 | Critique Pass (5 High fixed) | 0 | .copilot-tracking/plans/2026-11-15/fr-001-defrost-alarm-gap-plan.md; .copilot-tracking/reviews/plans/2026-11-15/ |
| 7c | Implement | rpi-implement | claude-sonnet-5.5 | 0 | 64/64 tests; Gauntlet thresholds met | 0 | .copilot-tracking/changes/2026-11-15/fr-001-defrost-alarm-gap-changes.md |
| 7d | Review | rpi-review | claude-sonnet-5 | 0 | Residual work only (RV-001 Medium, scenario-level) | 0 | .copilot-tracking/reviews/logs/2026-11-15/fr-001-defrost-alarm-gap-review.md |

Stage 7 gate (`slice`): FR-001 implemented tests first (five updated tests failed before the fix for the predicted reasons and passed after), every existing test passing, a review record, and Gauntlet scores before and after with seed 2026, independently reproduced by the reviewer and the orchestrator.

## 3. Trace

DT insight: the pilot runs on informal trust in controls that are thinner than people believe ("defrost is routine"; "a defrost always ends after 30 minutes") → BRD BG-001 (Cost of a Silent Night from €260,411 to under €50,000 by month 6) and BG-002 (detection) → PRD FR-001, AC-001 to AC-003, the single P0 slice → Security control 8 (keep the `defrost_until`-anchored exemption; never restore unconditional defrost suppression) and RAI T-RAI-025 (the assistant's defrost-mode reassurance, the AI-side mirror, not yet fixed) → instructions rule "Keep the defrost exemption anchored to a declared end time" → zava_cold_chain/alarms.py `check()` exempts a defrost only while `defrost_until` is set → tests `test_a_40_minute_vendor_defrost_never_pages`, `test_the_cover_ends_with_the_declared_window`, `test_scheduled_defrost_that_ends_on_time_raises_no_alarm` and the five updated business tests → Night Gauntlet seed 2026: €768,013 to €454,371 (−40.8%); warm cases found by an alarm 14/60 to 59/60; routine-night alarms 0; false pages 0; blocked work 0.

## 4. Repository fitness

| Stage | What the repository supplied | What was missing or got in the way |
|---|---|---|
| Orchestrator | A clear scenario, character cards, an offline test suite | No .github folder; the host doesn't support `agents` frontmatter, so dispatch is described in prose; live VS Code registration and per-dispatch model support not verified |
| Design Thinking | Rich in-story evidence (tickets, runbook, roster, five nights) and small, readable code that let DT Coach catch two stakeholder claims contradicting the code | No executive sponsor card (added); character cards share a file with the case-file answer key, so the run depended on an instruction not to read it |
| BRD | data/business.json, data/fixes.json and the Gauntlet gave sourced euro baselines, so targets were measurable from day one | No rollout budget, staffing or vendor-contract data; those figures are panel assumptions |
| PRD | The Gauntlet let PRD Builder prototype the slice in a scratch copy, measure it, and reject the naive fix with evidence (it false-pages the planned 40-minute vendor defrost) | Nothing material; the strongest stage |
| Security | Every threat could be tied to a code location and a ticket | No deployment, identity or infrastructure artifacts, so infra threats are reasoned rather than observed; the planner's own completeness verdict is INCOMPLETE (advisory) |
| Responsible AI | Two contrasting AI surfaces (an unexplained prediction and an explainable cost model) and a TEVV harness | No model card or data sheet for the prediction; no owner by design |
| Repository rules | Security and RAI each produced a "controls a coding agent must follow" list ready to consolidate | The plugin's generic Python instructions assume uv and Python 3.11; the new instructions file now states this repo's stdlib, Python 3.9 rule. Some rules say "keep" for behaviour not built yet |
| RPI | `python -m unittest` and the Gauntlet give objective red-green and euro evidence; the change was one line | Eight existing tests encode the planted gap as expected behaviour; fixing a planted gap conflicts with the repository's purpose as training material (RV-001) |

## 5. Findings and recommendations

1. The repository can carry a problem from discovery to a reviewed, tested, measured change with every HVE artifact, in one autonomous run. The Night Gauntlet is what makes that possible: it gives the PRD, RPI and review a shared, objective measure in euros.
2. Keep this branch separate from the default branch. FR-001 removes a planted workshop exercise (RV-001). Use the branch as the "after" reference for trainers, or as a worked example of the lifecycle, and decide about merging as a repository-governance question.
3. The next slice should be the assistant: after FR-001, the store assistant still gives 168 reassuring answers about warm stock (T-RAI-025, FR-010, FR-011). That's the largest remaining risk and the board's go/no-go question.
4. Split docs/facilitator.md into character cards and a case file, so persona subagents and interviewers can't read the answer key by accident.
5. Add a "pilot to production" data pack (rollout budget, staffing, contract dates) if future runs should derive BRD figures instead of inventing them.
6. Verify the orchestrator and panel subagent in VS Code (registration, `model:` honoured per subagent) before relying on it outside the Copilot SDK.
7. Correct data/runbook.md only on the lifecycle branch (WI-SEC-019): the runbook is deliberately wrong as in-story evidence on the default branch.

## Limitations

* All stakeholder evidence is simulated role-play by a small model. A few panel answers contained small factual slips relative to the cards and data.
* BRD and PRD sign-off are self-assessed under WAIV-001; the BRD quality reviewer returned NEEDS_REVIEW with one HIGH item carried forward.
* Security and RAI plans are drafts that support, and don't replace, qualified security and Responsible AI review.
* The implementer could not replay the dashboard story in a browser; story text was checked against simulator measurements.
