# INFS3201 – Web Technologies II
**Due: April 14, 2026 @ 11:59pm**

---

## Assignment 5

### Overview

In this assignment, you will refactor your Assignment 4 scheduling system in the following ways:

- Extend the authentication system to implement typical security features such as 2 factor authentication via email with enhanced security features such as account disabling and with email notifications.
- File uploads for employee profiles.

---

### Allowed Code

The existing restrictions of `.filter()`, `.map()`, `.reduce()`, etc. are still present for this assignment. Basically, the array functions that accept callbacks are not permitted. If in doubt just check with your instructor.

---

### GitHub

The use of GitHub remains mandatory for this assignment. Make sure that you have already committed and tagged everything in your repository before starting this exercise.

Commits are required for each major feature created but you are free and encouraged to commit more frequently as a backup. If you have learned how to use features branches in your other courses (i.e. INFS3203 if you are taking it) you are allowed to use those features but in this course, it is not mandatory.

---

### Email

Create a new `emailSystem.js` file. In this file, you will create functions required to handle email. Your implementation can just use `console.log()` to display messages but the interface into your email system should match what would be required if you were to really update to a real email system. The rest of the system should not know that the output is a `console.log()` operation (think of a Java interface; the users of the interface do not know the implementation details).

You may try sending to FakeSMTP server or mailtrap.com but please make sure that the output is just to the console for the submission so that the instructor can test your implementation.

---

### Authentication Enhancements

Implement a 2-factor authentication system with the following features:

- After the user has provided their correct username/password:
  - Generate a 6-digit code and send this to the user by email.
  - Show a 2FA Code Page waiting for the user to enter the code.
  - When the user enters the correct token, the user will be allowed to log in.
  - The session should not start until the 2FA code is entered correctly.
- The 2FA code must have a limited life of **3 minutes** only.
- After **3 invalid login attempts** the user must be sent an email indicating that there is suspicious activity on their account.
- After **10 invalid login attempts**, the account must be locked. There will be no way to unlock the account except through the database for this assignment.

---

### Employee Documents

Add a feature so that the logged in user can upload documents about their employees. Documents could include things like ID card scans, tax information, etc.

**Requirements:**

- PDF documents only are permitted.
- Documents must not be more than **2MB** in size.
- No more than **5 documents** are permitted for any employee.
- The documents must be protected so that non-logged in users cannot access the documents.
- Documents must **not** be available by a public static route.
- Files must be stored in the file system (not the database).

---

### Submission

When submitting the zip file in D2L make sure to include the link to your GitHub repository as a comment in the submission. If you leave the link to your GitHub account or the instructor is not able to view the repository, your grade will be reduced.


## Grading

| Criteria | Exemplary | Satisfactory | Developing | Unsatisfactory |
|---|---|---|---|---| 
| **Program Features and Operation** | **9 pts** – All features implemented and work as expected. User cannot crash the program with inputs. | **7 pts** – Missing minor features or specific inputs can cause crashes. | **5 pts** – Missing major functional features. | **0 pts** – Program cannot run due to a large number of errors. Normal inputs cause failures. |
| **Code Design and Layering** | **4 pts** – Appropriate functions used with good parameters and return types. | **2 pts** – Some functions have issues in terms of parameters and return types. | **1 pt** – Functions were used but design was not appropriate. | **0 pts** – Functions not used or parameters/return values done using global variables. |
| **Documentation and GitHub Repository** | **2 pts** – All functions have JSDoc comments indicating parameter and return types. Excellent formatting. GitHub had multiple commits and a release label. | **1 pt** – Some functions have appropriate comments. JSDoc cannot generate comment blocks. Formatting mostly good. GitHub used but not effectively. | **0 pts** – Only basic comments provided. Many parts require reformatting. | **0 pts** – Limited or no comments. Significant formatting issues. Code not found in GitHub. |