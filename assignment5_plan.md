# Assignment 5 – Implementation Plan
**INFS3201 | Due: April 14, 2026**

---

## Already Done (from A3 + A4)

| Feature | Status |
|---|---|
| Employee list, details, edit form (validation + PRG) | Done |
| MongoDB with employees embedded in shifts | Done |
| Custom session (no express-session), 5-min TTL | Done |
| SHA-256 password hashing | Done |
| Security access log (security_log collection) | Done |
| Auth middleware protecting all routes | Done |
| Employee photos behind auth (NOT public static) | Done |
| Login / Logout routes | Done |

---

## Gap Analysis — What Is Missing

### Gap 1: users collection is incomplete
Current users documents only have username + password.
Need to add: email, loginAttempts (int), isLocked (bool)

Run this in MongoDB Compass shell:
```js
db.users.updateMany({}, {
  $set: { email: "admin@example.com", loginAttempts: 0, isLocked: false }
})
```
(Set a real email per user individually)

### Gap 2: No pending_2fa collection
New collection needed — will be auto-created on first insert.

### Gap 3: multer not installed
```bash
npm install multer
```

### Gap 4: No emailSystem.js
Entire file missing — must be created from scratch.

### Gap 5: No 2FA route or view
GET/POST /2fa and views/twoFactor.handlebars are missing.

### Gap 6: No document upload system
No routes, no view, no multer config, no uploads/ folder.

---

## Implementation Steps

---

### STEP 0 — Git: Tag current state before starting

```bash
git add -A
git commit -m "A4 complete – tagging before A5 work"
git tag a4-complete
git push origin main --tags
```

---

### STEP 1 — Install multer

```bash
npm install multer
```

**Git commit:** `feat: install multer for file uploads`

---

### STEP 2 — Create emailSystem.js (NEW FILE)

Console.log only, but interface designed as if sending real email.
The rest of the system must not know it's console.log.

Functions to implement:

```js
'use strict';

/**
 * Base send function — simulates sending an email via console.log
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {void}
 */
function sendEmail(to, subject, body) {
    console.log("=== EMAIL SENT ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log("==================");
}

/**
 * Send a 2FA verification code to the user
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit code
 * @returns {void}
 */
function send2FACode(email, code) {
    sendEmail(email, "Your Login Verification Code",
        `Your 2FA code is: ${code}\nThis code expires in 3 minutes.`);
}

/**
 * Alert user of suspicious login activity (3 failed attempts)
 * @param {string} email - Recipient email
 * @returns {void}
 */
function sendSuspiciousActivityAlert(email) {
    sendEmail(email, "Security Alert: Suspicious Login Activity",
        "We detected multiple failed login attempts on your account. If this was not you, please contact your administrator.");
}

/**
 * Notify user that their account has been locked (10 failed attempts)
 * @param {string} email - Recipient email
 * @returns {void}
 */
function sendAccountLockedNotification(email) {
    sendEmail(email, "Account Locked",
        "Your account has been locked due to too many failed login attempts. Please contact your administrator to unlock it.");
}

module.exports = { sendEmail, send2FACode, sendSuspiciousActivityAlert, sendAccountLockedNotification };
```

**Git commit:** `feat: add emailSystem.js with console.log simulation`

---

### STEP 3 — Update Persistence.js (add 6 new functions)

Add after the existing getUserByUsername function:

| Function | Purpose |
|---|---|
| `incrementLoginAttempts(username)` | $inc loginAttempts by 1, return new count |
| `resetLoginAttempts(username)` | $set loginAttempts: 0 |
| `lockAccount(username)` | $set isLocked: true |
| `create2FAToken(username, code, expiry)` | Insert into pending_2fa collection |
| `get2FAToken(username)` | Find one from pending_2fa by username |
| `delete2FAToken(username)` | Delete from pending_2fa by username |

```js
/**
 * Increment the failed login attempt counter for a user
 * @param {string} username
 * @returns {Promise<number>} new attempt count
 */
async function incrementLoginAttempts(username) {
    await connectDB();
    const db = getDB();
    const result = await db.collection('users').findOneAndUpdate(
        { username },
        { $inc: { loginAttempts: 1 } },
        { returnDocument: 'after' }
    );
    return result.loginAttempts;
}

/**
 * Reset login attempt counter to 0 after successful login
 * @param {string} username
 * @returns {Promise<void>}
 */
async function resetLoginAttempts(username) {
    await connectDB();
    const db = getDB();
    await db.collection('users').updateOne({ username }, { $set: { loginAttempts: 0 } });
}

/**
 * Lock a user account permanently (only DB admin can unlock)
 * @param {string} username
 * @returns {Promise<void>}
 */
async function lockAccount(username) {
    await connectDB();
    const db = getDB();
    await db.collection('users').updateOne({ username }, { $set: { isLocked: true } });
}

/**
 * Store a 2FA token for a user with expiry
 * @param {string} username
 * @param {string} code - 6-digit code
 * @param {Date} expiry
 * @returns {Promise<void>}
 */
async function create2FAToken(username, code, expiry) {
    await connectDB();
    const db = getDB();
    await db.collection('pending_2fa').insertOne({ username, code, expiry });
}

/**
 * Retrieve a pending 2FA token for a user
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function get2FAToken(username) {
    await connectDB();
    const db = getDB();
    return await db.collection('pending_2fa').findOne({ username });
}

/**
 * Delete a pending 2FA token for a user
 * @param {string} username
 * @returns {Promise<void>}
 */
async function delete2FAToken(username) {
    await connectDB();
    const db = getDB();
    await db.collection('pending_2fa').deleteMany({ username });
}
```

