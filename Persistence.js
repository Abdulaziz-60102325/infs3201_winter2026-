const fs = require('fs/promises');

/**
 * Get all employees from employees.json.
 * @returns {Promise<Array<{employeeId: string, name: string, phone: string}>>}
 */
async function getEmployeeData() {
    let employeeData = await fs.readFile('employees.json', 'utf8');
    return JSON.parse(employeeData);
}

/**
 * Get all shifts from shifts.json.
 * @returns {Promise<Array<{shiftId: string, date: string, startTime: string, endTime: string}>>}
 */
async function getShiftData() {
    let shiftData = await fs.readFile('shifts.json', 'utf8');
    return JSON.parse(shiftData);
}

/**
 * Gets all assignments from assignments.json
 * @returns {Promise<Array<{employeeId: string, shiftId: string}>>}
 */
async function getAssignmentData() {
    let assignmentData = await fs.readFile('assignments.json', 'utf8');
    return JSON.parse(assignmentData);
}

/**
 * Saves employee data to employees.json. 
 * @param {Array<{employeeId: string, name: string, phone: string}>} employees
 * @returns {Promise<void>}
 */
async function saveEmployeeList(employees) {
    let data = JSON.stringify(employees, null, 4);
    await fs.writeFile('employees.json', data);
}

/**
 * Saves the assignments list to assignments.json.
 * @param {Array<{employeeId: string, shiftId: string}>} assignments
 * @returns {Promise<void>}
 */
async function saveAssignments(assignments) {
    let data = JSON.stringify(assignments, null, 4);
    await fs.writeFile('assignments.json', data);
}

/**
 * Fetch config data from config.json.
 * @returns {Promise<{maxDailyHours: number}>}
 */
async function getConfigData() {
    let config = await fs.readFile('config.json', 'utf8');
    return JSON.parse(config);
}

/**
 * Calculates shift duration. 
 * @param {string} start Start time in HH:MM format.
 * @param {string} end End time in HH:MM format.
 * @returns {number} Duration of shift in hours.
 */
function calculateShiftDuration(start, end) {
    let startHour = parseInt(start.substring(0, 2));
    let startMinute = parseInt(start.substring(3, 5));
    let endHour = parseInt(end.substring(0, 2));
    let endMinute = parseInt(end.substring(3, 5));

    let startTotalMinutes = startHour * 60 + startMinute;
    let endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
    }

    return (endTotalMinutes - startTotalMinutes) / 60;
}

/**
 * Add a new employee with auto-incremented ID.
 * @param {string} name Employee name
 * @param {string} phone Employee phone number
 */
async function addNewEmployee(name, phone) {
    let employees = await getEmployeeData();
    let highestId = 0;

    // find the highest employee ID
    for (let emp of employees) {
        let idNumber = parseInt(emp.employeeId.substring(1));
        if (idNumber > highestId) {
            highestId = idNumber;
        }
    }

    // generate new employee ID
    let newId = "E" + String(highestId + 1).padStart(3, "0");

    // add new employee to list
    employees.push({
        employeeId: newId,
        name: name,
        phone: phone
    });

    // save the updated list back
    await saveEmployeeList(employees);
}

/**
 * Get all the data needed for assigning shifts.
 * @returns {Promise<{
 *   employees: Array<{employeeId: string, name: string, phone: string}>,
 *   shifts: Array<{shiftId: string, date: string, startTime: string, endTime: string}>,
 *   assignments: Array<{employeeId: string, shiftId: string}>,
 *   config: {maxDailyHours: number}
 * }>}
 */
async function getAllAssignShiftData() {
    let employees = await getEmployeeData();
    let shifts = await getShiftData();
    let assignments = await getAssignmentData();
    let config = await getConfigData();

    return { employees, shifts, assignments, config };
}

/**
 * Save shift assignment data (employee to shift relationship).
 * @param {string} empID Employee ID
 * @param {string} shiftID Shift ID
 * @returns {Promise<void>}
 */
async function saveShiftAssignment(empID, shiftID) {
    let assignments = await getAssignmentData();  // load current assignments
    assignments.push({ employeeId: empID, shiftId: shiftID });  // add new assignment

    await saveAssignments(assignments);  // save updated assignments
}

/**
 * Get the work schedule for an employee.
 * @param {string} empID Employee ID
 * @returns {Promise<Array<{date: string, startTime: string, endTime: string}>>}
 */
async function getEmployeeSchedule(empID) {
    let shifts = await getShiftData();  // load all shifts
    let assignments = await getAssignmentData();  // load assignments

    let schedule = [];

    // find all assignments for employee
    for (let assignment of assignments) {
        if (assignment.employeeId === empID) {
            // find corresponding shift for assignment
            let shift = shifts.find(s => s.shiftId === assignment.shiftId);
            if (shift) {
                // add shift details to schedule
                schedule.push({
                    date: shift.date,
                    startTime: shift.startTime,
                    endTime: shift.endTime
                });
            }
        }
    }

    return schedule;
}

module.exports = {
    getEmployeeData,
    getShiftData,
    getAssignmentData,
    saveEmployeeList,
    saveAssignments,
    getConfigData,
    calculateShiftDuration,
    addNewEmployee,
    getAllAssignShiftData,
    saveShiftAssignment,
    getEmployeeSchedule
};
