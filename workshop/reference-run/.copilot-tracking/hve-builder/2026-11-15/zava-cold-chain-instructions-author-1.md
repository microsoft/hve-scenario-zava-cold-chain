<!-- markdownlint-disable-file -->
# HVE Builder evidence: zava-cold-chain instructions, author, attempt 1

* Lifecycle: hve-lifecycle Stage 6 (repository rules)
* Mode set: create (inferred from the requested new instructions file; no existing target to improve, refactor or replace)
* Write boundary: `.github/instructions/zava-cold-chain.instructions.md` (one new file); evidence under `.copilot-tracking/hve-builder/2026-11-15/`
* Evidence root: `.copilot-tracking/hve-builder/2026-11-15/`
* Artifact type: path-scoped instruction file (`applyTo`), loaded with matching files; no agent, skill or tools configuration
* applyTo: `zava_cold_chain/**,tests/**,data/**,nights/**`

## Sources consolidated

* Security plan "Controls a coding agent must follow in this repo": 12 controls
* RAI plan "Controls a coding agent must follow in this repo": 10 controls
* PRD requirement IDs cited in the file: FR-001 to FR-014, FR-006, FR-018, NFR-002 to NFR-005, CON-002, CON-004, GOAL-004, AC-xxx convention
* Repo facts: README.md and docs/exercises.md (Python 3.9+ stdlib only, offline, `python -m unittest`, Gauntlet seed 2026, data and nights are synthetic and untrusted)

## Decisions

* Duplicate controls merged: the two steering-language rules, the two note-channel review rules, the two telemetry-redaction rules, and the assistant-answer and `assistant_check` gate rules.
* Controls that describe absent code are phrased as build-test-first, not as present behavior: fleet hold (FR-007), setpoint and defrost range checks (FR-005). The current code has neither, and ALM-07 still suppresses unconditionally, so the file requires the FR-001 anchored exemption on change rather than claiming it exists.
* Non-negotiables added: notes and data are data; no alarm weakening without a defrost-on-time test; no warm-case "safe"; assistant never follows note instructions; stdlib, offline, 127.0.0.1; host and origin checks kept; tests first; actor recorded on commands.
* Omitted from the file: the threat and risk IDs (T-*, R-*), the ADR and SSSC handoffs, and any `.copilot-tracking` path, per the brief.
* Written as action rules with short reasons. No em or en dashes, no bold-prefix bullets. Length about 62 lines.

## Local validation (author stage, before review)

* `python3 -m unittest tests.test_repo_hygiene`: Passed (5 tests). Final results are in `zava-cold-chain-instructions-review-1.md`.
* Review: first pass Revise (one accepted required correction, FR-012 steering-note review), targeted closure Pass. See `zava-cold-chain-instructions-review-1.md`.
