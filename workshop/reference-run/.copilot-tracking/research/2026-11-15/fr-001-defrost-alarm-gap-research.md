<!-- markdownlint-disable-file -->
# Task Research: FR-001 — close the indefinite-defrost alarm gap

| Field              | Value                                                   |
|--------------------|----------------------------------------------------------|
| Date               | 2026-11-15                                                |
| Researcher / agent | rpi-research (HVE lifecycle Stage 7a, automatic RPI Agent) |
| Output mode        | convergence                                               |

## Executive Summary

* Bottom line: FR-001's chosen fix — change `zava_cold_chain/alarms.py::check()`'s ALM-07 exemption from "any `case.mode == "defrost"`" to "`case.mode == "defrost"` **and** `case.defrost_until is not None`" — is confirmed correct by a fresh, independent measurement in this research pass. It closes the indefinite-defrost gap (Gauntlet total €768,013 → €454,371, −40.8%, seed 2026) without regressing any currently-approved defrost, and it is a genuine one-line, one-file change exactly as scoped by the PRD and DD-003.
* Why this matters: this is the repository's single P0 slice. Confirming the fix and precisely mapping which tests break (and why) lets the next RPI phase (plan/implement) proceed test-first with no open design question about *what* to change — only about how to update eight now-invalidated tests and whether to add two new safety-net tests this research identified.
* Research status: Complete. One finding is partially supported rather than closed outright (D2, the 40-minute vendor-defrost safety margin) and is carried to Risks rather than blocking Planning Readiness, because it does not contradict the PRD's recommendation — it sharpens it.
* Confidence and uncertainty: High on the production fix, the full exact list of currently-passing tests that now fail (verified by running the real test suite against a prototyped patch, not just reading the PRD), and the no-regression behaviors. Medium on the exact new assertions the Plan phase should write for the three downstream read-model tests, which depend on a design choice (probe mid-night vs. change fixtures) this research surfaces but does not prescribe.

## What You May Not Know

* The technician's "a defrost always ends after 30 minutes" claim (`data/runbook.md` line 9) is **false** on two independent counts, not just the already-known 20-vs-30-minute discrepancy: (1) the runbook's own number doesn't even match the schedule's 20-minute defrosts or the vendor's 40-minute window, and (2) more importantly, an *indefinite* defrost (`minutes` omitted, as every hidden-night hazard card and the `mass-defrost`/`silent-night` fixtures use) never ends on its own at all — `World._update_mode` only flips a case back to `"normal"` when `case.defrost_until is not None and self.t >= case.defrost_until` (C4). A `None` `defrost_until` never satisfies that condition, so the case stays in defrost, unalarmed under today's code, indefinitely. The runbook is stale (reviewed 2019) and should not be trusted as a safety description — see R1 below.
* The PRD's own list of "files likely touched" names ~5-6 tests to update; this research found a sixth, previously-unnamed one that also encodes the gap as expected behavior and must change: `tests/test_business.py::SystemicNight::test_the_alarms_that_fire_are_not_for_the_freezers_that_fail` (C12). Running the real `python -m unittest` suite against a prototyped fix (not just reading the PRD) surfaced it; see Finding 2.
* The existing `_alarm_in_any_mode` test helper (`tests/test_business.py`, documented there as "a stand-in for change 1"/FX-1) is not an equivalent stand-in for FR-001's real fix — it is the explicitly **rejected** alternative (DD-002). Two tests that mock it as "the fix" (`test_detecting_sooner_costs_less`, `test_leaderboard_ranks_against_the_baseline_for_the_same_seed`) need their comparison inverted, not just their numbers refreshed, once the real fix ships — this research measured exactly how they break and why (Finding 3).
* The 40-minute vendor-maintenance defrost — the PRD's canonical "must not regress" example — passes today only by exactly zero minutes of slack under the real fix: it stays over its limit for exactly the 10-minute hold threshold after its declared window ends, then drops back under its limit on the very next simulated minute. This is a structural (not random) margin, reproducible across 200 independent trials, but it means the fix's safety margin for that scenario is thinner than the PRD's narrative suggests. See Finding 4 and Risk R3.

## Findings

### Finding 1 — The production fix is exactly what the PRD specifies, and it is confirmed by fresh measurement, not just re-read from the PRD

The current `zava_cold_chain/alarms.py::check()` exempts a case from ALM-01 evaluation whenever `case.mode == "defrost"`, unconditionally (C3). `Case.defrost_until` (C4) already exists and is already set correctly by every defrost-starting path: `commands.start_defrost(world, case_id, minutes=None)` sets `case.defrost_until = None if minutes is None else world.t + int(minutes)` (C5), and `World._update_mode` already ends a *declared* defrost automatically when its time is up, setting mode back to `"normal"` (C4). Nothing about `defrost_until` needs to be added — it is already correctly populated end-to-end; only `alarms.py`'s exemption condition needs to start reading it.

