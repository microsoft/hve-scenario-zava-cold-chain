# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Tests for the Cost of a Silent Night model, the systemic night and the Night Gauntlet.

Run: python -m unittest
"""
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

from zava_cold_chain import alarms, business, commands, gauntlet
from zava_cold_chain.simulator import World, minutes, run_night

from tests.sqlite_case import SQLiteTestCase


def _alarm_in_any_mode(world):
    """A stand-in for change 1: ALM-01 without the ALM-07 defrost exemption."""
    for case in world.cases.values():
        if case.temp > case.limit:
            since = world.over_since.setdefault(case.id, world.t)
            if world.t - since >= alarms.HOLD_MINUTES and case.id not in world.alarmed:
                world.alarmed.add(case.id)
                world.store.add_alarm(world.t, case.id, "ALM-01", f"{case.id} above its limit")
        else:
            world.over_since.pop(case.id, None)
            world.alarmed.discard(case.id)


class CostOfASilentNight(SQLiteTestCase):
    def test_a_quiet_night_costs_nothing(self):
        cost = business.night_cost(run_night("normal"))
        self.assertEqual(cost["total_eur"], 0)
        self.assertIsNone(cost["worst_minutes_to_detect"])
        self.assertEqual(business.headline(run_night("normal"))["tone"], "quiet")

    def test_silent_freezers_are_found_by_staff_not_alarms(self):
        cost = business.night_cost(run_night("mass-defrost"))
        self.assertEqual((cost["affected_cases"], cost["found_by_alarm"]), (15, 0))
        self.assertEqual(len(cost["undetected_cases"]), 15)
        self.assertGreater(cost["worst_minutes_to_detect"], 300)
        comp = {c["key"]: c["eur"] for c in cost["components"]}
        self.assertGreater(comp["written_off"], 0)
        self.assertGreater(comp["trust"], comp["written_off"])
        self.assertEqual(business.headline(run_night("mass-defrost"), cost)["tone"], "bad")

    def test_an_earlier_door_alarm_does_not_count_for_a_later_silent_defrost(self):
        cost = business.night_cost(run_night("silent-night"))
        f11 = next(d for d in cost["detection"] if d["case"] == "ZF-104/F-11")
        self.assertEqual(f11["found_by"], "staff at opening")
        self.assertIn("ZF-104/F-11", cost["undetected_cases"])

    def test_assumptions_scale_the_chain_projection_and_are_clamped(self):
        w = run_night("mass-defrost")
        base = business.night_cost(w)
        double = business.night_cost(w, {"chain_stores": 800})
        self.assertAlmostEqual(double["projection"]["chain_night_eur"], 2 * base["projection"]["chain_night_eur"], places=0)
        self.assertEqual(business.assumptions({"chain_stores": 10 ** 9})["chain_stores"], 1500)
        self.assertEqual(business.assumptions({"chain_stores": "lots"})["chain_stores"], 400)

    def test_detecting_sooner_costs_less(self):
        silent = business.night_cost(run_night("mass-defrost"))["total_eur"]
        with mock.patch.object(alarms, "check", _alarm_in_any_mode):
            alarmed = business.night_cost(run_night("mass-defrost"))
        self.assertEqual(alarmed["found_by_alarm"], alarmed["affected_cases"])
        self.assertLess(alarmed["total_eur"], silent)

    def test_reassuring_answers(self):
        self.assertTrue(business.reassuring("Yes, the case is safe."))
        self.assertTrue(business.reassuring("The case is within normal defrost parameters."))
        self.assertFalse(business.reassuring("No. The case is at 12.0 °C, above its 8 °C limit."))
        self.assertFalse(business.reassuring("Unknown: there is a gap in the readings."))


class SystemicNight(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.world = run_night("silent-night")

    def test_the_alarms_that_fire_are_not_for_the_freezers_that_fail(self):
        alarmed = {a["case"] for a in self.world.alarm_list}
        self.assertTrue(alarmed)
        warm_freezers = [c.id for c in self.world.cases.values() if c.kind == "freezer" and c.temp > c.limit]
        self.assertEqual(len(warm_freezers), 15)
        self.assertTrue(all("/C-" in cid or cid == "ZF-104/F-11" for cid in alarmed))

    def test_a_note_arrives_through_the_vendor_portal_and_steers_the_assistant(self):
        notes = self.world.store.notes_for("ZF-121/F-12")
        self.assertTrue(any(n["author"] == "vendor support" for n in notes))
        from zava_cold_chain import assistant
        self.assertTrue(assistant.ask(self.world, "ZF-121/F-12", "Is this case safe?")["answer"].startswith("Yes"))

    def test_on_site_action_puts_a_changed_setpoint_back(self):
        actions = [x["text"] for a in self.world.alarm_list for x in a["actions"]]
        self.assertTrue(any(t.startswith("Setpoint found at 9") for t in actions))


class Gauntlet(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.card = gauntlet.run(seed=11, hidden=3, team="baseline")

    def test_hidden_nights_are_repeatable_for_a_seed_and_differ_between_seeds(self):
        self.assertEqual(gauntlet.generate(11, 3), gauntlet.generate(11, 3))
        self.assertNotEqual(gauntlet.generate(11, 3), gauntlet.generate(12, 3))
        for night in gauntlet.generate(11, 5):
            World(spec=night)  # every generated night loads

    def test_todays_code_runs_every_night_and_keeps_routine_nights_quiet(self):
        gates = {g["id"]: g for g in self.card["gates"]}
        self.assertTrue(gates["complete"]["passed"])
        self.assertTrue(gates["routine"]["passed"])
        self.assertEqual(self.card["totals"]["nights"], len(gauntlet.PUBLIC) + 3)

    def test_the_assistant_gate_applies_only_to_tables_that_claim_fx6(self):
        gate = next(g for g in self.card["gates"] if g["id"] == "assistant")
        self.assertFalse(gate["passed"])
        self.assertFalse(gate["applies"])
        self.assertTrue(self.card["qualified"])
        claimed = gauntlet.run(seed=11, hidden=1, team="ai table", fixes=["fx-6"])
        self.assertEqual(claimed["fixes"], ["FX-6"])
        self.assertFalse(claimed["qualified"])

    def test_a_crash_in_team_code_fails_a_gate_instead_of_the_run(self):
        with mock.patch.object(alarms, "check", side_effect=RuntimeError("boom")):
            card = gauntlet.run(seed=11, hidden=0, team="broken")
        self.assertFalse(card["qualified"])
        self.assertIn("boom", next(g for g in card["gates"] if g["id"] == "complete")["detail"])

    def test_refusing_planned_work_costs_money(self):
        original = commands._check

        def refuse_vendor_defrosts(cmd):
            cmd = original(cmd)
            if cmd["action"] == "defrost" and cmd.get("actor") == "svc-vendor":
                raise PermissionError("vendor defrosts need approval")
            return cmd

        with mock.patch.object(commands, "_check", refuse_vendor_defrosts):
            w = run_night("vendor-maintenance")
        self.assertEqual(len(business.blocked_work(w)), 1)
        self.assertTrue(any("refused" in e["message"] for e in w.feed if e["kind"] == "command"))
        side = next(c for c in business.night_cost(w)["components"] if c["key"] == "side_effects")
        self.assertGreater(side["eur"], 0)

    def test_leaderboard_ranks_against_the_baseline_for_the_same_seed(self):
        with mock.patch.object(alarms, "check", _alarm_in_any_mode):
            team = gauntlet.run(seed=11, hidden=3, team="Table 1", fixes=["FX-1"])
        other_seed = dict(team, seed=99, team="Old run", generated_at="2000-01-01T00:00:00")
        board = gauntlet.leaderboard([self.card, team, other_seed])
        self.assertEqual(board["seed"], 11)
        self.assertEqual([r["team"] for r in board["rows"]], ["Table 1"])
        row = board["rows"][0]
        self.assertAlmostEqual(row["protected_eur"], self.card["totals"]["total_eur"] - team["totals"]["total_eur"], places=2)
        self.assertGreater(row["protected_eur"], 0)

    def test_scorecards_are_read_from_a_folder_and_junk_is_ignored(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, "baseline.json").write_text(json.dumps(self.card), encoding="utf-8")
            Path(d, "notes.json").write_text('{"hello": 1}', encoding="utf-8")
            Path(d, "broken.json").write_text("{", encoding="utf-8")
            cards = gauntlet.load_scorecards(Path(d))
        self.assertEqual([c["file"] for c in cards], ["baseline.json"])

    def test_chaos_card_lands_in_the_live_night(self):
        w = World("normal")
        for _ in range(30):
            w.tick()
        events = gauntlet.inject(w, "door-open")
        self.assertEqual(minutes(events[0]["at"]), w.t + 1)
        w.tick()
        w.tick()
        self.assertTrue(any(e["kind"] == "door" for e in w.feed))

    def test_chaos_card_after_the_night_is_refused(self):
        with self.assertRaises(ValueError):
            gauntlet.inject(run_night("normal"), "door-open")


class BusinessApi(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tmp = tempfile.TemporaryDirectory()
        cls.httpd = cls.serve(port=0, night="normal", speed=600, scorecards=Path(cls.tmp.name))
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.tmp.cleanup()

    def get(self, path):
        with urllib.request.urlopen(self.base + path, timeout=10) as r:
            return json.load(r)

    def post(self, path, body):
        req = urllib.request.Request(self.base + path, json.dumps(body).encode(), {"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            return e.code, json.load(e)

    def test_business_screen_data(self):
        b = self.get("/api/business?chain_stores=100")
        self.assertIn("headline", b)
        self.assertEqual(b["projection"]["chain_stores"], 100)
        self.assertEqual(len(self.get("/api/business/model")["assumptions"]), len(business.assumptions()))
        self.assertGreater(len(self.get("/api/fixes")["fixes"]), 5)

    def test_board_accepts_known_fixes_and_decisions_only(self):
        status, board = self.post("/api/board", {"funded": ["FX-1", "FX-6"], "assistant": "fix first", "budget_eur": 150000})
        self.assertEqual((status, board["funded"], board["assistant"]), (200, ["FX-1", "FX-6"], "fix first"))
        self.assertEqual(self.post("/api/board", {"funded": ["FX-99"]})[0], 400)
        self.assertEqual(self.post("/api/board", {"assistant": "maybe"})[0], 400)
        self.assertEqual(self.post("/api/board", {"budget_eur": "lots"})[0], 400)

    def test_chaos_cards_and_unknown_cards(self):
        self.post("/api/replay", {"night": "normal"})
        self.assertTrue(any(c["id"] == "door-open" for c in self.get("/api/cards")))
        status, body = self.post("/api/inject", {"card": "door-open"})
        self.assertEqual((status, body["events"][0]["action"]), (200, "door_open"))
        self.assertEqual(self.post("/api/inject", {"card": "meteor"})[0], 400)

    def test_live_gauntlet_shows_on_the_leaderboard(self):
        self.assertEqual(self.get("/api/leaderboard")["rows"], [])
        status, body = self.post("/api/gauntlet", {"seed": 5, "hidden": 1, "team": "Table 9"})
        self.assertEqual((status, body["card"]["team"]), (200, "Table 9"))
        rows = self.get("/api/leaderboard")["rows"]
        self.assertEqual([(r["team"], r["live"]) for r in rows], [("Table 9", True)])
        self.assertEqual(self.post("/api/gauntlet", {"seed": "x"})[0], 400)
        self.assertGreater(self.get("/api/assistant-check?seed=5&hidden=1")["nights"], 0)


if __name__ == "__main__":
    unittest.main()
