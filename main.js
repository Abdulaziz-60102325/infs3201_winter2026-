'use strict';

const fs = require('fs/promises');
const prompt = require('prompt-sync')();

/**
 * Loads the employee list from the employees.json file.
 * @returns {Promise<Array<{employeeId: string, name: string, phone: string}>>} Array of employee objects.
 */
async function loadEmployeeData() {
    let content = await fs.readFile('employees.json', 'utf8');
    return JSON.parse(content);
}

/**
 * Loads the shift list from the shifts.json file.
 * @returns {Promise<Array<{shiftId: string, date: string, startTime: string, endTime: string}>>} Array of shift objects.
 */
async function loadShiftData() {
    let content = await fs.readFile('shifts.json', 'utf8');
    return JSON.parse(content);
}

/**
 * Loads the employee-to-shift assignments from the assignments.json file.
 * @returns {Promise<Array<{employeeId: string, shiftId: string}>>} Array of assignment objects.
 */
async function loadAssignmentData() {
    let content = await fs.readFile('assignments.json', 'utf8');
    return JSON.parse(content);
}

/**
 * Saves the employee list to the employees.json file.
 * @param {Array<{employeeId: string, name: string, phone: string}>} employeeList Array of employee objects to save.
 * @returns {Promise<void>} Resolves when the file has been written.
 */
async function saveEmployeeData(employeeList) {
    let data = JSON.stringify(employeeList);
    await fs.writeFile('employees.json', data);
}

/**
 * Displays all employees in a formatted table to the console.
 * @returns {Promise<void>} Resolves after printing the employee list.
 */
async function listEmployee() {
    let allEmployees = await loadEmployeeData();

    if (allEmployees.length === 0) {
        console.log('No Employees');
    } else {
        console.log('Employee ID'.padEnd(12) + 'Name'.padEnd(22) + 'Phone');
        console.log('-----------'.padEnd(12) + '--------------------- ' + '---------');

        for (let e of allEmployees) {
            console.log(e.employeeId.padEnd(12) + e.name.padEnd(22) + e.phone);
        }
    }
}

/**
 * Adds a new employee to employees.json with an auto-incremented ID in the format E###.
 * @param {string} name The full name of the new employee.
 * @param {string} phoneNumber The phone number of the new employee.
 * @returns {Promise<void>} Resolves after the employee has been saved to file.
 */
async function addEmployee(name, phoneNumber) {
    let allEmployees = await loadEmployeeData();
    let maxId = 0;

    for (let c of allEmployees) {
        let num = parseInt(c.employeeId.substring(1));
        if (num > maxId) {
            maxId = num;
        }
    }

    let nextIdNumber = maxId + 1;
    let nextEmployeeId = 'E' + String(nextIdNumber).padStart(3, '0');

    let newEmployee = {
        employeeId: nextEmployeeId,
        name: name,
        phone: phoneNumber
    };

    allEmployees.push(newEmployee);
    await saveEmployeeData(allEmployees);
}

/**
 * Prints the schedule for a specific employee to the console in CSV format.
 * @param {string} empID The employee ID to view (e.g. "E003").
 * @returns {Promise<void>} Resolves after printing the schedule output.
 */
async function viewEmployeeSchedule(empID) {
    let allShifts = await loadShiftData();
    let allAssignments = await loadAssignmentData();

    console.log('date,startTime,endTime');

    for (let a of allAssignments) {
        if (a.employeeId === empID) {
            for (let s of allShifts) {
                if (s.shiftId === a.shiftId) {
                    console.log(`${s.date},${s.startTime},${s.endTime}`);
                }
            }
        }
    }
}

/**
 * Main application loop for the terminal interface.
 * Displays a menu and routes user input to the appropriate feature.
 * @returns {Promise<void>} Resolves when the user chooses to exit.
 */
async function main() {
    while (true) {
        console.log('1. Show all employees');
        console.log('2. Add new employee');
        console.log('3. View employee schedule');
        console.log('4. Exit');
        let selection = Number(prompt('What is your choice> '));

        if (selection === 1) {
            await listEmployee();
        } else if (selection === 2) {
            let name = prompt('Enter Employee name: ');
            let phoneNumber = prompt('Enter phone number: ');
            await addEmployee(name, phoneNumber);
            console.log('Employee added...');
        } else if (selection === 3) {
            let empID = prompt('Enter employee ID: ');
            await viewEmployeeSchedule(empID);
        } else if (selection === 4) {
            break;
        } else {
            console.log('ERROR: Please pick a number between 1 and 4.');
        }
    }
}

main();