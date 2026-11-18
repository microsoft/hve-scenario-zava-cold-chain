# Method 1 — Scope Boundaries (draft, lo-fi)

Project: Zava Cold Chain Monitor — Prototype to Production

## Original request (verbatim)

> Zava's Cold Chain Monitor is a 5-store pilot prototype: local only, no sign-in, simulated controllers, a rule-based store assistant and a shared vendor account. The board wants it running in all 400 stores within 12 months. What has to change to take it from prototype to a production service that store staff, food safety and IT can trust, without losing what it protects today?

## Frozen vs fluid classification

**Classified: frozen**, with a fluid problem underneath.

The request names a specific existing system (Cold Chain Monitor, simulated controllers, rule-based assistant, shared vendor account) and a specific solution-shaped target (all 400 stores, 12 months). That combination of named technology plus named context is the frozen signal from Method 1 guidance. But it also asks an open question in its own last sentence — "what has to change... without losing what it protects today" — which is a fluid, undiscovered problem wearing a frozen request's clothes. Coaching approach: acknowledge the board's thinking (a scale decision already feels made), then ask what's driving "12 months" and "all 400 stores," and what "trust" means to each of store staff, food safety and IT separately, since those three may not mean the same thing.

## In scope for this stage (problem space: Methods 1-3)

* Discovering why the pilot behaves the way it does for the people who rely on it (night cover, technician, food-safety officer, regional IT, vendor support).
* Surfacing the gap between what the pilot *appears* to protect (temperatures, stock, trust) and what it actually protected on the worst recorded night (`silent-night`: ~€260k pilot-region cost, 5 of 20 warm cases found by an alarm, slowest detection 5h46m — `docs/exercises.md`).
* Mapping ownership, identity, and alarm-trust gaps as lived experience, not yet as fixes.
* Framing the problem(s) the 400-store rollout must solve, and producing how-might-we statements.

## Explicitly out of scope for this stage

* Any specific technical fix (sign-in method, named vendor accounts, command guardrails, assistant rules). The fix catalogue in `data/fixes.json` (FX-1 through FX-8) is downstream solution-space material for Methods 4+ and for PRD/Security/RAI planning — not something to design or endorse here.
* Architecture or infrastructure decisions for 400-store scale.
* Cost/budget trade-offs beyond citing the Cost-of-a-Silent-Night figures as motivation.
* Deciding the store assistant's fate (go to all 400 stores or not) — that is the Investment Board's call downstream.

## What's already known vs what's assumed

See `assumptions-log.md` for the full list. Headline tension to validate with the panel: the pilot's design choices (no sign-in, shared vendor account, alarm silenced in defrost, assistant reads unverified notes) each have a *documented original reason* (tickets ZFW-203, ZFW-305, ZFW-112, ZFW-288) — these were not oversights, they were trade-offs made for a 5-store pilot. The scope question is whether those same trade-offs survive 400 stores, and who gets to decide that.

## Open questions carried into stakeholder conversations

1. What does "trust" mean separately to store staff, food safety and IT — are they even the same requirement?
2. What in the current pilot must **not** change (the exercise names one: "a scheduled defrost that ends on time raises no alarm" — `docs/exercises.md`)? Are there others each role would name?
3. Why 12 months and why all 400 at once — is there a driving event, contract, or board commitment behind that number?
4. Who currently owns the gaps that have no owner today (fleet commands, store assistant, named sender identity)?

## Carry-forward to Method 2 (Design Research)

* Interview targets: night store manager (or regional night cover equivalent), refrigeration technician, food-safety officer, regional IT, vendor support, plus an executive sponsor for the business framing.
* Focus areas: the lived meaning of "trust," what routine/planned work looks like night to night, and how each role currently decides what to do when something looks wrong.
* The technician's claim to check per the scenario card: "a defrost always ends after 30 minutes, I think" (`docs/exercises.md`) — note the runbook claims defrosts are both scheduled for exactly 20 minutes twice nightly (`data/runbook.md`) and separately says "no action is needed because defrosts always end after 30 minutes" — two different numbers for the same claim, already worth a research question.
