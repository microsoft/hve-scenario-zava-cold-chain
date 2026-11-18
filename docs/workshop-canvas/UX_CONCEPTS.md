# Three ways to build the Workshop Journey

Each concept carries the same content: 11 chapters over three days, three roles, and the artifacts between chapters. They differ in what you see first and how you move.

## A. Journey map

The first screen is the whole lifecycle drawn as a left-to-right map: 11 chapter nodes, the artifacts between them, and the return loops (Review back to Implementation, Operations back to Implementation for a hotfix). Selecting a node slides in a side panel with that chapter's content.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ○01──○02──●03──○04──○05──○06──○07──○08──○09──○10──○11                │
│            │handoff  BRD  PRD  items      ▲ rework  │                │
│            └─────────────────────────────┘  hotfix ─┘                │
│                                              ┌──────────────────────┐│
│                                              │ 03 Design Thinking   ││
│                                              │ panel: tasks, tools  ││
│                                              └──────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

* Good at: the big picture in one glance; shows the loops HVE Core documents; memorable on a projector.
* Weak at: teaching a 90-minute session. Instructions, prompts and checklists get squeezed into a panel. On a 390 px phone the map becomes a sideways scroll of tiny nodes. It tends to grow decoration because the diagram is the product.
* Facilitator: good for the opening and the debrief, poor during sessions.
* Attendee: knows where they are, has to dig for what to do.
* Build cost: high. An SVG layout that has to stay legible as content changes, plus keyboard navigation between nodes.

## B. Guided workspace

The first screen is a chapter page, like a lab manual. A sidebar lists the chapters; the main column has sections for why it matters, what to do, what you produce, done when and what's next. Previous and next sit at the bottom.

```
┌────────────┬─────────────────────────────────────────────────────────┐
│ 01 ✓       │ 03 Design Thinking                                      │
│ 02 ✓       │ Why this matters ...                                    │
│ 03 ●       │ Do this: 1. Pick DT Coach  2. Interview ...             │
│ 04         │ You produce: problem-space-handoff.md                   │
│ ...        │ Done when: [ ] [ ] [ ]                                  │
│ 11         │ ← 02 Setup                          04 Discovery →      │
└────────────┴─────────────────────────────────────────────────────────┘
```

* Good at: doing the work. Long content reads well, prompts are copyable, it's accessible and simple to build from content files.
* Weak at: showing the journey. You see one chapter and a list of names, and the artifact flow disappears into separate pages. It looks like the docs site the brief wants to avoid.
* Facilitator: good during sessions, poor for planning three days.
* Attendee: always knows what to do, rarely knows why it leads anywhere.
* Build cost: low.

## C. Hybrid: rail and workbench (recommended)

A thin chapter rail runs across the top of every screen: 11 stops grouped under Day 1, Day 2 and Day 3, the current one filled, finished ones ticked by you. Below it sits a chapter workbench with one section visible at a time. A role switch in the header (Attendee, Coach, Facilitator) changes what each section shows first. Two supporting views reuse the same data: Artifacts, a lineage diagram that is the one place a diagram earns its space, and a day view, which is a timeline of sessions.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Workshop Journey                 View as: [Attendee|Coach|Facilitator]│
│ Day 1 ─────────────── Day 2 ─────────────── Day 3 ────────────────── │
│ ✓01 ✓02 ●03 ○04       ○05 ○06 ○07           ○08 ○09 ○10 ○11          │
├──────────────────────────────────────────────────────────────────────┤
│ 03 Design Thinking · Methods 1 to 3 · Day 1, 11:00 to 14:45          │
│ [Why] [Do this] [You produce] [Done when] [If stuck]   ┌───────────┐ │
│                                                        │ Uses       │ │
│ section content                                        │ Business   │ │
│                                                        │ impact     │ │
│                                                        │ Hands to   │ │
│                                                        │ 04 BRD     │ │
│                                                        └───────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

* Good at: both questions at once, "where am I in the three days" and "what do I do now". Progressive disclosure keeps each screen short. The artifact lineage gets a proper view instead of being crammed into every chapter. The role switch is one control, not three apps.
* Weak at: there are two levels of navigation (rail and sections), so they must look clearly different. The rail has to collapse well on a phone.
* Facilitator: day view for planning, Facilitator lens during sessions.
* Attendee: rail for orientation, workbench for the task.
* Build cost: medium. The rail and workbench are plain HTML. Only the artifact view needs SVG.

## Scored against the brief

Scores are 1 (poor) to 5 (strong).

| Criterion | A. Map | B. Workspace | C. Hybrid |
|---|---|---|---|
| Ease of understanding | 4 | 3 | 5 |
| Navigation clarity | 3 | 4 | 4 |
| Fit for three days | 2 | 3 | 5 |
| Facilitator use | 3 | 3 | 5 |
| Attendee use | 2 | 5 | 5 |
| Learning the lifecycle | 4 | 2 | 5 |
| Visual quality possible | 5 | 3 | 4 |
| Accessibility | 2 | 5 | 4 |
| Build cost (5 is cheapest) | 2 | 5 | 3 |
| Easy to maintain | 2 | 5 | 4 |
| Total | 29 | 38 | 44 |

## Recommendation

Build C. It's the only concept that keeps the lifecycle visible while someone is doing a chapter's work, and the brief's main test is a new engineer understanding how each artifact leads to the next.

What C takes from the others: B's chapter structure and copyable prompts, A's diagram for the artifact view only, where the relationships are the content.

What we leave out on purpose: an infinite canvas, draggable nodes, zoom, and any diagram on the chapter screen. They make the page look impressive and make it harder to read.
