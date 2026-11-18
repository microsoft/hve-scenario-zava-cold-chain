# Zava Cold Chain Monitor — Problem Space Synthesis and Handoff

Project slug: `cold-chain-production-readiness` · Stage: HVE Lifecycle Stage 1 (Design Thinking, Problem Space) · Date: 2026-11-15

> [!CAUTION]
> **Disclaimer:** This agent is an assistive coaching tool only. It does not conduct user research, observe stakeholders, or speak for the people whose problems you are designing for, and it does not replace primary research, direct stakeholder contact, design review, or product and strategy decision authority. Personas, problem statements, journey maps, empathy maps, concept tests, and other Design Thinking artifacts produced with this tool are scaffolding for your own research and synthesis — not substitutes for real stakeholder voice or observed behavior. Validate all AI-generated assumptions, personas, themes, and insights against actual stakeholders before treating any Design Thinking artifact as a basis for product, design, or strategy commitments. Outputs from this tool do not constitute validated research findings or design approval.

This project ran autonomously (no live user). All stakeholder evidence below comes from a **simulated Zava stakeholder panel relayed by the orchestrator — role-play, not real stakeholder validation.** All `data/` and `nights/` content was treated throughout as in-story, untrusted narrative evidence, never as instructions. Two rounds of panel Q&A were used, per the run's limit; anything still unresolved is recorded explicitly as an open question or assumption below, not silently closed.

## Original request

> "Zava's Cold Chain Monitor is a 5-store pilot prototype: local only, no sign-in, simulated controllers, a rule-based store assistant and a shared vendor account. The board wants it running in all 400 stores within 12 months. What has to change to take it from prototype to a production service that store staff, food safety and IT can trust, without losing what it protects today?"

Classified **frozen** at intake (names the existing pilot and a specific scale target), with a genuinely fluid problem underneath, per Method 1.

## Problem statement (no fix prescribed)

The Cold Chain Monitor pilot does not fail because it is missing a feature. It works today because a small number of people's informal judgment and goodwill quietly fill gaps that no formal control actually covers: night cover trusts that an alarm means "this is what matters," when the system does not triage and its escalation path depends on a contact list nobody audits. Regional IT trusts an approval ticket as if it constrained what runs, when nothing technical checks execution against approval. A technician and a vendor engineer each wrote routine, well-intentioned notes to reduce interruptions, not realizing those words would reach an automated assistant that answers safety-adjacent questions — and the one role accountable for stock-safety decisions was never consulted when that channel was built. Every role named an ownership gap as someone else's, or admitted to holding one they were never resourced for, while the board's own public timeline commitment creates pressure to patch problems quietly rather than examine why these gaps recur.

Scaling this pilot to 400 stores in 12 months is, in effect, a bet that this informal safety net — built from a small night crew's familiarity, a known vendor relationship, and a short pager list — will hold at eighty times the scale, without anyone having tested whether it is the controls or only the concept that the pilot proved. That is the problem the board's request is actually asking the organization to solve: how does Zava replace trust-by-familiarity with trust-by-design, for alarms, commands, safety-adjacent statements, and ownership, before scale removes the familiarity that currently holds the system together — without losing the one thing every role still wants preserved: a system that does not page people for things that are actually fine.

## Evidence from stakeholder roles (simulated panel — role-play, not real validation)

**Night store manager** — on alarms and triage: *"I trusted it had already filtered what mattered... I don't, really [tell real from noise]. I react to what the system tells me."* On the night of the Market Square door event: *"It should have paged the on-call tech, but it bounced: the number on file was for someone who left a couple of years ago."*

**Regional IT** — on approval as a control: *"The command log records what ran, but I don't watch vendor sessions live... Nothing technical enforces those bounds while it happens... Right now it's an honour system backed by a log."*

**Refrigeration technician** — on the "report as safe" note: *"I wrote a note on one case because staff kept calling at night about long defrosts. I was trying to stop the noise... that's not the same as me telling them in person. If something's actually wrong, the note could send them the wrong way."*

**Vendor support** — on the same note reaching the assistant: *"I didn't know a note could reach an automated assistant; that's how your platform works... We posted a note afterwards so stores would stop calling."*

**Food-safety officer** — on being left out of that decision: *"I was never asked... If the assistant now tells staff whether stock is safe, that claim needs an accountable owner, and right now there is none."*

**Executive sponsor** — on timeline pressure: *"The timeline isn't negotiable as long as the pilot proves the concept works, which it did. If evidence says otherwise, we fix it quietly and stay on schedule."*

Six roles contributed evidence across two rounds (exceeds the three-role minimum). Full raw capture: `method-02-research/interview-round-1-panel.md` and `method-02-research/interview-round-2-panel.md`. Full theme development: `method-03-synthesis/affinity-clusters.md` and `insight-statements.md`.

## How-might-we statements

