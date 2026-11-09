"""ZavaWatch web server: the operations dashboard, a JSON API and a live event stream.

Binds to 127.0.0.1 only. There is no sign-in: being local is the only access control.
"""
from __future__ import annotations

import json
import math
import mimetypes
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import __version__, assistant, commands, impact, notify, ops
from .simulator import World, available_nights, clock, minutes

WEB = Path(__file__).resolve().parent / "web"


class Simulation:
    """Runs one World on a background thread at `speed` simulated minutes per second."""

    def __init__(self, night: str, speed: float) -> None:
        self.speed, self.paused, self.generation = speed, False, 1
        self.lock = threading.Lock()
        self.world = World(night)
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self) -> None:
        while True:
            if not self.paused:
                with self.lock:
                    self.world.tick()
            time.sleep(1 / max(self.speed, 0.1))

    def replay(self, night: str) -> None:
        with self.lock:
            self.world = World(night)
            self.generation += 1

    def jump(self, hhmm: str) -> None:
        target = minutes(hhmm)
        with self.lock:
            while self.world.t <= target and not self.world.done:  # include the target minute's events
                self.world.tick()

    def control(self) -> dict:
        return {"speed": self.speed, "paused": self.paused, "generation": self.generation}


def state(world) -> dict:
    """Compact snapshot kept for scripts and the first version of the page."""
    return {"company": world.company, "version": __version__, "night": world.night, "description": world.description,
            "time": clock(world.t), "done": world.done, "stores": ops.stores(world),
            "alarms": [dict(a, time=clock(a["t"])) for a in world.store.alarms()]}


# Sent on every response. Inline style attributes are used by the dashboard, so styles allow 'unsafe-inline'.
SECURITY_HEADERS = (
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "no-referrer"),
    ("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                                "img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; "
                                "form-action 'none'; frame-ancestors 'none'"),
)


def _reject_constant(name: str):
    raise ValueError(f"{name} is not allowed")


def _int(text: str) -> int:
    try:
        return int(text or 0)
    except ValueError:
        return 0


def _q(url, key: str) -> str:
    return parse_qs(url.query).get(key, [""])[0]


