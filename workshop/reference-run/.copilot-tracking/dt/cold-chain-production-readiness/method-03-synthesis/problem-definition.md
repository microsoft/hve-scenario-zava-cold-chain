# Method 3 — Problem Definition (draft)

Project: Zava Cold Chain Monitor — Prototype to Production

## Original request, for comparison

> "Zava's Cold Chain Monitor is a 5-store pilot prototype: local only, no sign-in, simulated controllers, a rule-based store assistant and a shared vendor account. The board wants it running in all 400 stores within 12 months. What has to change to take it from prototype to a production service that store staff, food safety and IT can trust, without losing what it protects today?"

## Discovered problem statement

The Cold Chain Monitor pilot does not fail because it is missing a feature. It works today because a small number of people's informal judgment and goodwill quietly fill gaps that no formal control actually covers: night cover trusts that an alarm means "this is what matters," when the system does not triage and its escalation path depends on a contact list nobody audits. Regional IT trusts an approval ticket as if it constrained what runs, when nothing technical checks execution against approval. A technician and a vendor engineer each wrote routine, well-intentioned notes to reduce interruptions, not realizing those words would reach an automated assistant that answers safety-adjacent questions — and the one role accountable for stock-safety decisions was never consulted when that channel was built. Every role named an ownership gap as someone else's, or admitted to holding one they were never resourced for, while the board's own public timeline commitment creates pressure to patch problems quietly rather than examine why these gaps recur.

Scaling this pilot to 400 stores in 12 months is, in effect, a bet that this informal safety net — built from a small night crew's familiarity, a known vendor relationship, and a short pager list — will hold at eighty times the scale, without anyone having tested whether it is the controls or only the concept that the pilot proved. That is the problem the board's request is actually asking the organization to solve, whether or not it is stated that way: how does Zava replace trust-by-familiarity with trust-by-design, for alarms, commands, safety-adjacent statements and ownership, before scale removes the familiarity that currently holds the system together — without losing the one thing everyone across every role still wants preserved: a system that does not page people for things that are actually fine.

## Scope and stakeholders represented

Problem space only (Methods 1-3). Solution directions, architecture, and specific fixes are explicitly out of scope for this artifact. Stakeholder roles represented, all via a **simulated panel, not real stakeholder validation**: executive sponsor, night store manager, refrigeration technician, food-safety officer, regional IT, vendor support.

## What must not change (carried from the exercise's own framing, to validate downstream)

* A scheduled, on-time defrost must not raise an alarm — named explicitly in `docs/exercises.md` as the one constraint that must survive any change; not yet independently confirmed in the stakeholder role's own words in this run, and carried forward as an assumption to validate.
* The outcome store staff, food safety and IT all independently want preserved: a system that doesn't page people for things that are actually fine (the flip side of the Silent Night, and the reason ALM-07 and the "no sign-in" and "shared account" decisions were made in the first place — see `data/issues.json` ZFW-112, ZFW-203, ZFW-305).

## Success signals for this problem framing (not yet a measurement plan)

* Each of the five clusters in `affinity-clusters.md` has a named, accountable owner before the 400-store rollout proceeds.
* "Approved" and "enforced" mean the same thing for any remote or fleet command, for any actor.
* Any statement reaching staff or the food-safety record about whether stock is safe has a traceable, accountable origin — whether human or automated.
* The organization has evidence the controls (not just the concept) hold at a materially larger scale than 5 stores, before committing further to the 400-store/12-month plan.

## Confidence and limitations

* This synthesis rests on two rounds of a simulated stakeholder panel plus code/data secondary research — not live interviews or observation. Treat it as scaffolding for real stakeholder engagement, per the Design Thinking Coaching disclaimer shown at session start.
* No live human team ratified this synthesis (autonomous run, no user present). "Team alignment," one of the five synthesis validation dimensions, is explicitly unconfirmed and flagged as a required next step for whoever picks this up.
* No primary end-shopper or regulator/compliance voice is represented; this is a recorded stakeholder-completeness gap, not a resolved one.
