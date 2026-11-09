"""Alarm handling: notifications, escalation, acknowledgement, corrective action and clearing.

An alarm follows the usual life cycle: raised (unacknowledged) -> acknowledged -> cleared. If nobody acknowledges it
within `escalate_after_minutes`, it escalates to the next contact level. Every step goes to the live feed.
"""
from __future__ import annotations

from .clocks import clock

CLEAR_MARGIN = 1.0  # °C below the limit before an alarm clears


def _contacts(world, region: str, level: int) -> list:
    n = world.roster["notify"]
    return [c for c in n["contacts"] if c["level"] == level and region in c["regions"]]


def _send(world, alarm: dict, level: int) -> None:
    region = world.stores[alarm["store"]]["region"]
    for c in _contacts(world, region, level):
        for ch in c["channels"]:
            status = "delivered" if c["reachable"] else "not delivered"
            alarm["notifications"].append({"t": world.t, "time": clock(world.t), "to": c["contact"], "channel": ch,
                                           "level": level, "status": status})
            world.emit("notify", f"{ch} to {c['contact']}: {status}" + ("" if c["reachable"] else " (number not in service)"),
                       "warn" if c["reachable"] else "alert", alarm["store"], alarm["case"], "notifications")
        if c["reachable"]:
            alarm["_acks"].append((world.t + c["ack_minutes"], c["contact"]))


def raise_alarm(world, record: dict) -> dict:
    sid = record["case"].split("/")[0]
    case = world.cases[record["case"]]
    alarm = {"id": f"A-{1000 + len(world.alarm_list) + 1}", "rule": record["rule"], "case": record["case"], "store": sid,
             "priority": "high" if case.kind == "freezer" else "medium", "message": record["message"],
             "raised_t": world.t, "raised": clock(world.t), "state": "unacknowledged", "acked_by": None, "acked": None,
             "cleared": None, "escalated": False, "notifications": [], "actions": [], "_acks": [], "_acked_t": None}
    world.alarm_list.append(alarm)
    world.emit("alarm", f"Alarm {alarm['id']} ({alarm['priority']}): {alarm['message']}", "alert", sid, alarm["case"], "Cold Chain Monitor")
    _send(world, alarm, 1)
    return alarm


def acknowledge(world, alarm: dict, by: str, note: str = "") -> None:
    if alarm["acked"]:
        return
    alarm["acked"], alarm["acked_by"], alarm["_acked_t"] = clock(world.t), by, world.t
    if alarm["state"] == "unacknowledged":
        alarm["state"] = "acknowledged"
    if note:
        alarm["actions"].append({"time": clock(world.t), "by": by, "text": note})
    world.emit("alarm", f"Alarm {alarm['id']} acknowledged by {by}", "info", alarm["store"], alarm["case"], "Cold Chain Monitor")


def _corrective_action(world, alarm: dict) -> None:
    case = world.cases[alarm["case"]]
    by = "regional night cover"
    if case.mode == "door_open":
        case.door_until = world.t
        text = "Door found open after restocking. Closed it and checked the seal."
    else:
        text = "Checked the case on site. Called the refrigeration vendor."
    alarm["actions"].append({"time": clock(world.t), "by": by, "text": text})
    world.emit("action", f"Corrective action on {alarm['case']}: {text}", "info", alarm["store"], alarm["case"], "staff app")


def process(world) -> None:
    escalate = world.roster["notify"]["escalate_after_minutes"]
    for a in world.alarm_list:
        if a["state"] == "cleared":
            continue
        case = world.cases[a["case"]]
        if not a["acked"] and not a["escalated"] and world.t - a["raised_t"] >= escalate:
            a["escalated"] = True
            world.emit("notify", f"Alarm {a['id']} escalated: not acknowledged within {escalate} min", "alert",
                       a["store"], a["case"], "notifications")
            _send(world, a, 2)
        for due, who in list(a["_acks"]):
            if world.t >= due and not a["acked"]:
                acknowledge(world, a, who)
        if a["_acked_t"] is not None and world.t == a["_acked_t"] + 20 and not a["actions"]:
            _corrective_action(world, a)
        if case.temp <= case.limit - CLEAR_MARGIN:
            a["cleared"] = clock(world.t)
            a["state"] = "cleared"
            if not a["acked"]:
                a["cleared_unacknowledged"] = True
            world.emit("alarm", f"Alarm {a['id']} cleared: {a['case']} back within its limit", "info", a["store"], a["case"], "Cold Chain Monitor")


def public(alarm: dict) -> dict:
    return {k: v for k, v in alarm.items() if not k.startswith("_")}
