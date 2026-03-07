const persistence = require('./Persistence.js');

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
 * Get a single employee by ID (_id)
 * @param {string} id
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
 * @returns {Promise<string>} New employee _id string
 */
async function createNewEmployee(name, phoneNumber) {
    return await persistence.addNewEmployee(name, phoneNumber);
}

/**
 * Get all shifts for an employee
 * @param {string} id - Employee _id
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(id) {
    const shiftsForEmp = await persistence.getShiftsForEmployee(id);
    
    // Process shifts
    shiftsForEmp.forEach(shift => {
        shift.isMorning = shift.startTime < "12:00";
    });

    // Sort chronologically
    shiftsForEmp.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
    });

    return shiftsForEmp;
}

/**
 * Update an employee
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
    return await persistence.updateEmployee(id, name, phone);
}

/**
 * Assign employee to shift
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
