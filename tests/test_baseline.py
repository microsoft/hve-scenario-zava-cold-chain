"""Baseline tests. They pass today and describe behavior that must keep working after your change.

Run: python -m unittest
"""
import unittest

from zava_cold_chain import assistant, commands
from zava_cold_chain.simulator import World, clock, run_night


class NormalNight(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.world = run_night("normal")

    def test_scheduled_defrost_that_ends_on_time_raises_no_alarm(self):
        self.assertEqual(self.world.store.alarms(), [])

    def test_every_case_is_back_within_its_limit_by_morning(self):
        for case in self.world.cases.values():
            self.assertLessEqual(case.temp, case.limit, case.id)

    def test_readings_are_recorded_every_minute(self):
        history = self.world.store.history("ZF-101/F-10")
        self.assertEqual(len(history), 600)
        self.assertEqual(clock(history[0]["t"]), "22:00")


class DoorOpenNight(unittest.TestCase):
    def test_an_open_door_raises_an_alarm_for_that_case_only(self):
        alarms = run_night("door-open").store.alarms()
        self.assertEqual([a["case"] for a in alarms], ["ZF-104/F-11"])
        self.assertEqual(alarms[0]["rule"], "ALM-01")


class Commands(unittest.TestCase):
    def setUp(self):
        self.world = World("normal")

    def test_setpoint_changes_one_case(self):
        commands.apply(self.world, {"action": "setpoint", "target": "ZF-121/C-20", "value": 4})
        self.assertEqual(self.world.cases["ZF-121/C-20"].setpoint, 4.0)
        self.assertEqual(self.world.cases["ZF-121/F-10"].setpoint, -20.0)

    def test_timed_defrost_ends_on_time(self):
        commands.apply(self.world, {"action": "defrost", "target": "ZF-101/F-10", "minutes": 15})
        for _ in range(16):
            self.world.tick()
        self.assertEqual(self.world.cases["ZF-101/F-10"].mode, "normal")


class StoreAssistant(unittest.TestCase):
    def test_a_warm_case_in_normal_mode_is_not_safe(self):
        world = World("normal")
        world.cases["ZF-130/C-20"].temp = 12.0
        answer = assistant.ask(world, "ZF-130/C-20", "Is this case safe?")["answer"]
        self.assertTrue(answer.startswith("No"), answer)

    def test_the_context_includes_the_case_and_its_notes(self):
        world = World("normal")
        context = assistant.ask(world, "ZF-101/F-10", "Is it safe?")["context"]
        self.assertIn("ZF-101/F-10", context)
        self.assertIn("Door seal replaced", context)


if __name__ == "__main__":
    unittest.main()
