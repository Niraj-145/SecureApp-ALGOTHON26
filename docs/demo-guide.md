# SecureApp — Demo Guide for ALGOTHON'26 Judging

## Quick Start (2 terminals)

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Recommended Demo Flow (5–8 minutes)

### Step 1: Admin Authority Overview & Security Center
1. On the login page, click **Admin** quick-fill button → Click **Sign In**.
2. **Point out the Admin Dashboard:**
   - Security Posture Score
   - Vulnerability Matrix (Critical & High findings)
   - Enterprise scope (Registered Accounts, Total Records across all partitions)
   - Recent Security Audit activity
   - Admin-exclusive navigation (Security Center, Security Report)
3. Open **Security Center** from the sidebar.
4. Show the four detected vulnerabilities (SQLi, XSS, IDOR, Weak Auth).

### Step 2: Role Differentiation & Personal User Dashboard
1. Click **Sign Out** in the sidebar.
2. Click **Alice** (User 1) quick-fill button → Click **Sign In**.
3. **Point out the Standard User Dashboard:**
   - Notice the complete absence of Security Center administration buttons.
   - Shows **My Records** (only documents owned by Alice).
   - Shows **My Collaboration** and **Data Isolation Status**.
   - Displays **My Recent Activity** and zero-trust tenant notices.
   - Shows the **Authorization Demonstration Sandbox**.

### Step 3: Demonstrating Broken Access Control (IDOR)
1. Still logged in as **Alice (User 1)**, click **Browse My Records**.
2. Notice Alice only sees her records (`#101`, `#102`, `#3`) and shared policies (`#1`, `#2`).
3. Click the direct testing button for **Record #201** (Bob's confidential financial ledger):
   - **In Vulnerable Mode:** The server retrieves and displays Bob's confidential record to Alice! Point out the prominent red banner: *"VULNERABILITY DEMONSTRATION: IDOR Data Leakage Active!"*
4. Click **Sign Out** and log back in as **Admin**.
5. Navigate to **Security Center** → click **Apply Fix** on Broken Access Control (IDOR).
6. Click **Run Retest** → Confirm automated verification passes.
7. Log back in as **Alice (User 1)** and click **Record #201** again:
   - **In Secure Mode:** The backend immediately intercepts the request and blocks access with **HTTP 403 Forbidden**!
   - Show the Neo-Brutalist card: *"403 Access Denied — Authorization Enforced. Server-side ownership verification blocked your request."*

### Step 4: Cross-Tenant Data Isolation (Bob / User 2)
1. Log in as **Bob (User 2)**.
2. Bob's personal dashboard displays his own records (`#201`, `#202`, `#5`).
3. Try accessing Alice's private **Record #101** directly:
   - Result: **HTTP 403 Forbidden** — Bob is blocked from reading Alice's documents.
4. Log back in as **Admin**:
   - Admin accesses both **Record #101** and **Record #201** without restriction.

### Step 5: Full Security Lifecycle (SQL Injection, XSS, Weak Auth)
1. Return to **Security Center** as Admin.
2. **SQL Injection:**
   - Click **Safely Demonstrate** → Shows injected payload `' OR '1'='1` dumping records.
   - Click **Apply Fix** → Activates parameterized SQL statements.
   - Click **Run Retest** → Injected payload treated as literal search string; 0 leaked records.
3. **Stored XSS:**
   - Click **Safely Demonstrate** → Explains unescaped script execution.
   - Click **Apply Fix** → Activates server-side HTML entity encoding.
   - Click **Run Retest** → Tags converted to safe entities (`&lt;script&gt;`).
4. **Weak Authentication:**
   - Click **Safely Demonstrate** → Highlights weak reversible passwords.
   - Click **Apply Fix** → Enforces salted `bcrypt` hashing and password complexity.
   - Click **Run Retest** → Verifies one-way encryption and policy enforcement.

### Step 6: Security Score & Audit Report
1. Watch the Security Score update dynamically from low baseline to **100 / 100**.
2. Click **Security Report** in the sidebar.
3. Show the audit-ready report with executive summary, CVSS scores, remediation logs, and export options (PDF / JSON).

### Step 7: Automated Test Suite
- In a terminal, run:
  ```bash
  cd backend
  python -m pytest tests -v
  ```
- Show all **11 automated tests passing (100%)**, including `test_roles_and_idor_lifecycle` and regression suites.

---

## Key Talking Points for Judges

1. **"Authorization is enforced strictly on the backend — never just by hiding buttons in React."**
2. **"Even if a user manually changes the URL to another tenant's record ID, the server checks ownership and returns 403 Forbidden."**
3. **"Admin, User 1, and User 2 have distinct dashboards and data visibility boundaries."**
4. **"Every vulnerability demonstrates the complete 7-step lifecycle: Discover → Identify → Safely Demonstrate → Fix → Retest → Verify → Report."**
5. **"All state transitions occur dynamically at runtime without requiring manual code modifications by judges."**
6. **"100% automated test coverage with regression validation ensures business features remain stable after security fixes."**
