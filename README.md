### README.md file

### GitHub Repository
https://github.com/abdulaziz5050/infs3201_winter2026-

---

## How to Run

```bash
npm install
node app.js
```

The server starts on **http://localhost:3000**

---

## Test User Accounts

| Username | Password  | Email               |
|----------|-----------|---------------------|
| admin    | admin123  | admin@example.com   |
| user1    | pass1234  | user1@example.com   |



## Assignment 5 — New Features

### Two-Factor Authentication (2FA)
- After entering correct username/password, a **6-digit code** is generated and "sent" (printed to console)
- A 2FA code entry page is shown — the session is **not created** until this step is passed
- The 2FA code expires in **3 minutes**
- After **3 failed login attempts**: a suspicious activity email alert is printed to console
- After **10 failed login attempts**: the account is locked permanently (only unlockable via DB)

### Email System (`emailSystem.js`)
- All email output goes to `console.log` — check the server terminal
- Interface designed as if using a real email provider
- Functions: `send2FACode`, `sendSuspiciousActivityAlert`, `sendAccountLockedNotification`

### Employee Documents
- Each employee can have up to **5 PDF documents** uploaded
- PDFs must be **2MB or smaller**
- Documents are stored in `uploads/employee-docs/{employeeId}/` (not in the database)
- Documents are **not** served via a public static route — access requires an active session
- Access the document manager from any employee's detail page → "Manage Documents"

---

## Features Implemented

- Landing page: list of employees with clickable links
- Employee details page with sorted shifts
- Morning shifts (before 12:00) highlighted in yellow on the `<td>` element
- Edit employee form with server-side validation (trimming, name non-empty, phone format `dddd-dddd`)
- PRG (Post-Redirect-Get) cycle on form submission

- **Database migration**: Embedded employee ObjectIds directly inside shift documents
- **transform_db.js**: One-time migration script (Step 1–3 completed)
- **A4_refactor_plan.txt**: Planning document committed before implementation
- **User Authentication**: Custom session management (no `express-session`)
  - SHA-256 password hashing
  - 5-minute session TTL with automatic extension on each request
  - Session stored in MongoDB `sessions` collection
- **Security Access Log**: Every request logged to `security_log` collection
  - Timestamp, username, URL, HTTP method
- **Employee Photos**: Served from `/public/images/` — access requires active session
- **Auth Middleware**: Protects all routes except `/login` and `/logout`

- **2FA Authentication**: 6-digit code via email (console), 3-minute expiry
- **Account Lockout**: Suspicious activity alert at 3 failures, lock at 10 failures
- **emailSystem.js**: Simulated email layer (console.log, but real interface)
- **Employee Documents**: PDF upload, 2MB limit, 5-doc cap, protected serving route
