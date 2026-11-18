# Workshop Journey: lifecycle content model

All workshop content lives in JSON files under `workshop/`, separate from the page code. A facilitator can change a prompt, a time or a checklist item without touching JavaScript. The server reads the files on each request, so edits show up on reload.

## Why JSON

The repo uses the Python standard library only. JSON is the one structured format it can read without a parser of its own, and the repo's data already uses it (`data/*.json`, `nights/*.json`). YAML and Markdown front matter would need a dependency or a hand-written parser. The cost is that long prose is awkward in JSON, which is acceptable because chapter text should be short: a task, a prompt, a check. Long explanations stay in `docs/`.

Text fields allow two kinds of inline markup and nothing else: `` `code` `` and `[label](target)`. The page escapes everything else. No HTML in content.

## Files

```
workshop/
├── journey.json            outcome, days, both tracks' sessions, artifacts, project slug
├── chapters/
│   ├── 01-scenario.json
│   ├── 02-setup.json
│   ├── 03-design-thinking.json
│   ├── 04-discovery.json
│   ├── 05-product-definition.json
│   ├── 06-decomposition.json
│   ├── 07-sprint-planning.json
│   ├── 08-implementation.json
│   ├── 09-review.json
│   ├── 10-delivery.json
│   └── 11-operations.json
└── reference-run/          the recorded run, at its original relative paths
    ├── README.md           what this is, which branch it came from, the slug it used, facilitator material
    ├── .copilot-tracking/...
    ├── .github/agents/hve-lifecycle.agent.md
    ├── .github/instructions/zava-cold-chain.instructions.md
    └── docs/project-planning/...
```

## `journey.json`

| Field | Type | Meaning |
|---|---|---|
| `version` | integer | Content schema version, starts at 1 |
| `hve_core_checked` | date string | When the agent and skill names were last checked against HVE Core's docs |
| `hve_core_sources` | list of URLs | The pages they were checked against |
| `abbreviations` | object | Abbreviation to meaning, for example `BRD`. The first use on each page shows the meaning on hover, focus or tap |
| `project_slug` | string | `zava-silent-night`. Prompts use it so tools write where the page looks |
| `delivery_start` | date string or null | First day of a delivery. When today is one of the three days, the rail marks the chapter scheduled now |
| `outcome` | object | `statement`, `measure`, `must_not_change`, `figures` (pilot, chain-wide, Gauntlet baseline at seed 2026) |
| `days` | list | Each: `n`, `theme`, `checkpoint` (what is agreed at the end of the day, and by whom) |
| `tracks` | object | `three-day` and `one-day`, each a list of sessions |
| `tracks.*[]` | session | `day`, `start` (HH:MM), `minutes`, `chapter` (id or null for a break, lunch, checkpoint or debrief), `kind` (`session`, `break`, `lunch`, `checkpoint`, `debrief`), `what` |
| `artifacts` | list | See below |
| `debrief` | list of strings | Questions for the closing debrief, shown to facilitators on the Day view |

An artifact:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable id, for example `brd` |
| `name` | string | "Business requirements" |
| `chapter` | string | Chapter that makes it, for example `04` |
| `made_by` | string | Tool or person, for example "BRD Builder" |
| `kind` | enum | `repo`, `create`, `outside` |
| `path` | string or null | Repo-relative path or glob, for example `docs/project-planning/zava-silent-night-brd.md` or `.copilot-tracking/research/*/*-research.md`. Null for `outside` |
| `reads` | list of ids | Artifacts this one is built from |
| `reference` | string or null | Path under `workshop/reference-run/`, when the reference run has one |
| `optional` | boolean | True for the ADR |

"Read by" is never stored. The server computes it from every artifact's `reads`, so the two directions can't disagree.

## A chapter file

| Field | Type | Meaning |
|---|---|---|
| `id`, `slug`, `title`, `short` | strings | `04`, `discovery`, "Discovery and business requirements", and the rail label "Discovery" |
| `hve` | object | `stage` (1 to 9 or null), `name`, `docs` URL. For chapter 03: `dt_methods: [1, 2, 3]`, `exit: 1` |
| `minutes` | integer | Total room time across all its sessions; the rail uses it for width |
| `scenario` | string | Where the Silent Night stands in this chapter, in one or two sentences |
| `why` | string | Why this chapter matters, for everyone |
| `objective` | string | What a person can do at the end |
| `needs` | list of ids | Artifacts that must exist before starting |
| `produces` | list of ids | Artifacts made here |
| `monitor` | list | `{label, route}`, screens in the monitor this chapter uses |
| `tools` | list | `{name, open, for}`: "BRD Builder", "agent picker", "runs Discover, Define, Govern" |
| `attendee` | object | `steps`: ordered. Each is a string, or `{text, prompt: {label, text}}` when the step asks the attendee to send a prompt, so the prompt sits inside the step that needs it |
| `coach` | object | `ask` (questions), `character` (role id from the cards, chapter 03 only), `mistakes`, `step_in` |
| `facilitator` | object | `before` (prep), `run` (`{at, minutes, do}`), `good_answer`, `watch_for`, `demo` (what to show on screen) |
| `done_when` | list of strings | Exit criteria, shown as manual checkboxes |
| `stuck` | list | `{if, then}` recovery pairs |
| `handoff` | object | `to` (chapter id), `note`: what the next chapter takes from this one |
| `loops` | list | `{to, when}`, for example `{to: "08", when: "rework"}` from chapter 09 |
| `references` | list | `{label, target}`, HVE Core doc pages or repo files |
| `words` | list, chapter 02 only | `{term, meaning}`: the workshop's vocabulary for people new to HVE Core |

How roles use the same file:

