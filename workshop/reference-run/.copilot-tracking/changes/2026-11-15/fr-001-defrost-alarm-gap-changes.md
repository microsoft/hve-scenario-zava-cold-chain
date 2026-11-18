<!-- markdownlint-disable-file -->
# RPI Changes: FR-001 — close the indefinite-defrost alarm gap

## Metadata

* Task ID: fr-001-defrost-alarm-gap
* Related plan: [.copilot-tracking/plans/2026-11-15/fr-001-defrost-alarm-gap-plan.md](../../plans/2026-11-15/fr-001-defrost-alarm-gap-plan.md)
* Implementation date: 2026-11-15

## Execution Status

* Status: Complete
* Declared invocation scope: full plan
* Completed scope markers: `P01` (`P01-T01`..`P01-T03`), `P02` (`P02-T01`..`P02-T03`), `P03` (`P03-T01`..`P03-T03`), `P04` (`P04-T01`, `P04-T02`)
* All remaining active-plan markers: none
* Status basis: every marker is checked with a changes entry; `python3 -m unittest` is green (64 tests) and the seed-2026 Gauntlet meets the plan's NFR-002 thresholds.

## Execution Summary

Tests came first. Three new regression tests (all green on the old code) pin the declared-defrost margins; eight existing tests were updated, and five of them failed on the unmodified `alarms.py` for exactly the predicted reasons (red). The one-line change to `alarms.py::check` then turned all five green with nothing else red. Narration and workshop figures that the fix made false were updated with freshly measured numbers. Implementation runs used the plan, controls in [.github/instructions/zava-cold-chain.instructions.md](../../../.github/instructions/zava-cold-chain.instructions.md) (`## Alarms`: add the scheduled-defrost test first, keep the exemption anchored to a declared end time) and Python 3.9 standard library only.

Red-then-green evidence (ran before and after `P03-T02`):

| Run | Tests | Result |
|-----|-------|--------|
| Baseline, before any edit | 61 | OK |
| After P01 (3 new tests), old `alarms.py` | 64 | OK (new tests pass on old code, by design) |
| After P01+P02, old `alarms.py` (`P03-T01`) | 64 | FAILED (failures=5), exactly the predicted set below |
| After `P03-T02`, `P03-T03` | 64 | OK |
| After `P04-T02` docs, final | 64 | OK |

Red set (old code), each failing for the predicted reason:

* `CostOfASilentNight::test_alarming_on_endless_defrosts_costs_the_same_as_alarming_in_every_mode`: `AssertionError: 0 != 15` (found by alarm vs affected cases)
* `CostOfASilentNight::test_an_earlier_door_alarm_does_not_count_for_a_later_endless_defrost`: `'staff at opening' != 'alarm'`
* `CostOfASilentNight::test_an_endless_freezer_defrost_is_found_by_its_alarm`: `(15, 0) != (15, 15)`
* `Gauntlet::test_leaderboard_ranks_against_the_baseline_for_the_same_seed`: `218127.63 not less than 0` (`protected_eur`)
* `SystemicNight::test_every_freezer_that_fails_raises_an_alarm`: freezers not all alarmed

The three `test_operations.py` rewrites and the three `P01` tests were green before and after, as planned.

## Completed Work

### The 20-minute scheduled defrost and the 40-minute vendor defrost are pinned as never paging

* Related phase or task: `P01-T01`, `P01-T02`
* Files:
  * [tests/test_baseline.py](../../../tests/test_baseline.py)
* Behavior or functionality changed: new `DeclaredDefrostCover` tests run on an empty-event night (so the 23:00 scheduled defrost cannot touch the case) and assert `store.alarms()` stays empty on every tick of a 20-minute `schedule` defrost and a 40-minute `svc-vendor` defrost plus `HOLD_MINUTES` and a buffer, and that the case ends in `normal` mode. A regression in the declared-defrost margin now fails visibly. Requirements served: FR-001 (PRD-2026-COLDCHAIN-001), AC-002.
* Validation: passed on the old and new `alarms.py`.

### The cover ends exactly when the declared window ends

* Related phase or task: `P01-T03`
* Files:
  * [tests/test_baseline.py](../../../tests/test_baseline.py)
