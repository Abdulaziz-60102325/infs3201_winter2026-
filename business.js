const persistence = require('./Persistence.js');


async function getAllEmployees() {
    return await persistence.getEmployeeData();
}

async function getEmployeeById(id) {
    return await persistence.getEmployeeById(id);
}

async function createNewEmployee(name, phoneNumber) {
    return await persistence.addNewEmployee(name, phoneNumber);
}

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

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createNewEmployee,
    getShiftsForEmployee
};
