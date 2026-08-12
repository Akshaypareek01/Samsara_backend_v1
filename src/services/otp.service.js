import crypto from 'crypto';
import httpStatus from 'http-status';
import { OTP } from '../models/index.js';
import { sendEmail } from './email.service.js';
import { buildOtpEmailContent, COMPANY_SUPPORT_EMAIL } from '../utils/emailTemplates.js';
import ApiError from '../utils/ApiError.js';

/** Failed attempts allowed against a single OTP before it is burned. */
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a 4-digit OTP using a cryptographically secure RNG.
 * @returns {string}
 */
const generateOTP = () => {
  return String(crypto.randomInt(1000, 10000));
};

/**
 * Create OTP for email verification
 * @param {string} email
 * @param {string} type - 'registration' or 'login'
 * @returns {Promise<Object>}
 */
const createOTP = async (email, type) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  // Delete any existing OTP for this email and type
  await OTP.deleteMany({ email: normalizedEmail, type });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const otpDoc = await OTP.create({
    email: normalizedEmail,
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
  const portal = options.portal || 'company';
  const { subject, text, html } = buildOtpEmailContent({
    otp,
    type,
    portal,
  });

  await sendEmail(email, subject, text, html, {
    replyTo: portal === 'company' ? COMPANY_SUPPORT_EMAIL : undefined,
  });
};

/**
 * Verify OTP
 * @param {string} email
 * @param {string} otp
 * @param {string} type
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (email, otp, type) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  // Atomically claim the OTP. Matching on isUsed:false in the same operation
  // means two concurrent requests can never both succeed with one code.
  const claimed = await OTP.findOneAndUpdate(
    {
      email: normalizedEmail,
      otp,
      type,
      isUsed: false,
      attempts: { $lt: MAX_OTP_ATTEMPTS },
      expiresAt: { $gt: new Date() },
    },
    { $set: { isUsed: true } },
    { new: true }
  );

  if (claimed) {
    return true;
  }

  // Wrong or already-burned code: count the attempt against the live OTP for
  // this email so guessing is bounded rather than free.
  await OTP.updateOne(
    { email: normalizedEmail, type, isUsed: false, expiresAt: { $gt: new Date() } },
    { $inc: { attempts: 1 } }
  );

  return false;
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
  MAX_OTP_ATTEMPTS,
  generateOTP,
  createOTP,
  sendOTPEmail,
  verifyOTP,
  sendRegistrationOTP,
  sendLoginOTP,
  verifyRegistrationOTP,
  verifyLoginOTP,
};