Also add these 6 functions to module.exports.

**Git commit:** `feat: add 2FA and account lockout persistence functions`

---

### STEP 4 — Update business.js

#### 4a — Refactor authenticateUser (return string, not boolean)

Old: returns true/false
New: returns 'OK' | 'INVALID' | 'LOCKED'

```js
async function authenticateUser(username, password) {
    const user = await persistence.getUserByUsername(username);
    if (!user) return 'INVALID';

    if (user.isLocked) return 'LOCKED';

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== user.password) {
        const attempts = await persistence.incrementLoginAttempts(username);
        if (attempts === 3) {
            emailSystem.sendSuspiciousActivityAlert(user.email);
        }
        if (attempts >= 10) {
            await persistence.lockAccount(username);
            emailSystem.sendAccountLockedNotification(user.email);
        }
        return 'INVALID';
    }

    await persistence.resetLoginAttempts(username);
    return 'OK';
}
```

#### 4b — Add initiate2FA(username)

```js
/**
 * Generate and store a 2FA token, send it to user via email
 * @param {string} username
 * @returns {Promise<void>}
 */
async function initiate2FA(username) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    await persistence.delete2FAToken(username);
    await persistence.create2FAToken(username, code, expiry);
    const user = await persistence.getUserByUsername(username);
    emailSystem.send2FACode(user.email, code);
}
```

#### 4c — Add verify2FACode(username, code)

```js
/**
 * Verify a 2FA code submitted by the user
 * @param {string} username
 * @param {string} code - User-submitted code
 * @returns {Promise<'OK'|'INVALID'|'EXPIRED'>}
 */
async function verify2FACode(username, code) {
    const token = await persistence.get2FAToken(username);
    if (!token) return 'INVALID';
    if (token.expiry < new Date()) {
        await persistence.delete2FAToken(username);
        return 'EXPIRED';
    }
    if (token.code !== code) return 'INVALID';
    await persistence.delete2FAToken(username);
    return 'OK';
}
```

Add `initiate2FA` and `verify2FACode` to module.exports.
Add `const emailSystem = require('./emailSystem.js');` at top of business.js.

**Git commit:** `feat: implement 2FA and account lockout business logic`

---

### STEP 5 — Update app.js (2FA routes + auth flow changes)

#### 5a — Add /2fa to public routes in authGuard
```js
const publicRoutes = ["/login", "/logout", "/2fa"];
```

#### 5b — Import new functions
```js
const { ..., initiate2FA, verify2FACode } = require("./business.js");
```

#### 5c — Modify POST /login (no longer creates session directly)
```js
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const result = await authenticateUser(username, password);

    if (result === 'LOCKED') {
        return res.redirect("/login?error=Account is locked. Contact administrator.");
    }
    if (result === 'INVALID') {
        return res.redirect("/login?error=Invalid username or password");
    }
    // Credentials OK — initiate 2FA
    await initiate2FA(username);
    res.cookie('pending_2fa_user', username, { httpOnly: true, maxAge: 3 * 60 * 1000 });
    res.redirect("/2fa");
});
```

#### 5d — Add GET /2fa
```js
app.get("/2fa", (req, res) => {
    if (!req.cookies.pending_2fa_user) return res.redirect("/login");
    if (req.sessionUser) return res.redirect("/");
    res.render("twoFactor", { error: req.query.error });
});
```

#### 5e — Add POST /2fa
```js
app.post("/2fa", async (req, res) => {
    const username = req.cookies.pending_2fa_user;
    if (!username) return res.redirect("/login");

    const { code } = req.body;
    const result = await verify2FACode(username, code);

    if (result === 'EXPIRED') {
        res.clearCookie('pending_2fa_user');
        return res.redirect("/login?error=2FA code expired. Please log in again.");
    }
    if (result === 'INVALID') {
        return res.redirect("/2fa?error=Invalid code. Please try again.");
    }
    // 2FA passed — create real session now
    const sessionId = await createSession(username);
    res.clearCookie('pending_2fa_user');
    res.cookie('session_id', sessionId, { httpOnly: true });
    res.redirect("/");
});
```

