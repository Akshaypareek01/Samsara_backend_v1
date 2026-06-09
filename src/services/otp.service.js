import httpStatus from 'http-status';
import { OTP } from '../models/index.js';
import { sendEmail } from './email.service.js';
import { buildOtpEmailContent } from '../utils/emailTemplates.js';
import ApiError from '../utils/ApiError.js';

/**
 * Generate a 4-digit OTP
 * @param {string} email - Email address (for test purposes)
 * @returns {string}
 */
const generateOTP = (email) => {
  // Always return "1234" for test email
  if (email === 'test@gmail.com') {
    return '1234';
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Create OTP for email verification
 * @param {string} email
 * @param {string} type - 'registration' or 'login'
 * @returns {Promise<Object>}
 */
const createOTP = async (email, type) => {
  // Delete any existing OTP for this email and type
  await OTP.deleteMany({ email, type });

  const otp = generateOTP(email);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const otpDoc = await OTP.create({
    email,
    otp,
    type,
    expiresAt,
  });

  return otpDoc;
};

/**
 * Send OTP via email with branded HTML template.
 * @param {string} email
 * @param {string} otp
 * @param {string} type
 * @param {Object} [options]
 * @param {'company'|'trainer'|'user'} [options.portal] - Portal context for CTA copy.
 * @returns {Promise}
 */
const sendOTPEmail = async (email, otp, type, options = {}) => {
  const { subject, text, html } = buildOtpEmailContent({
    otp,
    type,
    portal: options.portal || 'company',
  });

  await sendEmail(email, subject, text, html);
};

/**
 * Verify OTP
 * @param {string} email
 * @param {string} otp
 * @param {string} type
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (email, otp, type) => {
  const otpDoc = await OTP.findOne({
    email,
    otp,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    return false;
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  return true;
};

/**
 * Send OTP for registration
 * @param {string} email
 * @param {Object} [options]
 * @param {'company'|'trainer'|'user'} [options.portal]
 * @returns {Promise}
 */
const sendRegistrationOTP = async (email, options = {}) => {
  const otpDoc = await createOTP(email, 'registration');
  await sendOTPEmail(email, otpDoc.otp, 'registration', options);
};

/**
 * Send OTP for login
 * @param {string} email
 * @param {Object} [options]
 * @param {'company'|'trainer'|'user'} [options.portal]
 * @returns {Promise}
 */
const sendLoginOTP = async (email, options = {}) => {
  const otpDoc = await createOTP(email, 'login');
  await sendOTPEmail(email, otpDoc.otp, 'login', options);
};

/**
 * Verify registration OTP
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const verifyRegistrationOTP = async (email, otp) => {
  return await verifyOTP(email, otp, 'registration');
};

/**
 * Verify login OTP
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const verifyLoginOTP = async (email, otp) => {
  return await verifyOTP(email, otp, 'login');
};

export {
  generateOTP,
  createOTP,
  sendOTPEmail,
  verifyOTP,
  sendRegistrationOTP,
  sendLoginOTP,
  verifyRegistrationOTP,
  verifyLoginOTP,
};
