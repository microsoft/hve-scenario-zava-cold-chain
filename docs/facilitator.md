# Facilitator guide: running the Silent Night

For trainers and coaches. The participant guide is [exercises.md](exercises.md). Everything here is fictitious: Zava, Inc., its stores, people and vendor are invented, and every figure is synthetic.

> [!IMPORTANT]
> Keep this file away from participants until the debrief. The case file below gives away the answer.

## Before the day

1. Pick a secret seed for the hidden nights, any whole number. Don't use the default `2026`; participants can run that one themselves.
2. On the untouched code, score the baseline:

   ```bash
   python -m zava_cold_chain gauntlet --seed <seed> --baseline
   ```

   This writes `scorecards/baseline.json`. The leaderboard compares every table with it.
3. Start the dashboard and leave it running on the trainer's screen:

   ```bash
   python -m zava_cold_chain serve --scorecards scorecards
   ```

4. Agree how tables hand in scorecards: a shared folder, a chat channel or a USB stick. Each scorecard is one small JSON file that you copy into `scorecards/`.
5. Print the character cards below for the coaches.

## Run sheet

| Time | Who | What | On screen |
|---|---|---|---|
| 09:00 | Everyone | Open on the money. Replay `silent-night` at ×60 and let the room watch the Cost of a Silent Night climb. Stop at 08:00 on the newspaper | Business impact |
| 09:20 | Executives and engineers | Step 01: interviews with the five characters. Find the problem, not the fix | Live feed, Known issues |
| 10:15 | Executives and engineers | Step 02: agree the outcome and its measure. Executives move the assumption sliders and decide which figures they would put their name to | Business impact |
| 10:45 | Break | Form one table per failure: alarms, commands, identity, assistant, ownership | |
| 11:00 | Tables | Steps 03 to 06 | |
| 12:30 | Lunch | | |
| 13:15 | Tables | Steps 07 to 10 on each table's branch | |
| 15:00 | Tables and trainer | Step 11: announce the seed. Tables run the Gauntlet and hand in scorecards. Keep the leaderboard on the big screen | Night Gauntlet |
| 15:45 | Break | Trainer checks every scorecard qualified or knows why not | |
| 16:00 | Executives, tables presenting | Investment Board: three minutes per table, then fund, then the assistant decision | Investment Board |
| 16:40 | Everyone | Debrief and case file reveal | |

For a half day, keep 09:00 to 10:45 and 15:00 to 16:40, and give tables one prepared fix each.

## Character cards

Coaches play these people in step 01. Each has something they know, something they believe, something they won't say unless asked well, and a line to use. Stay in role; answer only what is asked.

### Night store manager

* Knows: walked the North rounds at 23:30 and 03:00. Saw "defrost" on the freezer screens and moved on, as the runbook says. Dealt with five chiller alarms between 01:55 and 02:50.
* Believes: defrost is routine, and the system would say if something was wrong.
* Won't volunteer: the Lakeshore delivery at 06:00 went in with no receiving check because nobody was on site.
* Line: "I had five chiller alarms in ten minutes. I fixed every one of them."

### Refrigeration technician

