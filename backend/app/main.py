"""
SecureApp — FastAPI Backend
Initializes database and registers all routes.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import APP_NAME, APP_VERSION, FRONTEND_URL, DEBUG
from app.database.init_db import init_db
from app.routes import auth, users, records, security

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# ── Create app ────────────────────────────────────────────

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    docs_url="/docs" if DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────
# Build allowed origins list: always include local dev, plus the
# configured FRONTEND_URL for production (e.g. https://xxx.onrender.com)

_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if FRONTEND_URL and FRONTEND_URL not in _allowed_origins:
    _allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security headers middleware ───────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Relaxed CSP that won't break the React SPA or API JSON responses
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# ── Global error handler ─────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full error for server-side debugging
    import traceback, sys
    traceback.print_exc(file=sys.stderr)
    # Return safe response to client
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

# ── Health ────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "app": APP_NAME, "version": APP_VERSION}

# ── Routes ────────────────────────────────────────────────

app.include_router(auth.router,     prefix="/api/auth")
app.include_router(users.router,    prefix="/api/users")
app.include_router(records.router,  prefix="/api/records")
app.include_router(security.router, prefix="/api/security")
