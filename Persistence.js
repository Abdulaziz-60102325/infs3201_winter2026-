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
 * @param {string} id 
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(id) {
    if (!id) return null;
    await connectDB();
    const db = getDB();
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
 * @param {string} empID 
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(empID) {
    if (!empID) return [];
    await connectDB();
    const db = getDB();

    const empObjectId = new mongodb.ObjectId(empID);
    
    const schedule = await db.collection('shifts').find({
        employees: empObjectId
    }).toArray();

    return schedule;
}

/**
 * @param {string} shiftID 
 * @param {string} empID 
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift(shiftID, empID) {
    if (!shiftID || !empID) return;
    await connectDB();
    const db = getDB();

    const shiftObjectId = new mongodb.ObjectId(shiftID);
    const empObjectId = new mongodb.ObjectId(empID);

    await db.collection('shifts').updateOne(
        { _id: shiftObjectId },
        { $addToSet: { employees: empObjectId } }
    );
}

/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function getUserByUsername(username) {
    await connectDB();
    const db = getDB();
    return await db.collection('users').findOne({ username: username });
}

module.exports = {
    connectDB,
    getEmployeeData,
    getEmployeeById,
    getShiftData,
    updateEmployee,
    addNewEmployee,
    getShiftsForEmployee,
    assignEmployeeToShift,
    getUserByUsername
};
