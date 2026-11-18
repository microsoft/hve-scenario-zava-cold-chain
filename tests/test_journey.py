# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Tests for the Workshop Journey: its content files, artifact status from disk, previews and routes.

Run: python -m unittest tests.test_journey
"""
import json
import re
import shutil
import subprocess
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

from zava_cold_chain import journey

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "workshop"
CHAPTER_IDS = [f"{n:02d}" for n in range(1, 12)]
KINDS = {"repo", "create", "outside"}
SESSION_KINDS = {"session", "break", "lunch", "checkpoint", "recap", "debrief"}


def _strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from _strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from _strings(v)


def _minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


class Content(unittest.TestCase):
    """The rules in docs/workshop-canvas/LIFECYCLE_CONTENT_MODEL.md, so a typo fails here instead of in a workshop."""

    @classmethod
    def setUpClass(cls):
        cls.doc = journey.content()
        cls.chapters = {c["id"]: c for c in cls.doc["chapters"]}
        cls.artifacts = {a["id"]: a for a in cls.doc["artifacts"]}

    def test_eleven_chapters_in_order(self):
        self.assertEqual([c["id"] for c in self.doc["chapters"]], CHAPTER_IDS)
        for c in self.doc["chapters"]:
            with self.subTest(chapter=c["id"]):
                self.assertTrue((CONTENT / "chapters" / f"{c['id']}-{c['slug']}.json").is_file())

    def test_every_reference_resolves(self):
        for c in self.doc["chapters"]:
            with self.subTest(chapter=c["id"]):
                for aid in c.get("needs", []) + c.get("produces", []):
                    self.assertIn(aid, self.artifacts)
                handoff = c.get("handoff", {}).get("to")
                self.assertTrue(handoff is None or handoff in self.chapters)
                for loop in c.get("loops", []):
                    self.assertIn(loop["to"], self.chapters)
        for a in self.doc["artifacts"]:
            with self.subTest(artifact=a["id"]):
                self.assertIn(a["kind"], KINDS)
                self.assertIn(a["chapter"], self.chapters)
                for r in a["reads"]:
                    self.assertIn(r, self.artifacts)

    def test_each_artifact_made_in_exactly_one_chapter(self):
        for aid, a in self.artifacts.items():
            makers = [c["id"] for c in self.doc["chapters"] if aid in c.get("produces", [])]
            with self.subTest(artifact=aid):
                self.assertEqual(makers, [a["chapter"]])

    def test_reference_and_repo_paths_exist(self):
        for a in self.doc["artifacts"]:
            with self.subTest(artifact=a["id"]):
                if a.get("reference"):
                    self.assertTrue((journey.REFERENCE / a["reference"]).is_file(), a["reference"])
                if a["kind"] == "repo":
                    self.assertTrue((ROOT / a["path"]).is_file(), a["path"])
                if a.get("path"):
                    self.assertNotIn("..", Path(a["path"]).parts)

    def test_sessions_fit_the_day_and_add_up(self):
        for name, sessions in self.doc["tracks"].items():
            for day in {s["day"] for s in sessions}:
                todays = sorted((s for s in sessions if s["day"] == day), key=lambda s: _minutes(s["start"]))
                with self.subTest(track=name, day=day):
                    self.assertGreaterEqual(_minutes(todays[0]["start"]), _minutes("08:30"))
                    for a, b in zip(todays, todays[1:]):
                        self.assertLessEqual(_minutes(a["start"]) + a["minutes"], _minutes(b["start"]))
                    self.assertLessEqual(_minutes(todays[-1]["start"]) + todays[-1]["minutes"], _minutes("17:30"))
                    for s in todays:
                        self.assertIn(s["kind"], SESSION_KINDS)
                        self.assertTrue(s["chapter"] is None or s["chapter"] in self.chapters)
        three = self.doc["tracks"]["three-day"]
        self.assertEqual({s["chapter"] for s in three if s["chapter"]}, set(CHAPTER_IDS))
        for cid, c in self.chapters.items():
            with self.subTest(chapter=cid):
                self.assertEqual(c["minutes"], sum(s["minutes"] for s in three if s["chapter"] == cid))
                run = c.get("facilitator", {}).get("run", [])
                if run:
                    self.assertEqual(sum(r["minutes"] for r in run), c["minutes"])

    def test_monitor_routes_exist(self):
        views = set(re.findall(r"^views\.(\w+) = ", (ROOT / "zava_cold_chain/web/app.js").read_text(encoding="utf-8"), re.M))
        for c in self.doc["chapters"]:
            for m in c.get("monitor", []):
                with self.subTest(chapter=c["id"], route=m["route"]):
                    self.assertIn(m["route"], views)

    def test_house_style(self):
        files = [CONTENT / "journey.json"] + sorted((CONTENT / "chapters").glob("*.json"))
        for path in files:
            for s in _strings(json.loads(path.read_text(encoding="utf-8"))):
                with self.subTest(file=path.name, text=s[:60]):
                    self.assertNotIn("\u2014", s)
                    self.assertNotIn("\u2013", s)
                    self.assertIsNone(re.search(r"<[A-Za-z/]", s), "no HTML in content")


class Disk(unittest.TestCase):
    """Status and preview against a throwaway repo, so the real working folder is never touched."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp()).resolve()
        self.addCleanup(shutil.rmtree, self.tmp)
        self.outside = Path(tempfile.mkdtemp()).resolve()
        self.addCleanup(shutil.rmtree, self.outside)
        (self.tmp / "workshop" / "reference-run" / "docs").mkdir(parents=True)
        (self.tmp / "workshop" / "chapters").mkdir()
        (self.tmp / "workshop" / "journey.json").write_text(json.dumps({"artifacts": [
            {"id": "brd", "kind": "create", "path": "docs/*-brd.md", "reads": [], "reference": "docs/ref-brd.md"},
            {"id": "code", "kind": "create", "path": "src/app.py", "reads": [], "reference": None},
            {"id": "pr", "kind": "outside", "path": None, "reads": [], "reference": None},
        ]}), encoding="utf-8")
        (self.tmp / "workshop" / "reference-run" / "docs" / "ref-brd.md").write_text("x" * (journey.PREVIEW_BYTES + 10), encoding="utf-8")
        for name, value in (("ROOT", self.tmp), ("CONTENT", self.tmp / "workshop"), ("REFERENCE", self.tmp / "workshop" / "reference-run")):
            patcher = mock.patch.object(journey, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def row(self, aid):
        return next(a for a in journey.status()["artifacts"] if a["id"] == aid)

    def test_a_new_file_turns_found(self):
        self.assertFalse(self.row("brd")["exists"])
        (self.tmp / "docs").mkdir()
        (self.tmp / "docs" / "zava-silent-night-brd.md").write_text("# BRD", encoding="utf-8")
        row = self.row("brd")
        self.assertTrue(row["exists"])
        self.assertEqual(row["matches"], ["docs/zava-silent-night-brd.md"])
        self.assertIsNone(self.row("pr")["exists"])

    def test_a_link_out_of_the_repo_is_never_found(self):
        (self.outside / "secret-brd.md").write_text("no", encoding="utf-8")
        (self.tmp / "docs").symlink_to(self.outside, target_is_directory=True)
        self.assertFalse(self.row("brd")["exists"])
        self.assertIsNone(journey.preview("brd", "yours"))

    def test_preview_rules(self):
        ref = journey.preview("brd", "reference")
        self.assertTrue(ref["truncated"])
        self.assertEqual(len(ref["text"]), journey.PREVIEW_BYTES)
        self.assertTrue(ref["vscode"].startswith("vscode://file/"))
        self.assertIsNone(journey.preview("nope", "reference"))
        self.assertIsNone(journey.preview("brd", "elsewhere"))
        self.assertIsNone(journey.preview("pr", "yours"))
        (self.tmp / "src").mkdir()
        (self.tmp / "src" / "app.py").write_text("print()", encoding="utf-8")
        self.assertTrue(self.row("code")["exists"])
        self.assertIsNone(journey.preview("code", "yours"), "only text documents are previewed")

    def test_broken_content_names_the_file_and_line(self):
        (self.tmp / "workshop" / "journey.json").write_text('{"artifacts": [}', encoding="utf-8")
        with self.assertRaises(journey.ContentError) as e:
            journey.content()
        self.assertEqual(e.exception.path, "workshop/journey.json")
        self.assertIn("line 1", e.exception.detail)


class Routes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from zava_cold_chain.server import serve
        cls.httpd = serve(port=0, night="normal", speed=600)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def get(self, path, **headers):
        with urllib.request.urlopen(urllib.request.Request(self.base + path, headers=headers), timeout=5) as r:
            return r.status, r.headers.get("Content-Type"), r.read()

    def test_page_and_content(self):
        status, ctype, body = self.get("/journey")
        self.assertEqual(status, 200)
        self.assertTrue(ctype.startswith("text/html"))
        self.assertIn(b"journey.js", body)
        doc = json.loads(self.get("/api/journey")[2])
        self.assertEqual(len(doc["chapters"]), 11)
        self.assertIn("read_by", doc["artifacts"][0])
        self.assertEqual(len(json.loads(self.get("/api/journey/status")[2])["artifacts"]), len(doc["artifacts"]))

    def test_preview_routes(self):
        found = json.loads(self.get("/api/journey/preview?id=brd&which=reference")[2])
        self.assertTrue(found["path"].startswith("workshop/reference-run/"))
        for query in ("id=nope", "id=pull-request&which=reference", "id=brd&which=../etc"):
            with self.subTest(query=query), self.assertRaises(urllib.error.HTTPError) as e:
                self.get("/api/journey/preview?" + query)
            e.exception.close()
            self.assertEqual(e.exception.code, 404)

    def test_unknown_host_is_refused(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            self.get("/api/journey", Host="attacker.example")
        e.exception.close()
        self.assertEqual(e.exception.code, 400)


class ReviewRecordsAreKept(unittest.TestCase):
    def test_rpi_review_records_are_not_ignored(self):
        git = shutil.which("git")
        if not git or not (ROOT / ".git").exists():
            self.skipTest("git is not available")
        for path in (".copilot-tracking/reviews/logs/2026-01-01/x-review.md",
                     "workshop/reference-run/.copilot-tracking/reviews/logs/2026-11-15/fr-001-defrost-alarm-gap-review.md"):
            with self.subTest(path=path):
                result = subprocess.run([git, "check-ignore", "-q", path], cwd=ROOT, check=False)
                self.assertEqual(result.returncode, 1, f"{path} is ignored by .gitignore")


if __name__ == "__main__":
    unittest.main()
