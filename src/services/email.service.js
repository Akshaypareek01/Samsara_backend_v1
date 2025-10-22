import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../config/logger.js';

// Create primary transporter (AWS SES)
const primaryTransport = nodemailer.createTransport(config.email.smtp);

// Create fallback transporter (legacy SMTP) if available
let fallbackTransport = null;
if (config.email.fallbackSmtp) {
  fallbackTransport = nodemailer.createTransport(config.email.fallbackSmtp);
}

// Verify connections on startup
/* istanbul ignore next */
if (config.env !== 'test') {
  // Verify primary connection
  primaryTransport
    .verify()
    .then(() => {
      logger.info(`Connected to primary email server: ${config.email.smtp.host}:${config.email.smtp.port}`);
      logger.info(`Using AWS SES: ${config.email.smtp.host?.includes('amazonaws.com') ? 'Yes' : 'No'}`);
    })
    .catch((error) => {
      logger.error('Unable to connect to primary email server:', error.message);
      logger.warn('Make sure you have configured the SMTP options in .env');
    });

  // Verify fallback connection if available
  if (fallbackTransport) {
    fallbackTransport
      .verify()
      .then(() => {
        logger.info(`Connected to fallback email server: ${config.email.fallbackSmtp.host}:${config.email.fallbackSmtp.port}`);
      })
      .catch((error) => {
        logger.warn('Fallback email server not available:', error.message);
      });
  }
}

/**
 * Send an email with fallback support
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html - Optional HTML content
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html = null) => {
  const msg = { 
    from: config.email.from, 
    to, 
    subject, 
    text,
    ...(html && { html })
  };
  
  logger.info(`Sending email to: ${to}, subject: ${subject}`);
  
  try {
    // Try primary transport (AWS SES) first
    const result = await primaryTransport.sendMail(msg);
    logger.info(`Email sent successfully via primary server. Message ID: ${result.messageId}`);
    return result;
  } catch (primaryError) {
    logger.warn(`Primary email server failed: ${primaryError.message}`);
    
    // Try fallback transport if available
    if (fallbackTransport) {
      try {
        logger.info('Attempting to send via fallback email server...');
        const result = await fallbackTransport.sendMail(msg);
        logger.info(`Email sent successfully via fallback server. Message ID: ${result.messageId}`);
        return result;
      } catch (fallbackError) {
        logger.error(`Both primary and fallback email servers failed`);
        logger.error(`Primary error: ${primaryError.message}`);
        logger.error(`Fallback error: ${fallbackError.message}`);
        throw new Error(`Email sending failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    } else {
      logger.error(`No fallback email server configured. Primary error: ${primaryError.message}`);
      throw primaryError;
    }
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

export { primaryTransport as transport, fallbackTransport, sendEmail, sendResetPasswordEmail, sendVerificationEmail };
