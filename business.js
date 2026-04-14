'use strict';

const persistence = require('./Persistence.js');
const crypto = require('crypto');
const emailSystem = require('./emailSystem.js');

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
    if (employee) {
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
 * @param {string} photo
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone, photo) {
    return await persistence.updateEmployee(id, name, phone, photo);
}

/**
 * Authenticate user by username and password.
 * Handles account lockout and suspicious activity email alerts.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<'OK'|'INVALID'|'LOCKED'>}
 */
async function authenticateUser(username, password) {
    const user = await persistence.getUserByUsername(username);
    if (!user) return 'INVALID';

    if (user.isLocked) return 'LOCKED';

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (hashedPassword !== user.password) {
        const attempts = await persistence.incrementLoginAttempts(username);

        if (attempts === 3) {
            emailSystem.sendSuspiciousActivityAlert(user.email);
        }
        if (attempts >= 10) {
            await persistence.lockAccount(username);
            emailSystem.sendAccountLockedNotification(user.email);
        }
        return 'INVALID';
    }

    await persistence.resetLoginAttempts(username);
    return 'OK';
}

/**
 * Generate a 6-digit 2FA code, store it with a 3-minute expiry, and email it to the user
 * @param {string} username
 * @returns {Promise<void>}
 */
async function initiate2FA(username) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    await persistence.delete2FAToken(username); // Clear any existing token first
    await persistence.create2FAToken(username, code, expiry);

    const user = await persistence.getUserByUsername(username);
    emailSystem.send2FACode(user.email, code);
}

/**
 * Verify a 2FA code submitted by the user
 * @param {string} username
 * @param {string} code - User-submitted 6-digit code
 * @returns {Promise<'OK'|'INVALID'|'EXPIRED'>}
 */
async function verify2FACode(username, code) {
    const token = await persistence.get2FAToken(username);
    if (!token) return 'INVALID';

    if (token.expiry < new Date()) {
        await persistence.delete2FAToken(username);
        return 'EXPIRED';
    }

    if (token.code !== code) return 'INVALID';

    await persistence.delete2FAToken(username);
    return 'OK';
}

/**
 * Get the list of document filenames for an employee
 * @param {string} employeeId
 * @returns {Array<string>}
 */
function getEmployeeDocuments(employeeId) {
    return persistence.getEmployeeDocuments(employeeId);
}

/**
 * Check whether an employee is allowed to upload another document (max 5 total)
 * @param {string} employeeId
 * @returns {'OK'|'MAX_DOCS'}
 */
function canUploadDocument(employeeId) {
    const count = persistence.countEmployeeDocuments(employeeId);
    if (count < 5) return 'OK';
    return 'MAX_DOCS';
}

/**
 * Delete a specific document for an employee
 * @param {string} employeeId
 * @param {string} filename
 * @returns {void}
 */
function deleteEmployeeDocument(employeeId, filename) {
    persistence.deleteEmployeeDocument(employeeId, filename);
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createNewEmployee,
    getShiftsForEmployee,
    updateEmployee,
    authenticateUser,
    initiate2FA,
    verify2FACode,
    getEmployeeDocuments,
    canUploadDocument,
    deleteEmployeeDocument,
    createSession: persistence.createInternalSession,
    getSession: persistence.getInternalSession,
    extendSession: persistence.extendInternalSession,
    deleteSession: persistence.deleteInternalSession,
    logSecurityEvent: persistence.logSecurityEvent
};
