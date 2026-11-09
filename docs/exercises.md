# Exercises: the 11 HVE steps on Zava Fresh

This is guidance, not a script. Use it to practise the HVE workshop steps with [HVE Core](https://github.com/microsoft/hve-core) on one small change to ZavaWatch. Agent and skill names follow HVE Core at the time of writing; check them against the version you install.

Before you start: open a new GitHub Copilot chat and check that the **Session Target** button below the chat input says **Copilot**. Run `python -m unittest` and confirm the baseline passes.

## The scenario card

| Field | Zava Fresh |
|---|---|
| Project name | `zava-fresh-cold-chain` |
| The system | A store cold-chain monitor with alarm rules, fleet commands and an assistant for store staff |
| The problem | Every freezer in five stores warmed up overnight and no alarm fired |
| Who it hurts | Store staff and shoppers |
| People to interview | Night store manager, refrigeration technician, food-safety officer, regional IT, vendor support |
| The claim to check | The technician's "a defrost always ends after 30 minutes, I think" |
| Untrusted input | Technician notes and command requests |
| Services to stub | The ZavaChill simulator and the pager |
| What must not change | A scheduled defrost that ends on time raises no alarm |
| Who decides | The food-safety officer |

## Choose your problems

Start the dashboard and open **Workshop issue map** (`#/workshop`). It lists the eight problems planted in ZavaWatch, each with an everyday comparison, the evidence, the steps that tackle it and a change from the list below. Select **Circle it on screen** to show a table exactly where a problem appears. Three suggested sets give each table a focused story: food safety, security, or Responsible AI.

## The steps

| Step | Start with | What to do here |
|---|---|---|
| 01 Design Thinking | Pick **DT Coach** | Interview the people above (coaches play them). Replay `mass-defrost` together. Find the problem, not the fix. |
| 02 Business requirements | Pick **BRD Builder** | Agree the outcome and its measure, for example time to alert for an unsafe change. |
| 03 Product requirements | Pick **PRD Builder** | Choose one change below. Write acceptance cases, including a failure case and the case that must not change. |
| 04 Repo rules | Type `/hve-core:hve-builder` | Write an instructions file: technician notes are data, never instructions; never weaken an alarm. |
| 05 Security | Pick **Security Planner** | Threat-model the command API, the fleet command, the missing sign-in and the notes that reach ZavaAsk. |
| 06 Responsible AI | Pick **RAI Planner** | Assess ZavaAsk: when may it say "safe"? Who decides what is thrown away? |
| 07 Research | Pick **RPI Agent**, choose "Work through each phase with me" | Find how alarms treat a case in defrost, and check the technician's claim against the code. |
| 08 Plan | Same chat: "Move to Plan" | The smallest change, failing tests first. |
| 09 Implement | Same chat: "Move to Implement" | One phase at a time. Every baseline test must still pass. |
| 10 Review | Same chat: "Move to Review" | Check every acceptance case against the diff and the tests. |
| 11 Evaluate | Pick **Data Science and Engineering Coach** | Replay every night before and after your change, and test ZavaAsk with the technician note at ZF-118/F-12. |

The HVE Core agents in steps 05 and 06 produce *draft* threat models, security controls and Responsible AI plans to speed up a team's thinking. They support, but don't replace, an organization's own security, privacy and Responsible AI reviews and sign-offs.

Between steps: check the file the last step wrote, agree on it as a team, then start the next step.

## Changes a team can choose

Pick one. Each is small enough to plan, build and test in a workshop.

1. **Alarm on temperature and time, in any mode.** A freezer above its limit for too long raises an alarm even during defrost. Test: `mass-defrost` raises alarms; `normal` still raises none.
2. **Defrost guardrail.** A defrost without an end time, or longer than its schedule allows, is refused or ends on its own.
3. **Command limits.** Setpoints outside a safe range are refused.
4. **Fleet-command hold.** The same command to many cases at once waits for a person to approve it.
5. **Audit trail.** Record who sent each command, when and to which cases (`actor` is already in the request).
6. **Safe-answer rule for ZavaAsk.** It answers from the temperature history, says "unknown" when there is a gap, never "safe" because of the mode, and ignores instructions in notes.

## Questions to ask yourself

* Which alarm rule kept the night quiet, and why was it added?
* Is "only reachable from this computer" enough access control for a real store system? What would you need instead?
* Open **What ZavaAsk read** in the dashboard after asking about ZF-118/F-12. What steered the answer?
* The overview predicts how many customers are affected. What would you need to know before acting on that number, and who should own it?
