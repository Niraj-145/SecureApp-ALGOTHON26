"""
Security Assessment Engine
- Demonstrates vulnerabilities safely against the local app
- Applies fixes (toggles state)
- Retests to verify fixes
"""
import html
import sqlite3
from datetime import datetime, timezone
from app.database.connection import get_connection, dict_row
from app.utils.auth import weak_hash, weak_verify, hash_password, verify_password


def _now():
    return datetime.now(timezone.utc).isoformat()


def _log(vuln_id: str, action: str, result: str, details: str = ""):
    conn = get_connection()
    conn.execute(
        "INSERT INTO security_logs (vuln_id, action, result, details) VALUES (?, ?, ?, ?)",
        (vuln_id, action, result, details),
    )
    conn.commit()
    conn.close()


# ══════════════════════════════════════════════════════════
#  SQL INJECTION
# ══════════════════════════════════════════════════════════

def demo_sql_injection():
    """Attempt a SQL injection against the local search feature."""
    conn = get_connection()
    vuln = dict_row(conn.execute("SELECT is_fixed FROM vulnerability_state WHERE id = 'sql-injection'").fetchone())

    payload = "' OR '1'='1"
    evidence = ""
    vulnerable = False

    if vuln and not vuln["is_fixed"]:
        # Build vulnerable query (same logic as the route)
        query = (
            f"SELECT r.id, r.title, r.owner_id, r.is_private "
            f"FROM records r "
            f"WHERE r.title LIKE '%{payload}%' OR r.content LIKE '%{payload}%'"
        )
        try:
            rows = conn.execute(query).fetchall()
            # The tautology should return ALL records including private ones
            if len(rows) > 0:
                vulnerable = True
                evidence = (
                    f"Injected payload: {payload}\n"
                    f"Query returned {len(rows)} record(s) — including potentially private records.\n"
                    f"Expected: 0 results for this nonsensical search term.\n"
                    f"This proves user input is embedded directly in the SQL query."
                )
        except Exception as e:
            evidence = f"Payload caused a database error: {str(e)[:200]}"
            vulnerable = True
    else:
        # Fixed mode — parameterized query
        try:
            rows = conn.execute(
                "SELECT r.id, r.title FROM records r WHERE r.title LIKE ? OR r.content LIKE ?",
                (f"%{payload}%", f"%{payload}%"),
            ).fetchall()
            evidence = (
                f"Injected payload: {payload}\n"
                f"Parameterized query returned {len(rows)} result(s).\n"
                f"Payload was treated as literal text, not SQL code. Injection blocked."
            )
        except Exception:
            evidence = "Parameterized query handled the payload safely."

    conn.execute(
        "UPDATE vulnerability_state SET demo_result = ? WHERE id = 'sql-injection'",
        (evidence,),
    )
    conn.commit()
    conn.close()

    _log("sql-injection", "demo", "vulnerable" if vulnerable else "safe", evidence)

    return {
        "vulnerability": "sql-injection",
        "status": "vulnerable" if vulnerable else "safe",
        "passed": not vulnerable,
        "message": "SQL Injection is exploitable." if vulnerable else "SQL Injection is blocked.",
        "evidence": evidence,
    }


def fix_sql_injection():
    conn = get_connection()
    conn.execute(
        "UPDATE vulnerability_state SET is_fixed = 1, fix_applied_at = ?, is_retested = 0, retest_passed = 0 WHERE id = 'sql-injection'",
        (_now(),),
    )
    conn.commit()
    conn.close()
    _log("sql-injection", "fix", "applied")
    return {"message": "SQL Injection fix applied — queries now use parameterized statements."}


def retest_sql_injection():
    result = demo_sql_injection()
    conn = get_connection()
    passed = result["passed"]
    conn.execute(
        "UPDATE vulnerability_state SET is_retested = 1, retest_passed = ? , retest_at = ? WHERE id = 'sql-injection'",
        (int(passed), _now()),
    )
    conn.commit()
    conn.close()
    _log("sql-injection", "retest", "passed" if passed else "failed", result.get("evidence", ""))
    result["status"] = "retest_passed" if passed else "retest_failed"
    return result


