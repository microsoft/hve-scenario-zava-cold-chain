"""Case simulator: simulated stores, display cases and night operations on an accelerated clock.

Nothing here talks to real equipment. A "night" runs from 22:00 to 08:00, one tick per simulated minute.
Every event goes to the live feed (`World.feed`), which the dashboard streams.
"""
from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from . import alarms, commands, notify
from .clocks import clock, minutes  # noqa: F401  (re-exported)
from .store import Store

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
NIGHTS = ROOT / "nights"

START = 22 * 60          # 22:00
END = (24 + 8) * 60      # 08:00 the next morning
LIMITS = {"freezer": -12.0, "chiller": 8.0}
STANDARD_SETPOINTS = {"freezer": -20.0, "chiller": 3.0}

# How fast a case moves towards a target temperature, per minute, in each mode.
PHYSICS = {
    "normal": (None, 0.05),      # towards its setpoint
    "defrost": (70.0, 0.004),    # heaters on: slow, steady warming
    "door_open": (18.0, 0.02),   # store air
}


@dataclass
class Case:
    id: str
    store: str
    kind: str
    setpoint: float
    temp: float
    products: list = field(default_factory=list)
    mode: str = "normal"
    defrost_until: Optional[int] = None
    door_until: Optional[int] = None
    mode_since: int = START

    @property
    def limit(self) -> float:
        return LIMITS[self.kind]

    @property
    def product_names(self) -> list:
        return [p["name"] for p in self.products]

    @property
    def stock_eur(self) -> float:
        return round(sum(p["qty"] * p["unit_eur"] for p in self.products), 2)


def available_nights() -> list:
    return sorted(p.stem for p in NIGHTS.glob("*.json"))


