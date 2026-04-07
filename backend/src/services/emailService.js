const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email using Nodemailer.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body content
 * @returns {Promise<any>}
 */
async function sendEmail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`[Email Service] Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
};
