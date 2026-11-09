"""Command line: python -m zava_fresh serve | replay <night> | nights"""
from __future__ import annotations

import argparse
import webbrowser

from .simulator import available_nights, clock, run_night


def cmd_serve(args) -> None:
    from .server import serve
    httpd = serve(args.port, args.night, args.speed)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Zava Fresh ZavaWatch running at {url}  (night: {args.night}; Ctrl+C to stop)")
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


def main() -> None:
    p = argparse.ArgumentParser(prog="python -m zava_fresh", description="Zava Fresh cold-chain monitor (fictitious, local only)")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("serve", help="start the dashboard on 127.0.0.1")
    s.add_argument("--port", type=int, default=8740)
    s.add_argument("--night", default="normal", choices=available_nights())
    s.add_argument("--speed", type=float, default=10.0, help="simulated minutes per second (default 10)")
    s.add_argument("--no-browser", action="store_true")
    s.set_defaults(func=cmd_serve)
    r = sub.add_parser("replay", help="run a whole night instantly and print a summary")
    r.add_argument("night", choices=available_nights())
    r.set_defaults(func=cmd_replay)
    n = sub.add_parser("nights", help="list the nights you can replay")
    n.set_defaults(func=lambda a: print("\n".join(available_nights())))
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
