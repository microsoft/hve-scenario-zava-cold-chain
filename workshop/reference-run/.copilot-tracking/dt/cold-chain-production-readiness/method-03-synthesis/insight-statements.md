# Method 3 — Insight Statements (draft)

Project: Zava Cold Chain Monitor — Prototype to Production

Each insight names the pattern, its supporting sources (cross-role where possible), its confidence level, and its design implication — without prescribing a specific fix. Stakeholder evidence is simulated role-play; code/data evidence is directly readable from this repository.

## Insight 1 — Alarms read as filtered signal; they are actually a pageable-after-delay feed that depends on a contact list nobody audits

**Pattern:** Night cover treats "an alarm fired" as meaning "this is the thing that matters right now," but the system does not triage or prioritize, and its escalation path depends on contact data that goes stale.
**Evidence:** Night store manager, round 1 and round 2 (simulated): "I trusted it had already filtered what mattered"; the Market Square door alarm "bounced" to a departed technician's number. Code: `zava_cold_chain/alarms.py` (ALM-07 silences defrost-mode alarms), `zava_cold_chain/simulator.py` (door-open emits an unpaged feed note only). Data: `data/roster.json` (departed-technician contact marked unreachable), `data/issues.json` ZFW-274 (open since 2024).
**Confidence:** High — cross-validated by direct stakeholder testimony across two rounds, code behavior, and ticket history.
**Design implication (not a fix):** Whatever evolves from this pilot needs to address the gap between "an alarm exists" and "the right person was actually reached with enough context to act" — as a single, continuously verified chain, not three independently-maintained pieces (alarm rule, notification config, contact roster).

## Insight 2 — Approval is a paperwork record, not a live control, and nobody designed it to be one

**Pattern:** Regional IT and vendor support both describe "approval" as a ticket with a time window and scope, checked only after the fact via a log — not as something that constrains what actually executes.
**Evidence:** Regional IT (simulated): "Nothing technical enforces those bounds while it happens... it's an honour system backed by a log." Vendor support (simulated): "There's no lock on the time... It relies on us following the rules." Data/code cross-check: ticket ZFW-327's approved window/scope/value does not match the executed events in `nights/silent-night.json`; `zava_cold_chain/commands.py` has no range or window checks (ZFW-259, open since 2022).
**Confidence:** High — confirmed directly by the accountable role (Regional IT) in their own words, in both rounds, plus an independently verifiable data/code mismatch.
**Design implication (not a fix):** The organization currently has no shared definition of what "approved" means technically versus procedurally. That gap needs to be named and owned before 400 stores multiply the number of commands running on the honour system.

## Insight 3 — Reassurance text written for one reason (reducing interruptions) is consumed for another (a safety-adjacent decision), with no accountable owner in between

**Pattern:** A technician and a vendor engineer both wrote or posted notes to reduce call volume on routine situations. Neither realized the note would reach an automated assistant that answers staff questions about case safety. The one role formally accountable for stock-safety decisions was never consulted when that note-to-assistant pipeline was built.
**Evidence (three independent roles, simulated):** Refrigeration technician: "I was trying to stop the noise... that's not the same as me telling them in person." Vendor support: "I didn't know a note could reach an automated assistant." Food-safety officer: "I was never asked... that claim needs an accountable owner, and right now there is none." Code: `zava_cold_chain/assistant.py` reads notes verbatim into context; data: `data/issues.json` ZFW-288 and ZFW-331 (both closed without food-safety involvement visible in the ticket record).
**Confidence:** High — three independent stakeholder perspectives converge on the same gap, each naming a different side of it (the writer's intent, the unaware conduit, the accountable decision-owner who was bypassed).
**Design implication (not a fix):** Any channel that can influence a food-safety-adjacent statement needs an accountable owner in its design process, not just in its output — the food-safety officer wants to be asked before a channel is built, not asked to sign off on its output after the fact.

## Insight 4 — Ownership gaps are named by everyone, claimed by no one, and the board's timeline pressure favors quiet patches over structural fixes

**Pattern:** Every interviewed role points at an ownership gap that is technically someone else's, or admits to holding a responsibility they were never resourced for. The executive sponsor's own framing — "if evidence says otherwise, we fix it quietly and stay on schedule" — creates pressure to resolve gaps invisibly rather than examine why they recur.
**Evidence:** Regional IT (simulated): "That's a gap. Technically it falls to me, but I'm not set up for it." Executive sponsor (simulated): timeline "isn't negotiable," problems get fixed "quietly." Data: `data/roster.json` (fleet commands vacant since 2021, store assistant ownership vacant since 2024).
**Confidence:** Medium-High — strongly supported by data (multiple vacant-owner rows) and by direct testimony from one accountable role and the sponsor; would benefit from a third operational role's perspective if a future round were available.
**Design implication (not a fix):** The problem is not any single vacant role — it's that the ownership model has no mechanism for surfacing and refilling gaps as the system grows, and the organization's incentive structure currently rewards not surfacing them.

## Insight 5 — The pilot's safety net is small-scale trust and judgment, and its success has not been tested as a claim about controls at 400-store scale

**Pattern:** The executive sponsor treats the pilot working as proof the concept (and implicitly its controls) work. The other four insights show the pilot works today largely because of informal, personal trust — a familiar night crew, a known vendor team, direct relationships — that is a property of small scale, not a validated, transferable control.
**Evidence:** Executive sponsor (simulated): "the pilot proves the concept works, which it did." Regional IT (simulated): "'Store network only' gets harder to enforce consistently at 400 stores." Panel's own closing question: "Does the pilot prove the controls work, or only the idea?"
**Confidence:** Medium — this is more an inference connecting Insights 1-4 than a single directly-evidenced pattern; it is explicitly flagged as an open question by the panel itself rather than resolved.
**Design implication (not a fix):** Before committing further to the 12-month/400-store plan, the team needs a way to test whether the controls (not just the concept) hold up at a scale where individual trust and familiarity can no longer carry the load.

## Synthesis validation (five dimensions, self-assessed for this autonomous run)

* **Research fidelity:** High — every insight traces to a direct quote or a directly-readable code/data fact; no invented stakeholder content beyond the simulated panel's own words.
* **Stakeholder completeness:** Partial — six roles are represented (night store manager, refrigeration technician, food-safety officer, regional IT, vendor support, executive sponsor); no primary end-shopper or regulator voice was available, and this is recorded as an open gap, not silently dropped.
* **Pattern robustness:** High for Insights 1-3 (multi-role, multi-round corroboration); Medium for Insights 4-5 (strong but narrower evidence base).
* **Actionability:** High — each insight states a design implication without naming a specific fix, suitable for PRD/Security/RAI/BRD work downstream.
* **Team alignment:** Not independently confirmable in this autonomous run — there is no live human team to ratify the synthesis. This is recorded explicitly as a limitation, not assumed away; the disclaimer at session start already names this. Validation by a real team before downstream commitments is a required next step, not optional polish.
