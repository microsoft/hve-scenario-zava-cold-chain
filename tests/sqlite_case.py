# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""SQLite connection cleanup for simulation tests, including nested and HTTP calls."""
import queue
import sqlite3
import threading
import unittest
from contextlib import ExitStack
from unittest import mock


class SQLiteTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        original_connect = sqlite3.connect
        connections = ExitStack()

        def connect(*args, **kwargs) -> sqlite3.Connection:
            connection = original_connect(*args, **kwargs)
            connections.callback(connection.close)
            return connection

        patcher = mock.patch("zava_cold_chain.store.sqlite3.connect", side_effect=connect)
        cls.addClassCleanup(patcher.stop)
        cls.addClassCleanup(connections.close)
        patcher.start()

    @classmethod
    def serve(cls, **kwargs):
        """Start an API-test simulation whose worker is joined before database cleanup."""
        from zava_cold_chain.server import Simulation, serve

        stopped = threading.Event()
        workers = queue.Queue(maxsize=1)

        def loop(sim):
            workers.put(threading.current_thread())
            while not stopped.is_set():
                with sim.lock:
                    if not sim.paused:
                        sim.world.tick()
                stopped.wait(1 / max(sim.speed, 0.1))

        with mock.patch.object(Simulation, "_loop", loop):
            httpd = serve(**kwargs)
        worker = workers.get(timeout=5)

        def stop_worker():
            stopped.set()
            worker.join(timeout=5)
            if worker.is_alive():
                raise RuntimeError("API-test simulation worker did not stop")

        cls.addClassCleanup(stop_worker)
        return httpd