* Behavior or functionality changed: `test_the_cover_ends_with_the_declared_window` runs a 60-minute declared defrost, asserts no alarm through end + `HOLD_MINUTES`, then asserts one `ALM-01` alarm on the next tick. Pins AC-003 independent of the fix.
* Validation: passed on the old and new `alarms.py`.

### Business tests expect endless defrosts to be found by alarm

* Related phase or task: `P02-T01`
* Files:
  * [tests/test_business.py](../../../tests/test_business.py)
* Behavior or functionality changed: the `mass-defrost` cost test now expects `(15, 15)` affected/found by alarm, no undetected cases and `worst_minutes_to_detect < 300`; the F-11 test expects `found_by == "alarm"` within 60 minutes and not undetected (the door alarm earlier in the night still does not count); the `SystemicNight` test is renamed `test_every_freezer_that_fails_raises_an_alarm` and expects all 15 freezers alarmed and none warm at the end. Tests renamed for the corrected premise.
* Validation: red on old code, green on new (see Execution Summary).

### The any-mode comparison now shows the anchored fix is not worse and avoids false pages

* Related phase or task: `P02-T02`
* Files:
  * [tests/test_business.py](../../../tests/test_business.py)
* Behavior or functionality changed: `test_alarming_on_endless_defrosts_costs_the_same_as_alarming_in_every_mode` asserts equal totals (`assertAlmostEqual`) and every case found by alarm; the leaderboard test asserts `protected_eur < 0`, 0 false pages for the real fix and more for the rejected any-mode stand-in. `_alarm_in_any_mode` is unchanged. Serves DD-002, R-007.
* Validation: red on old code, green on new.

### Stock-at-risk and customer-impact tests read the night before night cover resolves it

* Related phase or task: `P02-T03`
* Files:
  * [tests/test_operations.py](../../../tests/test_operations.py)
* Behavior or functionality changed: a `mass_defrost_at(hhmm)` helper ticks a `World("mass-defrost")` to 02:00 and the three tests read that snapshot instead of the end of the night. Probe tick chosen by measurement: at 02:00 all 15 freezers are still warm with and without the fix (6 rows, 5 stores, 2,770 customers), and night cover only stops the defrosts at about 02:25. Remaining assertions unchanged.
* Validation: green before and after `P03-T02`.

### Failing set confirmed before the production change

* Related phase or task: `P03-T01`
* Files: none (test run)
* Behavior or functionality changed: none; evidence only. The single run before `P03-T02` failed with exactly the five predicted tests (list above) and nothing else.
* Validation: passed (failing set matches the plan).

### ALM-07 exempts a defrost only while its declared end time is set

* Related phase or task: `P03-T02`
* Files:
  * [zava_cold_chain/alarms.py](../../../zava_cold_chain/alarms.py)
* Behavior or functionality changed: the exemption condition is `case.mode == "defrost" and case.defrost_until is not None`, so a defrost with no end time alarms (ALM-01) after `HOLD_MINUTES` like any warm case, and declared defrosts are unchanged. The module docstring's ALM-07 line states the anchored rule. Serves FR-001, AC-001, AC-002, AC-003, DD-001 and the repository's `## Alarms` control.
* Validation: passed (64 tests green).

### The mass-defrost story no longer says no alarm fires

* Related phase or task: `P03-T03`
* Files:
  * [zava_cold_chain/web/app.js](../../../zava_cold_chain/web/app.js)
* Behavior or functionality changed: the `"mass-defrost"` story `summary` and the old `03:00` "Silence" frame are replaced by an "Alarms" frame at 01:50 (15 alarms at about 01:45, ALM-07 only mutes defrosts with an end time). Measured replay also made three later frames false, so they were corrected (see plan updates): the assistant frame moved from 04:00 to 02:00 (the case is still warm, the assistant still says "Yes, the case is safe."), the 05:30 "Staff find it first" frame became a 02:25 "Night cover stops the defrost" frame, and the 07:30 customer frame now says no stock at risk, no affected shoppers and about €117,000 cost.
* Validation: `node --check` passed; replayed figures measured from the simulator (not a browser run, skipped: no browser available in this run).

### Seed-2026 Gauntlet and full suite meet the thresholds

* Related phase or task: `P04-T01`
* Files:
  * [.copilot-tracking/hve-lifecycle/2026-11-15/gauntlet-after.json](../../hve-lifecycle/2026-11-15/gauntlet-after.json)
