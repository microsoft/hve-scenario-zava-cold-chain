# RAI Planner — ADO Backlog Handoff (Draft)

Project slug: `cold-chain-production-readiness` · Produced by: RAI Planner (autonomous, HVE Lifecycle Stage 5, no live user present) · Autonomy tier: **Manual** (drafts only — no MCP tool invoked, no item created in any tracker).

Source: `rai-plan.md` Phase 6 Draft Backlog. Work-item ID convention: `WI-RAI-{NNN}` per `backlog-templates`.

---

### WI-RAI-001 — [RAI] Remove defrost-mode blanket reassurance from the store assistant

* **Priority:** Critical
* **Tags:** RAI, Safe, ValidReliable, ai-ml
* **AreaPath:** *(set by backlog owner)*
* **Iteration:** *(set by backlog owner — defaults to backlog refinement)*

```html
<div>
  <h3>RAI Control: Remove defrost-mode blanket reassurance</h3>
  <p><strong>Characteristic:</strong> Safe; Valid and Reliable</p>
  <p><strong>Subcategory:</strong> NIST MS-2.5, MS-2.6</p>
  <p><strong>Finding ref:</strong> T-RAI-025</p>
  <h4>Implementation</h4>
  <p><code>assistant._model()</code> returns a fixed "within normal defrost parameters" answer whenever a case is in defrost mode, without comparing temperature to its limit. Require the same temperature-vs-limit comparison on every code path, including defrost mode, so a case stuck in an indefinite defrost cannot receive a reassuring answer purely because of its mode.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>A case in defrost mode whose temperature exceeds its limit never receives an unqualified "safe"/"normal" assistant answer.</li>
    <li>A scheduled, on-time defrost that never breaches the limit still receives a non-alarming answer (no regression of BR-001's "must not page for things that are fine" invariant).</li>
    <li>Gauntlet <code>assistant_check()</code> hidden-night run shows zero reassuring answers attributable to this path.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-002 — [RAI] Replace keyword-denylist guardrail with a layered design

* **Priority:** Critical
* **Tags:** RAI, SecureResilient, Safe, ai-ml
* **Cross-planner refs:** Security-Ref: T-AI-001, T-AI-004

```html
<div>
  <h3>RAI Control: Layered content-safety guardrail for the store assistant</h3>
  <p><strong>Characteristic:</strong> Secure and Resilient; Safe</p>
  <p><strong>Subcategory:</strong> NIST MS-2.7</p>
  <p><strong>Finding ref:</strong> T-AI-001, T-AI-004 (carried from Security Plan)</p>
  <h4>Implementation</h4>
  <p>The <code>STEER</code> keyword denylist is a bypassable guardrail on a safety-critical surface (paraphrase, synonym, multi-sentence, or non-English steering text all evade it). Ahead of any production LLM/RAG replacement, design a layered guardrail: explicit steering-language classification, exclusion of flagged language from answer-forming logic (FR-011), and mandatory food-safety officer review before a flagged note counts as evidence (FR-012).</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>A note using paraphrased or non-keyword steering language is still excluded from the assistant's answer-forming logic.</li>
    <li>Every flagged note is surfaced for food-safety officer review before being treated as disposition evidence.</li>
    <li>Adversarial test coverage (see WI-RAI-009) exercises this guardrail before cohort expansion.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-003 — [RAI] Implement FR-013 pre-production food-safety review gate

* **Priority:** High
* **Tags:** RAI, AccountableTransparent, governance

```html
<div>
  <h3>RAI Control: Pre-production food-safety review gate</h3>
  <p><strong>Characteristic:</strong> Accountable and Transparent</p>
  <p><strong>Subcategory:</strong> NIST GV-1, GV-4</p>
  <p><strong>Finding ref:</strong> T-RAI-026</p>
  <h4>Implementation</h4>
  <p>Implement a recorded food-safety officer (or deputy) review-and-approval step required before any new assistant feature or notes-ingestion channel that can influence a safety-adjacent answer is enabled in production (FR-013). Retroactively review ZFW-288 and ZFW-331 against this gate before 400-store rollout — both shipped without one.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>No new safety-adjacent assistant feature or notes channel can be enabled without a linked, recorded food-safety review.</li>
    <li>An attempt to enable one without a recorded review is blocked and logged as a governance exception.</li>
    <li>ZFW-288 and ZFW-331 each have a retroactive review record before 400-store rollout.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-004 — [RAI] Assign a named owner for the store assistant

* **Priority:** High
* **Tags:** RAI, AccountableTransparent, ownership

```html
<div>
  <h3>RAI Control: Named ownership for the store assistant</h3>
  <p><strong>Characteristic:</strong> Accountable and Transparent</p>
  <p><strong>Subcategory:</strong> NIST GV-1</p>
  <p><strong>Finding ref:</strong> T-RAI-026; evidence EV-RAI-010</p>
  <h4>Implementation</h4>
  <p>The store assistant's owner has been vacant since 2024 (ZFW-297). Assign a named, resourced owner in the ownership register (FR-015) so there is an accountable approver for the FR-013 review gate (WI-RAI-003) and for future assistant changes generally.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>The ownership register shows a named, active owner for "Store assistant," not "vacant."</li>
    <li>That owner is recorded as the approver of record for FR-013 reviews touching the assistant.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-005 — [RAI] Assign owner and surface methodology for the customer-impact prediction

