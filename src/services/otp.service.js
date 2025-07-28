import { OTP } from '../models/index.js';
import { sendEmail } from './email.service.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

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
    expiresAt
  });
  
  return otpDoc;
};

/**
 * Send OTP via email
 * @param {string} email
 * @param {string} otp
 * @param {string} type
 * @returns {Promise}
 */
const sendOTPEmail = async (email, otp, type) => {
  const subject = type === 'registration' ? 'Email Verification OTP' : 'Login OTP';
  const text = `Your ${type === 'registration' ? 'verification' : 'login'} OTP is: ${otp}
  
This OTP will expire in 10 minutes.
If you didn't request this, please ignore this email.`;
  
  await sendEmail(email, subject, text);
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
    expiresAt: { $gt: new Date() }
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
 * @returns {Promise}
 */
const sendRegistrationOTP = async (email) => {
  const otpDoc = await createOTP(email, 'registration');
  await sendOTPEmail(email, otpDoc.otp, 'registration');
};

/**
 * Send OTP for login
 * @param {string} email
 * @returns {Promise}
 */
const sendLoginOTP = async (email) => {
  const otpDoc = await createOTP(email, 'login');
  await sendOTPEmail(email, otpDoc.otp, 'login');
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
  verifyLoginOTP
}; 