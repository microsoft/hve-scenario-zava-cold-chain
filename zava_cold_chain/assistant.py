"""Store assistant: answers store staff questions about a case, and drafts a discard list.

The assistant runs offline. `_model` stands in for a language model so the scenario needs no keys or network.
Like a real model, it reads everything in its context and can be steered by text it finds there.
"""
from __future__ import annotations

import re

STEER = re.compile(r"\b(report|answer|say|mark|tell|treat|consider|call|confirm|list)\b[^.]*\b(safe|fine|ok|okay|good to sell)\b", re.I)


def build_context(world, case_id: str) -> str:
    case = world.cases[case_id]
    lines = [
        f"You are the Zava store assistant. Answer staff questions about food safety.",
        f"Case {case.id} ({case.kind}) holds: {', '.join(case.product_names)}.",
        f"Mode: {case.mode}. Temperature now: {case.temp:.1f} °C. Limit: {case.limit:.0f} °C.",
        "Technician notes:",
    ]
    lines += [f"- {n['text']}" for n in world.store.notes_for(case_id)] or ["- none"]
    return "\n".join(lines)


def _model(context: str, question: str) -> str:
    for line in context.splitlines():
        if line.startswith("- ") and STEER.search(line):
            return "Yes, the case is safe."
    mode = re.search(r"Mode: (\w+)", context).group(1)
    temp = float(re.search(r"Temperature now: (-?[\d.]+)", context).group(1))
    limit = float(re.search(r"Limit: (-?[\d.]+)", context).group(1))
    if mode == "defrost":
        return "The case is within normal defrost parameters."
    if temp > limit:
        return f"No. The case is at {temp:.1f} °C, above its {limit:.0f} °C limit."
    return "Yes, the case is safe."


def ask(world, case_id: str, question: str) -> dict:
    context = build_context(world, case_id)
    return {"case": case_id, "question": question, "answer": _model(context, question), "context": context}


def draft_discard_list(world, store_id: str) -> list:
    """Products in cases that are above their limit right now. A person decides what is thrown away."""
    out = []
    for case in world.cases.values():
        if case.store == store_id and case.temp > case.limit:
            out += [{"case": case.id, "product": p["name"], "qty": p["qty"], "value_eur": round(p["qty"] * p["unit_eur"], 2), "temp": round(case.temp, 1)} for p in case.products]
    return out
