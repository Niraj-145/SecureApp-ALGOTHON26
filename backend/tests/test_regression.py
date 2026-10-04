import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_regression_after_fixes():
    admin_res = client.post("/api/auth/login", json={"email": "admin@secureapp.local", "password": "Admin@123"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    alice_res = client.post("/api/auth/login", json={"email": "alice@secureapp.local", "password": "Alice@123"})
    alice_token = alice_res.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # Apply all fixes
    client.post("/api/security/fix/sql-injection", headers=admin_headers)
    client.post("/api/security/fix/xss", headers=admin_headers)
    client.post("/api/security/fix/idor", headers=admin_headers)
    client.post("/api/security/fix/weak-auth", headers=admin_headers)

    # 1. Regression test: Normal search still works after SQL Injection fix
    search_res = client.get("/api/records?search=Policy", headers=alice_headers)
    assert search_res.status_code == 200
    records = search_res.json()
    assert any("Policy" in r["title"] for r in records)

    # 2. Regression test: Normal comments still post & display after XSS fix
    post_comment = client.post(
        "/api/records/1/comments",
        headers=alice_headers,
        json={"record_id": 1, "content": "Normal business review notes without HTML"}
    )
    assert post_comment.status_code == 200
    list_comments = client.get("/api/records/1/comments", headers=alice_headers).json()
    assert any("Normal business review notes" in c["content"] for c in list_comments)

    # 3. Regression test: Alice can still access HER OWN private record (Record #3) after IDOR fix
    own_record = client.get("/api/records/3", headers=alice_headers)
    assert own_record.status_code == 200
    assert own_record.json()["title"] == "Alice Private Notes"

    # Alice CANNOT access Bob's private record (Record #5) after IDOR fix
    other_record = client.get("/api/records/5", headers=alice_headers)
    assert other_record.status_code == 403
    assert "access denied" in other_record.json()["detail"].lower()

    # 4. Regression test: Valid login still functions after Auth fix
    login_check = client.post("/api/auth/login", json={"email": "bob@secureapp.local", "password": "Bob@12345"})
    assert login_check.status_code == 200
    assert "access_token" in login_check.json()
