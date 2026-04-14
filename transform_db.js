'use strict';

const { connectDB, getDB } = require('./db.js');


async function createEmployeesArray() {
    const db = getDB();
    const shifts = db.collection("shifts");

    console.log("Add empty employees array to all shifts");
    await shifts.updateMany(
        {},
        { $set: { employees: [] } }
    );
}


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
