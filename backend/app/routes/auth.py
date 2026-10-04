"""Authentication routes — register, login, logout."""
import re
from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.database.connection import get_connection, dict_row
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(tags=["auth"])


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email))


def _validate_password_strength(password: str) -> str | None:
    """Return an error message if password is weak, else None."""
    if len(password) < 6:
        return "Password must be at least 6 characters."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one digit."
    return None


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    if not _validate_email(req.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    pw_err = _validate_password_strength(req.password)
    if pw_err:
        raise HTTPException(status_code=400, detail=pw_err)

    conn = get_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already registered.")

    hashed = hash_password(req.password)
    cur = conn.execute(
        "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
        (req.email, hashed, req.name, "user"),
    )
    conn.commit()
    user_id = cur.lastrowid
    user_row = conn.execute("SELECT id, email, name, role, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    user = dict_row(user_row)
    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = dict_row(row)

    if not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    safe_user = {k: user[k] for k in ("id", "email", "name", "role", "created_at")}
    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=safe_user)


@router.post("/logout")
def logout():
    # Stateless JWT — client simply discards the token.
    return {"message": "Logged out successfully."}