**Git commit:** `feat: implement 2FA login flow (routes + temp cookie)`

---

### STEP 6 — Create views/twoFactor.handlebars (NEW FILE)

```html
<div style="max-width: 300px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
    <h2>Two-Factor Authentication</h2>
    <p>A 6-digit code has been sent to your email. It expires in 3 minutes.</p>
    {{#if error}}
        <p style="color: red;">{{error}}</p>
    {{/if}}
    <form action="/2fa" method="POST">
        <div style="margin-bottom: 10px;">
            <label for="code">Verification Code:</label><br>
            <input type="text" id="code" name="code" maxlength="6" style="width: 100%;" autocomplete="off">
        </div>
        <button type="submit" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Verify
        </button>
    </form>
    <p style="margin-top: 10px;"><a href="/login">Back to Login</a></p>
</div>
```

**Git commit:** `feat: add 2FA verification view`

---

### STEP 7 — Update MongoDB users documents

In MongoDB Compass, for EACH user add:
- email (unique real-looking email)
- loginAttempts: 0
- isLocked: false

---

### STEP 8 — Employee Documents Feature

#### 8a — Add multer config to app.js

```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'employee-docs', req.params.id);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + file.originalname;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are permitted'));
        }
    }
});
```

#### 8b — Add to Persistence.js (filesystem functions)

```js
/**
 * List all document filenames for an employee
 * @param {string} employeeId
 * @returns {Array<string>}
 */
function getEmployeeDocuments(employeeId) {
    const dir = path.join('uploads', 'employee-docs', employeeId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
}

/**
 * Count documents for an employee
 * @param {string} employeeId
 * @returns {number}
 */
function countEmployeeDocuments(employeeId) {
    return getEmployeeDocuments(employeeId).length;
}

/**
 * Delete a document from the filesystem
 * @param {string} employeeId
 * @param {string} filename
 * @returns {void}
 */
function deleteEmployeeDocument(employeeId, filename) {
    const filePath = path.join('uploads', 'employee-docs', employeeId, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
```

(Add `const path = require('path')` and `const fs = require('fs')` at top of Persistence.js)

#### 8c — Add to business.js (document functions)

```js
/**
 * Get document list for an employee
 * @param {string} employeeId
 * @returns {Array<string>}
 */
function getEmployeeDocuments(employeeId) {
    return persistence.getEmployeeDocuments(employeeId);
}

/**
 * Check if employee can upload another document
 * @param {string} employeeId
 * @returns {'OK'|'MAX_DOCS'}
 */
function canUploadDocument(employeeId) {
    const count = persistence.countEmployeeDocuments(employeeId);
    if (count < 5) return 'OK';
    return 'MAX_DOCS';
}

/**
 * Delete a document for an employee
 * @param {string} employeeId
 * @param {string} filename
 * @returns {void}
 */
function deleteEmployeeDocument(employeeId, filename) {
    persistence.deleteEmployeeDocument(employeeId, filename);
}
```

#### 8d — Add routes to app.js

```js
// List documents page
app.get("/employee/:id/documents", async (req, res) => {
    try {
        const employee = await getEmployeeById(req.params.id);
        if (!employee) return res.status(404).send("Employee not found");
        const documents = getEmployeeDocuments(req.params.id);
        res.render("documents", { employee, documents, success: req.query.success, error: req.query.error });
    } catch (err) {
        res.status(500).send("Error loading documents");
    }
});

// Upload document
app.post("/employee/:id/documents", (req, res) => {
    const checkResult = canUploadDocument(req.params.id);
    if (checkResult === 'MAX_DOCS') {
        return res.redirect(`/employee/${req.params.id}/documents?error=Maximum 5 documents allowed per employee`);
    }
    upload.single('document')(req, res, (err) => {
        if (err) {
            return res.redirect(`/employee/${req.params.id}/documents?error=${encodeURIComponent(err.message)}`);
        }
        if (!req.file) {
            return res.redirect(`/employee/${req.params.id}/documents?error=No file uploaded`);
        }
        res.redirect(`/employee/${req.params.id}/documents?success=Document uploaded successfully`);
    });
});

// Serve document (PROTECTED — NOT via static)
app.get("/employee/:id/documents/:filename", (req, res) => {
    const filePath = path.join('uploads', 'employee-docs', req.params.id, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("Document not found");
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    fs.createReadStream(filePath).pipe(res);
});

// Delete document
app.post("/employee/:id/documents/:filename/delete", (req, res) => {
    deleteEmployeeDocument(req.params.id, req.params.filename);
    res.redirect(`/employee/${req.params.id}/documents?success=Document deleted`);
});
```

