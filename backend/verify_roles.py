"""Verify all 13 checklist points against the live FastAPI server."""
import urllib.request
import urllib.error
import json

def post(url, data=None, token=None):
    body = json.dumps(data).encode() if data is not None else b""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(url, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def main():
    print("=== 1. TEST ADMIN LOGIN ===")
    s, r = post("http://127.0.0.1:8000/api/auth/login", {"email": "admin@secureapp.local", "password": "Admin@123"})
    assert s == 200, f"Admin login failed: {r}"
    admin_tok = r["access_token"]
    print(f"PASS: Admin login: HTTP {s}, user role: {r['user']['role']}")

    print("=== 2. TEST USER 1 (ALICE) LOGIN ===")
    s, r = post("http://127.0.0.1:8000/api/auth/login", {"email": "alice@secureapp.local", "password": "Alice@123"})
    assert s == 200, f"Alice login failed: {r}"
    alice_tok = r["access_token"]
    print(f"PASS: Alice login: HTTP {s}, user role: {r['user']['role']}")

    print("=== 3. TEST USER 2 (BOB) LOGIN ===")
    s, r = post("http://127.0.0.1:8000/api/auth/login", {"email": "bob@secureapp.local", "password": "Bob@12345"})
    assert s == 200, f"Bob login failed: {r}"
    bob_tok = r["access_token"]
    print(f"PASS: Bob login: HTTP {s}, user role: {r['user']['role']}")

    print("=== 4. VERIFY DASHBOARDS & ACCESS RESTRICTIONS ===")
    s, r = get("http://127.0.0.1:8000/api/security/dashboard-stats", admin_tok)
    assert s == 200, f"Admin dashboard failed: {r}"
    print(f"PASS: Admin dashboard-stats: HTTP {s}, open findings: {r['open_findings']}")

    s, r = get("http://127.0.0.1:8000/api/users/dashboard", alice_tok)
    assert s == 200, f"Alice personal dashboard failed: {r}"
    print(f"PASS: Alice personal dashboard: HTTP {s}, my_records_count: {r['my_records_count']}")

    s, r = get("http://127.0.0.1:8000/api/security/vulnerabilities", alice_tok)
    assert s == 403, f"Alice should be denied security center: {s}"
    print(f"PASS: Alice accessing /api/security/vulnerabilities -> HTTP {s} Forbidden")

    s, r = get("http://127.0.0.1:8000/api/users", alice_tok)
    assert s == 403, f"Alice should be denied user management: {s}"
    print(f"PASS: Alice accessing /api/users -> HTTP {s} Forbidden")

    print("=== 5. RESET TO VULNERABLE MODE FOR CONTROLLED IDOR TEST ===")
    post("http://127.0.0.1:8000/api/security/reset", token=admin_tok)

    s, r = get("http://127.0.0.1:8000/api/records/201", alice_tok)
    assert s == 200, f"Vulnerable mode should allow IDOR: {s}, {r}"
    print(f"PASS: Vulnerable Mode IDOR Demonstrated: Alice requested Bob's Record 201 -> HTTP {s}, Title: '{r['title']}'")

    print("=== 6. APPLY IDOR AUTHORIZATION FIX ===")
    s, r = post("http://127.0.0.1:8000/api/security/fix/idor", token=admin_tok)
    assert s == 200, f"Fix failed: {r}"
    print(f"PASS: Applied IDOR fix: HTTP {s}")

    print("=== 7. RETEST IDOR IN SECURE MODE ===")
    s, r = post("http://127.0.0.1:8000/api/security/retest/idor", token=admin_tok)
    assert s == 200 and r.get("passed"), f"Retest failed: {r}"
    print(f"PASS: Security Engine Automated Retest: HTTP {s}, Result Passed: {r.get('passed')}")

    s, r = get("http://127.0.0.1:8000/api/records/201", alice_tok)
    assert s == 403, f"Secure mode must return 403 for Alice on Bob's record: {s}"
    print(f"PASS: Secure Mode Enforced: Alice requesting Bob's Record 201 -> HTTP {s} Forbidden ('{r['detail']}')")

    s, r = get("http://127.0.0.1:8000/api/records/101", bob_tok)
    assert s == 403, f"Secure mode must return 403 for Bob on Alice's record: {s}"
    print(f"PASS: Secure Mode Enforced: Bob requesting Alice's Record 101 -> HTTP {s} Forbidden ('{r['detail']}')")

    print("=== 8. VERIFY ADMIN ACCESS TO ALL RECORDS ===")
    s1, r1 = get("http://127.0.0.1:8000/api/records/101", admin_tok)
    s2, r2 = get("http://127.0.0.1:8000/api/records/201", admin_tok)
    assert s1 == 200 and s2 == 200, f"Admin access failed: {s1}, {s2}"
    print(f"PASS: Admin access: Record 101 -> HTTP {s1}, Record 201 -> HTTP {s2}")

    print("=== 9. VERIFY LEGITIMATE RECORD ACCESS ===")
    s1, r1 = get("http://127.0.0.1:8000/api/records/101", alice_tok)
    s2, r2 = get("http://127.0.0.1:8000/api/records/201", bob_tok)
    assert s1 == 200 and s2 == 200, f"Legitimate access failed: {s1}, {s2}"
    print(f"PASS: Alice accesses own Record 101 -> HTTP {s1}, Bob accesses own Record 201 -> HTTP {s2}")

    print("\nALL 13 ROLE & IDOR REQUIREMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
