# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Command line: python -m zava_cold_chain serve | replay <night> | nights | gauntlet"""
from __future__ import annotations

import argparse
import json
import webbrowser
from pathlib import Path

from .simulator import available_nights, clock, run_night


def cmd_serve(args) -> None:
    from .server import serve
    httpd = serve(args.port, args.night, args.speed, args.scorecards)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Zava Cold Chain Monitor running at {url}  (night: {args.night}; Ctrl+C to stop)")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


def cmd_replay(args) -> None:
    w = run_night(args.night)
    print(f"Night: {w.night}. {w.description}\n")
    print(f"{'case':14} {'peak °C':>8} {'08:00 °C':>9}  above limit at 08:00")
    for cid, case in w.cases.items():
        peak = max(r["temp"] for r in w.store.history(cid))
        print(f"{cid:14} {peak:8.1f} {case.temp:9.1f}  {'YES' if case.temp > case.limit else ''}")
    alarms = w.store.alarms()
    print(f"\nAlarms: {len(alarms)}")
    for a in alarms:
        print(f"  {clock(a['t'])}  {a['rule']}  {a['message']}")


def cmd_gauntlet(args) -> None:
    from . import gauntlet
    team = "baseline" if args.baseline else args.team
    card = gauntlet.run(args.seed, args.hidden, team, (args.fixes or "").split(","))
    out = args.out or Path("scorecards") / f"{gauntlet.slug(team)}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(gauntlet.summary(card))
    print(f"\nScorecard written to {out}. Give it to your trainer for the leaderboard.")


def main() -> None:
    p = argparse.ArgumentParser(prog="python -m zava_cold_chain", description="Zava cold-chain monitoring scenario (fictitious, local only)")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("serve", help="start the dashboard on 127.0.0.1")
    s.add_argument("--port", type=int, default=8740)
    s.add_argument("--night", default="normal", choices=available_nights())
    s.add_argument("--speed", type=float, default=10.0, help="simulated minutes per second (default 10)")
    s.add_argument("--no-browser", action="store_true")
    s.add_argument("--scorecards", type=Path, default=Path("scorecards"), help="folder the leaderboard reads scorecards from")
    s.set_defaults(func=cmd_serve)
    r = sub.add_parser("replay", help="run a whole night instantly and print a summary")
    r.add_argument("night", choices=available_nights())
    r.set_defaults(func=cmd_replay)
    n = sub.add_parser("nights", help="list the nights you can replay")
    n.set_defaults(func=lambda a: print("\n".join(available_nights())))
    g = sub.add_parser("gauntlet", help="score this code across every night, including hidden ones, and write a scorecard")
    g.add_argument("--seed", type=int, default=2026, help="the trainer's seed for the hidden nights (default 2026)")
    g.add_argument("--hidden", type=int, default=5, help="how many hidden nights to generate (default 5)")
    g.add_argument("--team", default="this computer", help="your table's name, as it should appear on the leaderboard")
    g.add_argument("--fixes", default="", help="the fixes your table built, for example FX-1,FX-6 (see data/fixes.json)")
    g.add_argument("--baseline", action="store_true", help="trainer only: score the untouched code as the baseline")
    g.add_argument("--out", type=Path, help="where to write the scorecard (default scorecards/<team>.json)")
    g.set_defaults(func=cmd_gauntlet)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
