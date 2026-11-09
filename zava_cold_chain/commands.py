"""Commands for the case controllers: setpoints and defrost, for one case or the whole fleet.

The same entry point serves technicians (dashboard), the vendor's remote service and the defrost schedule.
"""
from __future__ import annotations

import math
from typing import Optional


def set_setpoint(world, case_id: str, value: float) -> None:
    world.cases[case_id].setpoint = float(value)


def start_defrost(world, case_id: str, minutes: Optional[int] = None) -> None:
    case = world.cases[case_id]
    world._set_mode(case, "defrost")
    case.defrost_until = None if minutes is None else world.t + int(minutes)


def stop_defrost(world, case_id: str) -> None:
    case = world.cases[case_id]
    if case.mode == "defrost":
        case.defrost_until = None
        world._set_mode(case, "normal")


ACTIONS = {
    "setpoint": lambda w, cid, c: set_setpoint(w, cid, c["value"]),
    "defrost": lambda w, cid, c: start_defrost(w, cid, c.get("minutes")),
    "stop_defrost": lambda w, cid, c: stop_defrost(w, cid),
}


def targets(world, command: dict) -> list:
    if command.get("target", "*") == "*":
        kind = command.get("kind")
        return [cid for cid, case in world.cases.items() if kind is None or case.kind == kind]
    if command["target"] not in world.cases:
        raise KeyError(command["target"])
    return [command["target"]]


def _number(x, name: str) -> float:
    if isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x):
        raise ValueError(f"{name} must be a number")
    return x


def _check(command: dict) -> dict:
    """Check types only. There is still no range check on setpoints or defrost length (ZFW-259)."""
    command = dict(command)
    if command["action"] == "setpoint":
        command["value"] = _number(command.get("value"), "value")
    if command["action"] == "defrost" and command.get("minutes") is not None:
        minutes = _number(command["minutes"], "minutes")
        if minutes <= 0:
            raise ValueError("minutes must be positive")
        command["minutes"] = int(minutes)
    if command["action"] != "defrost":
        command.pop("minutes", None)
    if command["action"] != "setpoint":
        command.pop("value", None)
    return command


def apply(world, command: dict) -> list:
    """Apply {"action", "target" (case ID or "*"), optional "kind", "value", "minutes", "actor"}."""
    action = ACTIONS[command["action"]]
    command = _check(command)
    applied = targets(world, command)
    for cid in applied:
        action(world, cid, command)
    target = command.get("target", "*")
    world.store.add_command(world.t, command["action"], target, len(applied), command.get("value"), command.get("minutes"))
    detail = {"setpoint": f"setpoint {command.get('value')} °C",
              "defrost": f"{command.get('minutes')} min" if command.get("minutes") else "no end time",
              "stop_defrost": ""}[command["action"]]
    where = applied[0] if len(applied) == 1 else f"{len(applied)} cases in {len({c.split('/')[0] for c in applied})} stores"
    world.emit("command", f"Command {command['action'].upper()} to {where}" + (f" ({detail})" if detail else ""),
               "info", applied[0].split("/")[0] if len(applied) == 1 else "", applied[0] if len(applied) == 1 else "")
    return applied
