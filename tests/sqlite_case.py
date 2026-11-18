# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""SQLite connection cleanup for simulation tests, including nested and HTTP calls."""
import sqlite3
import unittest
from unittest import mock


class SQLiteTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        original_connect = sqlite3.connect

        def connect(*args, **kwargs) -> sqlite3.Connection:
            connection = original_connect(*args, **kwargs)
            cls.addClassCleanup(connection.close)
            return connection

        patcher = mock.patch("zava_cold_chain.store.sqlite3.connect", side_effect=connect)
        cls.addClassCleanup(patcher.stop)
        patcher.start()
