'use strict';

const persistence = require('./Persistence.js');
const crypto = require('crypto');

/**
 * Get list of all employees
 * @returns {Promise<Array>}
 */
async function getAllEmployees() {
    const employees = await persistence.getEmployeeData();
    return employees.map(e => ({
        ...e,
        id: e._id.toString()
    }));
}

/**
 * Get a single employee by MongoDB ObjectId (_id)
 * @param {string} id - Hex string for ObjectId
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(id) {
    const employee = await persistence.getEmployeeById(id);
    if(employee) {
        employee.id = employee._id.toString();
    }
    return employee;
}

/**
 * Create a new employee
 * @param {string} name
 * @param {string} phoneNumber
 * @returns {Promise<string>} 
 */
async function createNewEmployee(name, phoneNumber) {
    return await persistence.addNewEmployee(name, phoneNumber);
}

/**
 * Get all shifts for an employee, sorted chronologically and flagged as morning if applicable
 * @param {string} id
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(id) {
    const shiftsForEmp = await persistence.getShiftsForEmployee(id);
    
    // Process shifts
    shiftsForEmp.forEach(shift => {
        shift.isMorning = shift.startTime < "12:00";
    });

    // Sort chronologically (oldest to newest)
    shiftsForEmp.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
    });

    return shiftsForEmp;
}

/**
 * Update an employee's information
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
    return await persistence.updateEmployee(id, name, phone);
}

/**
 * Assign an employee to a shift using the embedded model
 * @param {string} shiftId
 * @param {string} empId
 * @returns {Promise<void>}
 */
async function assignEmployeeToShift(shiftId, empId) {
    return await persistence.assignEmployeeToShift(shiftId, empId);
}

/**
 * Authenticate user by username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function authenticateUser(username, password) {
    const user = await persistence.getUserByUsername(username);
    if (!user) return false;

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    return hashedPassword === user.password;
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createNewEmployee,
    getShiftsForEmployee,
    updateEmployee,
    assignEmployeeToShift,
    authenticateUser,
    createSession: persistence.createInternalSession,
    getSession: persistence.getInternalSession,
    extendSession: persistence.extendInternalSession,
    deleteSession: persistence.deleteInternalSession
};
