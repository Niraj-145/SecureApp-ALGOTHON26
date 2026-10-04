# SecureApp — Web Application Security Assessment & Remediation Platform

> **ALGOTHON'26 · PS ID: ALG-CYBER-02 · Secure the Application**

SecureApp is an educational cybersecurity platform that demonstrates the complete security lifecycle against its own intentionally vulnerable local application:

**DISCOVER → IDENTIFY → SAFELY DEMONSTRATE → FIX → RETEST → VERIFY → REPORT**

---

## Project Overview

SecureApp is a realistic small-business web application (records, documents, comments, user management) that intentionally contains four categories of security vulnerabilities. A built-in Security Center discovers these flaws, safely demonstrates their impact in a controlled local environment, applies secure code fixes, retests to verify the fixes, and generates audit-ready reports.

**No external systems, third-party targets, or real user data are ever involved.**

---

## Architecture

```
User Browser
     ↓
React Frontend (Vite, port 5173)
     ↓
FastAPI REST API (Uvicorn, port 8000)
     ↓
SQLite Database (secureapp.db)
     ↓
Security Assessment Engine (Python)
```

```
Vulnerable Application
       ↓
Security Assessment (Discover & Demo)
       ↓
Apply Secure Fix
       ↓
Automated Retest
       ↓
Verified Secure State → Report
```

---

## Technology Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite 8, JavaScript, CSS   |
| Backend   | Python 3.14, FastAPI, Pydantic      |
| Database  | SQLite 3                            |
| Auth      | JWT (HS256), bcrypt                 |
| Testing   | Pytest                              |
| Icons     | Lucide React                        |

---

## Vulnerabilities Implemented

| # | Vulnerability                        | Severity | Affected Component       |
|---|--------------------------------------|----------|--------------------------|
| 1 | SQL Injection                        | Critical | Record Search / Lookup   |
| 2 | Cross-Site Scripting (XSS)           | High     | Comments / Notes         |
| 3 | Broken Access Control (IDOR)         | High     | Record Details API       |
| 4 | Weak Authentication & Session Security | Critical | Login / Session Mgmt   |

Each vulnerability follows the full lifecycle:
1. **Discover** — Listed in Security Center with severity, root cause, impact
2. **Demonstrate** — Real backend test with evidence output
3. **Fix** — Activates the secure code path (parameterized queries, HTML encoding, ownership checks, bcrypt)
4. **Retest** — Automated re-execution to verify fix blocks the exploit
5. **Report** — Audit-ready evidence with timestamps

---

## Setup Instructions

### Prerequisites

- Python 3.10+ (tested with 3.14)
- Node.js 18+ with npm

### Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The database is created and seeded automatically on first startup.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role   | Email                      | Password    |
|--------|----------------------------|-------------|
| Admin  | admin@secureapp.local      | Admin@123   |
| User A | alice@secureapp.local      | Alice@123   |
| User B | bob@secureapp.local        | Bob@12345   |

These are local-only demo credentials. Quick-fill buttons are available on the login page.

---

## Security Demonstration Flow

1. **Login** with any demo account
2. Open **Security Center** from the sidebar
3. View all 4 detected vulnerabilities with severity ratings
4. **Safely Demonstrate** — click to run a controlled exploit test
5. **Apply Fix** — activates the secure implementation
6. **Run Retest** — verifies the exploit is now blocked
7. Watch the **Security Score** increase from ~0 to **100/100**
8. Open **Security Report** for a print-ready audit summary

### Testing IDOR manually

1. Login as Alice → navigate to Records → view record #5 (Bob's private memo)
2. In Vulnerable mode: record is returned (unauthorized access!)
3. After applying the IDOR fix: 403 Forbidden is returned

### Testing SQL Injection manually

1. On the Records page, click **Test Payload: ' OR '1'='1**
2. In Vulnerable mode: all records (including private) are dumped
3. After fix: parameterized query returns 0 results

---

## Testing

```bash
cd backend
python -m pytest tests -v
```

**10 automated tests** covering:
- Authentication (login, register, password policy)
- Record CRUD and comments
- Full security lifecycle (demo → fix → retest → score=100)
- Regression (normal features work after all fixes applied)

---

## Security Considerations

- ✅ Passwords hashed with bcrypt (salted, one-way)
- ✅ JWT tokens with expiration
- ✅ Backend authorization on all protected endpoints
- ✅ Server-side input validation (Pydantic)
- ✅ HTML output encoding for XSS prevention
- ✅ Parameterized SQL queries
- ✅ No secrets in frontend bundle
- ✅ CORS restricted to localhost origins
- ✅ Global error handler (no stack traces exposed)
- ✅ All security tests run against local app only

---

## Project Structure

```
secureapp/
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, ProtectedRoute, CookieBanner
│   │   ├── pages/           # Login, Register, Dashboard, Records,
│   │   │                    # RecordDetails, Profile, SecurityCenter,
│   │   │                    # VulnerabilityDetails, SecurityReport,
│   │   │                    # PrivacyPolicy, Terms, NotFound
│   │   ├── services/api.js  # Centralized API client
│   │   ├── hooks/useAuth.jsx # Auth context provider
│   │   ├── App.jsx          # Router & layout
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Design system
│   ├── public/              # favicon, robots.txt, sitemap.xml
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app with lifespan, CORS, routes
│   │   ├── config.py        # Centralized configuration
│   │   ├── routes/          # auth, users, records, security
│   │   ├── database/        # connection, init_db (schema + seed)
│   │   ├── security/engine.py # Demo/Fix/Retest engine for 4 vulns
│   │   ├── schemas/         # Pydantic request/response models
│   │   └── utils/auth.py    # JWT + bcrypt helpers
│   ├── tests/               # test_auth, test_records, test_security,
│   │                        # test_regression
│   └── requirements.txt
├── docs/
│   ├── architecture.md
│   ├── security-report.md
│   ├── test-results.md
│   └── demo-guide.md
├── README.md
└── .gitignore
```

---

## Known Limitations

- SQLite is single-writer; not suitable for production concurrency
- No HTTPS in local dev (documented for production deployment)
- Rate limiting is not enforced (lightweight project scope)
- Session revocation is client-side only (stateless JWT)

---

## Future Improvements

- Add CSRF protection
- Implement refresh token rotation
- Add server-side rate limiting middleware
- HTTPS with self-signed certificate for local dev
- Expand to additional OWASP Top 10 categories

---

## HTTPS Configuration (Production)

For production deployment:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem

# Run with HTTPS
uvicorn app.main:app --host 0.0.0.0 --port 443 --ssl-keyfile key.pem --ssl-certfile cert.pem
```

For local development, HTTP on localhost is used.

---

## AI-Assisted Development Disclosure

This project was developed with AI-assisted coding tools for code generation, debugging, and documentation. All code has been reviewed, tested, and verified by the development team.

---

**ALGOTHON'26 — Team SecureApp**