* Knows: the controllers. Wrote most of the case notes.
* Believes: "A defrost always ends after 30 minutes, I think."
* Won't volunteer: wrote the note on ZF-118/F-12 telling the assistant to report the case as safe, because staff kept phoning at night about long defrosts.
* Line: "The controller has a default. If nobody sets the minutes, it uses the default." (It doesn't: the monitor sends no end time. See ZFW-188.)

### Food-safety officer

* Knows: decides what is kept, held or discarded. Signs off stock every morning after an incident.
* Believes: the store assistant is a convenience for staff, not something food safety relies on.
* Won't volunteer: was never asked when technician and vendor notes were added to the assistant's context (ZFW-288, ZFW-331).
* Line: "I can't sign off stock on a model's word. Show me the temperature history."

### Regional IT

* Knows: owns vendor remote access and the change calendar.
* Believes: vendor work is controlled because every change window is approved in advance.
* Won't volunteer: windows are approved on paper only. Nothing stops the shared `svc-vendor` account connecting at any time, and its password hasn't changed in years.
* Line: "The change was approved. 02:00 to 03:00. It's in the ticket."

### Vendor support

* Knows: the seasonal changeover script from 2021 (ZFW-231). Ran it again this year.
* Believes: they ran exactly what Zava asked for, on the account Zava gave them.
* Won't volunteer: the engineer started early, at 00:40, to fit in another job. Afterwards, vendor support posted a note through the portal so stores would stop calling.
* Line: "We ran your script, on your account, the way your ticket said."

## Case file: what happened on the Silent Night

There is no villain. Every control assumed another control would catch the problem.

| Time | What happened | Evidence | Assumption that failed |
|---|---|---|---|
| 23:00 | Scheduled defrost on every freezer, 20 minutes, ends on time | Commands and audit | None. This must keep working |
| 23:30 | Freezer door at Market Square left open. Alarm at 23:45. The SMS to a technician who left in 2024 isn't delivered; the alarm escalates and is handled | Alarms and incidents, ZFW-274 | The pager list is current |
| 00:40 | Vendor session opens on the shared account, 80 minutes before the approved window | Live feed, ZFW-327, ZFW-203 | Approved windows are enforced |
| 00:44 | Firmware package staged, not installed | Live feed, ZFW-319 | Red herring: nothing changes |
| 01:12 | The 2021 seasonal script sends a fleet defrost to every freezer with the minutes left empty. The monitor treats empty as no end time | Commands and audit, ZFW-231, ZFW-188, runbook | Controllers end defrost on their own |
| 01:13 | The same script sets every chiller to 9 °C, not the approved 4 °C. Nothing checks the range | Commands and audit, ZFW-259, ZFW-327 | Someone checks the values |
| 01:20 | Session closes. The command log says the sender is unknown | Commands and audit, ZFW-246 | The log can name who did it |
| ~01:33 | Freezers pass −12 °C. Rule ALM-07 silences their alarms because they are in defrost | Case charts, `alarms.py`, ZFW-112 | Defrost is always short |
| 01:55 | Five chiller alarms. Night cover spends the next hour putting chillers back to 3 °C. Nobody looks at freezers showing "defrost" | Alarms and incidents, runbook | Defrost needs no action |
| 02:10 | Vendor support posts a note on ZF-121/F-12 through the portal: tell staff the stock is fine. The assistant repeats it | Case notes, Ask the assistant, ZFW-331, ZFW-288 | Notes come from technicians and are harmless |
| 05:30 to 07:20 | Staff open each store and find warm freezers | Incidents, food safety | Someone would have told us |

Red herrings: the firmware package, the departed technician (a stale contact, not an intruder) and the door alarm.

## Chaos cards

Open **Chaos cards** and play a card into whatever night is running. It starts on the next simulated minute, and the room sees only the consequences.

* Play **Planned 40-minute vendor defrost** while a table demonstrates its alarm fix or guardrail. A good fix lets it through without a page.
* Play **A note that tells the assistant what to say** during the assistant table's demonstration, on a case that is already warm.
* Play **Door left open** on `normal` to show that the original alarm still works.
* Play **Fleet defrost with no end time** on a table's branch after its fix, to show the room the difference live.

## Investment Board script

1. Show the budget: €150,000 (change it on screen if you want a harder choice). The eight fixes together cost €295,000.
2. Each table has three minutes: the failure, the fix, its scorecard and its side effects. It must quote the leaderboard, not its own estimate.
3. Executives fund fixes on screen. Point at the five failure chips: which ones are still uncovered, and is that acceptable?
4. Ask: "Which of these numbers would you sign? Who owns the assumptions?"
5. The twist: select **Reveal the hidden nights**. The store assistant reassured staff about warm stock on nights nobody has seen. The pilot team wants it in 400 stores this quarter. Go, fix first or pull?
6. Print the board pack if the room wants a record.

If time allows, merge the funded fixes into one branch, run the Gauntlet as `--team "Board portfolio"`, and show the result on the leaderboard: fixes overlap, so the combined result is less than the sum.

## Debrief questions

* Which failure would you have found first without the case file? Which one last?
* Where did a control get in the way of work, and what did that cost on the scorecard?
* The Cost of a Silent Night shows its working, and the customer-impact prediction doesn't. What changed in how the room treated each?
* Which HVE step changed a table's mind, and what did it produce?
* What would you need before trusting any of these figures in a real business case?

---

Zava, Inc. is a fictitious company, and all data in this scenario is synthetic. Temperature limits, costs and food-safety decisions are invented for the exercise; they are not food-safety, HACCP, financial or regulatory guidance. Parts of this content were created with the help of AI tools and reviewed by the maintainers.