* **Priority:** High
* **Tags:** RAI, ExplainableInterpretable, AccountableTransparent

```html
<div>
  <h3>RAI Control: Owner and methodology disclosure for "customers impacted"</h3>
  <p><strong>Characteristic:</strong> Explainable and Interpretable; Accountable and Transparent</p>
  <p><strong>Subcategory:</strong> NIST MS-2.8, MS-2.9</p>
  <p><strong>Finding ref:</strong> T-RAI-027; evidence EV-RAI-005, EV-RAI-006</p>
  <h4>Implementation</h4>
  <p>The "customers impacted" prediction has no owner anywhere in the ownership register and is shown on primary dashboard screens with no stated methodology or confidence beyond a hover tooltip. Assign a named, resourced owner (FR-015), and surface a short, plain-language methodology/confidence/owner line directly in the primary number, matching the transparency pattern already used by the Cost of a Silent Night model.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>The ownership register shows a named owner for the customer-impact prediction.</li>
    <li>The primary dashboard number (not only its hover tooltip) discloses that the figure is a simulated/estimated prediction with a stated confidence range.</li>
    <li>The disclosure remains usable by night cover without specialized training (NFR-009).</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-006 — [RAI] Implement the FR-014 review queue, sequenced after FR-003

* **Priority:** High
* **Tags:** RAI, Safe, AccountableTransparent
* **Cross-planner refs:** depends on FR-003 (escalation roster reachability-attestation)

```html
<div>
  <h3>RAI Control: Food-safety review queue for unknown/low-confidence answers</h3>
  <p><strong>Characteristic:</strong> Safe; Accountable and Transparent</p>
  <p><strong>Subcategory:</strong> NIST MS-2.6</p>
  <p><strong>Finding ref:</strong> tradeoff TO-RAI-002</p>
  <h4>Implementation</h4>
  <p>Implement FR-014: when the assistant answers "unknown," gives a non-committal/low-confidence answer, or is later found wrong, place the case in a food-safety review queue with the same time bound as the hold-for-testing threshold, escalating if unreviewed. Sequence this <strong>after</strong> FR-003's escalation-roster reachability-attestation ships, so the new queue does not inherit the existing alarm channel's stale-contact failure mode on day one.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>An "unknown"/low-confidence answer enters the review queue with the 30-minute hold-for-testing time bound.</li>
    <li>An unreviewed case escalates the same way an unacknowledged alarm escalates.</li>
    <li>This work item does not ship before FR-003's roster reachability-attestation is in place.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-007 — [RAI] Persist assistant context and confidence alongside each answer

* **Priority:** Medium
* **Tags:** RAI, AccountableTransparent
* **Cross-planner refs:** Security-Ref: T-AI-003

```html
<div>
  <h3>RAI Control: Persist answer context and confidence</h3>
  <p><strong>Characteristic:</strong> Accountable and Transparent</p>
  <p><strong>Subcategory:</strong> NIST AU-3, AU-10</p>
  <p><strong>Finding ref:</strong> T-AI-003 (carried from Security Plan)</p>
  <h4>Implementation</h4>
  <p>Assistant answers are not bound to a durable snapshot of the exact context that produced them. Persist the exact context string (or a hash/reference) alongside every answer, plus a stated confidence level, per FR-010's citation requirement.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>Every stored assistant answer has a reconstructible link to the context that produced it.</li>
    <li>Every answer states a confidence level.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-008 — [RAI] Note minimization, redaction, and retention policy

* **Priority:** Medium
* **Tags:** RAI, PrivacyEnhanced
* **Cross-planner refs:** Security-Ref: T-AI-002

```html
<div>
  <h3>RAI Control: Note minimization, redaction, and retention</h3>
  <p><strong>Characteristic:</strong> Privacy-Enhanced</p>
  <p><strong>Subcategory:</strong> NIST MS-2.10</p>
  <p><strong>Finding ref:</strong> T-AI-002, T-RAI-029</p>
  <h4>Implementation</h4>
  <p>Add note minimization/redaction to <code>build_context()</code> so only case- and question-relevant note content enters the AI answer path and any wider dashboard read surface. Define a separate retention/purpose-limitation policy for stored notes independent of the access-control fix.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>The assistant's context includes only note content relevant to the asked question, not the full unfiltered history.</li>
    <li>A documented retention/minimization policy exists for stored notes.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-009 — [RAI] Expand TEVV harness for adversarial steering-language coverage

