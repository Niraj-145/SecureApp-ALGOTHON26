import os
from pathlib import Path

# ── Security ──────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "secureapp-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ── Database ──────────────────────────────────────────────
# Use a path relative to the backend directory (parent of app/)
# This works on any OS and regardless of the working directory.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = str(os.getenv("DATABASE_PATH", _BACKEND_DIR / "secureapp.db"))
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# ── CORS ──────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Server ────────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8000"))

# ── App ───────────────────────────────────────────────────
APP_NAME = "SecureApp"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
