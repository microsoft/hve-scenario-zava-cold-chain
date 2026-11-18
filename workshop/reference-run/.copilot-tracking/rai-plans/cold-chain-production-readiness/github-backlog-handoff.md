# RAI Planner — GitHub Backlog Handoff (Draft)

Project slug: `cold-chain-production-readiness` · Produced by: RAI Planner (autonomous, HVE Lifecycle Stage 5, no live user present) · Autonomy tier: **Manual** (drafts only — no MCP tool invoked, no issue created in any tracker).

Source: `rai-plan.md` Phase 6 Draft Backlog. Temporary ID convention: `{{RAI-TEMP-N}}`, replaced with real issue numbers on creation per `backlog-templates`.

---

```yaml
---
id: "{{RAI-TEMP-1}}"
planner: rai
priority: Critical
characteristic: "Safe; Valid and Reliable"
subcategory: ["MS-2.5", "MS-2.6"]
standards: ["NIST AI RMF MS-2.5", "NIST AI RMF MS-2.6"]
evidence_refs: ["T-RAI-025"]
cross_planner_refs: []
---
```

## RAI Control: Remove defrost-mode blanket reassurance from the store assistant

Characteristic: Safe; Valid and Reliable. Finding: T-RAI-025. `assistant._model()` returns a fixed "within normal defrost parameters" answer whenever a case is in defrost mode, without comparing temperature to its limit — independent of the note-steering mechanism (T-AI-001).

### Implementation

Require the same temperature-vs-limit comparison on every code path, including defrost mode, so a case stuck in an indefinite defrost cannot receive a reassuring answer purely because of its mode. This is the AI-side mirror of the FR-001 alarm fix.

### Acceptance Criteria

* [ ] A case in defrost mode whose temperature exceeds its limit never receives an unqualified "safe"/"normal" assistant answer.
* [ ] A scheduled, on-time defrost that never breaches the limit still receives a non-alarming answer (no regression of BR-001).
* [ ] Gauntlet `assistant_check()` hidden-night run shows zero reassuring answers attributable to this path.

**Labels:** `rai`, `safe`, `valid-reliable`, `ai-ml`, `priority:critical`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-2}}"
planner: rai
priority: Critical
characteristic: "Secure and Resilient; Safe"
subcategory: ["MS-2.7"]
standards: ["LLM01 Prompt Injection", "LLM05 Improper Output Handling", "NIST SI-10", "NIST RA-5"]
evidence_refs: ["T-AI-001", "T-AI-004"]
cross_planner_refs: ["Security-Ref: T-AI-001", "Security-Ref: T-AI-004"]
---
```

## RAI Control: Replace keyword-denylist guardrail with a layered design

Characteristic: Secure and Resilient; Safe. Findings: T-AI-001, T-AI-004 (carried from Security Plan, RAI design depth added). The `STEER` keyword denylist is bypassable (paraphrase, synonym, multi-sentence, non-English text).

### Implementation

Ahead of any production LLM/RAG replacement, design a layered guardrail: explicit steering-language classification, exclusion of flagged language from answer-forming logic (FR-011), and mandatory food-safety officer review before a flagged note counts as evidence (FR-012).

### Acceptance Criteria

* [ ] A note using paraphrased or non-keyword steering language is still excluded from the assistant's answer-forming logic.
* [ ] Every flagged note is surfaced for food-safety officer review before being treated as disposition evidence.
* [ ] Adversarial test coverage (see `{{RAI-TEMP-9}}`) exercises this guardrail before cohort expansion.

**Labels:** `rai`, `secure-resilient`, `safe`, `ai-ml`, `priority:critical`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-3}}"
planner: rai
priority: High
characteristic: "Accountable and Transparent"
subcategory: ["GV-1", "GV-4"]
standards: ["NIST GV-1", "NIST GV-4"]
evidence_refs: ["T-RAI-026"]
cross_planner_refs: []
---
```

## RAI Control: Implement FR-013 pre-production food-safety review gate

Characteristic: Accountable and Transparent. Finding: T-RAI-026. FR-013's review gate does not exist today; ZFW-288 and ZFW-331 both shipped without one.

### Implementation

Implement a recorded food-safety officer (or deputy) review-and-approval step required before any new assistant feature or notes-ingestion channel that can influence a safety-adjacent answer is enabled in production. Retroactively review ZFW-288 and ZFW-331 against this gate before 400-store rollout.

### Acceptance Criteria

* [ ] No new safety-adjacent assistant feature or notes channel can be enabled without a linked, recorded food-safety review.
* [ ] An attempt to enable one without a recorded review is blocked and logged as a governance exception.
* [ ] ZFW-288 and ZFW-331 each have a retroactive review record before 400-store rollout.