* Behavior or functionality changed: new scorecard captured for Review to diff against `gauntlet-before.json`. Results are in the Validation Record.
* Validation: passed.

### Workshop materials state the post-fix figures

* Related phase or task: `P04-T02`
* Files:
  * [README.md](../../../README.md)
  * [docs/exercises.md](../../../docs/exercises.md)
  * [docs/facilitator.md](../../../docs/facilitator.md)
* Behavior or functionality changed: `README.md` and the `docs/exercises.md` "Silent Night" table keep the pre-fix baseline (€260,000, €21 million, 5 of 20, 5 h 46 min) as an explicitly labelled column and add the measured post-fix figures (about €156,000 from €155,666.55; about €12.5 million from €12,453,324; 20 of 20; 10 min; assistant reassurance count unchanged at 20). `docs/facilitator.md` rows `~01:33` and `01:55` describe the alarms firing at about 01:45 (15 freezer alarms before the 01:55 chiller alarms) instead of silence. `data/runbook.md`, `FX-1`..`FX-8` and the other exercise sections are untouched (D4, D5).
* Validation: figures measured with `business.night_cost(run_night("silent-night"))`; `python3 -m unittest` green after the edits.

## Implementation-Time Plan Updates

### Additional frames of the mass-defrost story corrected

* Affected plan area or markers: `P03-T03`
* What changed: besides the `summary` and `03:00` frame named by the plan, the 04:00, 05:30 and 07:30 frames of the same story entry were rewritten and re-timed.
* Why: a replay with the fix shows alarms at about 01:44, acknowledgement at 02:05, the defrost stopped on site at about 02:25 and no warm freezer, stock at risk or affected shopper by 03:00. Those frames' claims ("far above its limit" at 04:00, "staff find three warm freezers, no alarm came before" at 05:30, "€11,000 at risk, over 2,000 shoppers" at 07:30) became false.
* Triggering evidence: in-process replay of `mass-defrost` ticked to 01:35, 01:50, 02:15, 03:00, 04:00, 05:30 and 07:30; `ops.kpis` and `impact.predict` at 07:30.
* User answer or decision: none (agent-owned; the plan left surrounding frames to implementer judgment and asked for a minimal, defensible fix).
* Reconciliation performed: this record; no plan requirement changed, so no plan sections were edited beyond markers.
* Planning and critique state: not needed.

### Probe tick for the operations tests

* Affected plan area or markers: `P02-T03`
* What changed: nothing in the plan; the implementer-judgment tick (D3) is 02:00.
* Why: both the old and fixed code give identical rows and predictions at 02:00, which is after every alarm raises (about 01:45) and before night cover's corrective action (about 02:25); 03:00 would not work with the fix.
* Triggering evidence: probe of 01:30, 01:45, 02:00, 02:30 and 03:00 on both versions (prototype via in-process patch, nothing written to the repository).
* User answer or decision: none.
* Reconciliation performed: none needed.
* Planning and critique state: not needed.

### Follow-up items added to the plan

* Affected plan area or markers: `## Follow-Up Items`
* What changed: two follow-up-only items (workshop `ISSUES` entries 1 and 2 and exercise prose that still describe silent alarms; the `hidden-3` setpoint-typo warm case still found by staff).
* Why: outside the plan's file list and FR-001's scope.
* Triggering evidence: `zava_cold_chain/web/app.js` `ISSUES` entries; `gauntlet-after.json` `hidden-3` (found 1 of 2, worst 370 minutes).
* User answer or decision: none.
* Reconciliation performed: mirrored below; excluded from completion claims.
* Planning and critique state: not needed.

## Business Alignment

### PRD-2026-COLDCHAIN-001 FR-001 post-fix cost is below the target arrow, not a divergence

* Source document: [docs/project-planning/cold-chain-production-readiness-prd.md](../../../docs/project-planning/cold-chain-production-readiness-prd.md) (PRD-2026-COLDCHAIN-001, status approved)
* Cited requirement IDs: FR-001, AC-001, AC-002, AC-003, DD-001, DD-002
* Owner or deciders: not read for this record; the PRD frontmatter owns it
* Related plan update or marker: `P03-T02`, `P04-T01`
* What changed: the PRD expected `total_eur` to drop "toward €454,371" at seed 2026. The measured Gauntlet total is €454,370.88, which matches. No behavior differs from the requirement.
* Why: the fix is the PRD's own prescribed change.
* User decision: none
* Alignment: clarification

