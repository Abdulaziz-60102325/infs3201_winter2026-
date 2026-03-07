'use strict';

const { connectDB, getDB } = require('./db.js');
const { ObjectId } = require('mongodb');

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
 * Get employee by (_id)
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(id) {
    await connectDB();
    const db = getDB();
    return await db.collection('employees').findOne({ _id: new ObjectId(id) });
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
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
    await connectDB();
    const db = getDB();
    await db.collection('employees').updateOne(
        { _id: new ObjectId(id) },
        { $set: { name: name, phone: phone } }
    );
}

/**
 * Add a new employee
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<string>} 
 */
async function addNewEmployee(name, phone) {
    await connectDB();
    const db = getDB();
    
    const result = await db.collection('employees').insertOne({
        name: name,
        phone: phone
    });
    
    return result.insertedId.toString();
}

/**
 * Get all shifts assigned to a specific employee
 * @param {string} empID - Employee's _id
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(empID) {
    await connectDB();
    const db = getDB();

    // In the new model, we search in the shifts collection for the employee's ObjectId
    const schedule = await db.collection('shifts').find({
        employees: new ObjectId(empID)
    }).toArray();

    return schedule;
}

/**
 * Assign an employee to a shift
 * @param {string} shiftID - The ObjectId of the shift
 * @param {string} empID - The ObjectId of the employee
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift(shiftID, empID) {
    await connectDB();
    const db = getDB();

    // $addToSet ensures no duplicates
    await db.collection('shifts').updateOne(
        { _id: new ObjectId(shiftID) },
        { $addToSet: { employees: new ObjectId(empID) } }
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
