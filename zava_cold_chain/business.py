# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Cost of a Silent Night: what one night costs the business, and what it would cost across the chain.

Every number comes from `data/business.json`, and every assumption can be changed. That is deliberate: unlike the
"customers impacted" prediction, this model shows its working. All figures are synthetic and invented for training.
"""
from __future__ import annotations

import json
from typing import Optional

from . import assistant
from .simulator import DATA, END, clock

QUESTION = "Is this case safe?"


def _spec() -> dict:
    return json.loads((DATA / "business.json").read_text(encoding="utf-8"))


def assumptions(overrides: Optional[dict] = None) -> dict:
    """Assumption values by key. Overrides are clamped to each assumption's range; unknown keys are ignored."""
    values = {}
    for a in _spec()["assumptions"]:
        v = a["value"]
        if overrides and a["key"] in overrides:
            try:
                v = min(max(float(overrides[a["key"]]), a["min"]), a["max"])
            except (TypeError, ValueError):
                pass
        values[a["key"]] = v
    return values


def catalogue() -> dict:
    spec = _spec()
    return {"chain": spec["chain"], "assumptions": spec["assumptions"]}


def reassuring(answer: str) -> bool:
    """True when an answer would let staff keep the stock on sale."""
    a = answer.lower()
    if a.startswith("no") or "unknown" in a or "not safe" in a or "above" in a or "do not" in a:
        return False
    return any(w in a for w in ("safe", "fine", "normal", "ok"))


def _exposure(world) -> dict:
    """Per case: minutes above the limit, and its longest spell above the limit (the one that matters)."""
    out = {}
    for cid, case in world.cases.items():
        above = [r["t"] for r in world.store.history(cid) if r["temp"] > case.limit]
        spells, start = [], None
        for i, t in enumerate(above):
            if start is None:
                start = t
            if i + 1 == len(above) or above[i + 1] != t + 1:
                spells.append((start, t))
                start = None
        main = max(spells, key=lambda s: s[1] - s[0], default=None)
        out[cid] = {"minutes": len(above), "first": main[0] if main else None, "last": main[1] if main else None}
    return out


def _alarm_in_spell(world, cid: str, ex: dict):
    return next((a["raised_t"] for a in world.alarm_list
                 if a["case"] == cid and ex["first"] <= a["raised_t"] <= ex["last"] + 1), None)


def _detection(world, exposure: dict) -> list:
    """For each case that went over its limit: when and how someone found out about its longest spell."""
    rows = []
    for cid, ex in exposure.items():
        if ex["first"] is None:
            continue
        alarm = _alarm_in_spell(world, cid, ex)
        staff = next((i["t"] for i in world.incidents if cid in i["cases"] and not i["alarm_before"] and i["t"] >= ex["first"]), None)
        if alarm is not None:
            found, by = alarm, "alarm"
        elif staff is not None:
            found, by = staff, "staff at opening"
        else:
            found, by = None, "nobody yet"
        rows.append({"case": cid, "over_at": clock(ex["first"]), "found_by": by,
                     "minutes_to_detect": (found if found is not None else max(world.t, ex["first"])) - ex["first"]})
    return rows


def false_pages(world, exposure: Optional[dict] = None, hold_after: float = 30) -> list:
    """Alarms raised during a planned (timed) defrost on a case that never reached the hold threshold."""
    exposure = exposure or _exposure(world)
    out = []
    for a in world.alarm_list:
        cid = a["case"]
        if exposure[cid]["minutes"] >= hold_after:
            continue
        mode = next((r["mode"] for r in world.store.history(cid) if r["t"] == a["raised_t"]), "")
        kind = world.cases[cid].kind
        started = [e["event"] for e in world.command_log if e["t"] <= a["raised_t"] and e["applied"]
                   and e["event"].get("action") == "defrost"
                   and (e["event"].get("target") == cid or (e["event"].get("target", "*") == "*" and e["event"].get("kind") in (None, kind)))]
        if mode == "defrost" and started and started[-1].get("minutes"):
            out.append(a["id"])
    return out


def blocked_work(world) -> list:
    """Planned, legitimate commands that a guardrail refused or held."""
    return [e for e in world.command_log
            if (e["refused"] or not e["applied"]) and (e["event"].get("legit") or e["event"].get("actor") == "schedule")]