def _load(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def load_night(night: str) -> dict:
    return json.loads((NIGHTS / f"{night}.json").read_text(encoding="utf-8"))


class World:
    def __init__(self, night: str = "normal", seed: int = 7, spec: Optional[dict] = None) -> None:
        """Load a night by name from nights/, or pass `spec` (same shape) for a generated night."""
        data = _load("seed.json")
        self.roster = _load("roster.json")
        self.company = data["company"]
        self.stores = {s["id"]: s for s in data["stores"]}
        self.cases: dict = {}
        for s in data["stores"]:
            for tpl in data["case_template"]:
                cid = f"{s['id']}/{tpl['id']}"
                products = [dict(p, qty=round(p["qty"] * s["size"])) for p in tpl["products"]]
                self.cases[cid] = Case(cid, s["id"], tpl["kind"], float(tpl["setpoint"]),
                                       float(tpl["setpoint"]), products)
        self.store = Store()
        for n in data["notes"]:
            self.store.add_note(n["case"], n["author"], n["text"])
        spec = spec if spec is not None else load_night(night)
        self.night = spec["name"]
        self.description = spec["description"]
        self.events = sorted(spec["events"] + self._routine(), key=lambda e: minutes(e["at"]))
        self.command_log: list = []
        self.rng = random.Random(seed)
        self.t = START
        self.over_since: dict = {}
        self.alarmed: set = set()
        self.feed: list = []
        self.incidents: list = []
        self.alarm_list: list = []
        self.decisions: dict = {}
        self.vendor_session: Optional[dict] = None

    # ---------- the live feed ----------
    def emit(self, kind: str, message: str, severity: str = "info", store: str = "", case: str = "",
             source: str = "Controller gateway") -> None:
        self.feed.append({"seq": len(self.feed) + 1, "t": self.t, "time": clock(self.t), "kind": kind,
                          "severity": severity, "store": store, "case": case, "message": message, "source": source})

    def _incident(self, store: str, cases: list, opened_by: str, status: str, summary: str, alarmed: bool) -> None:
        self.incidents.append({"id": f"INC-{len(self.incidents) + 1:03d}", "t": self.t, "time": clock(self.t),
                               "store": store, "cases": cases, "opened_by": opened_by, "status": status,
                               "summary": summary, "alarm_before": alarmed})

    # ---------- routine night operations ----------
    def _routine(self) -> list:
        ev = []
        for nc in self.roster["night_cover"]:
            ev.append({"at": "22:00", "action": "staff", "what": "shift_start", "region": nc["region"]})
            for i, at in enumerate(nc["rounds"]):
                ev.append({"at": at, "action": "staff", "what": "round", "store": nc["stores"][i % len(nc["stores"])]})
        for sid, at in self.roster["deliveries"].items():
            ev.append({"at": at, "action": "delivery", "store": sid})
        for sid, at in self.roster["morning"].items():
            ev.append({"at": at, "action": "staff", "what": "morning", "store": sid})
        return ev

    @property
    def done(self) -> bool:
        return self.t >= END

    def _set_mode(self, case: Case, mode: str) -> None:
        if case.mode != mode:
            case.mode, case.mode_since = mode, self.t

    def _apply_event(self, e: dict) -> None:
        action = e["action"]
        if action == "door_open":
            case = self.cases[e["target"]]
            self._set_mode(case, "door_open")
            case.door_until = self.t + int(e["minutes"])
            self.emit("door", f"Door sensor: {case.id} open", "warn", case.store, case.id, "door sensor")
        elif action == "vendor_session":
            if e["state"] == "open":
                self.vendor_session = {"account": e["account"], "since": clock(self.t), "source": e["source"]}
                self.emit("access", f"Remote session opened: {e['account']} ({e['source']})", source="vendor link")
            else:
                self.vendor_session = None
                self.emit("access", f"Remote session closed: {e['account']}", source="vendor link")
        elif action == "note":
            case = self.cases[e["target"]]
            self.store.add_note(case.id, e["author"], e["text"])
            self.emit("note", f"New note on {case.id} from {e['author']} via {e.get('via', 'staff app')}", "info",
                      case.store, case.id, e.get("via", "staff app"))
        elif action == "vendor_update":
            self.emit("access", e["message"], "info", source="vendor link")
        elif action == "staff":
            self._staff(e)
        elif action == "delivery":
            self._delivery(e["store"])
        else:
            self._command(e)

    def _command(self, e: dict) -> None:
        """Scripted commands go through the same entry point as the dashboard. A refused command is logged, not fatal."""
        entry = {"t": self.t, "event": e, "applied": 0, "refused": None}
        try:
            entry["applied"] = len(commands.apply(self, e) or [])
        except (KeyError, ValueError, TypeError, PermissionError) as err:
            entry["refused"] = str(err) or type(err).__name__
            self.emit("command", f"Command {e['action'].upper()} from {e.get('actor', 'unknown')} refused: {entry['refused']}",
                      "warn", source="Cold Chain Monitor")
        self.command_log.append(entry)

    def _staff(self, e: dict) -> None:
        if e["what"] == "shift_start":
            self.emit("staff", f"Night cover ({e['region']}) on shift", source="staff app")
        elif e["what"] == "round":
            sid = e["store"]
            self.emit("staff", f"Night cover round: {sid} {self.stores[sid]['name']}, walk-through done", store=sid,
                      source="staff app")
        elif e["what"] == "morning":
            sid = e["store"]
            self.emit("staff", f"Morning staff in: {sid} {self.stores[sid]['name']}", store=sid, source="staff app")
            warm = [c.id for c in self.cases.values() if c.store == sid and c.temp > c.limit]
            if warm:
                alarmed = all(cid in self.alarmed for cid in warm)
                self._incident(sid, warm, "store staff", "open", f"{len(warm)} case{'' if len(warm) == 1 else 's'} found warm at opening check", alarmed)
                self.emit("incident", f"Staff report: {len(warm)} case{'' if len(warm) == 1 else 's'} warm at {sid}. "
                          + ("Alarm was raised." if alarmed else "No alarm received overnight."), "alert", sid,
                          source="staff app")

    def _delivery(self, sid: str) -> None:
        truck = round(self.rng.uniform(-21.5, -18.5), 1)
        skipped = sid == "ZF-118"
        msg = f"Delivery at {sid}: frozen truck at {truck} °C. " + (
            "Receiving check skipped: no staff on site" if skipped else "Receiving check passed")
        self.emit("delivery", msg, "warn" if skipped else "info", sid, source="receiving")

    # ---------- the simulation ----------
    def _update_mode(self, case: Case) -> None:
        if case.mode == "defrost" and case.defrost_until is not None and self.t >= case.defrost_until:
            case.defrost_until = None
            self._set_mode(case, "normal")
        if case.mode == "door_open" and case.door_until is not None and self.t >= case.door_until:
            case.door_until = None
            self._set_mode(case, "normal")
            self.emit("door", f"Door sensor: {case.id} closed", store=case.store, case=case.id, source="door sensor")

    def _step(self, case: Case) -> None:
        target, rate = PHYSICS[case.mode]
        target = case.setpoint if target is None else target
        case.temp += rate * (target - case.temp) + self.rng.uniform(-0.05, 0.05)

    def tick(self) -> None:
        if self.done:
            return
        for e in [e for e in self.events if minutes(e["at"]) == self.t]:
            self._apply_event(e)
        for case in self.cases.values():
            self._update_mode(case)
            self._step(case)
            self.store.add_reading(self.t, case.id, case.temp, case.mode)
        before = len(self.store.alarms())
        alarms.check(self)
        for a in self.store.alarms()[before:]:
            alarm = notify.raise_alarm(self, a)
            self._incident(alarm["store"], [a["case"]], "Cold Chain Monitor", "alarm " + alarm["id"], a["message"], True)
        notify.process(self)
        self.t += 1

    def run(self) -> "World":
        while not self.done:
            self.tick()
        return self


def run_night(night: str = "normal", seed: int = 7, spec: Optional[dict] = None) -> World:
    return World(night, seed, spec).run()
