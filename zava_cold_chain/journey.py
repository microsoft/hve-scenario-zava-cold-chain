# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.
"""Workshop Journey: content from workshop/, artifact status from disk, and read-only previews.

Paths always come from workshop/journey.json, never from a request, and must resolve inside the repo.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "workshop"
REFERENCE = CONTENT / "reference-run"
PREVIEW_SUFFIXES = {".md", ".json", ".yml", ".yaml", ".txt"}
PREVIEW_BYTES = 64 * 1024
MAX_MATCHES = 5


class ContentError(Exception):
    """A workshop content file is missing or isn't valid JSON."""

    def __init__(self, path: Path, detail: str) -> None:
        super().__init__(f"{path.relative_to(ROOT)}: {detail}")
        self.path, self.detail = path.relative_to(ROOT).as_posix(), detail


def _load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ContentError(path, "file not found") from None
    except json.JSONDecodeError as e:
        raise ContentError(path, f"line {e.lineno}, column {e.colno}: {e.msg}") from None


def content() -> dict:
    """journey.json plus every chapter, with each artifact's read_by computed from the others' reads."""
    doc = _load(CONTENT / "journey.json")
    doc["chapters"] = [_load(p) for p in sorted((CONTENT / "chapters").glob("*.json"))]
    for a in doc["artifacts"]:
        a["read_by"] = [b["id"] for b in doc["artifacts"] if a["id"] in b.get("reads", [])]
    return doc


def _inside(path: Path, root: Path) -> bool:
    resolved = path.resolve()
    return resolved == root.resolve() or root.resolve() in resolved.parents


def _matches(pattern: str) -> list:
    """Files on this computer for a repo-relative path or glob, newest first, never outside the repo."""
    if ".." in Path(pattern).parts:
        return []
    found = ROOT.glob(pattern) if any(c in pattern for c in "*?[") else [ROOT / pattern]
    files = [p for p in found if p.is_file() and _inside(p, ROOT)]
    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)


def _iso(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


def status() -> dict:
    """For each artifact: whether it's on this computer, where, and whether the reference run has it."""
    out = []
    for a in _load(CONTENT / "journey.json")["artifacts"]:
        ref = a.get("reference")
        row = {"id": a["id"], "reference_exists": bool(ref) and (REFERENCE / ref).is_file()}
        if a["kind"] == "outside" or not a.get("path"):
            row.update(exists=None, matches=[], modified=None)
        else:
            files = _matches(a["path"])
            row.update(exists=bool(files), matches=[p.relative_to(ROOT).as_posix() for p in files[:MAX_MATCHES]],
                       count=len(files), modified=_iso(files[0]) if files else None)
        out.append(row)
    return {"checked": datetime.now(timezone.utc).isoformat(), "artifacts": out}


def preview(artifact_id: str, which: str):
    """The start of one artifact's file, read only. Returns None when there is nothing allowed to show."""
    artifact = next((a for a in _load(CONTENT / "journey.json")["artifacts"] if a["id"] == artifact_id), None)
    if artifact is None or which not in ("yours", "reference"):
        return None
    if which == "reference":
        if not artifact.get("reference"):
            return None
        file, root = REFERENCE / artifact["reference"], REFERENCE
        if not file.is_file():
            return None
    else:
        if artifact["kind"] == "outside" or not artifact.get("path"):
            return None
        files = _matches(artifact["path"])
        if not files:
            return None
        file, root = files[0], ROOT
    if not _inside(file, root) or file.suffix.lower() not in PREVIEW_SUFFIXES:
        return None
    with file.open("rb") as f:
        data = f.read(PREVIEW_BYTES + 1)
    resolved = file.resolve()
    return {"id": artifact_id, "which": which, "path": resolved.relative_to(ROOT).as_posix(),
            "text": data[:PREVIEW_BYTES].decode("utf-8", errors="replace"),
            "truncated": len(data) > PREVIEW_BYTES, "vscode": "vscode://file/" + resolved.as_posix().lstrip("/")}