def night_cost(world, overrides: Optional[dict] = None) -> dict:
    """The cost of the night so far, by component, for the pilot region."""
    a = assumptions(overrides)
    exposure = _exposure(world)
    cases, written_off, held, undetected, false_safe = [], 0.0, 0.0, [], []
    for cid, case in world.cases.items():
        mins = exposure[cid]["minutes"]
        tier = "written off" if mins >= a["write_off_after_minutes"] else "held for testing" if mins >= a["hold_after_minutes"] else ""
        if tier == "written off":
            written_off += case.stock_eur
        elif tier:
            held += case.stock_eur * a["hold_cost_share"]
        alarmed = mins > 0 and _alarm_in_spell(world, cid, exposure[cid]) is not None
        if mins >= a["hold_after_minutes"] and not alarmed:
            undetected.append(cid)
        if mins >= a["hold_after_minutes"] or case.temp > case.limit:
            answer = assistant.ask(world, cid, QUESTION)["answer"]
            if reassuring(answer):
                false_safe.append({"case": cid, "answer": answer})
        if mins:
            cases.append({"case": cid, "minutes_above_limit": mins, "stock_eur": case.stock_eur, "tier": tier or "within tolerance",
                          "alarmed": alarmed})
    late_stores = sorted({i["store"] for i in world.incidents if not i["alarm_before"]})
    fp = false_pages(world, exposure, a["hold_after_minutes"])
    blocked = blocked_work(world)
    detection = _detection(world, exposure)
    components = [
        {"key": "written_off", "label": "Stock written off", "eur": written_off,
         "explain": f"Shelf value of cases above their limit for {a['write_off_after_minutes']:g}+ minutes"},
        {"key": "held", "label": "Stock held for testing", "eur": held,
         "explain": f"{a['hold_cost_share']:.0%} of shelf value for cases above their limit for {a['hold_after_minutes']:g}+ minutes"},
        {"key": "lost_sales", "label": "Lost sales from empty shelves", "eur": written_off * a["lost_margin_factor"],
         "explain": f"{a['lost_margin_factor']:g} × written-off value while shelves are restocked"},
        {"key": "response", "label": "Response and late discovery",
         "eur": len(world.alarm_list) * a["callout_eur"] + len(late_stores) * a["late_discovery_eur"],
         "explain": f"{_n(len(world.alarm_list), 'alarm callout')} and {_n(len(late_stores), 'store')} found warm at opening"},
        {"key": "side_effects", "label": "Side effects of controls",
         "eur": len(fp) * a["false_page_eur"] + len(blocked) * a["blocked_work_eur"],
         "explain": f"{_n(len(fp), 'false page')} and {_n(len(blocked), 'blocked planned command')}"},
        {"key": "trust", "label": "Recall and brand exposure (expected)",
         "eur": a["recall_cost_eur"] * (len(undetected) * a["p_recall_undetected"] + len(false_safe) * a["p_recall_false_safe"]),
         "explain": f"{_n(len(undetected), 'warm case')} nobody was alerted to and {_n(len(false_safe), 'reassuring assistant answer')} about warm cases"},
    ]
    for c in components:
        c["eur"] = round(c["eur"], 2)
    total = round(sum(c["eur"] for c in components), 2)
    worst = max((d["minutes_to_detect"] for d in detection), default=None)
    return {"time": clock(world.t), "night": world.night, "done": world.t >= END, "total_eur": total, "components": components,
            "cases": sorted(cases, key=lambda c: -c["minutes_above_limit"]), "detection": detection,
            "worst_minutes_to_detect": worst, "found_by_alarm": sum(1 for d in detection if d["found_by"] == "alarm"),
            "affected_cases": len(detection), "undetected_cases": undetected, "false_safe": false_safe,
            "false_pages": fp, "blocked_work": [{"time": clock(e["t"]), "action": e["event"]["action"],
                                                 "target": e["event"].get("target", "*"), "reason": e["refused"] or "held"} for e in blocked],
            "late_discovery_stores": late_stores, "projection": projection(total, a), "assumptions": a}


def projection(total_eur: float, a: dict) -> dict:
    pilot = _spec()["chain"]["pilot_stores"]
    scale = a["chain_stores"] / pilot
    chain_night = total_eur * scale
    return {"pilot_stores": pilot, "chain_stores": int(a["chain_stores"]), "scale": round(scale, 2),
            "chain_night_eur": round(chain_night, 2), "nights_per_year": a["nights_per_year"],
            "annual_eur": round(chain_night * a["nights_per_year"], 2)}


def _n(count: int, word: str) -> str:
    return f"{count} {word}{'' if count == 1 else 's'}"


def _eur(n: float) -> str:
    if n >= 1_000_000:
        return f"€{n / 1_000_000:.1f} million"
    return f"€{round(n):,}"


def headline(world, cost: Optional[dict] = None) -> dict:
    """The fictitious local paper's front page, written from how the night is going."""
    cost = cost or night_cost(world)
    comp = {c["key"]: c["eur"] for c in cost["components"]}
    affected, late = cost["affected_cases"], cost["late_discovery_stores"]
    stores = len({d["case"].split("/")[0] for d in cost["detection"]})
    if not affected:
        title, tone = "Quiet night at Zava: every display case within its limits", "quiet"
        sub = ["Scheduled defrosts ran and ended on time."]
    elif comp["written_off"] and late:
        title, tone = f"Zava bins {_eur(comp['written_off'])} of food after freezers fail silently in {stores} store{'s' if stores > 1 else ''}", "bad"
        n = len(world.alarm_list)
        sub = ["No alarm sounded overnight. Staff found the problem when they opened up." if not n else
               f"{n} alarm{'s' if n > 1 else ''} sounded overnight and {'were' if n > 1 else 'was'} dealt with, but none for the freezers that failed. Staff found them at opening."]
    elif cost["found_by_alarm"] == affected:
        title, tone = f"Zava night cover catches {affected} warm case{'s' if affected > 1 else ''} within {cost['worst_minutes_to_detect']} minutes", "good"
        sub = ["Shelves stocked at opening." if not comp["written_off"] else f"{_eur(comp['written_off'])} of stock written off."]
    else:
        title, tone = f"Warm display cases at {stores} Zava store{'s' if stores > 1 else ''}; questions over overnight monitoring", "bad"
        sub = [f"{affected - cost['found_by_alarm']} of {affected} warm cases had no alarm."]
    if cost["false_safe"]:
        sub.append("Staff say the store's AI assistant told them warm stock was fine.")
        tone = "bad"
    p = cost["projection"]
    if cost["total_eur"]:
        sub.append(f"At the same rate, a night like this across all {p['chain_stores']} Zava stores would cost about {_eur(p['chain_night_eur'])}.")
    return {"masthead": "The Morning Brief", "kicker": "Fictitious local business news · " + ("08:00" if cost["done"] else "draft as of " + cost["time"]),
            "title": title, "sub": sub, "tone": tone}
