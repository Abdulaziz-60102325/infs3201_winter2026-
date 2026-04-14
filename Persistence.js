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
 * Update an employee's name, phone, and photo by MongoDB ObjectId
 * @param {string} id - The employee's MongoDB ObjectId string
 * @param {string} name - The updated name
 * @param {string} phone - The updated phone number
 * @param {string} photo - The updated photo filename
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone, photo) {
    if (!id) return;
    await connectDB();
    const db = getDB();
    const empObjectId = new mongodb.ObjectId(id);
    await db.collection('employees').updateOne(
        { _id: empObjectId },
        { $set: { name: name, phone: phone, photo: photo } }
    );
}

/**
 * Add a new employee to the employees collection
 * @param {string} name - The employee's full name
 * @param {string} phone - The employee's phone number
 * @returns {Promise<string>} The new employee's inserted ObjectId as a string
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
 * Get all shifts assigned to a specific employee, sorted by date then start time
 * @param {string} empID - The employee's MongoDB ObjectId string
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(empID) {
    if (!empID) return [];
    await connectDB();
    const db = getDB();

    const empObjectId = new mongodb.ObjectId(empID);

    const schedule = await db.collection('shifts')
        .find({ employees: empObjectId })
        .sort({ date: 1, startTime: 1 })
        .toArray();

    return schedule;
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

/**
 * Create a new session for an authenticated user (5-minute TTL)
 * @param {string} username
 * @returns {Promise<string>} The generated session ID
 */
async function createInternalSession(username) {
    await connectDB();
    const db = getDB();
    const crypto = require('crypto');
    const sessionId = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.collection('sessions').insertOne({
        sessionId,
        username,
        expiry
    });
    return sessionId;
}

/**
 * Retrieve a session by ID if it has not expired
 * @param {string} sessionId
 * @returns {Promise<object|null>} The session object or null if expired/not found
 */
async function getInternalSession(sessionId) {
    await connectDB();
    const db = getDB();
    const session = await db.collection('sessions').findOne({ sessionId });

    if (session && session.expiry > new Date()) {
        return session;
    }
    return null;
}

/**
 * Extend an existing session by another 5 minutes
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function extendInternalSession(sessionId) {
    await connectDB();
    const db = getDB();
    const newExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await db.collection('sessions').updateOne(
        { sessionId },
        { $set: { expiry: newExpiry } }
    );
}

/**
 * Delete a session (used on logout)
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function deleteInternalSession(sessionId) {
    await connectDB();
    const db = getDB();
    await db.collection('sessions').deleteOne({ sessionId });
}

/**
 * Log a security event to the security_log collection
 * @param {object} event - Event details
 * @param {string} event.username - Username of the requester (or 'unknown')
 * @param {string} event.url - The URL accessed
 * @param {string} event.method - HTTP method used (GET, POST, etc.)
 * @returns {Promise<void>}
 */
async function logSecurityEvent(event) {
    await connectDB();
    const db = getDB();
    await db.collection('security_log').insertOne({
        timestamp: new Date(),
        username: event.username || "unknown",
        url: event.url,
        method: event.method
    });
}

module.exports = {
    connectDB,
    getEmployeeData,
    getEmployeeById,
    getShiftData,
    updateEmployee,
    addNewEmployee,
    getShiftsForEmployee,
    getUserByUsername,
    createInternalSession,
    getInternalSession,
    extendInternalSession,
    deleteInternalSession,
    logSecurityEvent
};
