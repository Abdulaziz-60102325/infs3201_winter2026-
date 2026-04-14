const express = require("express");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./db.js");
const app = express();

const { 
    getAllEmployees, 
    getEmployeeById, 
    getShiftsForEmployee, 
    updateEmployee,
    authenticateUser,
    createSession,
    getSession,
    extendSession,
    deleteSession,
    logSecurityEvent
} = require("./business.js");

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


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


const securityLogger = async (req, res, next) => {
    await logSecurityEvent({
        username: req.sessionUser || "unknown",
        url: req.url,
        method: req.method
    });
    next();
};


const authGuard = (req, res, next) => {
    const publicRoutes = ["/login", "/logout"];
    if (publicRoutes.includes(req.path) || req.sessionUser) {
        return next();
    }
    res.redirect("/login");
};

app.use(sessionMiddleware);
app.use(securityLogger);
app.use(authGuard);
app.use(express.static('public')); // Must be after authGuard so photos require login

connectDB().then(() => app.listen(3000, () => console.log("Server on port 3000"))
).catch(err => console.error("Failed to connect to MongoDB", err));

app.get("/login", async (req, res) => {
    if (req.sessionUser) return res.redirect("/");
    res.render("login", { error: req.query.error });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const isValid = await authenticateUser(username, password);

    if (isValid) {
        const sessionId = await createSession(username);
        res.cookie('session_id', sessionId, { httpOnly: true });
        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid username or password");
    }
});

app.get("/logout", async (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
        await deleteSession(sessionId);
    }
    res.clearCookie('session_id');
    res.redirect("/login");
});

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