| Section on the page | Attendee | Coach | Facilitator |
|---|---|---|---|
| First tab | Do this (`attendee`) | Ask this (`coach.ask`) | Run this session (`facilitator`) |
| Why this matters | `why`, `scenario` | `why` | `why`, `scenario`, `facilitator.demo` |
| You produce | `produces`, reference collapsed | `produces` | `produces`, reference open |
| Done when | `done_when` | `done_when`, `coach.mistakes` | `done_when`, `facilitator.good_answer` |
| If you get stuck | `stuck` | `coach.step_in` | `stuck`, `facilitator.watch_for` |

## A worked chapter: `04-discovery.json`

```json
{
  "id": "04",
  "slug": "discovery",
  "title": "Discovery and business requirements",
  "hve": {"stage": 2, "name": "Discovery", "docs": "https://microsoft.github.io/hve-core/docs/hve-guide/lifecycle/discovery"},
  "minutes": 120,
  "scenario": "The room knows why nothing alarmed. Now it has to agree what a better night is worth, in euros, and who owns each number.",
  "why": "A fix without a measure can't be funded on Day 3. The BRD turns the problem statement into a business goal the Investment Board can judge.",
  "objective": "Write a BRD with a measurable goal, its owners, what is in and out of scope, and what must not change.",
  "needs": ["dt-handoff", "scenario"],
  "produces": ["brd"],
  "monitor": [{"label": "Business impact", "route": "business"}],
  "tools": [
    {"name": "BRD Builder", "open": "agent picker", "for": "Runs Discover, Define and Govern, and saves its session so you can resume"},
    {"name": "rpi-research", "open": "/rpi-research", "for": "Only when a claim in the handoff needs checking against the code"}
  ],
  "attendee": {
    "steps": [
      "Open GitHub Copilot Chat and pick BRD Builder in the agent picker.",
      {"text": "Start with this prompt.", "prompt": {"label": "Start the BRD", "text": "Create a BRD for zava-silent-night. Start from `.copilot-tracking/dt/zava-silent-night/problem-space-handoff.md`. The outcome is the Cost of a Silent Night on the Business impact screen. Save the BRD to `docs/project-planning/zava-silent-night-brd.md`."}},
      "Answer its Discover questions from [Business impact](/#/business). Move the sliders before you agree a target, and write down who owns each one.",
      "Before Govern, check that the BRD names what must not change."
    ]
  },
  "coach": {
    "ask": ["Which of these figures would the CFO sign?", "Who owns the shelf-value assumption?", "What would make this goal look met when it isn't?"],
    "mistakes": ["Writing a fix as the goal, for example \"add a defrost alarm\"", "Copying the €260,411 without asking where it comes from"],
    "step_in": ["When a table has written requirements before it has a goal with a number"]
  },
  "facilitator": {
    "before": ["Replay silent-night to 08:00 on the trainer's screen so Business impact shows the whole night", "Reset the sliders"],
    "run": [
      {"at": "14:45", "minutes": 15, "do": "Show the euro figure. Ask the room which of these numbers they would sign."},
      {"at": "15:00", "minutes": 60, "do": "Tables run BRD Builder. Walk the room at 15:20 and 15:40."},
      {"at": "16:00", "minutes": 15, "do": "Each table reads its business goal aloud."}
    ],
    "good_answer": "A goal with a number, a date and a measure. The reference run's BG-001: bring the Cost of a Silent Night from €260,411 to under €50,000 by month 6.",
    "watch_for": ["A goal with no owner for its assumptions"],
    "demo": "Move the shelf-value slider and watch the chain-wide figure change. That's the conversation about who owns the number."
  },
  "done_when": [
    "`docs/project-planning/zava-silent-night-brd.md` exists",
    "It has at least one business goal with a number and a date",
    "Every assumption behind the goal has an owner",
    "It states what must not change: a scheduled defrost that ends on time raises no alarm"
  ],
  "stuck": [
    {"if": "BRD Builder asks questions the table can't answer", "then": "Answer from Business impact and data/business.json, and mark the rest as assumptions"},
    {"if": "The table runs out of time", "then": "Open the reference run's BRD, agree its goal BG-001 as the table's goal and move on"}
  ],
  "handoff": {"to": "05", "note": "Product definition reads the BRD's goals, rules and what must not change"},
  "loops": [{"to": "06", "when": "TPMs can skip the PRD when the BRD is enough"}],
  "references": [
    {"label": "BRD and PRD Builders", "target": "https://microsoft.github.io/hve-core/docs/agents/project-planning/brd-prd-builders/"},
    {"label": "Business model", "target": "data/business.json"}
  ]
}
```

## Rules the tests enforce

A new `tests/test_journey.py` checks the content, so a typo fails the build instead of reaching a workshop:

1. `journey.json` and all 11 chapter files parse, and chapter ids run 01 to 11 with no gaps.
2. Every id in `needs`, `produces`, `reads`, `handoff.to` and `loops[].to` exists.
3. Every artifact is produced by exactly one chapter, and that chapter's `produces` lists it.
4. Every `reference` path exists under `workshop/reference-run/`.
5. Every `repo` artifact's path exists in the repo.
6. Each track's sessions on a day don't overlap and fit between 08:30 and 17:30. The three-day track visits all 11 chapters; each chapter's `minutes` equals the sum of its three-day sessions.
7. Every monitor `route` is a view the monitor has, read from `views.<name>` in `app.js`.
8. Content text has no em or en dashes, matching the house style, and no HTML tags.

The existing hygiene test already scans every new `.json` and `.md` for hidden Unicode.

## Keeping it current with HVE Core

`hve_core_checked` records the date the tool names were checked. The Overview shows it in small text: "Agent and skill names checked against HVE Core on 18 November 2026." When HVE Core renames a tool, the fix is one string in one chapter file, and the date moves.
