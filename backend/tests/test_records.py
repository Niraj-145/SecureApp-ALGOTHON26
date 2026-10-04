import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def get_token(email="alice@secureapp.local", password="Alice@123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]

def test_list_records():
    token = get_token()
    res = client.get("/api/records", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    records = res.json()
    assert len(records) > 0

def test_create_record():
    token = get_token()
    res = client.post(
        "/api/records",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Automated Test Memo",
            "content": "Confidential test payload content",
            "category": "notes",
            "is_private": True
        }
    )
    assert res.status_code == 200
    created = res.json()
    assert created["title"] == "Automated Test Memo"
    assert created["is_private"] == 1

def test_comments():
    token = get_token()
    # Post comment
    res = client.post(
        "/api/records/1/comments",
        headers={"Authorization": f"Bearer {token}"},
        json={"record_id": 1, "content": "Valid testing comment"}
    )
    assert res.status_code == 200
    # List comments
    res = client.get("/api/records/1/comments", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    comments = res.json()
    assert any(c["content"] == "Valid testing comment" for c in comments)
