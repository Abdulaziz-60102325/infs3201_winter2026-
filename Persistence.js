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


async function getShiftsForEmployee(empID) {
    await connectDB();
    const db = getDB();

    const schedule = await db.collection('assignments').aggregate([
        { $match: { employeeId: empID } },
        {
            $lookup: {
                from: 'shifts',
                localField: 'shiftId',
                foreignField: 'shiftId',
                as: 'shiftDetails'
            }
        },
        { $unwind: '$shiftDetails' },
        {
            $project: {
                _id: 0,
                shiftId: '$shiftDetails.shiftId',
                date: '$shiftDetails.date',
                startTime: '$shiftDetails.startTime',
                endTime: '$shiftDetails.endTime'
            }
        }
    ]).toArray();

    return schedule;
}


module.exports = {
    connectDB,
    getEmployeeData,
    getEmployeeById,
    getShiftData,
    updateEmployee,
    addNewEmployee,
    getShiftsForEmployee
};

