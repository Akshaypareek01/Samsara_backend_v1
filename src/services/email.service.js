import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../config/logger.js';
import { buildActionEmailContent } from '../utils/emailTemplates.js';

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
 * @param {string} [html] - Optional HTML content
 * @param {Object} [options] - Optional nodemailer extras
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html = null, options = {}) => {
  const msg = {
    from: config.email.from,
    to,
    subject,
    text,
    ...(html && { html }),
    ...(options.replyTo && { replyTo: options.replyTo }),
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
  const { subject, text, html } = buildActionEmailContent({
    action: 'reset-password',
    token,
  });
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const { subject, text, html } = buildActionEmailContent({
    action: 'verify-email',
    token,
  });
  await sendEmail(to, subject, text, html);
};

export { primaryTransport as transport, fallbackTransport, sendEmail, sendResetPasswordEmail, sendVerificationEmail };
