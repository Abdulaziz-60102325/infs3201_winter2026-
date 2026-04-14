'use strict';

const { connectDB, getDB } = require('./db.js');

/**
 * Step 1: Add an empty 'employees' array field to every shift document.
 * This prepares the shifts collection for the embedded document model.
 * @returns {Promise<void>}
 */
async function createEmployeesArray() {
    const db = getDB();
    const shifts = db.collection("shifts");

    console.log("Add empty employees array to all shifts");
    await shifts.updateMany(
        {},
        { $set: { employees: [] } }
    );
}


/**
 * Step 2: Read all documents from the assignments collection and embed
 * each employee's ObjectId into the corresponding shift's 'employees' array.
 * Uses $addToSet to avoid duplicate entries.
 * @returns {Promise<void>}
 */
async function embedEmployees() {
    const db = getDB();
    const assignments = await db.collection("assignments").find().toArray();

    console.log(`Processing ${assignments.length} assignments...`);

    for (let i = 0; i < assignments.length; i++) {
        let assignment = assignments[i];

        let employee = await db.collection("employees")
            .findOne({ employeeId: assignment.employeeId });

        let shift = await db.collection("shifts")
            .findOne({ shiftId: assignment.shiftId });

        if (employee && shift) {
            await db.collection("shifts").updateOne(
                { _id: shift._id },
                { $addToSet: { employees: employee._id } }
            );
        }
    }
}


/**
 * Step 3: Remove legacy relational fields and drop the assignments collection.
 * Removes 'employeeId' from employees, 'shiftId' from shifts,
 * and drops the now-redundant assignments collection entirely.
 * @returns {Promise<void>}
 */
async function cleanupLegacyData() {
    const db = getDB();

    console.log("Clean up legacy fields and collections...");

    await db.collection("employees").updateMany(
        {},
        { $unset: { employeeId: "" } }
    );

    await db.collection("shifts").updateMany(
        {},
        { $unset: { shiftId: "" } }
    );

    try {
        await db.collection("assignments").drop();
        console.log(" 'assignments' dropped.");
    } catch (e) {
        console.log(" 'assignments' already gone.");
    }
}

/**
 * Entry point: runs the full migration pipeline in order.
 * Must be executed exactly once after backing up the database.
 * @returns {Promise<void>}
 */
async function runMigration() {
    try {
        await connectDB();
        await createEmployeesArray();
        await embedEmployees();
        await cleanupLegacyData();
        console.log("migrate completed successfully!");
    } catch (err) {
        console.error("migrate failed:", err);
    } finally {
        process.exit(0);
    }
}

runMigration();