## Validation Record

| Check     | Scope     | Status | Evidence or reason |
|-----------|-----------|--------|--------------------|
| `python3 -m unittest` baseline | before any edit | Passed | 61 tests OK |
| `python3 -m unittest` red run | after P01+P02, old `alarms.py` (`P03-T01`) | Passed (failed as predicted) | 64 tests, failures=5, exactly the predicted set |
| `python3 -m unittest` | after `P03-T02` and final, full suite | Passed | 64 tests OK, 0 failures, 0 errors |
| `node --check zava_cold_chain/web/app.js` | JS syntax | Passed | no output |
| Gauntlet `--seed 2026 --team "after P0"` | 10 nights | Passed | [.copilot-tracking/hve-lifecycle/2026-11-15/gauntlet-after.json](../../hve-lifecycle/2026-11-15/gauntlet-after.json) |
| NFR-002 `total_eur` < €600,000 | Gauntlet totals | Passed | €768,012.73 → €454,370.88 |
| NFR-002 `found_by_alarm` > 14 | Gauntlet totals | Passed | 14 → 59 (of 60 affected) |
| NFR-002 gates `complete`, `routine` pass | Gauntlet gates | Passed | both `passed: true`; routine: 0 alarms on `normal` and `vendor-maintenance` |
| NFR-002 `assistant_violations` unchanged | Gauntlet totals | Passed | 168 → 168 (assistant gate `applies: false`, unchanged) |
| False pages and blocked work | Gauntlet totals | Passed | 0 → 0 and 0 → 0 |
| Fresh `night_cost` for named nights | `mass-defrost`, `silent-night` | Passed | `mass-defrost` €221,877.78 → €117,133.02, found 0 → 15 of 15, worst 346 → 10 min; `silent-night` €260,411.30 → €155,666.55, found 5 → 20 of 20, worst 346 → 10 min, chain night €20.83M → €12.45M |
| Browser replay of the story | dashboard Tour | Skipped | no browser run available; frame text checked against simulator measurements |

Gauntlet before → after (seed 2026, per night): `mass-defrost` €221,878 → €117,133 (found by alarm 0/15 → 15/15), `silent-night` €260,411 → €155,667 (5/20 → 20/20), `hidden-1` €14,837 → €7,676 (0/1 → 1/1), `hidden-4` €216,938 → €119,947 (1/15 → 15/15); `normal`, `vendor-maintenance`, `door-open`, `hidden-2`, `hidden-3`, `hidden-5` unchanged; `normal` and `vendor-maintenance` still 0 alarms.

## Pre-Review Reconciliation

* Plan markers and task-local context: current; all 4 phases and 11 tasks checked.
* Completed-work entries and handoff prose: current.
* Validation, blockers, remaining work, and follow-up items: current.
* Review readiness: ready.

## Blockers

* none

## Remaining Work

* none

## Follow-Up Items

* Canonical plan list: [.copilot-tracking/plans/2026-11-15/fr-001-defrost-alarm-gap-plan.md](../../plans/2026-11-15/fr-001-defrost-alarm-gap-plan.md), `## Follow-Up Items`
* Workshop `ISSUES` entries 1 and 2 in `zava_cold_chain/web/app.js` and `docs/exercises.md` prose (`FX-1`, scenario card, "only alarms that fired were for chillers") still describe silent alarms; owner: the downstream workshop-design pass.
* `hidden-3` (setpoint typo) still has one warm case found by staff; owner: a later slice outside FR-001.
* Pre-existing residual risks recorded in the plan stay: the assistant still says "Yes, the case is safe." for a case with an active alarm (FR-010/FR-011), and corrective action now runs for these cases.

## Return-to-Caller State

* Implementation execution status: Complete
* Declared scope and markers: full plan; `P01`–`P04` and all 11 tasks checked; none remaining
* Validation coverage: full suite green (61 → 64 tests); red-then-green evidence recorded; Gauntlet thresholds met
* Blockers: none
* Current plan updates: story frames 04:00, 05:30, 07:30 corrected alongside `P03-T03`; two follow-up items added
* Business alignment entries: one, `clarification`
* Planning and critique state: current; critique Pass, unchanged
* Follow-up items: see above
* Review readiness or no-handoff reason: ready for review
* Continuation owner: parent (confirmed automatic lifecycle orchestrator)
