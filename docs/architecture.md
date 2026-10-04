# SecureApp — Architecture

## System Architecture

```
┌─────────────────────────────────┐
│         User Browser            │
│    (React SPA, port 5173)       │
└────────────┬────────────────────┘
             │ HTTP REST (JSON)
             ▼
┌─────────────────────────────────┐
│      FastAPI Backend            │
│    (Uvicorn, port 8000)         │
│                                 │
│  ┌───────────┐ ┌──────────────┐ │
│  │  Routes   │ │  Auth Layer  │ │
│  │ auth      │ │  JWT+bcrypt  │ │
│  │ users     │ │              │ │
│  │ records   │ └──────────────┘ │
│  │ security  │                  │
│  └───────────┘                  │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Security Assessment     │   │
│  │  Engine                  │   │
│  │  - demo_*()              │   │
│  │  - fix_*()               │   │
│  │  - retest_*()            │   │
│  │  - calculate_score()     │   │
│  └──────────────────────────┘   │
└────────────┬────────────────────┘
             │ sqlite3
             ▼
┌─────────────────────────────────┐
│     SQLite Database             │
│     secureapp.db                │
│                                 │
│  Tables:                        │
│  - users                        │
│  - records                      │
│  - comments                     │
│  - vulnerability_state          │
│  - security_logs                │
└─────────────────────────────────┘
```

## Vulnerability Mode Architecture

Each of the 4 vulnerabilities has a `is_fixed` flag in `vulnerability_state`.

When `is_fixed = 0` (Vulnerable):
- Record search uses **string concatenation** SQL
- Comments return **raw unsanitized** content
- Record detail has **no ownership check**
- Auth uses **weak reversible hash** concept

When `is_fixed = 1` (Secure):
- Record search uses **parameterized queries**
- Comments HTML-escape content before return
- Record detail enforces **owner_id == user.id** check
- Auth uses **bcrypt with password policy**

The Security Engine `demo_*()` functions test the *current active path* and report real results.

## Data Flow

1. User interacts with React frontend
2. API calls go to FastAPI over localhost
3. FastAPI validates JWT token on protected routes
4. Routes query SQLite through `get_connection()`
5. Security engine modifies `vulnerability_state` table to toggle secure/vulnerable code paths
6. Score is calculated deterministically from current vulnerability states
