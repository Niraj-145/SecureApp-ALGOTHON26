"""Pydantic models for request / response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


# ── Auth ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Users ─────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: str


# ── Records ───────────────────────────────────────────────

class RecordCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    category: str = Field(default="general", max_length=50)
    is_private: bool = False

class RecordUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    is_private: Optional[bool] = None

class RecordOut(BaseModel):
    id: int
    owner_id: int
    title: str
    content: str
    category: str
    is_private: bool
    created_at: str
    owner_name: Optional[str] = None


# ── Comments ──────────────────────────────────────────────

class CommentCreate(BaseModel):
    record_id: int
    content: str = Field(..., min_length=1, max_length=2000)

class CommentOut(BaseModel):
    id: int
    record_id: int
    user_id: int
    content: str
    created_at: str
    user_name: Optional[str] = None


# ── Security ─────────────────────────────────────────────

class VulnerabilityOut(BaseModel):
    id: str
    name: str
    severity: str
    category: str
    component: str
    description: str
    root_cause: str
    impact: str
    fix_description: str
    is_fixed: bool
    is_retested: bool
    retest_passed: bool
    demo_result: Optional[str] = None
    fix_applied_at: Optional[str] = None
    retest_at: Optional[str] = None

class SecurityScoreOut(BaseModel):
    score: int
    total_vulnerabilities: int
    critical: int
    high: int
    medium: int
    fixed: int
    verified: int
    unfixed: int

class DemoResult(BaseModel):
    vulnerability: str
    status: str
    passed: bool
    message: str
    evidence: Optional[str] = None

class SecurityReportOut(BaseModel):
    score: SecurityScoreOut
    assessment_date: str
    vulnerabilities: List[VulnerabilityOut]
