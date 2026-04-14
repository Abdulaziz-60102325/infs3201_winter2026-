const express = require("express");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { connectDB } = require("./db.js");
const app = express();

const {
    getAllEmployees,
    getEmployeeById,
    getShiftsForEmployee,
    updateEmployee,
    authenticateUser,
    initiate2FA,
    verify2FACode,
    createSession,
    getSession,
    extendSession,
    deleteSession,
    logSecurityEvent,
    getEmployeeDocuments,
    canUploadDocument,
    deleteEmployeeDocument
} = require("./business.js");

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Multer storage config: store PDFs in uploads/employee-docs/{employeeId}/
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

// Multer upload instance: PDF only, 2MB max
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are permitted'));
        }
    }
});

// Middleware: resolve session user from cookie
const sessionMiddleware = async (req, res, next) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
        const session = await getSession(sessionId);
        if (session) {
            await extendSession(sessionId);
            req.sessionUser = session.username;
        }
    }
    next();
};

// Middleware: log every request to security_log collection
const securityLogger = async (req, res, next) => {
    await logSecurityEvent({
        username: req.sessionUser || "unknown",
        url: req.url,
        method: req.method
    });
    next();
};

// Middleware: protect all routes except public ones
const authGuard = (req, res, next) => {
    const publicRoutes = ["/login", "/logout", "/2fa"];
    if (publicRoutes.includes(req.path) || req.sessionUser) {
        return next();
    }
    res.redirect("/login?error=You must be logged in to access this page");
};

app.use(sessionMiddleware);
app.use(securityLogger);
app.use(authGuard);
app.use(express.static('public')); // Must be after authGuard so photos require login

connectDB().then(() => app.listen(3000, () => console.log("Server on port 3000"))
).catch(err => console.error("Failed to connect to MongoDB", err));

// ==================== AUTH ROUTES ====================

app.get("/login", async (req, res) => {
    if (req.sessionUser) return res.redirect("/");
    res.render("login", { error: req.query.error });
});

// POST /login — validates credentials, then hands off to 2FA instead of creating session
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const result = await authenticateUser(username, password);

    if (result === 'LOCKED') {
        return res.redirect("/login?error=Your account has been locked. Please contact an administrator.");
    }
    if (result === 'INVALID') {
        return res.redirect("/login?error=Invalid username or password");
    }

    // Credentials valid — initiate 2FA before creating a session
    await initiate2FA(username);
    res.cookie('pending_2fa_user', username, { httpOnly: true, maxAge: 3 * 60 * 1000 });
    res.redirect("/2fa");
});

app.get("/logout", async (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
        await deleteSession(sessionId);
    }
    res.clearCookie('session_id');
    res.redirect("/login");
});

// ==================== 2FA ROUTES ====================

// GET /2fa — show the 2FA code entry page
app.get("/2fa", (req, res) => {
    if (!req.cookies.pending_2fa_user) return res.redirect("/login");
    if (req.sessionUser) return res.redirect("/");
    res.render("twoFactor", { error: req.query.error });
});

// POST /2fa — verify the submitted code and create a real session if correct
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

    // 2FA passed — now create the real session
    const sessionId = await createSession(username);
    res.clearCookie('pending_2fa_user');
    res.cookie('session_id', sessionId, { httpOnly: true });
    res.redirect("/");
});

// ==================== EMPLOYEE ROUTES ====================

app.get("/", async (req, res) => {
    try {
        const employees = await getAllEmployees();
        res.render("employees", { employees });
    } catch (err) {
        res.status(500).send("Error loading employees");
    }
});

app.get("/employee/:id", async (req, res) => {
    try {
        const employee = await getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        const shifts = await getShiftsForEmployee(req.params.id);

        res.render("employeeDetails", {
            employee,
            shifts
        });
    } catch (err) {
        res.status(500).send("Error loading employee details");
    }
});

app.get("/employee/:id/edit", async (req, res) => {
    try {
        const employee = await getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        res.render("editEmployee", { employee });
    } catch (err) {
        res.status(500).send("Error loading edit page");
    }
});

app.post("/employee/:id/edit", async (req, res) => {
    try {
        let name = req.body.name.trim();
        let phone = req.body.phone.trim();
        let photo = req.body.photo ? req.body.photo.trim() : "";

        const regex = /^\d{4}-\d{4}$/;

        if (name === "" || !regex.test(phone)) {
            return res.status(400).send("Invalid input");
        }

        await updateEmployee(req.params.id, name, phone, photo);
        res.redirect("/");
    } catch (err) {
        res.status(500).send("Error updating employee");
    }
});

// ==================== DOCUMENT ROUTES ====================

// GET — list all documents for an employee
app.get("/employee/:id/documents", async (req, res) => {
    try {
        const employee = await getEmployeeById(req.params.id);
        if (!employee) return res.status(404).send("Employee not found");

        const documents = getEmployeeDocuments(req.params.id);
        res.render("documents", {
            employee,
            documents,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        res.status(500).send("Error loading documents");
    }
});

// POST — upload a new document for an employee (PDF only, max 2MB, max 5 total)
app.post("/employee/:id/documents", (req, res) => {
    // Check count BEFORE multer saves the file
    const checkResult = canUploadDocument(req.params.id);
    if (checkResult === 'MAX_DOCS') {
        return res.redirect(`/employee/${req.params.id}/documents?error=Maximum of 5 documents allowed per employee`);
    }

    upload.single('document')(req, res, (err) => {
        if (err) {
            return res.redirect(`/employee/${req.params.id}/documents?error=${encodeURIComponent(err.message)}`);
        }
        if (!req.file) {
            return res.redirect(`/employee/${req.params.id}/documents?error=No file selected`);
        }
        res.redirect(`/employee/${req.params.id}/documents?success=Document uploaded successfully`);
    });
});

// GET — serve a document file (PROTECTED — not via express.static)
app.get("/employee/:id/documents/:filename", (req, res) => {
    const filePath = path.join('uploads', 'employee-docs', req.params.id, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Document not found");
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    fs.createReadStream(filePath).pipe(res);
});

// POST — delete a document for an employee
app.post("/employee/:id/documents/:filename/delete", (req, res) => {
    deleteEmployeeDocument(req.params.id, req.params.filename);
    res.redirect(`/employee/${req.params.id}/documents?success=Document deleted successfully`);
});
