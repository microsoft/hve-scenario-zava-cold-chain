# Method 2 — Round 2 Panel Answers (final round, raw capture)

Project: Zava Cold Chain Monitor — Prototype to Production

**Source:** Simulated Zava Stakeholder Panel, relayed by the orchestrator. **This is role-play, not real stakeholder validation.** Final round — no further rounds available after this one.

## Raw answers by role

**Night store manager**
* Q1 (door-alarm contradiction): "We got an alarm that night at 23:45 when the Market Square freezer door was left open. It should have paged the on-call tech, but it bounced: the number on file was for someone who left a couple of years ago, so it escalated. Has a door stayed open longer than expected? [pauses] Not that I've noticed. But do we hear about it right away? The alarm came through eventually, once it escalated. I don't actually know we always would hear about a door staying open." *(simulated; basis: card; data/roster.json)*
* Q5 (triage follow-up): "[sighs] Five alarms between 01:55 and 02:50; I handled them as they came. If the screen says 'defrost' I move on; the runbook says it's routine. How do I tell real from noise? [pauses] I don't, really. I react to what the system tells me. I trusted it had already filtered what mattered. But if those were tangled up with something else, like a defrost that wasn't doing what it should, then handling symptoms isn't knowing the problem." *(simulated; basis: card; data/runbook.md)*

**Regional IT**
* Q2 (approval-mismatch contradiction): "The ticket is the record; we rely on the vendor to confirm when the work is done. [hesitates] The command log records what ran, but I don't watch vendor sessions live, and the shared account's password hasn't been rotated in quite a while. Nothing prevents a script running outside the window, against the wrong cases or at the wrong value. We'd see it in the log afterwards. Before morning? No. We'd find out when someone opened a case. Nothing technical enforces those bounds while it happens." *(simulated; basis: card)*
* Q3 (self-approval follow-up): "Approval sits with me: I sign off the window in the ticket. But who checks the engineer who runs it? I'd check the log afterwards, which is audit, not approval. A real approval would be live: someone watching, the system enforcing the window, or the script locked to a time and scope. Right now it's an honour system backed by a log." *(simulated; basis: card)*

**Food-safety officer**
* Q4 (assistant sign-off follow-up): "I was never asked. When I sign off stock I'm signing off temperature history and actions I can trace. Notes have owners: the technician or the vendor wrote them. If the assistant now tells staff whether stock is safe, that claim needs an accountable owner, and right now there is none. A real person should stand behind any statement about a case before it reaches the record I rely on." *(simulated; basis: card; data/issues.json ZFW-288, ZFW-331)*

**Refrigeration technician**
* Q6 (defrost-default follow-up): "I've never seen a defrost that didn't end on its own. The controller has a default, around 30 minutes I think. If one got stuck you'd hope the monitor would show it, or a temperature alarm would catch it. [hesitates] Though I wrote notes on cases where people called about long defrosts, telling them to let it run. So maybe some defrosts have run longer than expected and people didn't know what they were seeing." *(simulated; basis: card)*

**Vendor support**
* Q7 (unapproved-window follow-up): "We connect on the shared account and run what Zava asks for, the way the ticket says. Technically? There's no lock on the time. The account is always available and the password works at any hour. It relies on us following the rules. We posted a note afterwards so stores would stop calling." *(simulated; basis: card)*

## Panel's further suggested follow-ups (no more rounds available — carried forward as open questions)

1. Who keeps the pager list current, and how often is it audited?
2. Can a compromised session or password be detected and revoked mid-session?
3. When "defrost" shows on a case, when would night cover expect it to end?
4. Who validated the "report as safe" note before it reached the assistant?
5. Does the pilot prove the controls work, or only the idea?

## Contradictions: resolved reading

* **Door alarm:** confirmed thinner than the night manager first described. The alarm the manager initially credited as catching the door issue is the same escalation chain that depends on an accurate pager list — and on the night in question it bounced to a number for someone who left years ago (matches `data/issues.json` ZFW-274 and `data/roster.json`'s unreachable departed-technician contact). The manager's own follow-up answer walks the Q4-round-1 claim back: "I don't actually know we always would hear about a door staying open."
* **Approval vs. execution:** confirmed as a genuine gap, not a misunderstanding. Regional IT directly states there is no live, technical enforcement of an approved window, scope, or value — only a log that is read after the fact. IT's own words name the gap precisely: "audit, not approval."

Both contradictions are now first-person-confirmed findings, not just code-vs-testimony inferences, and carry into Method 3 synthesis as High confidence.
