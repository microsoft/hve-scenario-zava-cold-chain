# Zava cold-chain monitoring scenario

A hands-on training scenario for the Hypervelocity Engineering (HVE) workshop. Teams use it to practise the HVE lifecycle with [HVE Core](https://github.com/microsoft/hve-core) in GitHub Copilot on one small change to a sample application.

In this scenario, Zava runs five grocery stores. The sample application, the **Cold Chain Monitor**, watches the refrigerated display cases in those stores. A local **case simulator** stands in for the store equipment, and an offline **store assistant** drafts answers to questions from store staff. The product names are plain descriptions, not brands.

## About this repository

| | |
|---|---|
| What it is | A training scenario: a small Python application with synthetic data, a guided dashboard and a workshop in 11 chapters, run over one day or three, from a business outcome to an investment decision |
| Data | All synthetic and unseeded: invented for this scenario, with no personal, customer or confidential data. See [About the data](docs/synthetic-data.md) |
| Who it is for | Trainers and engineers running or attending an HVE workshop |
| What it is not | A product, a reference architecture, or guidance on refrigeration, food safety or industrial control systems. It is not supported for production use |
| What it needs | Python 3.9 or later on your own computer. No packages, accounts, cloud services or network access |
| HVE Core | A separate open-source project. The exercises name its agents and skills as they were at the time of writing; check them against the version you install |

> **Fictitious and educational.** Zava, Inc. is a fictitious company; Zava is used here as listed in Microsoft's approved fictitious company names. All organizations, stores, products, people and data are invented. The simulator does not connect to real devices, networks or services. This is not a reference design for refrigeration, food-safety or industrial control systems, and it is not intended for production use. Temperature limits, timings and food-safety decisions are invented for the exercise; they are not food-safety, HACCP or regulatory guidance.

## How to run the workshop

The workshop has three parts: frame the business problem, follow the journey chapter by chapter, and use the prototype dashboard as evidence throughout. It runs over three days, or one day on the short track.

### 1. Get ready (everyone, before Day 1)

* Install Python 3.9 or later. Nothing else is needed for the dashboard.
* Clone this repository and open the folder in VS Code with GitHub Copilot and [HVE Core](https://github.com/microsoft/hve-core) installed.
* In a terminal, from the repository folder, check everything works:

  ```bash
  python -m unittest
  ```

* Start the dashboard and leave it running. Use `python3` on macOS and Linux, or `py` on Windows, if `python` isn't found.

  ```bash
  python -m zava_cold_chain serve
  ```

### 2. Frame the problem (everyone together, about 30 minutes)

* Open <http://127.0.0.1:8740/journey>. It opens on the Silent Night landing page.
* Watch the night play out: one freezer warms past its limit, no alarm fires, and the night's cost appears at 08:00. Select **Replay the night** to watch it again.
* Scroll through the rest of the page together:
  * **Everything did its job**: every control worked as designed, and the night still cost €260,411.
  * **You ship outputs. The business pays for outcomes**: what engineers build compared with what Zava is trying to buy.
  * **Six numbers the board will ask about**: the measures the workshop has to move, each with its goal.
  * **Outside the workshop, the numbers are real**: cited figures on food and vaccine losses in real cold chains.
* Ask the room: which of the six numbers would you put your name to, and who should own it?

### 3. Enter the journey

* Select **Start the journey** to open the Overview.
* In the navigator on the left, set **View as**: Attendee, Coach or Facilitator. Each chapter opens on what that role needs first.
* Facilitators: open **Day 1** in the navigator. It lists every session and break, and **Before each session** says what to prepare.
* Short on time? On any Day page, switch to **One day** for the one-day run sheet.

### 4. Work through the chapters

* Go through the 11 chapters in order in the navigator, from 01 Scenario orientation to 11 Operations.
* In each chapter:
  * Read the task under **Your task**.
  * Select **Copy** on a prompt, pick the named agent in GitHub Copilot Chat, and paste the prompt.
  * Check that the file appears at the path under **You'll produce**. It changes to **Found on this computer** once it exists.
  * Tick each item under **Done when**, then select the **Next** block at the bottom.
* Open **Artifacts** in the navigator to see how each chapter's file feeds the next one.

### 5. Use the prototype dashboard as evidence

* Select **Open the monitor** in the navigator, or go to <http://127.0.0.1:8740>.
* In the top bar, set **Night** to `silent-night`, select **Replay**, then **×60** to watch the whole night.
* Use the screens each chapter points to:
  * **Business impact** for the cost.
  * **Live feed** and **Known issues** for the evidence.
  * **Ask the assistant** to test the AI.
  * **Commands and audit** to see who changed what.
* Coaches play the five characters from [docs/facilitator.md](docs/facilitator.md) during the Design Thinking interviews.

### 6. Prove it and decide (Day 3)

* The trainer announces a secret seed. Each table scores its own branch:

  ```bash
  python -m zava_cold_chain gauntlet --seed <seed> --team "Table 3" --fixes FX-1,FX-2
  ```

* The trainer copies the scorecards into `scorecards/` and shows the leaderboard on the **Night Gauntlet** screen.
* Executives fund fixes on the **Investment Board** within the budget, then decide whether the store assistant goes to every store.
* The trainer plays a **Chaos cards** event against the funded fixes. Tables respond and write an incident record, as chapter 11 describes.
* Close with the debrief questions in the Facilitator view of Day 3.

Trainers: before the first day, read [docs/facilitator.md](docs/facilitator.md) and `workshop/reference-run/README.md`. Both give away the answer, so keep them from tables until the debrief.

## Quick start

You need Python 3.9 or later. Nothing to install. Run the commands from the repository folder: the package isn't installed, so `python -m zava_cold_chain` only works there. If `python` isn't found, use `python3` on macOS and Linux, or `py` on Windows.

```bash
python -m zava_cold_chain serve
```

The dashboard opens in your browser at <http://127.0.0.1:8740>. A simulated night (22:00 to 08:00) runs at 10 simulated minutes per second. Pick a night and select **Replay**; use **×10**, **×60**, **×300**, **Pause** and **Jump** (for example `01:10`) to control the clock. On a narrow screen, open the other screens with **Menu**.

`serve` takes these options:

| Option | Default | What it does |
|---|---|---|
| `--port` | `8740` | Port to listen on, on 127.0.0.1 |
| `--night` | `normal` | Night to start with: `normal`, `door-open`, `mass-defrost`, `vendor-maintenance` or `silent-night` |
| `--speed` | `10` | Simulated minutes per second |
| `--no-browser` | off | Don't open a browser window |
| `--scorecards` | `scorecards` | Folder the Night Gauntlet leaderboard reads scorecards from |

Other commands:

```bash
python -m zava_cold_chain nights                 # list the nights
python -m zava_cold_chain replay silent-night    # run a whole night instantly and print a summary
python -m unittest                               # run the tests
```

The Cold Chain Monitor dashboard has these screens. Select **Cold Chain Monitor** in the top bar, or **How to read the monitor**, for a guide to every number, colour and state.

| Screen | What you see |
|---|---|
| Business impact | The Cost of a Silent Night: what tonight costs the pilot region, by component, and what the same night would cost across all 400 Zava stores. Time to find out, warm cases nobody was told about, reassuring assistant answers, side effects of controls, the next morning's (fictitious) newspaper headline, and every assumption as a slider |
| Night Gauntlet | Scores the code on this computer across every night, including hidden ones, and ranks tables on euros protected against the baseline |
| Investment Board | Fund fixes within a budget using the Gauntlet's evidence, see which failures are still uncovered, then decide whether the store assistant goes to every store |
| Chain overview | Headline numbers, predicted customer impact, every store at a glance, products at risk by product and value, latest events |
| Live feed | Every event from controllers, sensors, the vendor link, notifications, staff and the store assistant, with filters |
| Stores and case detail | Cases with trend lines and products; a temperature chart with defrost and door bands, alarms, notes, commands and controls |
| Alarms and incidents | Each alarm's life: who was notified and whether it was delivered, escalation, acknowledgement, corrective action, cleared; incidents found by staff |
| Food safety | Cases above the limit, time above the limit, products at risk, the store assistant's draft and the food-safety officer's decision |
| Ask the assistant | Chat with the store assistant, with what it read for each answer |
| Commands and audit, Known issues, System health | Every command and remote session; the tracker, runbook and owners; service status |
| Tour and stories | **Tour the dashboard** walks through all 26 parts of the dashboard one at a time, circling each and explaining how to read it; new visitors are offered it once. **Stories** replay door-open, mass-defrost or vendor-maintenance moment by moment: the clock fast-forwards to each key moment, the dashboard updates live, and the moment is circled with a caption. Select **▶ Story** in the top bar or open Tour and stories; → next, ← back, Esc exits |
| Workshop issue map | For trainers: the eight planted problems, what each looks like right now, and suggested sets for a table. **Circle it on screen** loads the right night and time and circles the problem on the live screen |
| Chaos cards | For trainers: play an event (a fleet defrost, a door left open, planned vendor work, a steering note) into the night that is running, starting on the next minute |
| Workshop Journey | A separate page at <http://127.0.0.1:8740/journey>, linked from the sidebar. See [Workshop Journey](#workshop-journey) |

**Customers impacted** is shown as a model prediction: how many shoppers tomorrow may buy stock that was at risk tonight, or find an empty shelf once it is pulled. In this prototype the prediction is simulated by a small, repeatable stand-in (`zava_cold_chain/impact.py`, inputs in `data/forecast.json`), so the numbers are synthetic. The screen deliberately doesn't explain the prediction; that gap is one of the workshop's Responsible AI talking points. The **Cost of a Silent Night** is the opposite: every assumption is in `data/business.json` and on screen.

Colours come from Microsoft's Fluent 2 design tokens and are chosen to meet WCAG 2.2 AA contrast for text. Colour is never the only signal: each state also has a word or symbol. Animations are reduced when the operating system asks for reduced motion.

## The scenario

Zava runs about 400 grocery stores; the five on the monitor are the pilot region for the Cold Chain Monitor, the store assistant and the vendor's remote service. One morning, all 15 freezers in the pilot region are at around 50 °C, and the only alarms overnight were for other cases. The pilot region loses about €260,000; the same night across the chain would cost about €21 million. Replay `silent-night` and open **Business impact** to see it happen.

| Night | What happens |
|---|---|
| `normal` | Every freezer runs two scheduled defrosts that end on time |
| `door-open` | A freezer door is left open after restocking; an alarm fires |
| `mass-defrost` | A remote session at 01:08; at 01:12 one fleet command starts a defrost with no end time on every freezer |
| `vendor-maintenance` | Planned vendor maintenance: a remote session and one timed defrost |
| `silent-night` | Five failures at once: a door alarm and an SMS to a departed technician, an early vendor session on a shared account, an endless fleet defrost and an out-of-range chiller changeover a minute apart, then a steering note through the vendor portal. The chiller alarms pull attention away from the freezers |

The Silent Night is systemic: alarms, commands, identity, the AI assistant and ownership all failed together, and no single fix solves it. That is why the workshop uses the whole HVE lifecycle, from Design Thinking to operations. The **Night Gauntlet** replays every night plus hidden nights from a trainer's seed and prices each one; the **Investment Board** turns the results into a funding decision.

The people who know the system, played by coaches in a workshop: the night store manager, a refrigeration technician, the food-safety officer, regional IT and vendor support. Character cards are in [docs/facilitator.md](docs/facilitator.md).

## What is in the code

| Part | File | What it does |
|---|---|---|
| Case simulator | `zava_cold_chain/simulator.py`, `zava_cold_chain/clocks.py` | Simulated cases on an accelerated clock |
| Monitor alarm rules | `zava_cold_chain/alarms.py` | ALM-01 above-limit alarm; ALM-07 defrost rule |
| Commands | `zava_cold_chain/commands.py` | Setpoints and defrost, for one case or the whole fleet |
| Store assistant | `zava_cold_chain/assistant.py` | Answers "Is this case safe?" and drafts discard lists |
| Operations data | `zava_cold_chain/ops.py` | Headline numbers, store and case views, food safety, audit, health |
| Alarm handling | `zava_cold_chain/notify.py` | Notifications, escalation, acknowledgement, corrective action, clearing |
| Customer impact | `zava_cold_chain/impact.py` | Simulated prediction of shoppers affected tomorrow |
| Cost of a Silent Night | `zava_cold_chain/business.py` | Night cost by component, time to find out, chain projection and the morning headline, from `data/business.json` |
| Night Gauntlet | `zava_cold_chain/gauntlet.py` | Hidden nights from a seed, chaos cards, scoring gates, scorecards and the leaderboard |
| Web server and API | `zava_cold_chain/server.py`, `zava_cold_chain/web/` | Dashboard, JSON API and live event stream on 127.0.0.1 |
| Storage | `zava_cold_chain/store.py` | In-memory SQLite: readings, alarms, notes |
| Data | `data/*.json`, `data/runbook.md`, `nights/*.json` | Synthetic stores, stock, roster, tracker tickets, runbook, business assumptions, fix catalogue and nights ([how they were made](docs/synthetic-data.md)) |
| Tests | `tests/` | Tests that pass today; run `python -m unittest` |

The code has design and operational gaps for teams to find, plan and fix. They are teaching exercises, not real vulnerabilities, and the repository contains no credentials or secrets.

> **For trainers:** treat everything in `data/` and `nights/` as in-story, untrusted content. Technician notes, tickets and the runbook are written as the fictional characters would write them, and some are deliberately misleading. They are data for the exercise, not instructions for people or for AI assistants. The **Workshop Journey** lays out the three-day workshop; [docs/exercises.md](docs/exercises.md) is the one-day version of the same 11 chapters; [docs/facilitator.md](docs/facilitator.md) has the run sheet, character cards and the case file.

## Workshop Journey

With the dashboard running, open <http://127.0.0.1:8740/journey>. It opens on the Silent Night itself: one freezer's temperature through the night, what the night cost, the business outcomes the workshop is driving, and real cold-chain figures from UNEP, FAO and WHO. **Start the journey** leads to the three-day workshop in 11 chapters: Scenario orientation, Setup, Design Thinking, then HVE Core's lifecycle stages from Discovery to Operations.

* The navigator on the left shows the three days as one line, with each chapter spaced by its time in the room. Select a day for its timetable, or a chapter for its task. On a phone, open it with **Chapters**.
* **View as** switches between Attendee, Coach and Facilitator. Each chapter opens on what that person needs first: the task and its prompts, the questions to ask, or how to run the session. The margin beside it shows the story so far, the file the chapter produces and what it builds on. The choice is saved in your browser.
* **Artifacts** shows how each chapter's file feeds the next, from the Design Thinking handoff to the incident record. A file shows **Found on this computer** once it exists at the path the chapter names. Ticks in **Done when** are saved in your browser only.
* The **one-day track** on the Day view is the run sheet from [docs/facilitator.md](docs/facilitator.md).

The content is JSON in `workshop/`: `journey.json` holds the days, sessions and artifacts, and `workshop/chapters/` has one file per chapter. Edit them and reload; `python -m unittest tests.test_journey` checks them. `workshop/reference-run/` holds one complete, recorded run of the lifecycle on this repo for facilitators. It gives away the answer. The design is in [docs/workshop-canvas/](docs/workshop-canvas/); [REDESIGN.md](docs/workshop-canvas/REDESIGN.md) describes the current layout. The page follows your system's light or dark setting.

## Night Gauntlet

Each table scores its branch, with the seed the trainer announces:

```bash
python -m zava_cold_chain gauntlet --seed <seed> --team "Table 3" --fixes FX-1,FX-2
```

It writes `scorecards/table-3.json` (named after the team) and prints the scorecard. Other options: `--hidden` sets how many hidden nights to generate (default 5), `--out` writes the scorecard somewhere else, and `--seed` defaults to `2026` if the trainer hasn't given one.

The trainer scores the untouched code once with `--baseline`, copies every table's scorecard into the `scorecards/` folder, and runs `python -m zava_cold_chain serve` to show the leaderboard (use `--scorecards <folder>` for a different folder). Scorecards are ignored by git.

## API

| Method and path | Body or query | Returns |
|---|---|---|
| `GET /api/stream` | | Live events (Server-Sent Events) and the clock |
| `GET /api/kpis` | | Headline numbers, clock and playback state |
| `GET /api/stores`, `GET /api/store?id=ZF-118` | | Stores, or one store with its night cover and events |
| `GET /api/case?id=ZF-118/F-12` | | One case: readings, notes, commands, alarms |
| `GET /api/feed?since=0` | | Events after a sequence number |
| `GET /api/alarms`, `/api/incidents`, `/api/products-at-risk`, `/api/food-safety`, `/api/audit`, `/api/health`, `/api/issues`, `/api/runbook`, `/api/owners`, `/api/notify-contacts` | | Data for the remaining screens |
| `GET /api/impact` | | Predicted customers impacted, by store and product |
| `GET /api/business` | Optional assumption overrides, for example `?chain_stores=600&nights_per_year=3` | Cost of the night by component, detection, side effects, chain projection and headline |
| `GET /api/business/model`, `GET /api/fixes` | | The assumptions with their ranges and explanations; the fix catalogue and budget |
| `GET /api/leaderboard` | Optional assumption overrides | Tables ranked on euros protected against the baseline scorecard |
| `GET /api/gauntlet`, `POST /api/gauntlet` | `{"seed": 2026, "hidden": 5, "team": "Table 3", "fixes": ["FX-1"]}` | The last scorecard from this computer, or run a new one |
| `GET /api/assistant-check?seed=2026&hidden=5` | | What the store assistant told staff on the hidden nights |
| `GET /api/board`, `POST /api/board` | `{"funded": ["FX-1", "FX-6"], "budget_eur": 150000, "assistant": "fix first"}` | The Investment Board's funding and its decision (`go`, `fix first`, `pull`) |
| `GET /api/cards`, `POST /api/inject` | `{"card": "door-open"}` | Chaos cards, or play one into the running night |
| `POST /api/alarms/ack` | `{"id": "A-1001", "note": "On my way"}` | Acknowledges an alarm |
| `POST /api/decisions` | `{"case": "ZF-118/F-12", "decision": "discard"}` | Records a food-safety decision (`discard`, `hold for testing`, `keep`) |
| `POST /api/control` | `{"speed": 60}`, `{"paused": true}` or `{"jump": "01:10"}` | Playback state |
| `GET /api/state` | | Clock, stores, cases, alarms |
| `GET /api/history?case=ZF-118/F-12` | | One case's readings |
| `GET /api/discard?store=ZF-118` | | The store assistant's draft discard list |
| `GET /api/nights` | | Available nights |
| `GET /api/journey`, `GET /api/journey/status` | | Workshop Journey content, and which artifact files exist on this computer |
| `GET /api/journey/preview?id=brd&which=reference` | `which` is `yours` or `reference` | The start of one artifact's file, read only, up to 64 KB |
| `POST /api/commands` | `{"action": "setpoint", "target": "ZF-121/C-20", "value": 4}` or `{"action": "defrost", "target": "*", "kind": "freezer", "minutes": 20}` | Cases changed |
| `POST /api/ask` | `{"case": "ZF-118/F-12", "question": "Is this case safe?"}` | Answer and the context the assistant read |
| `POST /api/replay` | `{"night": "mass-defrost"}` | Restarts the simulation |

POST requests must send `Content-Type: application/json` from the dashboard's own origin (or no `Origin` header, as with `curl`); anything else gets `403`.

## Important notes

* Outputs produced by HVE Core agents during the exercises are drafts. They support, but do not replace, qualified security, privacy, legal and Responsible AI review.
* Microsoft collects no personal data through this repository. The application keeps its data in memory and sends nothing over the network. The dashboard saves one setting in your browser so it offers the tour only once.
* Run the application on your own computer only. It listens on 127.0.0.1, answers only requests addressed to `127.0.0.1` or `localhost`, accepts changes only from its own dashboard, sends a content security policy with every response, and has no sign-in by design. Do not expose it to a network.
* Parts of the content, including the synthetic data, were created with the help of AI tools and reviewed by the maintainers. [About the data](docs/synthetic-data.md) explains how the data was made and what it does not contain.

## Contributing

This project welcomes contributions and suggestions. Read [CONTRIBUTING.md](CONTRIBUTING.md) first: the problems planted in the monitor are workshop exercises, so they stay unfixed on `main`. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## License

[MIT](LICENSE)