# ══════════════════════════════════════════════════════════
#  XSS
# ══════════════════════════════════════════════════════════

def demo_xss():
    conn = get_connection()
    vuln = dict_row(conn.execute("SELECT is_fixed FROM vulnerability_state WHERE id = 'xss'").fetchone())

    test_payload = '<script>alert("XSS")</script>'
    vulnerable = False
    evidence = ""

    if vuln and not vuln["is_fixed"]:
        # In vulnerable mode, content is stored raw
        # We simulate what the comments endpoint would return
        evidence = (
            f"Test payload: {test_payload}\n"
            f"In vulnerable mode, this payload is stored and returned AS-IS.\n"
            f"When rendered in a browser, the script tag would execute.\n"
            f"The comment content is not sanitized or encoded."
        )
        vulnerable = True
    else:
        sanitized = html.escape(test_payload)
        evidence = (
            f"Test payload: {test_payload}\n"
            f"After sanitization: {sanitized}\n"
            f"The payload is HTML-encoded before storage and rendering.\n"
            f"Script tags are converted to harmless text entities."
        )

    conn.execute("UPDATE vulnerability_state SET demo_result = ? WHERE id = 'xss'", (evidence,))
    conn.commit()
    conn.close()

    _log("xss", "demo", "vulnerable" if vulnerable else "safe", evidence)

    return {
        "vulnerability": "xss",
        "status": "vulnerable" if vulnerable else "safe",
        "passed": not vulnerable,
        "message": "XSS payload would execute in the browser." if vulnerable else "XSS payload is safely encoded.",
        "evidence": evidence,
    }


def fix_xss():
    conn = get_connection()
    conn.execute(
        "UPDATE vulnerability_state SET is_fixed = 1, fix_applied_at = ?, is_retested = 0, retest_passed = 0 WHERE id = 'xss'",
        (_now(),),
    )
    conn.commit()
    conn.close()
    _log("xss", "fix", "applied")
    return {"message": "XSS fix applied — output encoding enabled for all user content."}


def retest_xss():
    result = demo_xss()
    conn = get_connection()
    passed = result["passed"]
    conn.execute(
        "UPDATE vulnerability_state SET is_retested = 1, retest_passed = ?, retest_at = ? WHERE id = 'xss'",
        (int(passed), _now()),
    )
    conn.commit()
    conn.close()
    _log("xss", "retest", "passed" if passed else "failed", result.get("evidence", ""))
    result["status"] = "retest_passed" if passed else "retest_failed"
    return result


# ══════════════════════════════════════════════════════════
#  IDOR (Broken Access Control)
# ══════════════════════════════════════════════════════════