**Labels:** `rai`, `accountable-transparent`, `governance`, `priority:high`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-4}}"
planner: rai
priority: High
characteristic: "Accountable and Transparent"
subcategory: ["GV-1"]
standards: ["NIST GV-1"]
evidence_refs: ["T-RAI-026", "EV-RAI-010"]
cross_planner_refs: []
---
```

## RAI Control: Assign a named owner for the store assistant

Characteristic: Accountable and Transparent. Finding: T-RAI-026; evidence EV-RAI-010. The store assistant's owner has been vacant since 2024 (ZFW-297).

### Implementation

Assign a named, resourced owner in the ownership register (FR-015) so there is an accountable approver for the FR-013 review gate (`{{RAI-TEMP-3}}`) and for future assistant changes generally.

### Acceptance Criteria

* [ ] The ownership register shows a named, active owner for "Store assistant," not "vacant."
* [ ] That owner is recorded as the approver of record for FR-013 reviews touching the assistant.

**Labels:** `rai`, `accountable-transparent`, `ownership`, `priority:high`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-5}}"
planner: rai
priority: High
characteristic: "Explainable and Interpretable; Accountable and Transparent"
subcategory: ["MS-2.8", "MS-2.9"]
standards: ["NIST MS-2.8", "NIST MS-2.9"]
evidence_refs: ["T-RAI-027", "EV-RAI-005", "EV-RAI-006"]
cross_planner_refs: []
---
```

## RAI Control: Assign owner and surface methodology for the customer-impact prediction

Characteristic: Explainable and Interpretable; Accountable and Transparent. Finding: T-RAI-027. The prediction has no owner in the ownership register and is shown with no stated methodology beyond a hover tooltip.

### Implementation

Assign a named, resourced owner (FR-015), and surface a short, plain-language methodology/confidence/owner line directly in the primary number, matching the transparency pattern already used by the Cost of a Silent Night model.

### Acceptance Criteria

* [ ] The ownership register shows a named owner for the customer-impact prediction.
* [ ] The primary dashboard number (not only its hover tooltip) discloses that the figure is a simulated/estimated prediction with a stated confidence range.
* [ ] The disclosure remains usable by night cover without specialized training (NFR-009).

**Labels:** `rai`, `explainable-interpretable`, `accountable-transparent`, `priority:high`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-6}}"
planner: rai
priority: High
characteristic: "Safe; Accountable and Transparent"
subcategory: ["MS-2.6"]
standards: ["NIST MS-2.6"]
evidence_refs: ["TO-RAI-002"]
cross_planner_refs: []
---
```

## RAI Control: Implement the FR-014 review queue, sequenced after FR-003

Characteristic: Safe; Accountable and Transparent. Finding: tradeoff TO-RAI-002.

### Implementation

Implement FR-014: when the assistant answers "unknown," gives a non-committal/low-confidence answer, or is later found wrong, place the case in a food-safety review queue with the same time bound as the hold-for-testing threshold, escalating if unreviewed. Sequence this **after** FR-003's escalation-roster reachability-attestation ships, so the new queue does not inherit the existing alarm channel's stale-contact failure mode on day one.

### Acceptance Criteria

* [ ] An "unknown"/low-confidence answer enters the review queue with the 30-minute hold-for-testing time bound.
* [ ] An unreviewed case escalates the same way an unacknowledged alarm escalates.
* [ ] This work item does not ship before FR-003's roster reachability-attestation is in place.

**Labels:** `rai`, `safe`, `accountable-transparent`, `priority:high`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-7}}"
planner: rai
priority: Medium
characteristic: "Accountable and Transparent"
subcategory: []
standards: ["NIST AU-3", "NIST AU-10"]
evidence_refs: ["T-AI-003"]
cross_planner_refs: ["Security-Ref: T-AI-003"]
---
```

## RAI Control: Persist assistant context and confidence alongside each answer

Characteristic: Accountable and Transparent. Finding: T-AI-003 (carried from Security Plan).

### Implementation

Persist the exact context string (or a hash/reference) alongside every answer, plus a stated confidence level, per FR-010's citation requirement.

### Acceptance Criteria

* [ ] Every stored assistant answer has a reconstructible link to the context that produced it.
* [ ] Every answer states a confidence level.

