'use strict';

const { connectDB, getDB } = require('./db.js');
const mongodb = require('mongodb');

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
 * @param {string} id - The hex string of the ObjectId
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(id) {
    if (!id) return null;
    await connectDB();
    const db = getDB();
    // Use mongodb.ObjectId as requested in the instructions
    const empObjectId = new mongodb.ObjectId(id);
    return await db.collection('employees').findOne({ _id: empObjectId });
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
 * Update an existing employee using _id
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
    if (!id) return;
    await connectDB();
    const db = getDB();
    const empObjectId = new mongodb.ObjectId(id);
    await db.collection('employees').updateOne(
        { _id: empObjectId },
        { $set: { name: name, phone: phone } }
    );
}

/**
 * Add a new employee (No longer needs manual employeeId)
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<string>} The new employee's _id as string
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
 * Uses the new embedded model: find shifts where 'employees' array contains the employee's ObjectId
 * @param {string} empID - Employee's _id hex string
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(empID) {
    if (!empID) return [];
    await connectDB();
    const db = getDB();

    const empObjectId = new mongodb.ObjectId(empID);
    
    // As per instructions: find shifts where employees contains employeeId (ObjectId)
    const schedule = await db.collection('shifts').find({
        employees: empObjectId
    }).toArray();

    return schedule;
}

/**
 * Assign an employee to a shift by adding their ObjectId to the employees array
 * @param {string} shiftID - The ObjectId of the shift
 * @param {string} empID - The ObjectId of the employee
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift(shiftID, empID) {
    if (!shiftID || !empID) return;
    await connectDB();
    const db = getDB();

    const shiftObjectId = new mongodb.ObjectId(shiftID);
    const empObjectId = new mongodb.ObjectId(empID);

    // $addToSet ensures no duplicates
    await db.collection('shifts').updateOne(
        { _id: shiftObjectId },
        { $addToSet: { employees: empObjectId } }
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