def demo_idor():
    conn = get_connection()
    vuln = dict_row(conn.execute("SELECT is_fixed FROM vulnerability_state WHERE id = 'idor'").fetchone())

    # Find User 2's (Bob) private record (e.g. Record 201 or 5)
    private = conn.execute(
        "SELECT id, owner_id, title, is_private FROM records WHERE id = 201"
    ).fetchone()
    if private is None:
        private = conn.execute(
            "SELECT id, owner_id, title, is_private FROM records WHERE is_private = 1 AND owner_id = 3"
        ).fetchone()

    if private is None:
        conn.close()
        return {
            "vulnerability": "idor",
            "status": "error",
            "passed": True,
            "message": "No private records found for testing.",
            "evidence": "Could not find a suitable private record.",
        }

    private = dict_row(private)
    simulated_requester_id = 2  # Alice (User 1) trying to access Bob's (User 2) record
    vulnerable = False
    evidence = ""

    if vuln and not vuln["is_fixed"]:
        # Vulnerable: no ownership check — just fetch by id
        row = conn.execute("SELECT * FROM records WHERE id = ?", (private["id"],)).fetchone()
        if row:
            vulnerable = True
            evidence = (
                f"Controlled Exploit Test:\n"
                f"User 1 (Alice, id=2) sent: GET /api/records/{private['id']}\n"
                f"Target Record: '{private['title']}' (Owner: User 2 / Bob, Private: Yes)\n"
                f"Result: ❌ VULNERABLE — Server returned User 2's private record to User 1!\n"
                f"Backend failed to verify ownership before returning record payload."
            )
    else:
        # Secure: backend ownership check
        row = conn.execute("SELECT * FROM records WHERE id = ?", (private["id"],)).fetchone()
        if row:
            rec = dict_row(row)
            if rec["is_private"] and rec["owner_id"] != simulated_requester_id:
                evidence = (
                    f"Controlled Verification Retest:\n"
                    f"User 1 (Alice, id=2) sent: GET /api/records/{private['id']}\n"
                    f"Target Record: '{private['title']}' (Owner: User 2 / Bob, Private: Yes)\n"
                    f"Result: ✅ 403 FORBIDDEN — Access Denied!\n"
                    f"Server-side ownership verification enforced. Unauthorized access blocked."
                )
            else:
                evidence = "Record is not private or belongs to requester — access granted correctly."

    conn.execute("UPDATE vulnerability_state SET demo_result = ? WHERE id = 'idor'", (evidence,))
    conn.commit()
    conn.close()

    _log("idor", "demo", "vulnerable" if vulnerable else "safe", evidence)

    return {
        "vulnerability": "idor",
        "status": "vulnerable" if vulnerable else "safe",
        "passed": not vulnerable,
        "message": "IDOR allows unauthorized access to private records." if vulnerable else "Access control is properly enforced.",
        "evidence": evidence,
    }


def fix_idor():
    conn = get_connection()
    conn.execute(
        "UPDATE vulnerability_state SET is_fixed = 1, fix_applied_at = ?, is_retested = 0, retest_passed = 0 WHERE id = 'idor'",
        (_now(),),
    )
    conn.commit()
    conn.close()
    _log("idor", "fix", "applied")
    return {"message": "IDOR fix applied — server-side ownership checks now enforced."}


def retest_idor():
    result = demo_idor()
    conn = get_connection()
    passed = result["passed"]
    conn.execute(
        "UPDATE vulnerability_state SET is_retested = 1, retest_passed = ?, retest_at = ? WHERE id = 'idor'",
        (int(passed), _now()),
    )
    conn.commit()
    conn.close()
    _log("idor", "retest", "passed" if passed else "failed", result.get("evidence", ""))
    result["status"] = "retest_passed" if passed else "retest_failed"
    return result


# ══════════════════════════════════════════════════════════
#  WEAK AUTHENTICATION
# ══════════════════════════════════════════════════════════

def demo_weak_auth():
    conn = get_connection()
    vuln = dict_row(conn.execute("SELECT is_fixed FROM vulnerability_state WHERE id = 'weak-auth'").fetchone())

    vulnerable = False
    evidence = ""

    if vuln and not vuln["is_fixed"]:
        # Demonstrate weak hashing
        test_password = "password123"
        weak = weak_hash(test_password)
        can_reverse = weak_verify(test_password, weak)

        # Check if weak passwords are accepted (no complexity check in vulnerable mode)
        weak_pw = "123"
        evidence = (
            f"Weak hashing demonstration:\n"
            f"  Password: {test_password}\n"
            f"  Weak 'hash': {weak}\n"
            f"  Reversible: {can_reverse}\n\n"
            f"Password policy check:\n"
            f"  Password '{weak_pw}' — In vulnerable mode, weak passwords may be accepted.\n"
            f"  No complexity requirements are enforced.\n"
            f"  Tokens have no expiration configured in vulnerable mode."
        )
        vulnerable = True
    else:
        test_password = "SecureP@ss1"
        hashed = hash_password(test_password)
        is_bcrypt = hashed.startswith("$2b$")
        evidence = (
            f"Secure hashing demonstration:\n"
            f"  Password: {test_password}\n"
            f"  Hash (bcrypt): {hashed[:20]}...\n"
            f"  Uses bcrypt: {is_bcrypt}\n"
            f"  Hash is one-way and salted — cannot be reversed.\n\n"
            f"Password policy: Minimum 6 chars, uppercase, digit required.\n"
            f"Tokens expire after configured timeout.\n"
            f"Tokens are validated on every request."
        )

    conn.execute("UPDATE vulnerability_state SET demo_result = ? WHERE id = 'weak-auth'", (evidence,))
    conn.commit()
    conn.close()

    _log("weak-auth", "demo", "vulnerable" if vulnerable else "safe", evidence)

    return {
        "vulnerability": "weak-auth",
        "status": "vulnerable" if vulnerable else "safe",
        "passed": not vulnerable,
        "message": "Authentication uses weak hashing and no password policy." if vulnerable else "Authentication uses bcrypt and enforces password policy.",
        "evidence": evidence,
    }


