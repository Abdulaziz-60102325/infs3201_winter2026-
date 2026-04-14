'use strict';

const persistence = require('./Persistence.js');
const crypto = require('crypto');

/**
 * Get list of all employees
 * @returns {Promise<Array>}
 */
async function getAllEmployees() {
    const employees = await persistence.getEmployeeData();
    const result = [];
    for (let i = 0; i < employees.length; i++) {
        const e = employees[i];
        result.push({
            _id: e._id,
            id: e._id.toString(),
            name: e.name,
            phone: e.phone,
            photo: e.photo
        });
    }
    return result;
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
    // Sorting is handled by MongoDB in the persistence layer
    const shiftsForEmp = await persistence.getShiftsForEmployee(id);

    // Flag morning shifts (before 12:00) using a plain for loop
    for (let i = 0; i < shiftsForEmp.length; i++) {
        shiftsForEmp[i].isMorning = shiftsForEmp[i].startTime < "12:00";
    }

    return shiftsForEmp;
}

/**
 * Update an employee's information
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone, photo) {
    return await persistence.updateEmployee(id, name, phone, photo);
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
    authenticateUser,
    createSession: persistence.createInternalSession,
    getSession: persistence.getInternalSession,
    extendSession: persistence.extendInternalSession,
    deleteSession: persistence.deleteInternalSession,
    logSecurityEvent: persistence.logSecurityEvent
};