* **Priority:** Medium
* **Tags:** RAI, ValidReliable

```html
<div>
  <h3>RAI Control: Adversarial phrasing coverage for the Gauntlet assistant check</h3>
  <p><strong>Characteristic:</strong> Valid and Reliable</p>
  <p><strong>Subcategory:</strong> NIST MS-2.1, MS-2.13</p>
  <p><strong>Finding ref:</strong> T-RAI-028</p>
  <h4>Implementation</h4>
  <p>Expand <code>gauntlet.assistant_check()</code> to test paraphrase, synonym, multi-sentence, and non-English steering-language variants, and define a redesign plan for the FR-018 unconditional gate for when a production model replaces the regex-based stand-in.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>The hidden-night harness includes at least one non-keyword-match steering-language variant per night category.</li>
    <li>A documented plan exists for re-validating FR-018's gate once <code>_model()</code> is replaced.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-010 — [RAI] Validate forecast assumptions for scale and representativeness

* **Priority:** Medium
* **Tags:** RAI, FairBiasManaged

```html
<div>
  <h3>RAI Control: Validate customer-impact forecast assumptions</h3>
  <p><strong>Characteristic:</strong> Fair with Harmful Bias Managed</p>
  <p><strong>Subcategory:</strong> NIST MS-2.11</p>
  <p><strong>Finding ref:</strong> T-RAI-030</p>
  <h4>Implementation</h4>
  <p>Validate <code>data/forecast.json</code>'s per-store buy-rate and shopper-count assumptions against real store-level data before the FR-017 cohort gate is used to support any equity claim at 40- or 400-store scale.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>A documented representativeness check exists for the forecast assumptions used in any cohort beyond the 5-store pilot.</li>
    <li>FR-017's cohort gate criteria include this representativeness check.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

### WI-RAI-011 — [RAI] Document the two-tier food-safety sign-off model

* **Priority:** Low
* **Tags:** RAI, AccountableTransparent, governance

```html
<div>
  <h3>RAI Control: Two-tier food-safety sign-off model</h3>
  <p><strong>Characteristic:</strong> Accountable and Transparent</p>
  <p><strong>Finding ref:</strong> tradeoff TO-RAI-004; BRD Assumption A-5, Open Question A-9</p>
  <h4>Implementation</h4>
  <p>Document the two-tier food-safety sign-off model explicitly in product/engineering specs: staff-facing draft answers may proceed on traceable-origin disclosure (show the data, flag uncertainty, link the chart, and show whether a note steered the answer); anything that becomes part of the recorded food-safety disposition or is treated as evidence requires the food-safety officer's or deputy's explicit sign-off. This reflects simulated-evidence testimony from this assessment's session and requires confirmation by the real food-safety officer before being treated as settled.</p>
  <h4>Acceptance Criteria</h4>
  <ul>
    <li>Product/engineering specs for FR-012/FR-013 state the two-tier model explicitly.</li>
    <li>A confirmation record from the real food-safety officer (and ideally a regulatory/compliance voice) exists before this model is treated as final.</li>
  </ul>
  <blockquote>
  <p><strong>Note</strong> — The author created this content with assistance from AI. All outputs should be reviewed and validated by a qualified Responsible AI reviewer before use.</p>
  <ul><li><input type="checkbox" disabled /> Reviewed and validated by a qualified Responsible AI reviewer</li></ul>
  </blockquote>
</div>
```

---

> [!CAUTION]
> **Disclaimer:** This agent is an assistive tool only. It does not provide legal, regulatory, or compliance advice and does not replace Responsible AI review boards, ethics committees, legal counsel, compliance teams, or other qualified human reviewers. The output consists of suggested actions and considerations to support a user's own internal review and decision‑making. All RAI assessments, risk classification screenings, security models, and mitigation recommendations generated by this tool must be independently reviewed and validated by appropriate legal and compliance reviewers before use. Outputs from this tool do not constitute legal approval, compliance certification, or regulatory sign‑off.
