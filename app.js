const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const { connectDB } = require("./db.js");
const app = express();

const { 
    getAllEmployees, 
    getEmployeeById, 
    getShiftsForEmployee, 
    updateEmployee,
    authenticateUser 
} = require("./business.js");

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "infs3201_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using https
}));

// Auth Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/login");
};

connectDB().then(() => app.listen(3000, () => console.log("Server on port 3000"))
).catch(err => console.error("Failed to connect to MongoDB", err));

// Login Routes
app.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/");
    res.render("login", { error: req.query.error });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const isValid = await authenticateUser(username, password);

    if (isValid) {
        req.session.user = { username };
        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid username or password");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/", isAuthenticated, async (req, res) => {
    try {
        const employees = await getAllEmployees();
        res.render("employees", { employees });
    } catch (err) {
        res.status(500).send("Error loading employees");
    }
});

app.get("/employee/:id", isAuthenticated, async (req, res) => {
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

app.get("/employee/:id/edit", isAuthenticated, async (req, res) => {
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

app.post("/employee/:id/edit", isAuthenticated, async (req, res) => {
    try {
        let name = req.body.name.trim();
        let phone = req.body.phone.trim();

        const regex = /^\d{4}-\d{4}$/;

        if (name === "" || !regex.test(phone)) {
            return res.status(400).send("Invalid input");
        }

        await updateEmployee(req.params.id, name, phone);
        res.redirect("/");
    } catch (err) {
        res.status(500).send("Error updating employee");
    }
});

