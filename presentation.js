const prompt = require('prompt-sync')();
const business = require('./business.js');

/**
 * Shows all employees in a table. 
 * If no employees, it will tell the user.
 * @returns {Promise<void>}
 */
async function displayEmployees() {
    let allEmployees = await business.getEmployeeList();

    if (allEmployees.length === 0) {
        console.log("No employees available.");
        return;
    }

    console.log("Employee ID".padEnd(15) + "Full Name".padEnd(25) + "Phone Number");
    console.log("-------------".padEnd(15) + "-------------------------"+ "------------");

    for (let employee of allEmployees) {
        console.log(employee.employeeId.padEnd(15) + employee.name.padEnd(25) + employee.phone);
    }
}

/**
 * Ask user for new employee info and adds them to system.
 * @returns {Promise<void>}
 */
async function createNewEmployee() {
    let name = prompt("Please provide the employee's name:  ");
    let phoneNumber = prompt("Enter the employee's phone number:  ");
    await business.createNewEmployee(name, phoneNumber);
    console.log("New employee successfully added.");
}

/**
 * Ask for employee and shift IDs, try to assign the shift.
 * Will print result after.
 * @returns {Promise<void>}
 */
async function assignShiftToEmployee() {
    let employeeID = prompt("Enter the employee's ID: ");
    let shiftID = prompt("Enter the shift ID: ");

    let result = await business.assignEmployeeToShift(employeeID, shiftID);

    if (result === "OK") {
        console.log("Shift assigned successfully.");
    }
    else if (result === "EMP_NOT_FOUND") {
        console.log("Employee not found.");
    }
    else if (result === "SHIFT_NOT_FOUND") {
        console.log("Shift not found.");
    }
    else if (result === "DUPLICATE") {
        console.log("This employee is already assigned to the shift.");
    }
    else if (result === "MAX_HOURS") {
        console.log("The maximum daily hours have been exceeded.");
    }
    else if (result === "INVALID_SHIFT_TIME") {
        console.log("The shift time provided is invalid.");
    }
    else {
        console.log("Unable to assign the shift.");
    }
}

/**
 * Asks for employee ID and shows their work schedule in CSV format.
 * If no shifts assigned, only the header will show.
 * @returns {Promise<void>}
 */
async function showEmployeeSchedule() {
    let empID = prompt("Enter the employee ID: ");
    let scheduleEntries = await business.getEmployeeSchedule(empID);

    // Always print the header (even if no schedule entries exist)
    console.log("Date,Start Time,End Time");
    for (let entry of scheduleEntries) {
        console.log(`${entry.date},${entry.startTime},${entry.endTime}`);
    }
}

/**
 * Main loop of the program. Shows menu, gets user input, 
 * and calls the right function until the user exits.
 * @returns {Promise<void>}
 */
async function runApp() {
    while (true) {
        console.log('1. View all employees');
        console.log('2. Add a new employee');
        console.log('3. Assign an employee to a shift');
        console.log('4. View employee work schedule');
        console.log('5. Exit');

        let choice = Number(prompt("Please choose an option: "));
        if (choice === 1) {
            await displayEmployees();
        }
        else if (choice === 2) {
            await createNewEmployee();
        }
        else if (choice === 3) {
            await assignShiftToEmployee();
        }
        else if (choice === 4) {
            await showEmployeeSchedule();
        }
        else if (choice === 5) {
            console.log("You have chosen to exit");
            break;
        }
        else {
            console.log('Invalid choice! Please select a number between 1-5.');
        }
    }
}

runApp();