def make_handler(sim: Simulation):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):  # keep the terminal quiet
            pass

        def end_headers(self) -> None:
            for name, value in SECURITY_HEADERS:
                self.send_header(name, value)
            super().end_headers()

        def _host_ok(self) -> bool:
            """Answer only requests addressed to this server, so a DNS-rebinding page can't read the API."""
            port = self.server.server_address[1]
            return self.headers.get("Host") in (f"127.0.0.1:{port}", f"localhost:{port}")

        def _send(self, code: int, body, content_type: str = "application/json") -> None:
            data = body if isinstance(body, bytes) else json.dumps(body).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _body(self) -> dict:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}", parse_constant=_reject_constant)
            if not isinstance(body, dict):
                raise ValueError("body must be a JSON object")
            return body

        def _same_origin(self) -> bool:
            """Accept JSON only, from this dashboard. Stops other web pages posting to the local API."""
            if (self.headers.get("Content-Type") or "").split(";")[0].strip() != "application/json":
                return False
            origin = self.headers.get("Origin")
            port = self.server.server_address[1]
            return origin is None or origin in (f"http://127.0.0.1:{port}", f"http://localhost:{port}")

        def _static(self, path: str) -> bool:
            name = "index.html" if path in ("/", "/index.html") else path.lstrip("/")
            file = (WEB / name).resolve()
            if WEB.resolve() not in file.parents or not file.is_file():
                return False
            ctype = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
            self._send(200, file.read_bytes(), ctype + ("; charset=utf-8" if ctype.startswith("text") else ""))
            return True

        def _stream(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            last, gen = 0, sim.generation
            try:
                while True:
                    with sim.lock:
                        if sim.generation != gen:
                            gen, last = sim.generation, 0
                            self.wfile.write(b"event: reset\ndata: {}\n\n")
                        new = sim.world.feed[last:]
                        last = len(sim.world.feed)
                        tick = {"time": clock(sim.world.t), "done": sim.world.done, **sim.control()}
                    for e in new:
                        self.wfile.write(f"data: {json.dumps(e)}\n\n".encode("utf-8"))
                    self.wfile.write(f"event: clock\ndata: {json.dumps(tick)}\n\n".encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(0.5)
            except (BrokenPipeError, ConnectionResetError):
                return

        def do_GET(self) -> None:
            if not self._host_ok():
                return self._send(400, {"error": "unknown host"})
            url = urlparse(self.path)
            path = url.path
            if path == "/api/stream":
                return self._stream()
            if not path.startswith("/api/"):
                return None if self._static(path) else self._send(404, {"error": "not found"})
            with sim.lock:
                w = sim.world
                routes = {
                    "/api/state": lambda: state(w),
                    "/api/kpis": lambda: dict(ops.kpis(w), company=w.company, version=__version__,
                                              description=w.description, **sim.control()),
                    "/api/stores": lambda: ops.stores(w),
                    "/api/feed": lambda: [e for e in w.feed if e["seq"] > _int(_q(url, "since"))],
                    "/api/incidents": lambda: list(reversed(w.incidents)),
                    "/api/alarms": lambda: ops.alarms(w),
                    "/api/products-at-risk": lambda: ops.products_at_risk(w),
                    "/api/notify-contacts": lambda: w.roster["notify"],
                    "/api/food-safety": lambda: ops.food_safety(w),
                    "/api/audit": lambda: ops.audit(w),
                    "/api/health": lambda: ops.health(w),
                    "/api/impact": lambda: impact.predict(w),
                    "/api/issues": ops.issues,
                    "/api/runbook": lambda: {"markdown": ops.runbook()},
                    "/api/owners": lambda: ops.owners(w),
                    "/api/nights": lambda: {"nights": available_nights(), "current": w.night},
                    "/api/discard": lambda: {"store": _q(url, "store"), "draft": assistant.draft_discard_list(w, _q(url, "store"))},
                }
                if path in routes:
                    return self._send(200, routes[path]())
                if path == "/api/store":
                    sid = _q(url, "id")
                    return self._send(200, ops.store_detail(w, sid)) if sid in w.stores else self._send(404, {"error": "unknown store"})
                if path in ("/api/case", "/api/history"):
                    cid = _q(url, "id") or _q(url, "case")
                    if cid not in w.cases:
                        return self._send(404, {"error": "unknown case"})
                    d = ops.case_detail(w, cid)
                    return self._send(200, d if path == "/api/case" else {"case": cid, "readings": d["readings"]})
            self._send(404, {"error": "not found"})

        def do_POST(self) -> None:
            if not self._host_ok():
                return self._send(400, {"error": "unknown host"})
            if not self._same_origin():
                return self._send(403, {"error": "send JSON from the dashboard"})
            try:
                body = self._body()
            except ValueError as e:
                return self._send(400, {"error": f"invalid JSON: {e}"})
            path = urlparse(self.path).path
            if path == "/api/replay":
                if body.get("night") not in available_nights():
                    return self._send(400, {"error": "unknown night"})
                sim.replay(body["night"])
                return self._send(200, {"night": body["night"]})
            if path == "/api/control":
                try:
                    if "speed" in body:
                        speed = float(body["speed"])
                        if not math.isfinite(speed):
                            raise ValueError("speed must be a number")
                        sim.speed = min(max(speed, 1.0), 600.0)
                    if "paused" in body:
                        sim.paused = bool(body["paused"])
                    if body.get("jump"):
                        sim.jump(str(body["jump"]))
                except (TypeError, ValueError) as e:
                    return self._send(400, {"error": f"bad request: {e}"})
                return self._send(200, sim.control())
            with sim.lock:
                w = sim.world
                try:
                    if path == "/api/commands":
                        return self._send(200, {"applied": commands.apply(w, body)})
                    if path == "/api/alarms/ack":
                        alarm = next(a for a in w.alarm_list if a["id"] == body["id"])
                        notify.acknowledge(w, alarm, body.get("by") or "dashboard user", body.get("note", ""))
                        return self._send(200, notify.public(alarm))
                    if path == "/api/decisions":
                        return self._send(200, ops.decide(w, body["case"], body["decision"]))
                    if path == "/api/ask":
                        r = assistant.ask(w, body["case"], body.get("question", ""))
                        w.emit("zavaask", f"ZavaAsk about {body['case']}: {r['answer']}", case=body["case"],
                               store=body["case"].split("/")[0], source="ZavaAsk")
                        return self._send(200, r)
                except (KeyError, ValueError, TypeError, OverflowError, StopIteration) as e:
                    return self._send(400, {"error": f"bad request: {e}"})
            self._send(404, {"error": "not found"})

    return Handler


def serve(port: int = 8740, night: str = "normal", speed: float = 10.0) -> ThreadingHTTPServer:
    sim = Simulation(night, speed)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), make_handler(sim))
    httpd.daemon_threads = True
    httpd.sim = sim
    return httpd
