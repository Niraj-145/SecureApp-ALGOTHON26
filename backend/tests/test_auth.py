import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_login_success():
    res = client.post("/api/auth/login", json={
        "email": "admin@secureapp.local",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@secureapp.local"
    assert data["user"]["role"] == "admin"

def test_login_invalid_password():
    res = client.post("/api/auth/login", json={
        "email": "admin@secureapp.local",
        "password": "WrongPassword1"
    })
    assert res.status_code == 401

import time

def test_register_success():
    email = f"david.{int(time.time() * 1000)}@secureapp.local"
    res = client.post("/api/auth/register", json={
        "name": "David Test",
        "email": email,
        "password": "SecurePassword1"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["name"] == "David Test"

def test_register_weak_password():
    # Test missing uppercase / digits (passes Pydantic min length 6, caught by route validator)
    res = client.post("/api/auth/register", json={
        "name": "Weak User",
        "email": "weak@secureapp.local",
        "password": "weakpassword"
    })
    assert res.status_code == 400
    assert "uppercase" in res.json()["detail"].lower()

    # Test short password (caught by Pydantic min_length schema)
    res_short = client.post("/api/auth/register", json={
        "name": "Weak User",
        "email": "weak2@secureapp.local",
        "password": "123"
    })
    assert res_short.status_code == 422

def test_register_duplicate_email():
    res = client.post("/api/auth/register", json={
        "name": "Admin Again",
        "email": "admin@secureapp.local",
        "password": "AdminPassword1"
    })
    assert res.status_code == 409
