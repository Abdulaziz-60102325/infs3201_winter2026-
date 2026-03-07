'use strict';

const persistence = require('./Persistence.js');

/**
 * Get list of all employees
 * Maps _id to id for easier use in views
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
 * No longer requires manual employeeId (e.g. E001)
 * @param {string} name
 * @param {string} phoneNumber
 * @returns {Promise<string>} The new employee's _id as string
 */
async function createNewEmployee(name, phoneNumber) {
    return await persistence.addNewEmployee(name, phoneNumber);
}

/**
 * Get all shifts for an employee, sorted chronologically and flagged as morning if applicable
 * Uses the new embedded model: find shifts that include the employee's ObjectId
 * @param {string} id - Employee _id
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

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createNewEmployee,
    getShiftsForEmployee,
    updateEmployee,
    assignEmployeeToShift
};
