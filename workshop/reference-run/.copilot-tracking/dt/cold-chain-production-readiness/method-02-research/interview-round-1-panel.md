# Method 2 — Round 1 Panel Answers (raw capture)

Project: Zava Cold Chain Monitor — Prototype to Production

**Source:** Simulated Zava Stakeholder Panel, relayed by the orchestrator. **This is role-play, not real stakeholder validation.** Captured close to verbatim; not yet synthesized or theme-clustered (that is Method 3 work). Each answer below keeps the panel's own `[basis: ...]` tag.

## Raw answers by role

**Executive sponsor**
* Q1: "The 12-month, 400-store rollout is in our investor update, so it's already public. A second Silent Night would end the programme. The timeline isn't negotiable as long as the pilot proves the concept works, which it did. If evidence says otherwise, we fix it quietly and stay on schedule. I need one number I can defend to the board, and a date." *(simulated; basis: card)*
* Q2: "The board cares most about regulators and store staff. If staff don't trust the system to tell them when stock is unsafe, they'll ignore it and do their own checks, which kills the labour savings we promised. Losing trust looks like 400 stores calling in defect reports, or stock going out that shouldn't. The investor update talks about food safety compliance." *(simulated; basis: card; panel-flagged assumption that food safety is a board dependency)*

**Night store manager**
* Q3: "I walk the North rounds at 23:30 and 03:00. If a case shows 'defrost' I move on; the runbook says defrost is routine. If there's an alarm I look at the temperature history. On the night in question I had five chiller alarms in ten minutes between 01:55 and 02:50 and fixed every one. I wish I could trust that alarms were real and not noise, and that the system told me which case was the problem." *(simulated; basis: card)*
* Q4: "I've seen the door not latch maybe twice at my store, mostly when the night crew moves fast. The door sensor catches it and an alarm goes off; I go back and latch it. It's a staff issue, not a system issue." *(simulated; basis: card; data/seed.json note)*

**Refrigeration technician**
* Q5: "I'm... reasonably confident. The controller has a default. If nobody sets the minutes, it uses the default. If a defrost didn't end, someone would see it and fix it. Is there a reason you're asking?" *(simulated; basis: card)*
* Q6: "[hesitates] I wrote a note on one case because staff kept calling at night about long defrosts. I was trying to stop the noise. If an automated assistant repeats what I wrote word for word without checking, that's not the same as me telling them in person. If something's actually wrong, the note could send them the wrong way." *(simulated; basis: card, disclosed because asked directly)*

**Food-safety officer**
* Q7: "I can't sign off stock on a model's word. Show me the temperature history, the time the case spent over its limit, and when it came back. Today I tell staff stock is fine after an incident; night cover or the vendor technician may say it's 'just maintenance'. If in doubt they call me. I was never asked when technician notes were added to the assistant." *(simulated; basis: card; data/issues.json ZFW-288, ZFW-331)*

**Regional IT**
* Q8: "The shared account is a compromise the vendor contract forced. 'Store network only' gets harder to enforce consistently at 400 stores. The real problem is the shared account's password is old and static, and nothing stops it connecting at any time. At 400 stores we need credential rotation and logging on every use." *(simulated; basis: card; data/issues.json ZFW-203, ZFW-305)*
* Q9: "[sighs] That's a gap. Technically it falls to me, but I'm not set up for it. The vendor sends fleet commands under approved change windows. 'The change was approved. 02:00 to 03:00. It's in the ticket.' But if wrong values go out, it takes us a while to spot and roll back. We need someone who owns it end to end." *(simulated; basis: card; data/issues.json ZFW-231, ZFW-327)*

**Vendor support**
* Q10: "We connect on the shared account, stage the firmware or run the seasonal script, test it and close the session. Windows are tight and other jobs are queued. If every command needed approval or sign-off, we'd lose the window and reschedule. 'We ran your script, on your account, the way your ticket said.'" *(simulated; basis: card)*
* Q11: "We post notes through the vendor portal so stores stop calling about something routine. We expect store staff to see them. I didn't know a note could reach an automated assistant; that's how your platform works." *(simulated; basis: card; data/issues.json ZFW-331)*

## Panel's own suggested follow-ups (carried forward, not yet answered)

1. Who owns approval for fleet commands, and what if the engineer who runs the script also approves it?
2. If the assistant influences stock decisions, does it need food-safety sign-off the way technicians do?
3. How does night cover tell a defrost from a real problem without staring at every screen?
4. If a defrost doesn't end after 30 minutes, is that a controller bug, a monitor bug or a misunderstanding?
5. What stops a vendor engineer connecting early and running scripts on an unapproved night?

## Contradictions flagged against code/data (candidates for round 2)

* **Door-alarm belief vs. code behavior.** The night store manager describes the door as self-correcting: "the door sensor catches it and an alarm goes off... it's a staff issue, not a system issue." The code (`zava_cold_chain/simulator.py`) shows `door_open` only emits a quiet, unpaged "warn" feed event ("Door sensor: ... open"); `zava_cold_chain/alarms.py` has no distinct door rule, so the only alarm that can ever page anyone is ALM-01, the same above-limit-for-10-minutes rule that also missed the freezers on the Silent Night. The manager may be trusting a control that does not exist the way they describe it.
* **Approved-change ticket vs. executed event.** Regional IT describes approval as the control: "The change was approved. 02:00 to 03:00. It's in the ticket." Ticket ZFW-327 approves "02:00-03:00... chillers only, setpoint 4 °C." The Silent Night script (`nights/silent-night.json`) shows a vendor session opening at 00:40, a fleet defrost on **all freezers** at 01:12, and a chiller setpoint change to **9 °C** at 01:13 — a different window, a different scope, and a different value than any approved ticket on file. Nothing in `zava_cold_chain/commands.py` checks an executed command against an approval record; approval today appears to be a paper/ticket process with no technical link to what actually runs.

These two are carried into round 2 as the "contradicts the code/data" trigger, alongside the panel's own five follow-ups.
