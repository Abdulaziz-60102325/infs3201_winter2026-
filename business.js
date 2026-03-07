const persistence = require('./Persistence.js');


/**
 * Get list of all employees
 * @returns {Promise<Array>}
 */
async function getAllEmployees() {
    return await persistence.getEmployeeData();
}

/**
 * Get a single employee by ID
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(id) {
    return await persistence.getEmployeeById(id);
}

/**
 * Create a new employee
 * @param {string} name
 * @param {string} phoneNumber
 * @returns {Promise<string>} New employee ID
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
    const shifts = await persistence.getShiftsForEmployee(id);
    
    // Process shifts to add morning flag and sort
    shifts.forEach(shift => {
        shift.isMorning = shift.startTime < "12:00";
    });

    // Sort shifts by date and then by startTime (oldest to newest)
    shifts.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
    });

    return shifts;
}

/**
 * Update an employee's name and phone
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
    return await persistence.updateEmployee(id, name, phone);
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createNewEmployee,
    getShiftsForEmployee,
    updateEmployee
};
