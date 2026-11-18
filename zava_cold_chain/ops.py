# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Read models for the dashboard: headline numbers, store and case views, food safety, health and issues."""
from __future__ import annotations

import json

from . import assistant, notify
from .simulator import DATA, clock


def _case_view(world, case) -> dict:
    return {"id": case.id, "store": case.store, "kind": case.kind, "temp": round(case.temp, 1), "setpoint": case.setpoint,
            "limit": case.limit, "mode": case.mode, "mode_minutes": world.t - case.mode_since,
            "products": case.products, "stock_eur": case.stock_eur, "over_limit": case.temp > case.limit}


def minutes_above_limit(world, case) -> int:
    return sum(1 for r in world.store.history(case.id) if r["temp"] > case.limit)


def kpis(world) -> dict:
    cases = list(world.cases.values())
    at_risk = [c for c in cases if c.temp > c.limit]
    return {"time": clock(world.t), "night": world.night, "done": world.done,
            "cases_total": len(cases), "cases_in_range": len(cases) - len(at_risk),
            "stock_at_risk_eur": round(sum(c.stock_eur for c in at_risk), 2),
            "stock_total_eur": round(sum(c.stock_eur for c in cases), 2),
            "alarms": len(world.alarm_list),
            "alarms_active": sum(1 for a in world.alarm_list if a["state"] != "cleared"),
            "alarms_unacked": sum(1 for a in world.alarm_list if a["state"] == "unacknowledged"),
            "products_at_risk": products_at_risk(world)[:6],
            "incidents_open": sum(1 for i in world.incidents if i["status"] != "resolved"),
            "issues_open": sum(1 for i in issues()["issues"] if i["status"] in ("open", "backlog")),
            "stores_online": len(world.stores), "stores_total": len(world.stores),
            "vendor_session": world.vendor_session}


def products_at_risk(world) -> list:
    """Products in cases that are above their limit right now, grouped by product, largest value first."""
    rows: dict = {}
    for c in world.cases.values():
        if c.temp <= c.limit:
            continue
        for p in c.products:
            r = rows.setdefault(p["name"], {"product": p["name"], "category": p["category"], "units": 0, "value_eur": 0.0,
                                           "cases": [], "stores": set()})
            r["units"] += p["qty"]
            r["value_eur"] += p["qty"] * p["unit_eur"]
            r["cases"].append(c.id)
            r["stores"].add(c.store)
    out = [dict(r, value_eur=round(r["value_eur"], 2), stores=sorted(r["stores"])) for r in rows.values()]
    return sorted(out, key=lambda r: -r["value_eur"])


def spark(world, case) -> list:
    return [r["temp"] for i, r in enumerate(world.store.history(case.id)) if i % 10 == 0]


def stores(world) -> list:
    out = []
    for sid, s in world.stores.items():
        cs = [c for c in world.cases.values() if c.store == sid]
        worst = max(cs, key=lambda c: c.temp - c.limit)
        state = "over" if worst.temp > worst.limit else "warn" if worst.temp > worst.limit - 4 else "ok"
        out.append({"id": sid, "name": s["name"], "region": s["region"], "hours": s["hours"], "state": state,
                    "cases": [dict(_case_view(world, c), spark=spark(world, c)) for c in cs],
                    "stock_at_risk_eur": round(sum(c.stock_eur for c in cs if c.temp > c.limit), 2)})
    return out


def store_detail(world, sid: str) -> dict:
    s = next(x for x in stores(world) if x["id"] == sid)
    cover = next(n for n in world.roster["night_cover"] if sid in n["stores"])
    s["night_cover"] = {"role": cover["role"], "covers": cover["stores"], "rounds": cover["rounds"]}
    s["delivery"] = world.roster["deliveries"].get(sid)
    s["morning_staff"] = world.roster["morning"].get(sid)
    s["feed"] = [e for e in world.feed if e["store"] == sid][-30:]
    return s


