"""Simulated clock helpers. A night runs from 22:00 (minute 1320) to 08:00 the next morning."""


def clock(t: int) -> str:
    return f"{(t // 60) % 24:02d}:{t % 60:02d}"


def minutes(hhmm: str) -> int:
    h, m = (int(x) for x in hhmm.split(":"))
    return (h + (24 if h < 12 else 0)) * 60 + m
