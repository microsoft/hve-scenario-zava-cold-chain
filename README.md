# Zava Fresh cold-chain monitor

A hands-on training scenario for the Hypervelocity Engineering (HVE) workshop. Teams use it to practise the workshop steps with [HVE Core](https://github.com/microsoft/hve-core) in GitHub Copilot on one small change to a sample application.

Zava Fresh is a fictitious grocery chain. The sample application, **ZavaWatch**, monitors refrigerated display cases in five Zava Fresh stores. A local simulator, **ZavaChill**, stands in for the store equipment, and an offline assistant, **ZavaAsk**, drafts answers to questions from store staff.

## About this repository

| | |
|---|---|
| What it is | A training scenario: a small Python application with synthetic data, a guided dashboard and exercises that follow the 11 HVE workshop steps |
| Who it is for | Trainers and engineers running or attending an HVE workshop |
| What it is not | A product, a reference architecture, or guidance on refrigeration, food safety or industrial control systems. It is not supported for production use |
| What it needs | Python 3.9 or later on your own computer. No packages, accounts, cloud services or network access |
| HVE Core | A separate open-source project. The exercises name its agents and skills as they were at the time of writing; check them against the version you install |

> **Fictitious and educational.** All organizations, stores, products, people and data are invented. The simulator does not connect to real devices, networks or services. This is not a reference design for refrigeration, food-safety or industrial control systems, and it is not intended for production use. Temperature limits, timings and food-safety decisions are invented for the exercise; they are not food-safety, HACCP or regulatory guidance.

## Quick start

You need Python 3.9 or later. Nothing to install.

```bash
python -m zava_fresh serve
```

Open <http://127.0.0.1:8740>. A simulated night (22:00 to 08:00) runs at 10 simulated minutes per second. Pick a night and select **Replay**; use **×10**, **×60**, **×300**, **Pause** and **Jump** (for example `01:10`) to control the clock.

The ZavaWatch operations dashboard has these screens. Select **ZavaWatch** in the top bar, or **How to read ZavaWatch**, for a guide to every number, colour and state.

| Screen | What you see |
|---|---|
| Chain overview | Headline numbers, predicted customer impact, every store at a glance, products at risk by product and value, latest events |
| Live feed | Every event from controllers, sensors, the vendor link, notifications, staff and ZavaAsk, with filters |
| Stores and case detail | Cases with trend lines and products; a temperature chart with defrost and door bands, alarms, notes, commands and controls |
| Alarms and incidents | Each alarm's life: who was notified and whether it was delivered, escalation, acknowledgement, corrective action, cleared; incidents found by staff |
| Food safety | Cases above the limit, time above the limit, products at risk, ZavaAsk's draft and the food-safety officer's decision |
| Ask ZavaAsk | Chat with the store assistant, with what it read for each answer |
| Commands and audit, Known issues, System health | Every command and remote session; the tracker, runbook and owners; service status |
| Tour and stories | **Tour the dashboard** walks through all 26 parts of ZavaWatch one at a time, circling each and explaining how to read it; new visitors are offered it once. **Stories** replay door-open, mass-defrost or vendor-maintenance moment by moment: the clock fast-forwards to each key moment, the dashboard updates live, and the moment is circled with a caption. Select **▶ Story** in the top bar or open Tour and stories; → next, ← back, Esc exits |
| Workshop issue map | For trainers: the eight planted problems, what each looks like right now, and suggested sets for a table. **Circle it on screen** loads the right night and time and circles the problem on the live screen |

**Customers impacted** is shown as a model prediction: how many shoppers tomorrow may buy stock that was at risk tonight, or find an empty shelf once it is pulled. In this prototype the prediction is simulated by a small, repeatable stand-in (`zava_fresh/impact.py`, inputs in `data/forecast.json`), so the numbers are synthetic. The screen deliberately doesn't explain the prediction; that gap is one of the workshop's Responsible AI talking points.

Colours come from Microsoft's Fluent 2 design tokens and are chosen to meet WCAG 2.2 AA contrast for text. Colour is never the only signal: each state also has a word or symbol. Animations are reduced when the operating system asks for reduced motion.

## The scenario

One morning, all 15 freezers in five Zava Fresh stores are at around 50 °C. The alarm log for the night is empty. Replay the `mass-defrost` night to see it happen.

| Night | What happens |
|---|---|
| `normal` | Every freezer runs two scheduled defrosts that end on time |
| `door-open` | A freezer door is left open after restocking; an alarm fires |
| `mass-defrost` | A remote session at 01:08; at 01:12 one fleet command starts a defrost with no end time on every freezer |
| `vendor-maintenance` | Planned vendor maintenance: a remote session and one timed defrost |

The people who know the system, played by coaches in a workshop: the night store manager, a refrigeration technician, the food-safety officer, regional IT and vendor support.

## What is in the code

| Part | File | What it does |
|---|---|---|
| ZavaChill simulator | `zava_fresh/simulator.py` | Simulated cases on an accelerated clock |
| ZavaWatch alarm rules | `zava_fresh/alarms.py` | ALM-01 above-limit alarm; ALM-07 defrost rule |
| Commands | `zava_fresh/commands.py` | Setpoints and defrost, for one case or the whole fleet |
| ZavaAsk assistant | `zava_fresh/assistant.py` | Answers "Is this case safe?" and drafts discard lists |
| Operations data | `zava_fresh/ops.py` | Headline numbers, store and case views, food safety, audit, health |
| Alarm handling | `zava_fresh/notify.py` | Notifications, escalation, acknowledgement, corrective action, clearing |
| Customer impact | `zava_fresh/impact.py` | Simulated prediction of shoppers affected tomorrow |
| Web server and API | `zava_fresh/server.py`, `zava_fresh/web/` | Dashboard, JSON API and live event stream on 127.0.0.1 |
| Storage | `zava_fresh/store.py` | In-memory SQLite: readings, alarms, notes |
| Data | `data/*.json`, `data/runbook.md`, `nights/*.json` | Synthetic stores, stock, roster, tracker tickets, runbook and nights |
| Tests | `tests/` | Baseline tests that pass today |

The code has design and operational gaps for teams to find, plan and fix. They are teaching exercises, not real vulnerabilities, and the repository contains no credentials or secrets. [docs/exercises.md](docs/exercises.md) walks a team through the 11 HVE steps on one small change.

## API

| Method and path | Body or query | Returns |
|---|---|---|
| `GET /api/stream` | | Live events (Server-Sent Events) and the clock |
| `GET /api/kpis` | | Headline numbers, clock and playback state |
| `GET /api/stores`, `GET /api/store?id=ZF-118` | | Stores, or one store with its night cover and events |
| `GET /api/case?id=ZF-118/F-12` | | One case: readings, notes, commands, alarms |
| `GET /api/feed?since=0` | | Events after a sequence number |
| `GET /api/alarms`, `/api/incidents`, `/api/products-at-risk`, `/api/food-safety`, `/api/audit`, `/api/health`, `/api/issues`, `/api/runbook`, `/api/owners` | | Data for the remaining screens |
| `GET /api/impact` | | Predicted customers impacted, by store and product |
| `POST /api/alarms/ack` | `{"id": "A-1001", "note": "On my way"}` | Acknowledges an alarm |
| `POST /api/decisions` | `{"case": "ZF-118/F-12", "decision": "discard"}` | Records a food-safety decision (`discard`, `hold for testing`, `keep`) |
| `POST /api/control` | `{"speed": 60}`, `{"paused": true}` or `{"jump": "01:10"}` | Playback state |
| `GET /api/state` | | Clock, stores, cases, alarms |
| `GET /api/history?case=ZF-118/F-12` | | One case's readings |
| `GET /api/discard?store=ZF-118` | | ZavaAsk's draft discard list |
| `GET /api/nights` | | Available nights |
| `POST /api/commands` | `{"action": "setpoint", "target": "ZF-121/C-20", "value": 4}` or `{"action": "defrost", "target": "*", "kind": "freezer", "minutes": 20}` | Cases changed |
| `POST /api/ask` | `{"case": "ZF-118/F-12", "question": "Is this case safe?"}` | Answer and the context ZavaAsk read |
| `POST /api/replay` | `{"night": "mass-defrost"}` | Restarts the simulation |

POST requests must send `Content-Type: application/json` from the dashboard's own origin (or no `Origin` header, as with `curl`); anything else gets `403`.

## Important notes

* Outputs produced by HVE Core agents during the exercises are drafts. They support, but do not replace, qualified security, privacy, legal and Responsible AI review.
* Microsoft collects no personal data through this repository. The application keeps its data in memory and sends nothing over the network. The dashboard saves one setting in your browser so it offers the tour only once.
* Run the application on your own computer only. It listens on 127.0.0.1, accepts changes only from its own dashboard, and has no sign-in by design; do not expose it to a network.
* Parts of the content were created with the help of AI tools and reviewed by the maintainers.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## License

[MIT](LICENSE)
