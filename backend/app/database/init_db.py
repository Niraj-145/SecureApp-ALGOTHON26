"""
Database schema creation and seed data.
Run once at startup — safe to call repeatedly (uses IF NOT EXISTS).
"""
import sqlite3
from app.database.connection import get_connection
from app.utils.auth import hash_password


# ── Schema ────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'user',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id    INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'general',
    is_private  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id   INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    content     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (record_id) REFERENCES records(id),
    FOREIGN KEY (user_id)   REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vulnerability_state (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    severity    TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    component   TEXT    NOT NULL,
    description TEXT    NOT NULL,
    root_cause  TEXT    NOT NULL,
    impact      TEXT    NOT NULL,
    fix_description TEXT NOT NULL,
    is_fixed    INTEGER NOT NULL DEFAULT 0,
    is_retested INTEGER NOT NULL DEFAULT 0,
    retest_passed INTEGER NOT NULL DEFAULT 0,
    demo_result TEXT,
    fix_applied_at TEXT,
    retest_at   TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS security_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vuln_id     TEXT    NOT NULL,
    action      TEXT    NOT NULL,
    result      TEXT,
    details     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""


# ── Seed data ─────────────────────────────────────────────

def seed_database():
    """Insert demo users, records, comments, and vulnerability definitions."""
    conn = get_connection()
    cur = conn.cursor()

    # Check if already seeded
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        # ── Users ─────────────────────────────────────────────
        admin_pw = hash_password("Admin@123")
        alice_pw = hash_password("Alice@123")
        bob_pw   = hash_password("Bob@12345")

        cur.executemany(
            "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
            [
                (1, "admin@secureapp.local", admin_pw, "Admin User", "admin"),
                (2, "alice@secureapp.local", alice_pw, "Alice Johnson", "user"),
                (3, "bob@secureapp.local",   bob_pw,   "Bob Williams",  "user"),
            ],
        )

    # ── Check records ─────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM records WHERE id = 101")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT OR REPLACE INTO records (id, owner_id, title, content, category, is_private) VALUES (?, ?, ?, ?, ?, ?)",
            [
                (1, 1, "Company Security Policy",
                 "All employees must follow the information security guidelines issued quarterly. "
                 "Ensure multi-factor authentication is enabled on all accounts.",
                 "policy", 0),
                (2, 2, "Project Alpha — Q3 Report",
                 "Revenue targets exceeded by 12 %. Customer retention improved to 94 %. "
                 "Marketing spend reduced by 8 % compared to Q2.",
                 "report", 0),
                (3, 2, "Alice Private Notes",
                 "Personal research notes on competitor analysis. Confidential — do not share.",
                 "notes", 1),
                (4, 3, "Invoice #1042",
                 "Client: Acme Corp. Amount: $4,500. Due: 2026-11-01. Status: Pending.",
                 "finance", 0),
                (5, 3, "Bob Confidential Memo",
                 "Internal restructuring plan — strictly confidential. Not for distribution.",
                 "notes", 1),
                (6, 1, "IT Infrastructure Audit",
                 "Server uptime 99.7 %. Two minor incidents in September. Patch cycle on schedule.",
                 "report", 0),
                (101, 2, "Record 101 — Alice Project Alpha Specs",
                 "Confidential system architecture specifications for Project Alpha. User 1 proprietary asset.",
                 "report", 1),
                (102, 2, "Record 102 — Alice Client Contacts",
                 "Confidential enterprise partner directory and NDA negotiations. User 1 proprietary asset.",
                 "notes", 1),
                (201, 3, "Record 201 — Bob Financial Ledger Q3",
                 "Unreleased quarterly financial projections, tax provisions, and executive payroll. User 2 proprietary asset.",
                 "finance", 1),
                (202, 3, "Record 202 — Bob Restructuring Plan",
                 "Corporate reorganization proposal and confidential personnel assignments. User 2 proprietary asset.",
                 "notes", 1),
            ],
        )

        # ── Comments ──────────────────────────────────────────
        cur.executemany(
            "INSERT INTO comments (record_id, user_id, content) VALUES (?, ?, ?)",
            [
                (1, 1, "Updated policy draft approved by management."),
                (1, 2, "Reviewed — looks good."),
                (2, 2, "Need to add regional breakdown for next quarter."),
                (4, 3, "Payment follow-up sent to Acme Corp."),
                (6, 1, "Patch cycle report attached separately."),
                (101, 2, "Alice: Core architecture signed off."),
                (102, 2, "Alice: Updated Acme Corp lead contact info."),
                (201, 3, "Bob: Q3 ledger reconciled with bank feeds."),
                (202, 3, "Bob: Awaiting executive committee sign-off."),
            ],
        )

    # ── Check Vulnerability state ─────────────────────────
    cur.execute("SELECT COUNT(*) FROM vulnerability_state")
    if cur.fetchone()[0] > 0:
        conn.commit()
        conn.close()
        return

    # ── Vulnerability definitions ─────────────────────────
    vulns = [
        (
            "sql-injection",
            "SQL Injection",
            "critical",
            "injection",
            "Record Search / Lookup",
            "The record search feature constructs SQL queries by directly concatenating user input, "
            "allowing an attacker to manipulate the query structure and access or modify data beyond their authorization.",
            "User-supplied search terms are embedded directly into SQL query strings without parameterization.",
            "An attacker could read, modify, or delete arbitrary database records, extract sensitive information, "
            "or bypass authentication entirely.",
            "Replace string concatenation with parameterized queries (using ? placeholders) so user input is treated "
            "as data, never as SQL code.",
        ),
        (
            "xss",
            "Cross-Site Scripting (XSS)",
            "high",
            "injection",
            "Comments / Notes",
            "User-submitted comment content is rendered in the browser without output encoding, "
            "allowing injection of arbitrary HTML and JavaScript that executes in other users' browsers.",
            "User-controlled content is inserted into the DOM without sanitization or contextual output encoding.",
            "An attacker could steal session tokens, redirect users to malicious sites, deface the application, "
            "or perform actions on behalf of authenticated users.",
            "Apply context-appropriate output encoding (HTML-entity encoding) before rendering user content. "
            "On the backend, sanitize stored content to strip dangerous tags and attributes.",
        ),
        (
            "idor",
            "Broken Access Control (IDOR)",
            "high",
            "access-control",
            "Record Details API",
            "The API endpoint for fetching record details does not verify that the requesting user owns "
            "or is authorized to view the record, allowing any authenticated user to access another user's private records.",
            "The server retrieves records solely by ID without checking ownership or authorization.",
            "An attacker could access confidential records belonging to other users by simply changing "
            "the record ID in the API request.",
            "Add server-side authorization checks that verify the requesting user owns the record or has "
            "appropriate permissions before returning data.",
        ),
        (
            "weak-auth",
            "Weak Authentication & Session Security",
            "critical",
            "authentication",
            "Login / Session Management",
            "The authentication system accepts weak passwords, stores credentials with insufficient hashing, "
            "and issues long-lived tokens without proper validation, making it vulnerable to credential attacks.",
            "Lack of password complexity requirements, use of weak/no hashing for passwords in vulnerable mode, "
            "and absence of token expiration / rotation.",
            "An attacker could brute-force weak passwords, exploit leaked credential hashes, or hijack "
            "long-lived sessions.",
            "Enforce strong password policies, use bcrypt for hashing, issue short-lived JWTs, validate "
            "tokens on every request, and implement proper session expiration.",
        ),
    ]

    cur.executemany(
        """INSERT INTO vulnerability_state
           (id, name, severity, category, component, description, root_cause, impact, fix_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        vulns,
    )

    conn.commit()
    conn.close()


def init_db():
    """Create tables and seed data."""
    conn = get_connection()
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()
    seed_database()
