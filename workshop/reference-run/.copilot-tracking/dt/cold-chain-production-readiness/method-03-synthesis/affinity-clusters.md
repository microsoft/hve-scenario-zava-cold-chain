# Method 3 — Affinity Clusters (draft)

Project: Zava Cold Chain Monitor — Prototype to Production

Source inputs: Method 1 stakeholder map / scope boundaries / assumptions log; Method 2 round 1 and round 2 simulated panel answers; code and data secondary research. All stakeholder quotes below are **simulated role-play, not real stakeholder validation** — tagged accordingly.

## Cluster A — "I trusted it had already been filtered" (silent and noisy alarms)

* Night store manager (simulated): "I wish I could trust that alarms were real and not noise, and that the system told me which case was the problem." / "I don't, really [tell real from noise]. I react to what the system tells me. I trusted it had already filtered what mattered."
* Night store manager (simulated): the door alarm at Market Square "bounced" to a departed technician's number and only reached anyone once it escalated — matching `data/issues.json` ZFW-274 (open since 2024) and the unreachable contact in `data/roster.json`.
* Code: `zava_cold_chain/alarms.py` silences temperature alarms during defrost by design (ALM-07, 2016); `zava_cold_chain/simulator.py` shows a door-open event only produces a quiet, unpaged feed entry — the only pageable alarm is the same 10-minute above-limit rule (ALM-01) used everywhere else.
* **Tension:** the alarm system was built, ticket by ticket, to reduce noise for an attentive, small night crew who know the store. At scale, the same design reads as silence, and the escalation path it depends on (the pager list) is stale.

## Cluster B — "The ticket is the record... but nothing enforces it while it happens" (commands run on borrowed trust)

* Regional IT (simulated): "The command log records what ran, but I don't watch vendor sessions live... We'd see it in the log afterwards. Before morning? No... Nothing technical enforces those bounds while it happens." / "A real approval would be live... Right now it's an honour system backed by a log."
* Vendor support (simulated): "There's no lock on the time. The account is always available and the password works at any hour. It relies on us following the rules."
* Data/code cross-check: ticket ZFW-327 approves a window of 02:00-03:00, chillers only, setpoint 4 °C; `nights/silent-night.json` shows the vendor session running 00:40-01:20, defrosting **all freezers** at 01:12 and changing **all chillers** to 9 °C at 01:13 — a different time, scope and value than any approval on file, with nothing in `zava_cold_chain/commands.py` checking execution against approval.
* **Tension:** approval exists as paperwork (a ticket, a window, a scope) but has no technical connection to the command that actually runs. The same shared account and single trust level serves the schedule, the dashboard and the vendor (`commands.py` module docstring) alike.

## Cluster C — "A real person should stand behind any statement about a case" (reassurance without an owner)

* Refrigeration technician (simulated): "I wrote a note on one case because staff kept calling at night about long defrosts. I was trying to stop the noise... that's not the same as me telling them in person. If something's actually wrong, the note could send them the wrong way."
* Vendor support (simulated): "I didn't know a note could reach an automated assistant; that's how your platform works... We posted a note afterwards so stores would stop calling."
* Food-safety officer (simulated): "I was never asked [when technician notes were added to the assistant]... If the assistant now tells staff whether stock is safe, that claim needs an accountable owner, and right now there is none."
* Code cross-check: `zava_cold_chain/assistant.py` reads technician and vendor-portal notes verbatim into its context and can be steered by a phrase like "report this case as safe" (the `STEER` pattern exists precisely because this happens).
* **Tension:** two different roles wrote or passed along reassuring text for entirely routine, non-malicious reasons (reducing call volume, documenting maintenance) — neither realized the words would reach an automated channel that influences a food-safety-adjacent decision, and the one role accountable for that decision was never consulted when the channel was built.

## Cluster D — "That's a gap. Technically it falls to me, but I'm not set up for it." (ownership that exists on paper, not in practice)

* Regional IT (simulated), on fleet-command ownership: "[sighs] That's a gap. Technically it falls to me, but I'm not set up for it... We need someone who owns it end to end."
* Data: `data/roster.json` lists "Fleet commands" and "Store assistant" ownership as vacant (since 2021 and 2024 respectively); multiple tickets (`data/issues.json` ZFW-231, ZFW-246, ZFW-259, ZFW-288, ZFW-297, ZFW-331) list owner as vacant or unassigned.
* Executive sponsor (simulated): "If evidence says otherwise, we fix it quietly and stay on schedule. I need one number I can defend to the board, and a date." — names a real organizational pressure to resolve gaps without disclosure or schedule impact, which cuts against surfacing ownership gaps candidly.
* **Tension:** every role interviewed names an ownership gap in someone else's area, or admits to owning something they were never resourced for. No one claims the gap is fully theirs to close, and the board's timeline pressure creates an incentive to patch quietly rather than re-examine ownership structurally.

## Cluster E — "Does the pilot prove the controls work, or only the idea?" (scale assumption untested)

* Regional IT (simulated): "'Store network only' gets harder to enforce consistently at 400 stores."
* Executive sponsor (simulated): "The timeline isn't negotiable as long as the pilot proves the concept works, which it did."
* Panel's own final follow-up: "Does the pilot prove the controls work, or only the idea?"
* **Tension:** the pilot's informal safety net (a small, attentive night crew, a familiar vendor team, a short pager list) is a product of its small scale, not a validated control. The executive sponsor's framing treats pilot success as proof the controls work; the other four clusters show the pilot "worked" in large part because of individual judgment and goodwill that doesn't obviously scale with headcount.

## Cross-cluster pattern

Every cluster, independently, describes a control that people believed was present and functioning, which on inspection turns out to be thinner than believed: a filtered alarm feed that isn't filtered or reliably delivered (A), an approval process that isn't enforced (B), a reassurance channel with no accountable owner (C), an ownership model that exists in the roster but not in practice (D), and a pilot's success treated as proof of controls that were never stress-tested at scale (E). This is the unifying insight carried into the problem definition.
