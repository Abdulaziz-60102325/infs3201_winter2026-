'use strict';

/**
 * Base function to simulate sending an email via console.log.
 * This interface matches what a real email system would require.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} body - Email body text
 * @returns {void}
 */
function sendEmail(to, subject, body) {
    console.log("\n========== EMAIL SENT ==========");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log("================================\n");
}

/**
 * Send a 2FA verification code to the user's email
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {void}
 */
function send2FACode(email, code) {
    sendEmail(
        email,
        "Your Login Verification Code",
        `Your 2FA verification code is: ${code}\nThis code expires in 3 minutes.\nDo not share this code with anyone.`
    );
}

/**
 * Send a suspicious activity alert after 3 failed login attempts
 * @param {string} email - Recipient email address
 * @returns {void}
 */
function sendSuspiciousActivityAlert(email) {
    sendEmail(
        email,
        "Security Alert: Suspicious Login Activity Detected",
        "We detected multiple failed login attempts on your account.\nIf this was not you, please contact your administrator immediately."
    );
}

/**
 * Send an account locked notification after 10 failed login attempts
 * @param {string} email - Recipient email address
 * @returns {void}
 */
function sendAccountLockedNotification(email) {
    sendEmail(
        email,
        "Account Locked",
        "Your account has been locked due to too many failed login attempts.\nPlease contact your administrator to restore access."
    );
}

module.exports = {
    sendEmail,
    send2FACode,
    sendSuspiciousActivityAlert,
    sendAccountLockedNotification
};
