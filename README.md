# INFS3201 – Assignment 4
## Employee Scheduling System

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

| Username | Password   |
|----------|-----------|
| admin    | admin123  |
| user1    | pass1234  |

> **Note to evaluator:** If the above credentials do not work, please check the `users` collection in MongoDB Compass under the `infs3201_winter2026` database for the current usernames. Passwords are stored as SHA-256 hashes.

---

## Features Implemented

### Assignment 3
- Landing page: list of employees with clickable links
- Employee details page with sorted shifts
- Morning shifts (before 12:00) highlighted in yellow on the `<td>` element
- Edit employee form with server-side validation (trimming, name non-empty, phone format `dddd-dddd`)
- PRG (Post-Redirect-Get) cycle on form submission

### Assignment 4
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

---

## Project Structure

```
├── app.js           # Express server + routes
├── business.js      # Business logic layer
├── Persistence.js   # MongoDB persistence layer
├── db.js            # MongoDB connection
├── transform_db.js  # A4 one-time migration script
├── A4_refactor_plan.txt
├── views/
│   ├── employees.handlebars
│   ├── employeeDetails.handlebars
│   ├── editEmployee.handlebars
│   ├── login.handlebars
│   └── layouts/main.handlebars
└── public/
    └── images/      # Employee photos
```
