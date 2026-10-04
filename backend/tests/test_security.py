import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def get_admin_token():
    res = client.post("/api/auth/login", json={"email": "admin@secureapp.local", "password": "Admin@123"})
    return res.json()["access_token"]

def test_full_security_lifecycle():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reset state
    res = client.post("/api/security/reset", headers=headers)
    assert res.status_code == 200

    # 2. Check initial score
    res = client.get("/api/security/score", headers=headers)
    assert res.status_code == 200
    initial_score = res.json()["score"]
    assert initial_score < 60  # Initial vulnerable state has significant deductions

    # 3. Test SQL Injection Lifecycle
    demo_sqli = client.post("/api/security/demo/sql-injection", headers=headers).json()
    assert demo_sqli["status"] == "vulnerable"
    assert demo_sqli["passed"] is False

    fix_sqli = client.post("/api/security/fix/sql-injection", headers=headers).json()
    assert "fix applied" in fix_sqli["message"].lower()

    retest_sqli = client.post("/api/security/retest/sql-injection", headers=headers).json()
    assert retest_sqli["passed"] is True
    assert retest_sqli["status"] == "retest_passed"

    # 4. Test XSS Lifecycle
    demo_xss = client.post("/api/security/demo/xss", headers=headers).json()
    assert demo_xss["status"] == "vulnerable"

    fix_xss = client.post("/api/security/fix/xss", headers=headers).json()
    assert "fix applied" in fix_xss["message"].lower()

    retest_xss = client.post("/api/security/retest/xss", headers=headers).json()
    assert retest_xss["passed"] is True

    # 5. Test IDOR Lifecycle
    demo_idor = client.post("/api/security/demo/idor", headers=headers).json()
    assert demo_idor["status"] == "vulnerable"

    fix_idor = client.post("/api/security/fix/idor", headers=headers).json()
    assert "fix applied" in fix_idor["message"].lower()

    retest_idor = client.post("/api/security/retest/idor", headers=headers).json()
    assert retest_idor["passed"] is True

    # 6. Test Weak Auth Lifecycle
    demo_auth = client.post("/api/security/demo/weak-auth", headers=headers).json()
    assert demo_auth["status"] == "vulnerable"

    fix_auth = client.post("/api/security/fix/weak-auth", headers=headers).json()
    assert "fix applied" in fix_auth["message"].lower()

    retest_auth = client.post("/api/security/retest/weak-auth", headers=headers).json()
    assert retest_auth["passed"] is True

    # 7. Check final verified score (must reach 100!)
    score_res = client.get("/api/security/score", headers=headers).json()
    assert score_res["score"] == 100
    assert score_res["verified"] == 4
    assert score_res["unfixed"] == 0

    # 8. Check report generation
    report_res = client.get("/api/security/report", headers=headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["score"]["score"] == 100
    assert len(report_data["vulnerabilities"]) == 4
