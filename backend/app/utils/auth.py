import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database.connection import get_connection, dict_row

security_scheme = HTTPBearer()


# ── Password helpers ──────────────────────────────────────

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


# ── Weak password helpers (for vulnerable mode demo) ─────

def weak_hash(password: str) -> str:
    """Intentionally weak 'hash' — just base64-ish reversal. FOR DEMO ONLY."""
    return password[::-1]

def weak_verify(plain: str, hashed: str) -> bool:
    return plain[::-1] == hashed


# ── JWT helpers ───────────────────────────────────────────

def create_access_token(data: dict, expires_minutes: int = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# ── Dependency — get current user ─────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    conn = get_connection()
    row = conn.execute("SELECT id, email, name, role, created_at FROM users WHERE id = ?", (int(user_id),)).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")
    return dict_row(row)


def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