Import at top of business.js:
```js
const { getEmployeeDocuments, canUploadDocument, deleteEmployeeDocument } = require('./business.js');
```

#### 8e — Create views/documents.handlebars (NEW FILE)

```html
<h1>Documents – {{employee.name}}</h1>

<p><a href="/employee/{{employee.id}}">← Back to Employee Details</a></p>

{{#if success}}
    <p style="color: green;">{{success}}</p>
{{/if}}
{{#if error}}
    <p style="color: red;">{{error}}</p>
{{/if}}

<h2>Upload New Document</h2>
<form action="/employee/{{employee.id}}/documents" method="POST" enctype="multipart/form-data">
    <input type="file" name="document" accept=".pdf" required>
    <button type="submit">Upload PDF</button>
</form>
<p><em>PDF only. Max 2MB. Maximum 5 documents per employee.</em></p>

<h2>Uploaded Documents</h2>
{{#if documents.length}}
    <ul>
        {{#each documents}}
        <li>
            <a href="/employee/{{../employee.id}}/documents/{{this}}" target="_blank">{{this}}</a>
            <form action="/employee/{{../employee.id}}/documents/{{this}}/delete" method="POST" style="display:inline;">
                <button type="submit" onclick="return confirm('Delete this document?')">Delete</button>
            </form>
        </li>
        {{/each}}
    </ul>
{{else}}
    <p>No documents uploaded yet.</p>
{{/if}}
```

#### 8f — Update views/employeeDetails.handlebars

Add this link below the "Edit Details" link:
```html
<a href="/employee/{{employee.id}}/documents">Manage Documents</a>
```

**Git commit:** `feat: add employee document upload, serving, and management`

---

### STEP 9 — Update .gitignore

Add:
```
uploads/
```

**Git commit:** `chore: add uploads/ to .gitignore`

---

### STEP 10 — Update README.md

Add Assignment 5 section:
- How 2FA works (look at console for code)
- User email addresses used for testing
- Account lockout (3 attempts = alert, 10 = locked)
- Document upload instructions and limits

---

### STEP 11 — JSDoc review + GitHub Release Tag

Check every function in:
- emailSystem.js — @param and @returns on all 4 functions
- Persistence.js — all new functions documented
- business.js — all new/modified functions documented

Then:
```bash
git add -A
git commit -m "docs: complete JSDoc and README for A5"
git tag v5.0
git push origin main --tags
```

---

## Final File Structure After A5

```
├── app.js                    ← Updated (2FA routes, multer, doc routes)
├── business.js               ← Updated (2FA logic, doc logic, authenticateUser)
├── Persistence.js            ← Updated (2FA token, lockout, doc FS functions)
├── emailSystem.js            ← NEW
├── db.js                     ← No change
├── transform_db.js           ← No change
├── package.json              ← Updated (+multer)
├── views/
│   ├── login.handlebars      ← No change
│   ├── twoFactor.handlebars  ← NEW
│   ├── employees.handlebars  ← No change
│   ├── employeeDetails.handlebars ← Updated (+docs link)
│   ├── documents.handlebars  ← NEW
│   └── layouts/main.handlebars ← No change
├── public/
│   └── images/               ← Existing (auth protected)
└── uploads/
    └── employee-docs/        ← NEW (in .gitignore)
        └── {employeeId}/
            └── *.pdf
```

---

## Key Rules Checklist

| Rule | Check |
|---|---|
| No .filter() / .map() / .reduce() | Use plain for loops |
| No express-session | Custom session already in place |
| Documents NOT via public static route | Custom GET route streams file |
| Session starts ONLY after 2FA success | pending_2fa_user temp cookie |
| 2FA code expires in 3 minutes | expiry Date stored in pending_2fa |
| Suspicious activity alert at 3 failures | sendSuspiciousActivityAlert called |
| Account locked at 10 failures | lockAccount + sendAccountLockedNotification |
| PDF only, max 2MB, max 5 docs | multer fileFilter + limits + canUploadDocument |
| emailSystem hides implementation | sendEmail wraps console.log |
| Multiple GitHub commits | 1 commit per step |
| GitHub release tag | git tag v5.0 |

---

## Testing Checklist

- [ ] Wrong password x3 → console shows suspicious activity email
- [ ] Wrong password x10 → console shows account locked email, login blocked
- [ ] Correct password → console shows 2FA code → enter code → logged in
- [ ] Wrong 2FA code → error message shown, stays on /2fa
- [ ] 2FA code after 3 min → expired error, redirected to /login
- [ ] Upload PDF under 2MB → success
- [ ] Upload PDF over 2MB → rejected with error
- [ ] Upload non-PDF → rejected with error
- [ ] Upload 6th document → rejected (max 5)
- [ ] View document while logged in → PDF opens in browser
- [ ] Access document URL while logged out → redirected to /login
- [ ] No uploads/ path accessible via direct URL