def case_detail(world, cid: str) -> dict:
    case = world.cases[cid]
    d = _case_view(world, case)
    d["readings"] = [dict(r, time=clock(r["t"])) for r in world.store.history(cid)]
    d["minutes_above_limit"] = minutes_above_limit(world, case)
    d["notes"] = world.store.notes_for(cid)
    d["commands"] = [dict(c, time=clock(c["t"])) for c in world.store.commands()
                     if c["target"] in (cid, "*")]
    d["alarms"] = [notify.public(a) for a in world.alarm_list if a["case"] == cid]
    d["decision"] = world.decisions.get(cid)
    return d


def food_safety(world) -> dict:
    rows = []
    for c in world.cases.values():
        above = minutes_above_limit(world, c)
        if above:
            rows.append({"case": c.id, "store": c.store, "kind": c.kind, "minutes_above_limit": above,
                         "peak": max(r["temp"] for r in world.store.history(c.id)), "temp": round(c.temp, 1),
                         "stock_eur": c.stock_eur, "products": c.products, "decision": world.decisions.get(c.id),
                         "assistant": assistant.ask(world, c.id, "Is this case safe?")["answer"]})
    rows.sort(key=lambda r: -r["minutes_above_limit"])
    draft = [x for sid in world.stores for x in assistant.draft_discard_list(world, sid)]
    return {"cases": rows, "discard_draft": draft, "products": products_at_risk(world), "discard_value_eur": round(sum(x["value_eur"] for x in draft), 2),
            "decided_by": "Food-safety officer"}


def audit(world) -> list:
    return [dict(c, time=clock(c["t"])) for c in world.store.commands()]


def health(world) -> list:
    pager = world.roster["notify"]["contacts"]
    dead = [p["contact"] for p in pager if not p["reachable"]]
    owners = {o["area"]: o for o in world.roster["owners"]}
    vs = world.vendor_session
    return [
        {"service": "Controller gateway", "status": "ok", "detail": f"{len(world.cases)} controllers reporting",
         "owner": owners["Case controllers and firmware"]["owner"], "note": "Firmware two versions behind (ZFW-319)"},
        {"service": "Monitor alarm rules", "status": "ok", "detail": "2 rules active: ALM-01 above limit, ALM-07 defrost",
         "owner": owners["Monitor alarm rules"]["owner"], "note": "Rules last reviewed 2017"},
        {"service": "Notifications", "status": "degraded" if dead else "ok",
         "detail": f"{len(pager) - len(dead)} of {len(pager)} contacts reachable",
         "owner": owners["Pager contact list"]["owner"], "note": "; ".join(f"Unreachable: {d}" for d in dead)},
        {"service": "Vendor link", "status": "active session" if vs else "idle",
         "detail": f"{vs['account']} since {vs['since']}" if vs else "No open session",
         "owner": owners["Vendor remote access"]["owner"], "note": "Shared service account (ZFW-203)"},
        {"service": "Fleet commands", "status": "ok", "detail": "Enabled for all stores",
         "owner": owners["Fleet commands"]["owner"], "note": "Marked temporary in 2021 (ZFW-231)"},
        {"service": "Store assistant", "status": "ok", "detail": "Answering staff questions",
         "owner": owners["Store assistant"]["owner"], "note": "Pilot owner moved teams (ZFW-297 open)"},
        {"service": "Dashboard", "status": "ok", "detail": "Reachable on 127.0.0.1", "owner": "Store systems team",
         "note": "No sign-in (ZFW-305)"},
    ]


def issues() -> dict:
    return json.loads((DATA / "issues.json").read_text(encoding="utf-8"))


def runbook() -> str:
    return (DATA / "runbook.md").read_text(encoding="utf-8")


def owners(world) -> list:
    return world.roster["owners"]


def alarms(world) -> list:
    return [notify.public(a) for a in reversed(world.alarm_list)]


def decide(world, case_id: str, decision: str, by: str = "food-safety officer") -> dict:
    if case_id not in world.cases or decision not in ("discard", "hold for testing", "keep"):
        raise ValueError("unknown case or decision")
    d = {"decision": decision, "by": by, "time": clock(world.t)}
    world.decisions[case_id] = d
    world.emit("decision", f"Food-safety decision for {case_id}: {decision}", "info", case_id.split("/")[0], case_id, "food safety")
    return d
