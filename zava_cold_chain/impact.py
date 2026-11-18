# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Predicted customer impact: how many shoppers tomorrow may meet stock that is at risk tonight.

The dashboard presents this as a model prediction and does not say how it is made. In this prototype it is
simulated with a small, repeatable stand-in so tests stay stable. Shoppers "may buy affected stock" while a
case has no discard or hold decision, and "may find an empty shelf" once the stock is pulled.
"""
from __future__ import annotations

import json
from math import prod

from .simulator import DATA

PULLED = ("discard", "hold for testing")


def _inputs() -> dict:
    return json.loads((DATA / "forecast.json").read_text(encoding="utf-8"))


def _reach(rates: list) -> float:
    """Share of shoppers who buy at least one of the products."""
    return 1 - prod(1 - r for r in rates) if rates else 0.0


def _round(n: float) -> int:
    return int(round(n, -1))


def predict(world) -> dict:
    f = _inputs()
    spread = f["interval"]
    stores, products = [], {}
    for sid, s in world.stores.items():
        shoppers = f["shoppers_per_day"].get(sid, 2000)
        on_sale, pulled = [], []
        for c in (c for c in world.cases.values() if c.store == sid):
            weight = 1.0 if c.temp > c.limit else 0.5 if c.temp > c.limit - 4 else 0.0
            if not weight:
                continue
            gone = (world.decisions.get(c.id) or {}).get("decision") in PULLED
            for p in c.products:
                rate = f["buy_rate"].get(p["name"], 0.02) * weight
                (pulled if gone else on_sale).append(rate)
                products[p["name"]] = products.get(p["name"], 0) + shoppers * rate
        # One total per store (shoppers who meet any affected product), split by whether that stock is still on sale,
        # so pulling stock moves shoppers between the two groups without changing the total.
        total = _round(shoppers * _reach(on_sale + pulled))
        r_buy, r_gone = _reach(on_sale), _reach(pulled)
        buy = _round(total * r_buy / (r_buy + r_gone)) if total else 0
        stores.append({"store": sid, "name": s["name"], "customers": total,
                       "may_buy_affected": buy, "may_find_empty": total - buy})
    total = sum(x["customers"] for x in stores)
    return {"customers": total, "low": _round(total * (1 - spread)), "high": _round(total * (1 + spread)),
            "may_buy_affected": sum(x["may_buy_affected"] for x in stores),
            "may_find_empty": sum(x["may_find_empty"] for x in stores),
            "horizon": f["horizon"], "stores": stores,
            "products": {k: _round(v) for k, v in sorted(products.items(), key=lambda kv: -kv[1])}}
