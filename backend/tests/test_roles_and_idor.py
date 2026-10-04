"""Tests for Role Authorization, Role Dashboards, and IDOR Lifecycle."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def login(email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    data = res.json()
    return data["access_token"], {"Authorization": f"Bearer {data['access_token']}"}


def test_roles_and_idor_lifecycle():
    # 1. Test Admin login
    admin_token, admin_headers = login("admin@secureapp.local", "Admin@123")
    assert admin_token is not None

    # 2. Test User 1 (Alice) login
    alice_token, alice_headers = login("alice@secureapp.local", "Alice@123")
    assert alice_token is not None

    # 3. Test User 2 (Bob) login
    bob_token, bob_headers = login("bob@secureapp.local", "Bob@12345")
    assert bob_token is not None

    # 4. Verify Admin can access security and user management endpoints
    admin_stats = client.get("/api/security/dashboard-stats", headers=admin_headers)
    assert admin_stats.status_code == 200
    assert "score" in admin_stats.json()

    user_list = client.get("/api/users", headers=admin_headers)
    assert user_list.status_code == 200
    assert len(user_list.json()) >= 3

    # Normal users MUST NOT access security center or user list
    alice_sec = client.get("/api/security/vulnerabilities", headers=alice_headers)
    assert alice_sec.status_code == 403

    bob_sec = client.get("/api/security/score", headers=bob_headers)
    assert bob_sec.status_code == 403

    alice_users = client.get("/api/users", headers=alice_headers)
    assert alice_users.status_code == 403

    # Normal users CAN access their personal dashboard
    alice_dash = client.get("/api/users/dashboard", headers=alice_headers)
    assert alice_dash.status_code == 200
    assert alice_dash.json()["my_records_count"] >= 2
    assert "notifications" in alice_dash.json()

    # 5. Reset vulnerabilities to test VULNERABLE IDOR MODE first
    client.post("/api/security/reset", headers=admin_headers)

    # In VULNERABLE MODE: User 1 (Alice) can access User 2's private Record #201
    vuln_res = client.get("/api/records/201", headers=alice_headers)
    assert vuln_res.status_code == 200
    assert "Bob Financial Ledger" in vuln_res.json()["title"]

    # In VULNERABLE MODE: User 2 (Bob) can access User 1's private Record #101
    vuln_res_bob = client.get("/api/records/101", headers=bob_headers)
    assert vuln_res_bob.status_code == 200
    assert "Alice" in vuln_res_bob.json()["title"]

    # 6. Apply IDOR authorization fix
    fix_res = client.post("/api/security/fix/idor", headers=admin_headers)
    assert fix_res.status_code == 200

    # 7. Retest IDOR via security engine
    retest_res = client.post("/api/security/retest/idor", headers=admin_headers)
    assert retest_res.status_code == 200
    assert retest_res.json()["passed"] is True

    # 8. In SECURE MODE: Verify User 1 CANNOT access User 2's records (Record 201)
    blocked_alice = client.get("/api/records/201", headers=alice_headers)
    assert blocked_alice.status_code == 403
    assert "access denied" in blocked_alice.json()["detail"].lower()

    # In SECURE MODE: Verify User 2 CANNOT access User 1's records (Record 101)
    blocked_bob = client.get("/api/records/101", headers=bob_headers)
    assert blocked_bob.status_code == 403
    assert "access denied" in blocked_bob.json()["detail"].lower()

    # 9. Verify Admin can access both User 1 and User 2's records
    admin_r101 = client.get("/api/records/101", headers=admin_headers)
    assert admin_r101.status_code == 200
    assert "Alice" in admin_r101.json()["title"]

    admin_r201 = client.get("/api/records/201", headers=admin_headers)
    assert admin_r201.status_code == 200
    assert "Bob" in admin_r201.json()["title"]

    # 10. Verify legitimate record access still works
    alice_own = client.get("/api/records/101", headers=alice_headers)
    assert alice_own.status_code == 200
    assert "Alice" in alice_own.json()["title"]

    bob_own = client.get("/api/records/201", headers=bob_headers)
    assert bob_own.status_code == 200
    assert "Bob" in bob_own.json()["title"]

    # 11. Verify User 1 cannot edit or delete User 2's record
    edit_denied = client.put(
        "/api/records/201",
        headers=alice_headers,
        json={"title": "Hacked Title", "content": "Modified by Alice"}
    )
    assert edit_denied.status_code == 403

    delete_denied = client.delete("/api/records/201", headers=alice_headers)
    assert delete_denied.status_code == 403

    # User 1 CAN edit their own record
    edit_own = client.put(
        "/api/records/101",
        headers=alice_headers,
        json={"title": "Updated Specs by Alice", "content": "Updated content"}
    )
    assert edit_own.status_code == 200
    assert edit_own.json()["title"] == "Updated Specs by Alice"
