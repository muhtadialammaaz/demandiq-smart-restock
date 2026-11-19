"""
DemandIQ Database Layer (SQLite with foreign keys)
"""

import sqlite3
import os
from .config import DB_PATH, SCHEMA_PATH

def get_connection(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=DB_PATH):
    conn = get_connection(db_path)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.commit()
    conn.close()
    return True