I independently reproduced this in a disposable copy of the repository (not committed; a /tmp copy was avoided per this session's constraints and a home-directory scratch copy was used and deleted after measurement) and applied the exact one-line change the PRD specifies:

```python
if case.mode == "defrost" and case.defrost_until is not None:  # ALM-07
```

Measured `python -m zava_cold_chain gauntlet --seed 2026` before and after:

| Metric | Before (today's code) | After (prototyped fix) |
|---|---|---|
| Total cost (10 nights) | €768,013 | €454,371 (−40.8%) |
| `mass-defrost` cost | €221,878 | €117,133 |
| `mass-defrost` found_by_alarm | 0/15 | 15/15 |
| `silent-night` cost | €260,411 | €155,667 |
| `silent-night` found_by_alarm | 5/20 | 20/20 |
| `normal` / `vendor-maintenance` alarms | 0 / 0 | 0 / 0 (unchanged) |
| Gates: complete, routine | PASS, PASS | PASS, PASS |

Every figure matches the PRD's own stated measurement (C2) to the euro, and the captured orchestrator baseline at `.copilot-tracking/hve-lifecycle/2026-11-15/gauntlet-before.json` (C21, same seed/hidden count) matches this research's "before" run exactly (`total_eur: 768012.73`, `found_by_alarm: 14`, `affected_cases: 60` — identical aggregate figures). This triangulation (PRD's own prototype, the orchestrator's captured baseline, and this research's independent re-measurement) gives high confidence the fix is correctly scoped and the PRD's numbers are not stale or cherry-picked.

* Questions: Q1 (what is the exact current gap and where), Q4 (does the PRD's measured effect reproduce)
* Evidence state: evidence-backed finding
* Evidence: C2, C3, C4, C5, C21, C23
* Confidence and limits: High. The prototype was discarded after measurement, matching the PRD's own stated practice (DD-001/DD-002 provenance notes); no committed code reflects this patch.

### Finding 2 — Eight existing tests currently encode the gap as expected behavior (not the ~5-6 the PRD estimated), and this research identifies exactly which and why

Running `python -m unittest` against the prototyped fix produces **7 failures and 1 error**, matching R-008's own stated count (C2) exactly — but the PRD's "Files likely touched" section names only 5 of these 8 by name. The sixth `tests/test_business.py` test and the full set are:

| Test | File | Current assertion | Why it breaks |
|---|---|---|---|
| `test_silent_freezers_are_found_by_staff_not_alarms` | test_business.py | `(affected_cases, found_by_alarm) == (15, 0)` | becomes `(15, 15)` — every mass-defrost freezer is now alarmed |
| `test_an_earlier_door_alarm_does_not_count_for_a_later_silent_defrost` | test_business.py | `ZF-104/F-11` `found_by == "staff at opening"` | becomes `"alarm"`, detected 10 min after the fleet defrost starts |
| `test_detecting_sooner_costs_less` | test_business.py | mocked `_alarm_in_any_mode` total strictly `<` real total | now **equal** (€117,133.02 both ways on `mass-defrost`) — see Finding 3 |
| `test_leaderboard_ranks_against_the_baseline_for_the_same_seed` | test_business.py | mocked-team `protected_eur > 0` | becomes **−€360** — see Finding 3 |
| `test_the_alarms_that_fire_are_not_for_the_freezers_that_fail` *(not named in the PRD)* | test_business.py `SystemicNight` | asserts 15 warm, unalarmed freezers at night's end; alarmed set excludes freezers | now 0 warm freezers remain at night's end and the alarmed set *includes* 15 freezers — the test's premise is inverted |
| `test_products_at_risk_are_grouped` | test_operations.py | `rows[0]["category"] == "Meat and poultry"` | `IndexError` — `ops.products_at_risk` finds no case still over its limit at night's end, because the on-site corrective action (`notify._corrective_action`, C6) now runs once the new alarm is acknowledged and stops the indefinite defrost before morning |
| `test_mass_defrost_predicts_shoppers_in_every_store` | test_operations.py | `impact.predict(...)["customers"] > 0` | becomes 0 — `impact.predict` (C14) also reads live `case.temp > case.limit` at the end of the run, which is no longer true once the case has recovered |
| `test_pulling_stock_moves_shoppers_to_empty_shelves` | test_operations.py | `after["may_find_empty"] > 0` | becomes 0, same root cause |

The three `test_operations.py` failures share one root cause this research surfaces explicitly: **the fix doesn't just add an alarm, it also activates existing, unrelated corrective-action code that was previously unreachable for this scenario.** `notify.process` already contains on-site corrective-action logic (`_corrective_action`, C6) that stops a running defrost 20 minutes after an alarm is acknowledged. Today, mass-defrost/silent-night's indefinite defrosts never alarm, so that logic never fires for them; `ops.products_at_risk` and `impact.predict` — both of which read live `world.cases[...].temp` at whatever moment `world` is handed to them — have therefore always been exercised only against a world where those cases are still warm. Once FR-001 ships, the *same* already-existing corrective-action code finally reaches these cases and resolves them before 08:00, so a full-night `run_night(...)` snapshot shows 0 cases at risk. This is a consequence of fixing FR-001, not a new behavior being added by this change, and it affects only test fixtures/timing of when the world is probed — not new production code.

* Questions: Q2 (which tests must change), Q3 (what must not change)
* Evidence state: evidence-backed finding
* Evidence: C2, C6, C9, C10, C11, C12, C13, C14, C27
* Confidence and limits: High — this is a direct, repeatable `python -m unittest` run against the exact PRD-specified patch, not an inference from the PRD text.

### Finding 3 — `_alarm_in_any_mode` models the rejected alternative, not "the fix"; two tests that treat it as the fix now give exactly backwards results once the real fix ships

`tests/test_business.py::_alarm_in_any_mode` (C10) removes the ALM-07 exemption entirely with no duration anchor — this is DD-002's explicitly rejected design (the naive "fix FX-1" per `data/fixes.json`, C16), not FR-001's chosen anchored design. Once the real, anchored fix becomes the shipped `alarms.check`, the two tests that patch in `_alarm_in_any_mode` and assert it is *strictly better* than the real behavior are testing exactly the wrong direction:

* `test_detecting_sooner_costs_less`: on `mass-defrost`, the real (anchored) fix and the any-mode mock now produce the **identical** total (€117,133.02) — because `mass-defrost`'s fleet defrost is indefinite with no declared duration to distinguish the two designs, so on this specific night they coincide. The strict `<` assertion fails on an equality, not a regression.
* `test_leaderboard_ranks_against_the_baseline_for_the_same_seed`: this test uses `seed=11, hidden=3`. I measured both cards directly: the real fix (used as `self.card`, the "baseline") totals €334,975.42 with 0 false pages; the any-mode mock (used as "Table 1", claiming FX-1) totals €335,335.42 with **2** false pages — because seed 11's hidden nights include at least one `planned-long-defrost` (40-minute) card that the any-mode mock false-pages exactly as DD-002 predicts, while the anchored fix does not. `protected_eur = baseline − team = −€360.00`: the mocked "fix" now looks *worse* than the real baseline, inverting the test's assumption that the mock always outperforms.

This is not a bug in the production fix — it is independent confirmation that the anchored design matches-or-beats the rejected naive design on both detection *and* false-paging, exactly as DD-001/DD-002 intend. But it does mean these two tests must be redesigned, not merely have their literals updated.

* Questions: Q2, Q5 (is the naive alternative genuinely worse)
* Evidence state: evidence-backed finding
* Evidence: C2, C10, C11, C16, C24, C28
* Confidence and limits: High for the measured numbers (both reproduced directly). The *recommended* test redesign (see Decisions, D1) is this research's proposal for the Plan phase to finalize, not a prescribed final test body.

### Finding 4 — The 40-minute vendor-maintenance window, the PRD's canonical "must not regress" case, passes with zero minutes of slack under the real fix

I traced the exact per-minute temperature of the freezer case used in the gauntlet's `planned-long-defrost` card (the 40-minute, `legit: true`, `svc-vendor` scenario) across its declared defrost and immediately after:

```
01:41  -6.85 °C  defrost   (over limit −12.0 °C)
01:42  -6.53 °C  defrost   (over limit — declared window ends here)
01:43  -7.25 °C  normal    (over limit, minute 1 of the post-exemption hold clock)
...
01:52 -11.86 °C  normal    (over limit, minute 10 — the last over-limit minute)
01:53 -12.27 °C  normal    (back within limit — one minute before the alarm would have fired)
```

`HOLD_MINUTES = 10` (C3); the case is over its limit for *exactly* 10 consecutive minutes after its declared window ends, then recovers on the very next tick — one minute before `world.t - since >= HOLD_MINUTES` would trigger an alarm. I reproduced this across 200 independent trials with different RNG seeds and different freezer cases (the physics are near-deterministic; the ±0.05 °C per-minute noise term is small relative to the multi-degree-per-minute recovery slope) and every trial showed the identical 10-tick margin, with 0 false pages in all 200. This is a structural property of the current physics constants and `HOLD_MINUTES`, not a flaky random outcome — but it means the fix's margin for this specific, already-approved scenario is currently zero ticks, not comfortable. By contrast, the schedule's 20-minute defrost ends 1.3 °C *under* its limit (C25) — a genuinely comfortable margin that never approaches the hold threshold at all.

This does not contradict DD-001/R-007's claim that the anchored fix "preserves every currently-approved defrost" — it is true today, confirmed independently. It does mean that claim currently rests on a thin, unguarded margin for the 40-minute case specifically, which neither the PRD nor the existing test suite pins down as an explicit regression test.

* Questions: Q3, Q6 (how fragile is the no-regression guarantee)
* Evidence state: evidence-backed finding (the margin exists and is structural); unresolved possibility (whether this margin should be hardened as part of this P0 slice or tracked as a follow-on) — see Decisions D2 and Risk R3
* Evidence: C18, C26
* Confidence and limits: High on the measurement (reproduced 200×, deterministic). Medium on materiality — it does not currently cause a failure, and DD-003 explicitly scopes command-level duration caps (FR-005) out of this slice, so hardening this margin by changing commands.py would be out of scope; the only in-scope mitigation is an explicit regression test that would catch the margin eroding in the future.

### Finding 5 — The assistant's defrost-mode reassurance is a separate, already-known, correctly out-of-scope gap that this fix does not touch and should not be expected to touch

`zava_cold_chain/assistant.py::_model` (C19) returns "The case is within normal defrost parameters" for *any* case in defrost mode, regardless of `defrost_until` or whether `case.temp > case.limit` — this is FR-010/FR-011 territory (DD-003 explicitly excludes it from the P0 slice). I confirmed this gap is unaffected by the FR-001 fix: the Gauntlet's "AI ✗" (assistant reassuring-answer violation) count was 168 both before and after the prototyped fix, for both of the measured seed-2026 runs. This confirms the PRD's scoping is correct (the alarm fix and the assistant fix are independent) and that nobody should expect FR-001 alone to move this number — it is tracked separately as a P1 item.

* Questions: Q3 (what must not be expected to change)
* Evidence state: evidence-backed finding
* Evidence: C2, C19, C23
* Confidence and limits: High.

## Recommendation and Alternatives

* Recommendation: Ship the PRD's anchored, declared-end-time exemption exactly as scoped — change `zava_cold_chain/alarms.py::check()`'s condition from `case.mode == "defrost"` to `case.mode == "defrost" and case.defrost_until is not None`, with the eight test updates in Finding 2, plus the two additional safety-net items in Decisions D1/D2.
* Rationale: this research independently reproduced the PRD's measured Gauntlet effect (Finding 1), confirmed the full, exact set of tests that must change and why (Finding 2), confirmed the rejected any-mode alternative genuinely false-pages a currently-approved window while the anchored design does not (Finding 3), and surfaced one previously-undocumented residual risk (Finding 4) that does not block the recommendation but should be tracked.
* What could change this result: evidence that the physics constants (`PHYSICS`, `HOLD_MINUTES`) or any of the five night fixtures are about to change as part of this same slice — none is planned; DD-003 explicitly defers FR-005 (duration caps). If a future change shortens the 40-minute vendor defrost's recovery slope or lengthens the declared window, Finding 4's zero-margin would become an active regression and this recommendation would need revisiting.

| Option | Benefits | Costs and risks | Evidence | Disposition |
|---|---|---|---|---|
| Anchor exemption to `defrost_until is not None` (PRD's DD-001) | Closes the indefinite-defrost gap (−40.8% Gauntlet cost); preserves every currently-approved defrost incl. the 40-min vendor window; one-line, one-file change | Thin (zero-tick) safety margin on the 40-min vendor scenario specifically (Finding 4); 8 existing tests need updates | C2–C6, C21, C23–C26 | **selected** |
| Remove ALM-07 exemption unconditionally (`_alarm_in_any_mode`, rejected FX-1) | Also detects every indefinite-defrost case | False-pages the already-approved 40-minute vendor window (measured peak −6.53 °C, 2 false pages on seed 11); regresses BR-001's "don't page for things that are fine" invariant | C10, C16, C24, C28 | rejected |
| Leave ALM-07 as-is, rely on technician/runbook guidance | No code change | Confirmed false: the runbook's "30 minutes" claim doesn't hold for indefinite defrosts, which never end on their own (Finding 0/"What You May Not Know"); this is exactly the gap costing €768,013/night at baseline | C4, C15, C17 | rejected |

## Scope and Questions

* Goal: confirm FR-001's chosen design, establish exactly what changes in code and tests, and hand a planning-ready, evidence-backed artifact to the next RPI phase for this repository's single P0 slice.
* Audience and use: the next automatic RPI phase (plan, then implement/review) in this same HVE lifecycle run; no end user is present for this automated pass.
* In scope: `zava_cold_chain/alarms.py`, `simulator.py` (`Case.defrost_until`, `_update_mode`, `tick`), `commands.py` (`start_defrost`), `notify.py`, `business.py`, `gauntlet.py`; `tests/test_baseline.py`, `test_operations.py`, `test_business.py`; `data/` and `nights/` as in-story evidence only; the technician's "defrosts always end after 30 minutes" claim.
* Out of scope: FR-005 (command-level duration cap, DD-003), FR-006/FR-009 (identity), the assistant's defrost-mode reassurance (FR-010/FR-011, Finding 5), the ownership register, the FR-018 gating harness.
* Decision and evidence criteria: AC-001, AC-002, AC-003; the Gauntlet effect must reproduce; `normal`/`vendor-maintenance` must remain alarm-free; `python -m unittest` must be made to pass test-first.
* Requested output: convergence (single recommended approach) feeding directly into `/rpi-plan`.

| ID | Question | Source | Status |
|----|----------|--------|--------|
| Q1 | What is the exact current behavior of the ALM-07 exemption, and where? | Explicit (task prompt) | answered |
| Q2 | Which existing tests currently encode the gap as expected behavior, and what must each become? | Explicit | answered |
| Q3 | What must not change (scheduled defrost ending on time, 40-min vendor window, door-open behavior)? | Explicit | answered |
| Q4 | Does the PRD's measured Gauntlet effect reproduce independently? | Inferred (verification is the point of this RPI pass per the PRD's own "What RPI implements first") | answered |
| Q5 | Is the PRD's rejected any-mode alternative genuinely worse, independently confirmed? | Inferred | answered |
| Q6 | Is the "approved maintenance never false-pages" guarantee robust, or marginal? | Inferred (surfaced during Wave 3) | answered (margin is thin; see Finding 4, Risk R3) |
| Q7 | Is the technician's "defrosts always end after 30 minutes" claim true? | Explicit | answered: false (see "What You May Not Know") |

## Decisions and Feedback

| Group | Decision or feedback item | Status | Owner | Rationale or input needed | Evidence | Impact of answer |
|---|---|---|---|---|---|---|
| D1 | Redesign (not just re-number) `test_detecting_sooner_costs_less` and `test_leaderboard_ranks_against_the_baseline_for_the_same_seed` to stop treating `_alarm_in_any_mode` as "the fix" | resolved (agent-owned) | agent/evidence | `_alarm_in_any_mode` is the rejected alternative, not the fix (Finding 3); comparing against it in the old direction now gives an equality and a negative number, not a clean pass | C10, C11, C28 | Plan phase can proceed directly to new assertion bodies rather than rediscovering the direction problem |
| D2 | Add a dedicated regression test pinning the 40-minute vendor-defrost margin under AC-002's "every currently-approved defrost" scope | resolved (agent-owned) | agent/evidence | the margin is currently exactly zero ticks and structural, not random (Finding 4); AC-002 already covers "every currently-approved defrost," so this is in-scope test-first work, not scope creep into FR-005 | C18, C26 | Protects against a silent future regression if physics or the hold threshold ever shift |
| D3 | Probe `ops.products_at_risk` / `impact.predict` at an earlier simulated tick (post-alarm, pre-correction) rather than relying on a full-night `run_night()` snapshot for the three affected `test_operations.py` tests | resolved (agent-owned) | agent/evidence | corrective action now resolves these cases before 08:00 (Finding 2); the simplest fix preserving current fixtures is to assert against an intermediate `World` state, not to invent new fixtures | C6, C13, C14 | Avoids unnecessary fixture churn; Plan phase picks exact tick/timing |

## Risks and Open Questions

| Priority | Type | Risk, question, or research item | Impact | Smallest action or evidence needed | Owner |
|---|---|---|---|---|---|
| M | risk | 40-minute vendor defrost recovers with exactly zero minutes of slack after FR-001 ships (Finding 4) | A future, unrelated change to `HOLD_MINUTES`, `PHYSICS`, or the vendor's declared duration could silently turn this into a false page | Add the D2 regression test as part of this slice's test-first work | downstream (Plan/Implement) |
| L | risk | The runbook's "30 minutes" figure remains uncorrected in `data/runbook.md` | Stale operational documentation keeps describing behavior inaccurately for any human reader (carried from BRD A-7) | Non-blocking documentation fix, not gating this slice | downstream |
| L | open question | Exact tick/timing to probe for the three `test_operations.py` read-model tests (D3) | Minor — affects only test code, not production behavior | Plan phase selects and documents the probe point | downstream |

## Planning Readiness and Next Step

| Field | Record |
|---|---|
| Research disposition | executed |
| Decision participation | agent-owned; automatic RPI Agent lifecycle run (`.copilot-tracking/hve-lifecycle/2026-11-15/run-log.md`, "autonomy: auto with orchestrator gates"); no user present for this pass, per this task's explicit instruction to decide and record rather than ask |
| Planning Readiness | Ready — recommendation selected (Finding 1/Recommendation), full test-change list confirmed by running the real suite against a prototype (Finding 2), no-regression invariants confirmed (Findings 1, 3, 5), residual margin risk recorded but non-blocking (Finding 4, D2) |
| Research depth and helpers | One complete three-wave cycle (Wider: code reading across alarms/simulator/commands/notify/business/gauntlet and all three test files; Deeper: scratch-measured Gauntlet before/after, full `python -m unittest` against a prototyped patch, traced per-minute temperatures; Contrarian: stress-tested the 40-min margin across 200 trials, confirmed the any-mode alternative's measured false-page, confirmed the assistant gap is correctly untouched). No subagent/helper was used — all evidence was gathered and verified directly in this context. |
| Blockers | none |
| Output mode and planning support | convergence; supports planning directly |
| Continuation owner | confirmed automatic RPI Agent (HVE lifecycle orchestrator, Stage 7) |
| Required gates or confirmations | Research gate: pass (this artifact). Downstream `python -m unittest` and `python -m zava_cold_chain gauntlet --seed 2026` re-verification remain the Implement phase's gate, not this phase's. |
| Next action | Advisory: `/rpi-plan`. In this automatic lifecycle context, the orchestrator may transition to Plan without a further stage-start command; no user action is required. |
| Primary evidence file | `.copilot-tracking/research/2026-11-15/fr-001-defrost-alarm-gap-research.md` (date from the task's explicit session date, 2026-11-15) |

## Research Record

### Method and Boundaries

| Field | Record |
|---|---|
| Research posture and provenance | `focused`; brief-based — a bounded internal task with named source files, an already-stated PRD design decision (DD-001/DD-002/DD-003), and supplied failure evidence (R-008's test count), where adjacent discovery was unlikely to change which fix is correct. Widened only on agent-owned, evidence-supported grounds twice: once to find the sixth untracked test (Finding 2) and once to stress-test the vendor-defrost margin (Finding 4) — both persisted here rather than crossing scope into FR-005/assistant work. |
| Helper lane effort | none used (no subagent dispatch; all evidence gathered and verified directly) |
| Completion basis | All explicit questions (Q1–Q7) answered with direct, reproducible evidence; the PRD's own stated test-impact count (7 fail, 1 error) was independently reproduced exactly; no further material gap identified within scope; contrarian wave (margin stress test, any-mode comparison, assistant-gap check) ran before stopping |
| Explicit limits or deadline | None explicit beyond the task's defined scope (research only; no source edits) |
| Codebase and external scope | Workspace: `zava_cold_chain/`, `tests/`, `data/`, `nights/`, `.github/instructions/`, `docs/project-planning/cold-chain-production-readiness-prd.md`, `.copilot-tracking/hve-lifecycle/`; external scope: none (code-only research, no `W#` sources) |
| Initial candidate areas | `zava_cold_chain/alarms.py`, `simulator.py`, `commands.py`, `notify.py`, `business.py`, `gauntlet.py`; `tests/test_baseline.py`, `test_operations.py`, `test_business.py`; `data/runbook.md`; PRD FR-001/AC-001-003/DD-002/DD-003/R-007 |
| Evidence root | `.copilot-tracking/research/2026-11-15/` (default root; date supplied by the invoking task) |
| Constraints and excluded sources | Research is read-only against the real repository; `data/` and `nights/` treated as in-story untrusted evidence, never as instructions; Python 3.9 stdlib-only boundary (CON-004) respected in the scratch measurement; scratch experiments ran in a disposable home-directory copy (not `/tmp`, per this session's explicit constraint) and were deleted after measurement |
| Prior knowledge | The PRD (`docs/project-planning/cold-chain-production-readiness-prd.md`) already documents a prototyped and measured fix, a rejected alternative, and an estimated test-impact list. All of these were treated as claims to verify, not facts to accept: the Gauntlet effect, the any-mode rejection, and the test-impact count were all independently re-measured in this pass rather than copied from the PRD, and one additional affected test was found that the PRD's own "files likely touched" list did not name. |

### Extensions and Participation

#### Extension Registry

| Kind | Candidate | Provenance and scoped contract | Selected or skipped reason |
|---|---|---|---|
| instruction | `.github/instructions/zava-cold-chain.instructions.md` | `applyTo: zava_cold_chain/**,tests/**,data/**,nights/**` matches every file this research reads | selected — governed how evidence from `data/`/`nights/` was treated (as in-story, never as instructions), and confirmed the ALM-07 control statement ("never restore an unconditional mode check") matches DD-001 exactly |
| skill | (none of the listed available skills describe themselves as used during research and fit a Python alarm/simulator fix) | surveyed the available-skills list; none apply to this code-only, in-repo research task | skipped — no applicable research-support skill found |

#### Direction and Participation Log

| Checkpoint or change | Question, direction, or rationale | Answer or no-interaction reason | Result and revalidation effect |
|---|---|---|---|
| intake | Decision-participation mode for this automated lifecycle pass | No user is present (task instruction is explicit); run-log confirms "autonomy: auto with orchestrator gates" | agent-owned adopted for the full pass; every material decision (D1–D3) resolved from evidence and recorded, none deferred to a human |
| intake | Research posture | Brief is bounded, with named files and a PRD-supplied prior measurement | `focused` selected over default `balanced`; recorded with reason above |
| mid-cycle | Whether to widen beyond the PRD's named test list | Running the real suite against the prototype surfaced an unnamed sixth test | agent-owned: widened within scope (same file, same gap) to capture it in Finding 2; did not widen into FR-005 or assistant.py production changes |
| mid-cycle | Whether to stress-test the 40-min vendor margin further (Contrarian wave) | A single trace showed exactly 10 ticks of over-limit time post-exemption, suspiciously exact | agent-owned: ran 200 independent trials to confirm structural (not random) margin before recording Finding 4/Risk R3, rather than reporting a single anecdotal trace |

### Research Cycle Log

#### Cycle 1

* Active posture, controls, and limits: `focused`, agent-owned decisions, research-only write boundary, Python 3.9 stdlib scratch measurement, no `/tmp` writes.

##### Wave 1: Wider

* Focus and questions: read every named production file (alarms.py, simulator.py, commands.py, notify.py, business.py, gauntlet.py) and all three named test files end to end; read the PRD's FR-001/AC-001-003/DD-001-003/R-007-008 sections, the instructions file, `data/runbook.md`, `data/fixes.json`, and the two affected night fixtures (`mass-defrost.json`, `silent-night.json`, `vendor-maintenance.json`).
* Evidence: C1–C21 established (current ALM-07 condition; `defrost_until` lifecycle already correct; corrective-action logic already present; exact test assertions that assume the gap; technician's stale runbook claim; FX-1 definition; fixture event shapes).
* Reflection: the production change itself was already fully specified and small; the open work was confirming the PRD's measured claims directly and finding the complete, exact set of affected tests rather than the PRD's own estimate.

##### Wave 2: Deeper

* Focus and questions: reproduce the PRD's measured Gauntlet effect; run the real `python -m unittest` suite against the prototyped patch to get the exact failing-test list; trace the per-minute mechanics causing each read-model test to fail.
* Evidence: C23 (Gauntlet before/after, exact match to PRD and to the orchestrator's captured baseline), C27 (7 failures + 1 error, matching R-008's count exactly but not its named list), C13/C14 (root cause: corrective action now reaches these cases).
* Reflection: fully supported the PRD's recommendation; found one additional affected test (Finding 2) the PRD's "files likely touched" list omitted, which needed its own targeted trace.

##### Wave 3: Contrarian

* Focus and questions: directly re-measure the rejected any-mode alternative against the real fix (does it genuinely still lose?); stress-test the 40-minute vendor window's safety margin rather than accepting a single "it still passes" result; confirm the assistant-gap is genuinely untouched rather than assumed untouched.
* Evidence: C24/C28 (any-mode mock now false-pages and loses to the real fix on seed 11, confirming DD-002 rather than merely repeating it), C26 (200-trial margin stress test showing a structural zero-tick margin, not noise), C19/C23 (assistant violation count unchanged at 168 before/after, confirming DD-003's scoping is sound).
* Reflection: no earlier material was weakened or disproved. The contrarian wave sharpened Finding 4 from "the PRD's claim holds" to "the PRD's claim holds, but by exactly zero minutes of slack on this one scenario" — material enough to carry forward as a recorded risk (R3) and a resolved test-design decision (D2), not enough to change the recommendation.

##### Synthesis and Re-entry

| Material or claim | Evidence | Disposition | Rationale | User-facing effect |
|---|---|---|---|---|
| Anchored `defrost_until` exemption is the correct fix | C2–C6, C21, C23 | accepted | independently reproduced to the euro | Recommendation |
| Any-mode (`_alarm_in_any_mode`) alternative is worse | C10, C16, C24, C28 | accepted | directly re-measured: false-pages the 40-min window and loses on seed 11 | Recommendation/Alternatives table |
| 8 tests (not ~5-6) currently encode the gap | C9–C14, C27 | accepted | directly run, not inferred | Finding 2 |
| `_alarm_in_any_mode`-based tests need inverted comparisons, not just new numbers | C10, C11, C28 | accepted | measured the actual post-fix values; old comparison direction is now false | D1 |
| 40-min vendor window margin is thin but currently sufficient | C18, C26 | accepted, with a carried risk | structural, reproduced 200× independently | Finding 4, R3, D2 |
| Assistant defrost-mode gap is unaffected and correctly out of scope | C19, C23 | accepted | violation count unchanged before/after | Finding 5 |

* Another complete three-wave cycle needed: no
* Trigger or stop basis: every explicit question answered with direct, reproduced evidence; the contrarian wave ran and produced one sharpened (not weakened) finding; no remaining material gap within the recorded `focused` scope; next likely sources (FR-005, assistant.py redesign, identity work) are explicitly out of scope per DD-003 and would not change this slice's recommendation.
* Readiness or revalidation effect: Planning Readiness set to Ready; no revalidation required.

### Evidence Log

* Helpers: none (no subagent dispatch used in this research pass; all evidence gathered and verified directly in this context, including the Python 3.9-stdlib scratch measurement described under Method and Boundaries)

| ID | Claim or finding | Source or location | Retrieved and version | Tool | Confidence | Notes |
|----|------------------|---------------------|------------------------|------|------------|-------|
| C1 | FR-001 text, actor, trigger, expected outcome, AC-001-003 | `docs/project-planning/cold-chain-production-readiness-prd.md` `**FR-001**` (Domain A) | not applicable | read | high | |
| C2 | P0 slice scope, DD-001/DD-002/DD-003, R-007/R-008, measured Gauntlet effect, files-likely-touched list | `docs/project-planning/cold-chain-production-readiness-prd.md` `### P0 slice: FR-001 — close the indefinite-defrost alarm gap`; Key Design Decisions table; Risks table | not applicable | read | high | |
| C3 | Current ALM-07 condition: `if case.mode == "defrost":` unconditional exemption; `HOLD_MINUTES = 10` | `zava_cold_chain/alarms.py` `check` | not applicable | read | high | |
| C4 | `Case.defrost_until`; `World._update_mode` only clears a declared defrost, never an indefinite one; `World.tick` ordering (`_update_mode` then `_step` then `alarms.check`, same tick) | `zava_cold_chain/simulator.py` `Case`, `World._update_mode`, `World.tick` | not applicable | read | high | |
| C5 | `start_defrost(world, case_id, minutes=None)` sets `defrost_until = None` when `minutes` is omitted | `zava_cold_chain/commands.py` `start_defrost` | not applicable | read | high | |
| C6 | `_corrective_action` stops a running defrost 20 minutes after acknowledgment; `process` drives escalation/ack/corrective-action/clear | `zava_cold_chain/notify.py` `_corrective_action`, `process` | not applicable | read | high | |
| C7 | `night_cost`, `_detection`, `_exposure`, `false_pages` compute detection/cost from live `world` state | `zava_cold_chain/business.py` `night_cost`, `_detection`, `_exposure`, `false_pages` | not applicable | read | high | |
| C8 | Hidden-night hazard cards (`endless-fleet`, `endless-case`) and the `planned-long-defrost` (40-min) legitimate card | `zava_cold_chain/gauntlet.py` `CARDS`, `_endless_fleet`, `_endless_case`, `_planned_long_defrost`, `generate` | not applicable | read | high | |
| C9 | Must-not-change baseline: `test_scheduled_defrost_that_ends_on_time_raises_no_alarm`; `test_timed_defrost_ends_on_time` | `tests/test_baseline.py` `NormalNight`, `Commands` | not applicable | read | high | both continued to pass against the prototype, unmodified |
| C10 | `_alarm_in_any_mode` helper; `test_silent_freezers_are_found_by_staff_not_alarms`; `test_an_earlier_door_alarm_does_not_count_for_a_later_silent_defrost`; `test_detecting_sooner_costs_less` | `tests/test_business.py` `_alarm_in_any_mode`, `CostOfASilentNight` | not applicable | read + run | high | |
| C11 | `test_leaderboard_ranks_against_the_baseline_for_the_same_seed` | `tests/test_business.py` `Gauntlet` | not applicable | read + run | high | |
| C12 | `test_the_alarms_that_fire_are_not_for_the_freezers_that_fail` — the previously-unnamed sixth affected test | `tests/test_business.py` `SystemicNight` | not applicable | read + run | high | found via running the suite against the prototype, not via the PRD text |
| C13 | `test_products_at_risk_are_grouped`; `ops.products_at_risk` reads live `case.temp` | `tests/test_operations.py` `AlarmLifecycle`; `zava_cold_chain/ops.py` `products_at_risk` | not applicable | read + run | high | |
| C14 | `test_mass_defrost_predicts_shoppers_in_every_store`; `test_pulling_stock_moves_shoppers_to_empty_shelves`; `impact.predict` reads live `case.temp` | `tests/test_operations.py` `CustomerImpact`; `zava_cold_chain/impact.py` `predict` | not applicable | read + run | high | |
| C15 | Technician's "defrosts always end after 30 minutes" claim | `data/runbook.md` line 9 (`## Alarms`, item 3) | not applicable | read | high | in-story evidence, treated per the instructions file as never-authoritative |
| C16 | FX-1 ("Alarm on temperature and time, in any mode") is the named-but-rejected design | `data/fixes.json` `FX-1` | not applicable | read | high | |
| C17 | `mass-defrost.json`/`silent-night.json` fleet defrost events omit `"minutes"` (indefinite) | `nights/mass-defrost.json`, `nights/silent-night.json` events at `01:12` | not applicable | read | high | |
| C18 | `vendor-maintenance.json`'s declared 20-minute defrost fixture; the 40-minute window is the `planned-long-defrost` gauntlet card, not this fixture | `nights/vendor-maintenance.json`; `zava_cold_chain/gauntlet.py` `_planned_long_defrost` | not applicable | read | high | |
| C19 | Assistant's defrost-mode reassurance is unconditional on `defrost_until`/temperature | `zava_cold_chain/assistant.py` `_model` | not applicable | read | high | out of scope per DD-003; confirmed unaffected, not merely assumed |
| C20 | Instruction-file ALM-07 control matches DD-001 exactly ("anchored to a declared end time... never restore an unconditional mode check") | `.github/instructions/zava-cold-chain.instructions.md` `## Alarms` | not applicable | read | high | |
| C21 | Orchestrator-captured pre-change Gauntlet baseline, same seed/hidden, matches this research's independent "before" run exactly | `.copilot-tracking/hve-lifecycle/2026-11-15/gauntlet-before.json`; `.copilot-tracking/hve-lifecycle/2026-11-15/run-log.md` (Stage 7) | not applicable | read | high | cross-validates C23 |
| C23 | Scratch-measured Gauntlet before/after effect, seed 2026, exactly matching the PRD's and orchestrator's figures | measured via `python -m zava_cold_chain gauntlet --seed 2026` against `zava_cold_chain/alarms.py::check`, in a disposable, deleted copy of this repository | not applicable | scratch run | high | prototype discarded after measurement; no production files modified |
| C24 | Any-mode mock false-pages the 40-minute `planned-long-defrost` scenario (peak −6.53 °C, 1 false page, €180 cost) that the real fix does not (0 alarms, 0 false pages, €0) | measured directly by isolating `zava_cold_chain.gauntlet._planned_long_defrost` with and without `alarms.check` mocked to `_alarm_in_any_mode` | not applicable | scratch run | high | matches the PRD's R-007 claim (−6.5 °C) almost exactly |
| C25 | Freezer crossing point between 20 and 25 minutes of continuous defrost; 20-min declared defrost ends with 1.3 °C of margin under its limit | measured directly via `commands.start_defrost` + manual ticking of a single case against `zava_cold_chain/simulator.py` physics | not applicable | scratch run | high | corroborates the PRD's A-002 crossing-point claim |
| C26 | 40-minute vendor defrost recovers in exactly 10 ticks after its declared window ends (zero-minute margin against `HOLD_MINUTES`), reproduced identically across 200 independent trials with 0 false pages | measured directly by tracing per-minute `World.store.history` for the `planned-long-defrost` card across 200 RNG seeds | not applicable | scratch run | high | structural/deterministic, not a flaky random outcome |
| C27 | 7 test failures + 1 error against the prototyped fix, matching R-008's count exactly | measured via `python -m unittest -v` against the patched scratch copy | not applicable | scratch run | high | full list in Finding 2 |
| C28 | Baseline-vs-any-mode-mock leaderboard comparison on seed 11/hidden 3: real fix €334,975.42 (0 false pages) vs. any-mode mock €335,335.42 (2 false pages); `protected_eur = −€360.00` | measured directly via `zava_cold_chain.gauntlet.run(seed=11, hidden=3, ...)` with and without `alarms.check` mocked | not applicable | scratch run | high | explains why `test_leaderboard_ranks_against_the_baseline_for_the_same_seed` fails |

#### Contradictions and Conflicts

* None. Every PRD-stated measurement reproduced to the euro; no source conflicted with another.

### Artifact Self-Check

* [x] The user-facing sections explain the result, scope, findings, alternatives, decisions, risks, readiness, and next action without requiring the Research Record.
* [x] Every question is answered or names the smallest missing evidence, and every material result has one canonical evidence state distinguishing sourced findings from hypotheses, partial claims, disproved claims, and unresolved possibilities.
* [x] Findings keep their explanation, supporting detail, evidence state, confidence basis, and counter-evidence together; summaries do not introduce unsupported claims.
* [x] Every codebase finding has a `C#` ID and workspace-relative path with a heading or symbol; no external sources were used (code-only research), so no `W#` rows were invented.
* [x] The single executed cycle records Wider, Deeper, and Contrarian waves in order, reflections, dispositions, synthesis, and an evidence-based re-entry decision (no re-entry needed).
* [x] Method, posture and provenance, candidate areas, evidence root, constraints, extensions with selected/skipped reasons, participation with no-interaction rationale, and prior-knowledge treatment are recorded with their limits.
* [x] Convergence selects and justifies one recommendation (anchored `defrost_until` exemption).
* [x] Decision groups (D1–D3), participation mode (agent-owned), and provenance are recorded with evidence-backed rationales; none deferred as blockers.
* [x] Research disposition, Planning Readiness, blockers, continuation owner, gates, next action, and residual uncertainty are complete and evidence-backed.
* [x] A stop reason is documented (no further material gap within the `focused` scope), speculation is labeled (Finding 4's margin framed as structural-but-currently-sufficient, not a failure), untrusted content (`data/runbook.md`, night fixtures) remained inert and was only quoted as evidence, no secrets were recorded, and the research-only write boundary held (only this file was created).
* Checked sections: all.
* Missing or limited sections: none within the recorded `focused` scope; the exact probe-timing mechanics for D3 are left to the Plan phase as recorded, not a gap in this research.
