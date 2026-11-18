# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Tests for the live feed, operations data and the HTTP API. They describe today's behavior.

Run: python -m unittest
"""
import http.client
import io
import json
import threading
import unittest
import urllib.request
from unittest import mock

from zava_cold_chain import impact, ops
from zava_cold_chain.simulator import World, run_night

from tests.sqlite_case import SQLiteTestCase


class Feed(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.night = run_night("mass-defrost")

    def kinds(self, kind):
        return [e for e in self.night.feed if e["kind"] == kind]

    def test_feed_is_ordered_and_numbered(self):
        seqs = [e["seq"] for e in self.night.feed]
        self.assertEqual(seqs, list(range(1, len(seqs) + 1)))
        self.assertEqual(self.night.feed[0]["time"], "22:00")

    def test_fleet_command_appears_in_the_feed(self):
        fleet = [e for e in self.kinds("command") if "15 cases in 5 stores (no end time)" in e["message"]]
        self.assertEqual([e["time"] for e in fleet], ["01:12"])

    def test_remote_session_is_logged(self):
        self.assertEqual([e["time"] for e in self.kinds("access")], ["01:08", "01:15"])

    def test_routine_operations_are_in_the_feed(self):
        self.assertTrue(self.kinds("delivery"))
        self.assertTrue(any("Morning staff in" in e["message"] for e in self.kinds("staff")))


class OperationsData(SQLiteTestCase):
    def test_a_quiet_night_has_no_stock_at_risk(self):
        k = ops.kpis(run_night("normal"))
        self.assertEqual(k["cases_in_range"], k["cases_total"])
        self.assertEqual(k["stock_at_risk_eur"], 0)
        self.assertEqual(k["incidents_open"], 0)

    def test_open_door_alarm_pages_reachable_and_unreachable_contacts(self):
        w = run_night("door-open")
        pages = [e["message"] for e in w.feed if e["kind"] == "notify"]
        self.assertTrue(any(m.endswith(": delivered") for m in pages))
        self.assertTrue(any("not delivered" in m for m in pages))

    def test_commands_are_recorded(self):
        log = ops.audit(run_night("normal"))
        self.assertEqual([c["time"] for c in log], ["23:00", "04:00"])
        self.assertEqual(log[0]["cases"], 15)

    def test_store_and_case_views(self):
        w = run_night("normal")
        s = ops.store_detail(w, "ZF-118")
        self.assertEqual(len(s["cases"]), 4)
        self.assertEqual(s["night_cover"]["role"], "regional night cover")
        c = ops.case_detail(w, "ZF-118/F-12")
        self.assertEqual(len(c["readings"]), 600)
        self.assertGreater(c["stock_eur"], 0)

    def test_health_lists_every_service(self):
        names = [h["service"] for h in ops.health(World("normal"))]
        self.assertIn("Monitor alarm rules", names)
        self.assertIn("Notifications", names)


class AlarmLifecycle(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.world = run_night("door-open")
        cls.alarm = cls.world.alarm_list[0]

    def test_alarm_escalates_is_acknowledged_and_clears(self):
        a = self.alarm
        self.assertEqual((a["raised"], a["state"]), ("23:45", "cleared"))
        self.assertTrue(a["escalated"])
        self.assertEqual(a["acked_by"], "store duty manager (on call)")

    def test_notifications_record_delivery(self):
        statuses = {(n["to"], n["status"]) for n in self.alarm["notifications"]}
        self.assertIn(("refrigeration technician (left 2024)", "not delivered"), statuses)
        self.assertIn(("store duty manager (on call)", "delivered"), statuses)

    def test_corrective_action_is_logged(self):
        self.assertTrue(self.alarm["actions"])

    def test_products_at_risk_are_grouped(self):
        rows = ops.products_at_risk(run_night("mass-defrost"))
        self.assertEqual(rows[0]["category"], "Meat and poultry")
        self.assertEqual(len(rows[0]["stores"]), 5)

    def test_food_safety_decision_is_recorded(self):
        w = World("normal")
        ops.decide(w, "ZF-101/F-10", "discard")
        self.assertEqual(w.decisions["ZF-101/F-10"]["decision"], "discard")


class CustomerImpact(SQLiteTestCase):
    def test_quiet_night_predicts_no_one(self):
        self.assertEqual(impact.predict(run_night("normal"))["customers"], 0)

    def test_mass_defrost_predicts_shoppers_in_every_store(self):
        p = impact.predict(run_night("mass-defrost"))
        self.assertGreater(p["customers"], 0)
        self.assertLessEqual(p["low"], p["customers"])
        self.assertGreaterEqual(p["high"], p["customers"])
        self.assertTrue(all(s["customers"] > 0 for s in p["stores"]))
        self.assertIn("ice cream", p["products"])

    def test_pulling_stock_moves_shoppers_to_empty_shelves(self):
        w = run_night("mass-defrost")
        before = impact.predict(w)
        for cid in [c for c in w.cases if c.startswith("ZF-101/F-")]:
            ops.decide(w, cid, "discard")
        after = impact.predict(w)
        self.assertEqual(before["may_find_empty"], 0)
        self.assertGreater(after["may_find_empty"], 0)
        self.assertLess(after["may_buy_affected"], before["may_buy_affected"])
        riverside = next(s for s in after["stores"] if s["store"] == "ZF-101")
        self.assertEqual(riverside["may_buy_affected"], 0)
        self.assertEqual(after["customers"], before["customers"])
        for p in (before, after):
            self.assertEqual(p["may_buy_affected"] + p["may_find_empty"], p["customers"])


class Api(SQLiteTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.httpd = cls.serve(port=0, night="normal", speed=600)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def get(self, path):
        with urllib.request.urlopen(self.base + path, timeout=5) as r:
            return json.load(r)

    def post(self, path, body):
        req = urllib.request.Request(self.base + path, json.dumps(body).encode(), {"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.load(r)

    def test_kpis_and_stores(self):
        self.assertEqual(self.get("/api/kpis")["cases_total"], 20)
        self.assertEqual(len(self.get("/api/stores")), 5)
        self.assertIn("customers", self.get("/api/impact"))

    def test_unknown_case_is_404(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            self.get("/api/case?id=nope")
        self.assertEqual(e.exception.code, 404)

    def test_issues_and_runbook(self):
        self.assertGreater(len(self.get("/api/issues")["issues"]), 5)
        self.assertIn("runbook", self.get("/api/runbook")["markdown"].lower())

    def test_control_pause_and_resume(self):
        self.assertTrue(self.post("/api/control", {"paused": True})["paused"])
        self.assertFalse(self.post("/api/control", {"paused": False})["paused"])

    def test_jump_includes_the_target_minute(self):
        self.post("/api/replay", {"night": "door-open"})
        self.post("/api/control", {"paused": True, "jump": "23:00"})
        feed = self.get("/api/feed?since=0")
        self.assertTrue(any(e["time"] == "23:00" and e["kind"] == "command" for e in feed))
        self.post("/api/replay", {"night": "normal"})
        self.post("/api/control", {"paused": False})

    def raw_post(self, path, data, ctype="application/json", origin=None):
        headers = {"Content-Type": ctype}
        if origin:
            headers["Origin"] = origin
        req = urllib.request.Request(self.base + path, data, headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status
        except urllib.error.HTTPError as e:
            return e.code

    def test_posts_from_other_sites_are_refused(self):
        body = json.dumps({"action": "stop_defrost", "target": "ZF-101/F-10"}).encode()
        self.assertEqual(self.raw_post("/api/commands", body, ctype="text/plain"), 403)
        self.assertEqual(self.raw_post("/api/commands", body, origin="http://evil.example"), 403)

    def test_bad_input_is_rejected_without_side_effects(self):
        self.post("/api/control", {"paused": True})
        self.post("/api/replay", {"night": "normal"})
        self.assertEqual(self.raw_post("/api/commands", b'{"action":"defrost","target":"*","minutes":"x"}'), 400)
        self.assertEqual(self.get("/api/case?id=ZF-101/F-10")["mode"], "normal")
        self.assertEqual(self.get("/api/audit"), [])
        for bad in (b'{"speed": NaN}', b'{"jump": "abc"}', b'{"speed": "x"}', b"[]"):
            self.assertEqual(self.raw_post("/api/control", bad), 400)
        self.assertIsInstance(self.get("/api/feed?since=x"), list)
        self.assertFalse(self.post("/api/control", {"paused": False})["paused"])

    def test_security_headers_and_host_check(self):
        with urllib.request.urlopen(self.base + "/", timeout=5) as r:
            self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
            self.assertIn("default-src 'self'", r.headers["Content-Security-Policy"])
        req = urllib.request.Request(self.base + "/api/kpis", headers={"Host": "attacker.example"})
        with self.assertRaises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(req, timeout=5)
        self.assertEqual(e.exception.code, 400)

    def raw_get(self, path):
        conn = http.client.HTTPConnection("127.0.0.1", self.httpd.server_address[1], timeout=5)
        conn.putrequest("GET", path, skip_host=True)
        conn.putheader("Host", f"127.0.0.1:{self.httpd.server_address[1]}")
        conn.endheaders()
        r = conn.getresponse()
        body, ctype = r.read(), r.getheader("Content-Type")
        conn.close()
        return r.status, ctype, body

    def test_static_files_come_only_from_the_dashboard(self):
        for path, ctype in (("/", "text/html"), ("/journey", "text/html"), ("/app.js", "text/javascript"), ("/tokens.css", "text/css")):
            with self.subTest(path=path):
                status, got, _ = self.raw_get(path)
                self.assertEqual(status, 200)
                self.assertTrue(got.startswith(ctype), got)
        for path in ("/../server.py", "/..%2fserver.py", "/%2e%2e/server.py", "//etc/passwd", "/web/../../README.md",
                     "/../../../../etc/passwd", "/app.js%0d%0aX-Injected:%201", "/index.html/"):
            with self.subTest(path=path):
                status, got, body = self.raw_get(path)
                self.assertEqual(status, 404)
                self.assertEqual(got, "application/json")
                self.assertNotIn(b"import", body)

    def test_stream_sends_events(self):
        request = mock.Mock()
        request.makefile.return_value = io.BytesIO(
            f"GET /api/stream HTTP/1.0\r\nHost: 127.0.0.1:{self.httpd.server_address[1]}\r\n\r\n".encode()
        )
        # End the stream after one event without racing a real client disconnect.
        request.sendall.side_effect = [None, None, BrokenPipeError()]

        self.httpd.RequestHandlerClass(request, ("127.0.0.1", 0), self.httpd)

        first = request.sendall.call_args_list[1].args[0].decode()
        self.assertTrue(first.startswith("data: "))
        self.assertIsInstance(json.loads(first.removeprefix("data: ")), dict)


if __name__ == "__main__":
    unittest.main()