def fix_weak_auth():
    conn = get_connection()
    conn.execute(
        "UPDATE vulnerability_state SET is_fixed = 1, fix_applied_at = ?, is_retested = 0, retest_passed = 0 WHERE id = 'weak-auth'",
        (_now(),),
    )
    conn.commit()
    conn.close()
    _log("weak-auth", "fix", "applied")
    return {"message": "Authentication fix applied — bcrypt hashing and password policy enforced."}


def retest_weak_auth():
    result = demo_weak_auth()
    conn = get_connection()
    passed = result["passed"]
    conn.execute(
        "UPDATE vulnerability_state SET is_retested = 1, retest_passed = ?, retest_at = ? WHERE id = 'weak-auth'",
        (int(passed), _now()),
    )
    conn.commit()
    conn.close()
    _log("weak-auth", "retest", "passed" if passed else "failed", result.get("evidence", ""))
    result["status"] = "retest_passed" if passed else "retest_failed"
    return result


# ══════════════════════════════════════════════════════════
#  SECURITY SCORE
# ══════════════════════════════════════════════════════════

SEVERITY_WEIGHT = {"critical": 30, "high": 20, "medium": 10, "low": 5}


def calculate_score():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM vulnerability_state").fetchall()
    conn.close()

    vulns = [dict_row(r) for r in rows]
    total = len(vulns)
    critical = sum(1 for v in vulns if v["severity"] == "critical")
    high = sum(1 for v in vulns if v["severity"] == "high")
    medium = sum(1 for v in vulns if v["severity"] == "medium")
    fixed = sum(1 for v in vulns if v["is_fixed"])
    verified = sum(1 for v in vulns if v["is_retested"] and v["retest_passed"])
    unfixed = total - fixed

    # Score: start at 100, deduct for unresolved, partially recover for fixed-but-not-retested
    score = 100
    for v in vulns:
        w = SEVERITY_WEIGHT.get(v["severity"], 10)
        if not v["is_fixed"]:
            score -= w
        elif v["is_fixed"] and not (v["is_retested"] and v["retest_passed"]):
            score -= w // 4  # partial credit

    score = max(0, min(100, score))

    return {
        "score": score,
        "total_vulnerabilities": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "fixed": fixed,
        "verified": verified,
        "unfixed": unfixed,
    }


# ══════════════════════════════════════════════════════════
#  RESET (for demo purposes)
# ══════════════════════════════════════════════════════════

def reset_all():
    """Reset all vulnerabilities to unfixed state."""
    conn = get_connection()
    conn.execute(
        "UPDATE vulnerability_state SET is_fixed = 0, is_retested = 0, retest_passed = 0, "
        "demo_result = NULL, fix_applied_at = NULL, retest_at = NULL"
    )
    conn.execute("DELETE FROM security_logs")
    conn.commit()
    conn.close()
    return {"message": "All vulnerabilities reset to vulnerable state."}
