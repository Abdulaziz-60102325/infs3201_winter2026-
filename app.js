const express = require("express");
const exphbs = require("express-handlebars");
const { connectDB } = require("./db.js");
const app = express();

const { getAllEmployees, getEmployeeById, getShiftsForEmployee, updateEmployee } = require("./business.js");

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

connectDB().then(() => app.listen(3000, () => console.log("Server on port 3000"))
).catch(err => console.error("Failed to connect to MongoDB", err));

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

