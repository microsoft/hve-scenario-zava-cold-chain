<!-- markdownlint-disable-file -->
# HVE Builder evidence: zava-cold-chain instructions, review, attempt 1

* Target: `.github/instructions/zava-cold-chain.instructions.md` (60 lines)
* Reviewer: HVE Builder Reviewer (`hve-core:hve-builder-review`, fresh context, read-only)
* Parent: verified every finding at its cited location before recording a disposition

## First review pass (revision: author-1)

Reviewer suggested verdict: Revise. Reviewer status: Partial, because it reported that `review-rubric.md` was not readable from its tools. The parent read the rubric and the requirements catalog directly and applied them to the verification.

| ID | Severity (reviewer) | Finding | Parent disposition | Reason |
|----|---------------------|---------|--------------------|--------|
| 1 | High | Flagged steering notes need food-safety officer review before they support a discard, hold or keep decision (FR-012); draft-only `draft_discard_list()` and `ops.decide()` as sole disposition path | Accepted, required correction | Verified: the draft-only and `ops.decide()` rule was present, but the FR-012 flagged-note review rule was missing. Added as a new bullet in the Store assistant section |
| 2 | High | Missing unconditional `assistant_check()` release gate and equal-or-stronger harness rule | Rejected | Verified present at the Store assistant section (`Keep gauntlet.assistant_check() an unconditional release gate ...`, FR-018, GOAL-004) |
| 3 | Medium | Missing steering-handling log and layered-guard rule | Rejected | Verified present (`Log steering handling so it can be reviewed. A keyword pattern alone is not an adequate guard ...`, FR-011) |
| 4 | Medium | Missing "Simulated" disclosure and real-model shipping condition | Rejected | Verified present (`Keep the "Simulated" disclosure ...`, README.md basis) |

Source check by the reviewer: no direct contradiction with the security-plan controls; no contradiction found by the parent on re-reading the RAI and security control lists.

## Correction batch

* One edit: added the FR-012 flagged-note review bullet after the steering-language bullet.

## Targeted closure (revision: author-1 plus correction)

* Finding 1: Closed. Reviewer suggested verdict Pass. No new required findings. No em or en dashes or bold-prefix bullets introduced.

## Final verdict

* Review verdict: Pass (after targeted closure of finding 1; rejected findings 2 to 4 recorded above with reasons)
* Required findings open: none
* Advisory suggestions: none recorded by the reviewer

## Local validation (revision: final)

* `python3 -m unittest tests.test_repo_hygiene`: Passed (5 tests, OK; no hidden or bidirectional characters, synthetic labels intact)
* `python3 -m unittest` (full suite, supplementary): Passed (61 tests, OK; existing tests unchanged)
* Dash, bold-prefix and `.copilot-tracking` scans on the target: no matches

## Limitations

* Host loading of the path-scoped instructions file in VS Code (applyTo matching) is not verified in this run. Deferred: confirm on a machine with VS Code Copilot by opening a file under `zava_cold_chain/` and checking the instruction is attached.
* The reviewer's verdict was not treated as binding; each finding was verified by the parent.
