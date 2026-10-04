"""Security Center API routes — STRICTLY restricted to Administrator role."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_connection, dict_row, dict_rows
from app.utils.auth import require_admin
from app.security.engine import (
    demo_sql_injection, fix_sql_injection, retest_sql_injection,
    demo_xss, fix_xss, retest_xss,
    demo_idor, fix_idor, retest_idor,
    demo_weak_auth, fix_weak_auth, retest_weak_auth,
    calculate_score, reset_all,
)

router = APIRouter(tags=["security"])

# Lookup tables for dispatch
DEMO_FN = {
    "sql-injection": demo_sql_injection,
    "xss": demo_xss,
    "idor": demo_idor,
    "weak-auth": demo_weak_auth,
}
FIX_FN = {
    "sql-injection": fix_sql_injection,
    "xss": fix_xss,
    "idor": fix_idor,
    "weak-auth": fix_weak_auth,
}
RETEST_FN = {
    "sql-injection": retest_sql_injection,
    "xss": retest_xss,
    "idor": retest_idor,
    "weak-auth": retest_weak_auth,
}


@router.get("/vulnerabilities")
def list_vulnerabilities(admin: dict = Depends(require_admin)):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM vulnerability_state ORDER BY severity DESC").fetchall()
    conn.close()
    return dict_rows(rows)


@router.get("/vulnerabilities/{vuln_id}")
def get_vulnerability(vuln_id: str, admin: dict = Depends(require_admin)):
    conn = get_connection()
    row = conn.execute("SELECT * FROM vulnerability_state WHERE id = ?", (vuln_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Vulnerability not found.")
    return dict_row(row)


@router.post("/demo/{vuln_id}")
def run_demo(vuln_id: str, admin: dict = Depends(require_admin)):
    fn = DEMO_FN.get(vuln_id)
    if fn is None:
        raise HTTPException(status_code=404, detail="Unknown vulnerability.")
    return fn()


@router.post("/fix/{vuln_id}")
def apply_fix(vuln_id: str, admin: dict = Depends(require_admin)):
    fn = FIX_FN.get(vuln_id)
    if fn is None:
        raise HTTPException(status_code=404, detail="Unknown vulnerability.")
    return fn()


@router.post("/retest/{vuln_id}")
def run_retest(vuln_id: str, admin: dict = Depends(require_admin)):
    fn = RETEST_FN.get(vuln_id)
    if fn is None:
        raise HTTPException(status_code=404, detail="Unknown vulnerability.")
    return fn()


@router.get("/score")
def get_score(admin: dict = Depends(require_admin)):
    return calculate_score()


@router.get("/report")
def get_report(admin: dict = Depends(require_admin)):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM vulnerability_state ORDER BY severity DESC").fetchall()
    conn.close()

    return {
        "score": calculate_score(),
        "assessment_date": datetime.now(timezone.utc).isoformat(),
        "vulnerabilities": dict_rows(rows),
    }


@router.get("/activity")
def get_activity(admin: dict = Depends(require_admin)):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 50").fetchall()
    conn.close()
    return dict_rows(rows)


@router.get("/dashboard-stats")
def get_admin_dashboard_stats(admin: dict = Depends(require_admin)):
    conn = get_connection()
    vuln_rows = conn.execute("SELECT * FROM vulnerability_state ORDER BY severity DESC").fetchall()
    vulns = dict_rows(vuln_rows)

    user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    record_count = conn.execute("SELECT COUNT(*) FROM records").fetchone()[0]
    log_rows = conn.execute("SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 6").fetchall()
    conn.close()

    score = calculate_score()
    open_findings = sum(1 for v in vulns if not (v["is_fixed"] and v["retest_passed"]))

    return {
        "score": score,
        "vulnerabilities": vulns,
        "open_findings": open_findings,
        "total_users": user_count,
        "total_records": record_count,
        "assessment_status": "All Verified Secure" if score["score"] == 100 else "Active Vulnerabilities Detected",
        "recent_activity": dict_rows(log_rows),
    }


@router.post("/reset")
def reset_vulnerabilities(admin: dict = Depends(require_admin)):
    return reset_all()
