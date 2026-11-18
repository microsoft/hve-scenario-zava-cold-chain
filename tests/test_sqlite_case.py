# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Regression tests for API-test worker and SQLite cleanup ordering."""
import sqlite3
import threading
import unittest
from unittest import mock

from tests.sqlite_case import SQLiteTestCase
from zava_cold_chain.simulator import World


class SimulationCleanup(unittest.TestCase):
    def test_given_unfinished_night_when_class_cleanup_then_worker_stops_before_databases_close(self):
        class Fixture(SQLiteTestCase):
            pass

        self.addCleanup(Fixture.doClassCleanups)
        Fixture.setUpClass()
        ticked = threading.Event()
        workers = []
        original_tick = World.tick

        def tick(world):
            workers.append(threading.current_thread())
            original_tick(world)
            ticked.set()

        with mock.patch.object(World, "tick", tick):
            httpd = Fixture.serve(port=0, night="normal", speed=0.1)
            self.addCleanup(httpd.server_close)
            self.assertTrue(ticked.wait(timeout=5), "Simulation worker did not tick")

        first_store = httpd.sim.world.store
        httpd.sim.replay("normal")
        replay_store = httpd.sim.world.store
        self.assertFalse(httpd.sim.world.done)
        original_join = workers[0].join

        def join(timeout):
            for store in (first_store, replay_store):
                store.history("ZF-101/F-10")
            original_join(timeout=timeout)

        with mock.patch.object(workers[0], "join", side_effect=join):
            Fixture.doClassCleanups()

        self.assertEqual(Fixture.tearDown_exceptions, [])
        self.assertFalse(workers[0].is_alive())
        for store in (first_store, replay_store):
            with self.subTest(store=store), self.assertRaises(sqlite3.ProgrammingError):
                store.history("ZF-101/F-10")
