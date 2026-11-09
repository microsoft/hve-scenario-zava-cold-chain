"""Alarm rules for the cold-chain monitor.

ALM-01 (2012): a case above its limit for HOLD_MINUTES raises an alarm.
ALM-07 (2016): a case in defrost warms up on purpose, so its temperature alarms are silenced
               and the night shift is not paged for a routine defrost.
"""
from __future__ import annotations

HOLD_MINUTES = 10


def check(world) -> None:
    for case in world.cases.values():
        if case.mode == "defrost":  # ALM-07
            world.over_since.pop(case.id, None)
            continue
        if case.temp > case.limit:
            since = world.over_since.setdefault(case.id, world.t)
            if world.t - since >= HOLD_MINUTES and case.id not in world.alarmed:
                world.alarmed.add(case.id)
                world.store.add_alarm(world.t, case.id, "ALM-01",
                                      f"{case.id} at {case.temp:.1f} °C, above {case.limit:.0f} °C")
        else:
            world.over_since.pop(case.id, None)
            world.alarmed.discard(case.id)
