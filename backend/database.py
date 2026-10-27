"""
SQLite-backed persistence layer.
All domain objects are stored as JSON columns for flexibility.
"""
from __future__ import annotations

import json
import sqlite3
import hashlib
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Generator

DB_PATH = Path(__file__).parent / "research_compass.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS papers (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL DEFAULT 'default',
    hash        TEXT,                  -- SHA-256 of file bytes for dedup
    filename    TEXT NOT NULL,
    data        TEXT NOT NULL,         -- JSON-encoded Paper model
    raw_text    TEXT NOT NULL DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analysis_state (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL             -- JSON blob
);

CREATE TABLE IF NOT EXISTS gaps (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL DEFAULT 'default',
    data        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ideas (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL DEFAULT 'default',
    data        TEXT NOT NULL
);
"""


def init_db() -> None:
    """Create tables if they don't exist and ensure session columns exist."""
    with get_db() as conn:
        conn.executescript(SCHEMA)
        try:
            conn.execute("ALTER TABLE papers ADD COLUMN session_id TEXT NOT NULL DEFAULT 'default'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE gaps ADD COLUMN session_id TEXT NOT NULL DEFAULT 'default'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE ideas ADD COLUMN session_id TEXT NOT NULL DEFAULT 'default'")
        except Exception:
            pass


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def clear_all_data() -> None:
    """Purge all data from all tables to return strictly to a zero state."""
    with get_db() as conn:
        conn.execute("DELETE FROM papers")
        conn.execute("DELETE FROM analysis_state")
        conn.execute("DELETE FROM gaps")
        conn.execute("DELETE FROM ideas")


# ---------------------------------------------------------------------------
# Papers
# ---------------------------------------------------------------------------

def file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def paper_exists_by_hash(h: str, session_id: str = "default") -> bool:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM papers WHERE hash = ? AND (session_id = ? OR session_id = 'default')",
            (h, session_id),
        ).fetchone()
        return row is not None


def get_paper_by_hash(h: str, session_id: str = "default") -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT data FROM papers WHERE hash = ? AND (session_id = ? OR session_id = 'default')",
            (h, session_id),
        ).fetchone()
        return json.loads(row["data"]) if row else None


def save_paper(paper_id: str, file_hash_val: str, filename: str, paper_dict: dict, raw_text: str, session_id: str = "default") -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO papers (id, session_id, hash, filename, data, raw_text) VALUES (?, ?, ?, ?, ?, ?)",
            (paper_id, session_id, file_hash_val, filename, json.dumps(paper_dict), raw_text),
        )


def get_all_papers(session_id: str | None = None) -> list[dict]:
    with get_db() as conn:
        if session_id:
            rows = conn.execute("SELECT data FROM papers WHERE session_id = ? ORDER BY created_at DESC", (session_id,)).fetchall()
        else:
            rows = conn.execute("SELECT data FROM papers ORDER BY created_at DESC").fetchall()
        return [json.loads(r["data"]) for r in rows]


def get_paper_by_id(paper_id: str, session_id: str | None = None) -> dict | None:
    with get_db() as conn:
        if session_id:
            row = conn.execute("SELECT data FROM papers WHERE id = ? AND session_id = ?", (paper_id, session_id)).fetchone()
        else:
            row = conn.execute("SELECT data FROM papers WHERE id = ?", (paper_id,)).fetchone()
        return json.loads(row["data"]) if row else None


def get_paper_raw_text(paper_id: str) -> str:
    with get_db() as conn:
        row = conn.execute("SELECT raw_text FROM papers WHERE id = ?", (paper_id,)).fetchone()
        return row["raw_text"] if row else ""


def update_paper_data(paper_id: str, paper_dict: dict, session_id: str | None = None) -> None:
    with get_db() as conn:
        if session_id:
            conn.execute(
                "UPDATE papers SET data = ? WHERE id = ? AND session_id = ?",
                (json.dumps(paper_dict), paper_id, session_id),
            )
        else:
            conn.execute(
                "UPDATE papers SET data = ? WHERE id = ?",
                (json.dumps(paper_dict), paper_id),
            )


def delete_paper(paper_id: str, session_id: str | None = None) -> None:
    with get_db() as conn:
        if session_id:
            conn.execute("DELETE FROM papers WHERE id = ? AND session_id = ?", (paper_id, session_id))
        else:
            conn.execute("DELETE FROM papers WHERE id = ?", (paper_id,))


# ---------------------------------------------------------------------------
# Analysis state (pipeline results cache)
# ---------------------------------------------------------------------------

def _state_key(key: str, session_id: str = "default") -> str:
    return f"{session_id}:{key}" if session_id else key


def save_state(key: str, value: Any, session_id: str = "default") -> None:
    s_key = _state_key(key, session_id)
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO analysis_state (key, value) VALUES (?, ?)",
            (s_key, json.dumps(value)),
        )


def load_state(key: str, default: Any = None, session_id: str = "default") -> Any:
    s_key = _state_key(key, session_id)
    with get_db() as conn:
        row = conn.execute("SELECT value FROM analysis_state WHERE key = ?", (s_key,)).fetchone()
        return json.loads(row["value"]) if row else default


# ---------------------------------------------------------------------------
# Gaps
# ---------------------------------------------------------------------------

def save_gaps(gaps: list[dict], session_id: str = "default") -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM gaps WHERE session_id = ?", (session_id,))
        for g in gaps:
            conn.execute("INSERT OR REPLACE INTO gaps (id, session_id, data) VALUES (?, ?, ?)", (g["id"], session_id, json.dumps(g)))


def get_gaps(session_id: str = "default") -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT data FROM gaps WHERE session_id = ?", (session_id,)).fetchall()
        return [json.loads(r["data"]) for r in rows]


# ---------------------------------------------------------------------------
# Ideas
# ---------------------------------------------------------------------------

def save_ideas(ideas: list[dict], session_id: str = "default") -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM ideas WHERE session_id = ?", (session_id,))
        for idea in ideas:
            conn.execute("INSERT OR REPLACE INTO ideas (id, session_id, data) VALUES (?, ?, ?)", (idea["id"], session_id, json.dumps(idea)))


def get_ideas(session_id: str = "default") -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT data FROM ideas WHERE session_id = ?", (session_id,)).fetchall()
        return [json.loads(r["data"]) for r in rows]
