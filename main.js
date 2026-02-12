const fs = require('fs/promises') 

const prompt = require('prompt-sync')()


/**
 * Loads the employee list from employees.json.
 * @returns {Promise<Array<{employeeId: string, name: string, phone: string}>>} Array of employee objects.
 */

async function loadEmployeeData() {
    let employees = await fs.readFile('employees.json','utf8')
    
    let object = JSON.parse(employees)
    return object
}

/**
 * Loads the shift list from shifts.json.
 * @returns {Promise<Array<{shiftId: string, date: string, startTime: string, endTime: string}>>} Array of shift objects.
 */

async function loadShiftData() {
    let shifts = await fs.readFile('shifts.json','utf8')
    
    let object = JSON.parse(shifts)
    return object
}

/**
 * Loads the employee-to-shift assignments from assignmentsList.json.
 * @returns {Promise<Array<{employeeId: string, shiftId: string}>>} Array of assignment objects.
 */

async function loadAssignmentData() {
    let assignmentList = await fs.readFile('assignments.json','utf8')
    
    let object = JSON.parse(assignmentList)
    return object
}

/**
 * Saves the employee list to employees.json.
 * @param {Array<{employeeId: string, name: string, phone: string}>} employeeList Array of employee objects to save.
 * @returns {Promise<void>} Resolves when the file has been written.
 */

async function saveEmployeeData(employeeList) {
    let data = JSON.stringify(employeeList)
    
    await fs.writeFile('employees.json', data )
}

/**
 * Saves the employee-to-shift assignments to assignments.json.
 * @param {Array<{employeeId: string, shiftId: string}>} assignment Array of assignment objects to save.
 * @returns {Promise<void>} Resolves when the file has been written.
 */

async function saveAssignmentData(assignment) {
    let data = JSON.stringify(assignment)
    
    await fs.writeFile('assignments.json', data )
}

/**
 * Displays all employees in a formatted table.
 * Loads employees from employees.json each time it is called (no caching).
 * @returns {Promise<void>} Resolves after printing the employee list.
 */

async function listEmployee() {
    let allEmployees = await loadEmployeeData()
    
    if (allEmployees.length === 0){
        console.log("No Employees")
    }
    else{

        console.log( "Employee ID".padEnd(12) + "Name".padEnd(22) + "Phone")
        console.log( "-----------".padEnd(12) + "--------------------- " + "---------")
        
        for (let e of allEmployees) { 

            console.log(e.employeeId.padEnd(12) + e.name.padEnd(22) + e.phone)
        }
    } 


}

/**
 * Adds a new employee to employees.json using an auto-increment style ID (E###).
 * @param {string} name The new employee's full name.
 * @param {string} phoneNumber The new employee's phone number.
 * @returns {Promise<void>} Resolves after the employee has been saved.
 */

async function addEmployee(name, phoneNumber) {
    let allEmployees = await loadEmployeeData()
    let maxId = 0

    for (let c of allEmployees) {
        let num = parseInt(c.employeeId.substring(1))
        if (num > maxId) {
            maxId = num
        }
    }

    let nextIdNumber = maxId + 1
    let nextEmployeeId = "E" + String(nextIdNumber).padStart(3, "0")

    let newEmployee = {
        employeeId: nextEmployeeId,
        name: name,
        phone: phoneNumber
    }

    allEmployees.push(newEmployee)
    await saveEmployeeData(allEmployees)
}

/**
 * Assigns an employee to a shift by writing to assignments.json.
 * Validates that the employee exists, the shift exists, and that the employee is not already
 * assigned to the same shift (composite key: employeeId + shiftId).
 * @param {string} empID The employee ID (e.g., E001).
 * @param {string} shiftID The shift ID (e.g., S001).
 * @returns {Promise<void>} Resolves after printing the result and saving if successful.
 */

async function assignShift(empID,shiftID){
   
    let allEmployees = await loadEmployeeData()
   
    let allShifts = await loadShiftData()
   
    let allAssignments = await loadAssignmentData()

    let foundemp = false
    let foundshift = false

    for(let emp of allEmployees){
        if (emp.employeeId === empID) {
            foundemp = true
        }   
    }
    if (!foundemp) {
        console.log("Employee does not exist")
        return
    }
    for(let shift of allShifts){
        if (shift.shiftId === shiftID) {
            foundshift = true
        }   
    }
    if (!foundshift) {
        console.log("Shift does not exist")
        return
    }

    for (let a of allAssignments) {
        if (a.employeeId === empID && a.shiftId === shiftID) {
            console.log("Employee already assigned to shift")
            return

        }
    }

    allAssignments.push({
        employeeId: empID,
        shiftId: shiftID
    })

    await saveAssignmentData(allAssignments)
    console.log("Shift Recorded")

}

/**
 * Prints the schedule for a specific employee in CSV format (for copy/paste).
 * If the employee has no shifts (or does not exist), only the header is printed.
 * @param {string} empID The employee ID to view (e.g., E003).
 * @returns {Promise<void>} Resolves after printing the schedule output.
 */

async function viewEmployeeSchedule(empID){
     let allShifts = await loadShiftData()
     let allAssignments = await loadAssignmentData()
    console.log("date,startTime,endTime")
     for (let a of allAssignments) {
        if (a.employeeId === empID) {
            let shift = a.shiftId
            for(let s of allShifts){
                if (s.shiftId === shift) {
                    console.log(`${s.date},${s.startTime},${s.endTime}`)
                }
            }
        }
    }

}

/**
 * Main application loop.
 * Displays the menu, processes user input, and routes to the appropriate feature
 * until the user chooses to exit.
 * @returns {Promise<void>} Resolves when the application terminates.
 */

async function main(){
    while (true) {
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let selection = Number(prompt("What is your choice> "))
        if (selection == 1) {
            await listEmployee()
        }
        else if (selection == 2){
            let name = prompt("Enter Employee name:  ")
            let phoneNumber = prompt("Enter phone number:  ")
            await addEmployee(name,phoneNumber)
            console.log("Employee added...")
        }
        else if (selection == 3) {
            let empID = (prompt("Enter employee ID: "))
            let shiftID = (prompt("Enter shift  ID: "))
            await assignShift(empID,shiftID)
        }
        else if (selection == 4) {
            let empID = prompt("Enter employee ID: ")
            await viewEmployeeSchedule(empID)
        }
        else if (selection == 5) {
            break 
        }
        else {
            console.log('******** ERROR!!! Pick a number between 1 and 5')
        }
    }

}

main()