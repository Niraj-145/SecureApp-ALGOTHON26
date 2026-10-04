"""
SQLite database connection helper.
Uses standard sqlite3 (synchronous) — simple and lightweight.
"""
import sqlite3
import os
from app.config import DATABASE_PATH


def get_db_path():
    return DATABASE_PATH


def get_connection():
    """Return a new sqlite3 connection with row_factory set."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def dict_row(row):
    """Convert a sqlite3.Row to a plain dict."""
    if row is None:
        return None
    return dict(row)


def dict_rows(rows):
    """Convert a list of sqlite3.Row to list of dicts."""
    return [dict(r) for r in rows]
