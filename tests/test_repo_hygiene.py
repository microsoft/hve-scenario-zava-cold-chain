# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Repository hygiene: no hidden or direction-changing Unicode characters, and every data file labelled synthetic.

These characters can make code or text read differently from what runs (for example "Trojan Source"),
or hide instructions from reviewers.
"""
from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUFFIXES = {".py", ".js", ".css", ".html", ".json", ".md", ".txt", ".yml", ".yaml", ".toml", ".cfg"}
SKIP_DIRS = {".git", "__pycache__", ".venv", "venv", ".pytest_cache", ".mypy_cache"}
HIDDEN = {
    **{chr(c): "bidirectional control" for c in range(0x202A, 0x202F)},
    **{chr(c): "bidirectional isolate" for c in range(0x2066, 0x206A)},
    "\u200b": "zero-width space", "\u200c": "zero-width non-joiner", "\u200d": "zero-width joiner",
    "\u2060": "word joiner", "\ufeff": "byte order mark", "\u00ad": "soft hyphen",
    "\u200e": "left-to-right mark", "\u200f": "right-to-left mark",
}


def _files():
    for path in ROOT.rglob("*"):
        if path.is_file() and path.suffix in SUFFIXES and not SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            yield path


class HiddenCharacters(unittest.TestCase):
    def test_no_hidden_or_bidirectional_characters(self):
        problems = []
        for path in _files():
            for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                for ch, label in HIDDEN.items():
                    if ch in line:
                        problems.append(f"{path.relative_to(ROOT)}:{n}: {label} (U+{ord(ch):04X})")
        self.assertEqual(problems, [], "\n".join(problems))

    def test_files_scanned(self):
        self.assertGreater(len(list(_files())), 10)


class SyntheticDataLabels(unittest.TestCase):
    """Every data file says it is synthetic and points to docs/synthetic-data.md."""

    def test_json_data_carries_synthetic_note(self):
        files = sorted((ROOT / "data").glob("*.json")) + sorted((ROOT / "nights").glob("*.json"))
        self.assertGreater(len(files), 4)
        for path in files:
            note = json.loads(path.read_text(encoding="utf-8")).get("note", "")
            with self.subTest(file=path.name):
                self.assertIn("synthetic", note.lower())
                self.assertIn("docs/synthetic-data.md", note)

    def test_runbook_carries_synthetic_label(self):
        first_lines = (ROOT / "data" / "runbook.md").read_text(encoding="utf-8").splitlines()[:3]
        self.assertTrue(any("synthetic" in line.lower() for line in first_lines))

    def test_data_statement_exists(self):
        self.assertTrue((ROOT / "docs" / "synthetic-data.md").is_file())


if __name__ == "__main__":
    unittest.main()
