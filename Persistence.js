'use strict';

const { connectDB, getDB } = require('./db.js');



async function getEmployeeData() {
    await connectDB();
    const db = getDB();
    return await db.collection('employees').find({}).toArray();
}


async function getEmployeeById(employeeId) {
    await connectDB();
    const db = getDB();
    return await db.collection('employees').findOne({ employeeId: employeeId });
}

/**
 * Retrieves all shift documents from the shifts collection.
 * @returns {Promise<Array>} Array of all shift objects.
 */
async function getShiftData() {
    await connectDB();
    const db = getDB();
    return await db.collection('shifts').find({}).toArray();
}


async function updateEmployee(employeeId, name, phone) {
    await connectDB();
    const db = getDB();
    await db.collection('employees').updateOne(
        { employeeId: employeeId },
        { $set: { name: name, phone: phone } }
    );
}


async function addNewEmployee(name, phone) {
    await connectDB();
    const db = getDB();
    
    // Find the latest employee to get the highest ID
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


module.exports = {
    connectDB,
    getEmployeeData,
    getEmployeeById,
    getShiftData,
    updateEmployee,
    addNewEmployee
};