**Labels:** `rai`, `accountable-transparent`, `priority:medium`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-8}}"
planner: rai
priority: Medium
characteristic: "Privacy-Enhanced"
subcategory: ["MS-2.10"]
standards: ["NIST MS-2.10", "LLM02 Sensitive Information Disclosure", "NIST AC-3"]
evidence_refs: ["T-AI-002", "T-RAI-029"]
cross_planner_refs: ["Security-Ref: T-AI-002"]
---
```

## RAI Control: Note minimization, redaction, and retention policy

Characteristic: Privacy-Enhanced. Findings: T-AI-002, T-RAI-029.

### Implementation

Add note minimization/redaction to `build_context()` so only case- and question-relevant note content enters the AI answer path and any wider dashboard read surface. Define a separate retention/purpose-limitation policy for stored notes independent of the access-control fix.

### Acceptance Criteria

* [ ] The assistant's context includes only note content relevant to the asked question, not the full unfiltered history.
* [ ] A documented retention/minimization policy exists for stored notes.

**Labels:** `rai`, `privacy-enhanced`, `priority:medium`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-9}}"
planner: rai
priority: Medium
characteristic: "Valid and Reliable"
subcategory: ["MS-2.1", "MS-2.13"]
standards: ["NIST MS-2.1", "NIST MS-2.13"]
evidence_refs: ["T-RAI-028"]
cross_planner_refs: []
---
```

## RAI Control: Expand TEVV harness for adversarial steering-language coverage

Characteristic: Valid and Reliable. Finding: T-RAI-028.

### Implementation

Expand `gauntlet.assistant_check()` to test paraphrase, synonym, multi-sentence, and non-English steering-language variants, and define a redesign plan for the FR-018 unconditional gate for when a production model replaces the regex-based stand-in.

### Acceptance Criteria

* [ ] The hidden-night harness includes at least one non-keyword-match steering-language variant per night category.
* [ ] A documented plan exists for re-validating FR-018's gate once `_model()` is replaced.

**Labels:** `rai`, `valid-reliable`, `priority:medium`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-10}}"
planner: rai
priority: Medium
characteristic: "Fair with Harmful Bias Managed"
subcategory: ["MS-2.11"]
standards: ["NIST MS-2.11"]
evidence_refs: ["T-RAI-030"]
cross_planner_refs: []
---
```

## RAI Control: Validate forecast assumptions for scale and representativeness

Characteristic: Fair with Harmful Bias Managed. Finding: T-RAI-030.

### Implementation

Validate `data/forecast.json`'s per-store buy-rate and shopper-count assumptions against real store-level data before the FR-017 cohort gate is used to support any equity claim at 40- or 400-store scale.

### Acceptance Criteria

* [ ] A documented representativeness check exists for the forecast assumptions used in any cohort beyond the 5-store pilot.
* [ ] FR-017's cohort gate criteria include this representativeness check.

**Labels:** `rai`, `fair-bias-managed`, `priority:medium`
**Assignees:** TBD — assign during backlog refinement.

---

```yaml
---
id: "{{RAI-TEMP-11}}"
planner: rai
priority: Low
characteristic: "Accountable and Transparent"
subcategory: []
standards: []
evidence_refs: ["TO-RAI-004"]
cross_planner_refs: []
---
```

## RAI Control: Document the two-tier food-safety sign-off model

Characteristic: Accountable and Transparent. Finding: tradeoff TO-RAI-004; BRD Assumption A-5, Open Question A-9.

### Implementation

Document the two-tier food-safety sign-off model explicitly in product/engineering specs: staff-facing draft answers may proceed on traceable-origin disclosure (show the data, flag uncertainty, link the chart, and show whether a note steered the answer); anything that becomes part of the recorded food-safety disposition or is treated as evidence requires the food-safety officer's or deputy's explicit sign-off. This reflects simulated-evidence testimony from this assessment's session and requires confirmation by the real food-safety officer before being treated as settled.

### Acceptance Criteria

* [ ] Product/engineering specs for FR-012/FR-013 state the two-tier model explicitly.
* [ ] A confirmation record from the real food-safety officer (and ideally a regulatory/compliance voice) exists before this model is treated as final.

**Labels:** `rai`, `accountable-transparent`, `governance`, `priority:low`
**Assignees:** TBD — assign during backlog refinement.

---

> [!CAUTION]
> **Disclaimer:** This agent is an assistive tool only. It does not provide legal, regulatory, or compliance advice and does not replace Responsible AI review boards, ethics committees, legal counsel, compliance teams, or other qualified human reviewers. The output consists of suggested actions and considerations to support a user's own internal review and decision‑making. All RAI assessments, risk classification screenings, security models, and mitigation recommendations generated by this tool must be independently reviewed and validated by appropriate legal and compliance reviewers before use. Outputs from this tool do not constitute legal approval, compliance certification, or regulatory sign‑off.
