# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Storage for readings, alarms and technician notes. In-memory SQLite: every run starts clean."""
from __future__ import annotations

import sqlite3
import threading


class Store:
    def __init__(self) -> None:
        self._db = sqlite3.connect(":memory:", check_same_thread=False)
        self._lock = threading.Lock()
        self._db.executescript(
            """
            CREATE TABLE readings (t INTEGER, case_id TEXT, temp REAL, mode TEXT);
            CREATE TABLE alarms (t INTEGER, case_id TEXT, rule TEXT, message TEXT);
            CREATE TABLE notes (case_id TEXT, author TEXT, text TEXT);
            CREATE TABLE commands (t INTEGER, action TEXT, target TEXT, cases INTEGER, value REAL, minutes INTEGER,
                                   actor TEXT);
            CREATE INDEX readings_case ON readings (case_id, t);
            """
        )

    def add_reading(self, t: int, case_id: str, temp: float, mode: str) -> None:
        with self._lock:
            self._db.execute("INSERT INTO readings VALUES (?, ?, ?, ?)", (t, case_id, round(temp, 2), mode))

    def add_alarm(self, t: int, case_id: str, rule: str, message: str) -> None:
        with self._lock:
            self._db.execute("INSERT INTO alarms VALUES (?, ?, ?, ?)", (t, case_id, rule, message))

    def add_note(self, case_id: str, author: str, text: str) -> None:
        with self._lock:
            self._db.execute("INSERT INTO notes VALUES (?, ?, ?)", (case_id, author, text))

    def add_command(self, t: int, action: str, target: str, cases: int, value=None, minutes=None,
                    actor: str = "unknown") -> None:
        with self._lock:
            self._db.execute("INSERT INTO commands VALUES (?, ?, ?, ?, ?, ?, ?)",
                             (t, action, target, cases, value, minutes, actor))

    def commands(self) -> list:
        with self._lock:
            rows = self._db.execute("SELECT t, action, target, cases, value, minutes, actor FROM commands ORDER BY t").fetchall()
        keys = ("t", "action", "target", "cases", "value", "minutes", "actor")
        return [dict(zip(keys, r)) for r in rows]

    def alarms(self) -> list[dict]:
        with self._lock:
            rows = self._db.execute("SELECT t, case_id, rule, message FROM alarms ORDER BY t").fetchall()
        return [{"t": t, "case": c, "rule": r, "message": m} for t, c, r, m in rows]

    def history(self, case_id: str) -> list[dict]:
        with self._lock:
            rows = self._db.execute(
                "SELECT t, temp, mode FROM readings WHERE case_id = ? ORDER BY t", (case_id,)
            ).fetchall()
        return [{"t": t, "temp": temp, "mode": mode} for t, temp, mode in rows]

    def notes_for(self, case_id: str) -> list[dict]:
        with self._lock:
            rows = self._db.execute("SELECT author, text FROM notes WHERE case_id = ?", (case_id,)).fetchall()
        return [{"author": a, "text": x} for a, x in rows]
