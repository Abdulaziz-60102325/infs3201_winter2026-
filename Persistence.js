'use strict';

const { connectDB, getDB } = require('./db.js');



/**
 * Get all employees data
 * @returns {Promise<Array>}
 */
async function getEmployeeData() {
    await connectDB();
    const db = getDB();
    return await db.collection('employees').find({}).toArray();
}

/**
 * Get employee by ID
 * @param {string} employeeId
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(employeeId) {
    await connectDB();
    const db = getDB();
    return await db.collection('employees').findOne({ employeeId: employeeId });
}

/**
 * Get all shifts data
 * @returns {Promise<Array>}
 */
async function getShiftData() {
    await connectDB();
    const db = getDB();
    return await db.collection('shifts').find({}).toArray();
}

/**
 * Update an existing employee
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(employeeId, name, phone) {
    await connectDB();
    const db = getDB();
    await db.collection('employees').updateOne(
        { employeeId: employeeId },
        { $set: { name: name, phone: phone } }
    );
}

/**
 * Add a new employee with auto-generated ID
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<string>} The new employee's ID
 */
async function addNewEmployee(name, phone) {
    await connectDB();
    const db = getDB();
    
    const lastEmployee = await db.collection('employees')
        .find({})
        .sort({ employeeId: -1 })
        .limit(1)
        .toArray();
    
    let highestId = 0;
    if (lastEmployee.length > 0) {
        highestId = parseInt(lastEmployee[0].employeeId.substring(1));
    }

    const newId = 'E' + String(highestId + 1).padStart(3, '0');

    await db.collection('employees').insertOne({
        employeeId: newId,
        name: name,
        phone: phone
    });
    
    return newId;
}

/**
 * Get all shifts assigned to a specific employee
 * @param {string} empID
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(empID) {
    await connectDB();
    const db = getDB();

    const employee = await db.collection('employees').findOne({ employeeId: empID });
    if (!employee) return [];

    // Find all shifts where this employee's _id is in the employees array
    const schedule = await db.collection('shifts').find({
        employees: employee._id
    }).toArray();

    return schedule;
}

/**
 * Assign an employee to a shift by updating the shift document's employees array
 * @param {string} shiftID - The ObjectId of the shift
 * @param {string} employeeId - The employeeId (e.g. E001)
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift(shiftID, employeeId) {
    await connectDB();
    const db = getDB();
    const { ObjectId } = require('mongodb');

    // Find the employee's _id first
    const employee = await db.collection('employees').findOne({ employeeId: employeeId });
    if (!employee) throw new Error("Employee not found");

    // $addToSet ensures no duplicates
    await db.collection('shifts').updateOne(
        { _id: new ObjectId(shiftID) },
        { $addToSet: { employees: employee._id } }
    );
}

module.exports = {
    connectDB,
    getEmployeeData,
    getEmployeeById,
    getShiftData,
    updateEmployee,
    addNewEmployee,
    getShiftsForEmployee,
    assignEmployeeToShift
};