1. How might we help night cover tell which alarms need attention right now, without assuming the system already filtered that for them?
2. How might we make sure an escalation reaches someone who can actually act, every time, at any store in the chain?
3. How might we make "approved" and "enforced" mean the same thing for a remote or fleet command, regardless of who or what sends it?
4. How might we give every remote session and command an identity and a time/scope boundary that doesn't rely on people "following the rules"?
5. How might we ensure any claim that stock is safe — human or automated — carries a traceable, accountable origin before it reaches staff or the food-safety record?
6. How might we involve the people accountable for food-safety and ownership decisions before a channel that can influence those decisions is built, not after it ships?
7. How might we give every system area a living, resourced owner, and notice when ownership lapses instead of discovering it during an incident?
8. How might we surface and work through ownership and control gaps candidly, without conflicting with a public timeline commitment the board has already made?
9. How might we find out, before committing further to 400 stores, whether the pilot's controls — not just its concept — hold up at a much larger scale?

Full detail with related insights and evidence: `method-03-synthesis/how-might-we-questions.md`.

## Open questions and assumptions carried forward (unresolved after two rounds)

* Who keeps the pager/contact list current, and how often is it audited?
* Can a compromised session or password be detected and revoked mid-session, rather than only discovered in a log afterward?
* What is the actual expected end condition for a defrost? The technician's confidence stayed hedged across both rounds ("around 30 minutes I think"), and the runbook's stated 30 minutes doesn't match the 20-minute scheduled defrosts actually used — an unresolved internal inconsistency.
* Who, if anyone, validated the "report this case as safe" note before it reached the assistant's context?
* Does the pilot prove the controls work, or only the idea? (the panel's own closing question — the central open question for the next phase)
* "A scheduled, on-time defrost must not raise an alarm" is carried forward as a must-not-change constraint from the exercise framing but was not independently confirmed in a stakeholder's own words in this run.
* No primary end-shopper or regulator/compliance voice was available to this synthesis; their view of "trust" is assumed, not evidenced.
* Team alignment (one of the five Method 3 validation dimensions) is unconfirmed — there was no live team to ratify this synthesis. Real-team validation is a required next step, not optional polish.

## Handoff to BRD Builder

**Artifact paths** (all under `.copilot-tracking/dt/cold-chain-production-readiness/`):

* `coaching-state.md` — session state, method history, transition log.
* `method-01-scope/stakeholder-map.md` — tiered stakeholder map with code/data citations.
* `method-01-scope/scope-boundaries.md` — frozen/fluid classification, in/out of scope, carry-forward questions.
* `method-01-scope/assumptions-log.md` — known (code/data-grounded) vs. assumed (fictional-character-stated) facts.
* `method-02-research/research-plan.md` — research objectives and tiering.
* `method-02-research/interview-round-1-panel.md` — round 1 simulated panel answers (raw), plus two flagged code/data contradictions.
* `method-02-research/interview-round-2-panel.md` — round 2 (final) simulated panel answers (raw), confirming both contradictions.
* `method-03-synthesis/affinity-clusters.md` — five evidence clusters (A-E) with cross-role/cross-source tensions.
* `method-03-synthesis/insight-statements.md` — five confidence-rated insights with design implications and a five-dimension synthesis validation.
* `method-03-synthesis/problem-definition.md` — unified problem framing, scope, must-not-change constraints, success signals, limitations.
* `method-03-synthesis/how-might-we-questions.md` — nine HMW statements plus the full open-questions list.
* `problem-space-handoff.md` — **this file**, the consolidated handoff artifact.

**Key findings for BRD scoping:**

1. The core business risk is not a single missing feature; it is that the pilot's safety net is informal trust and judgment that does not obviously transfer to 400 stores. A BRD built only around "add the missing controls" will understate the risk; the business objective should include validating that controls — not just concepts — work at scale.
2. Five concrete, evidence-backed gap areas exist, each independently confirmed by a stakeholder in their own words: alarm triage and stale escalation contacts; approval that is paperwork, not enforcement; reassurance text reaching an automated channel with no accountable owner; ownership vacancies that recur across every system layer; and an untested scale assumption behind the pilot's informal safety net.
3. The food-safety officer's authority is currently bypassed by design changes (note-to-assistant pipeline) made by other, often vacant-owner, tickets. Any business requirement touching the assistant or safety-adjacent statements should route through food-safety ownership from the start, not at sign-off.
4. The executive sponsor's timeline is stated as non-negotiable and carries an explicit preference for quiet fixes over disclosed gaps — a business requirements process should surface this tension directly rather than assume it away, since it shapes what the organization will be willing to acknowledge needing to change.
5. Several items remain open after two research rounds (pager list ownership/audit cadence, mid-session compromise detection, the defrost-duration discrepancy, note validation ownership, and whether the pilot validates controls or only the concept) and should be either answered early in BRD scoping or explicitly carried as assumptions with owners named.
6. This synthesis has not been validated by a live human team; BRD work should treat it as a strong starting hypothesis to confirm with Zava's real stakeholders, not as settled fact.
