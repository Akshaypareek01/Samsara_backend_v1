import httpStatus from 'http-status';
import { verifyToken, generateAuthTokens } from './token.service.js';
import trainerService from './trainer.service.js';
import { sendLoginOTP, verifyLoginOTP } from './otp.service.js';
import { Token } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';
import { Trainer } from '../models/index.js';

/**
 * Send OTP for trainer login
 * @param {string} email
 * @returns {Promise<Object>}
 */
const sendLoginOTPForTrainer = async (email) => {
  const trainer = await trainerService.getTrainerByEmail(email);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found. Please register first.');
  }
  if (!trainer.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been deactivated');
  }

  await sendLoginOTP(email);
  return { message: 'OTP sent successfully to your email' };
};

/**
 * Login trainer with OTP
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Trainer>}
 */
const loginTrainerWithOTP = async (email, otp) => {
  const trainer = await trainerService.getTrainerByEmail(email);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found. Please register first.');
  }
  if (!trainer.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been deactivated');
  }

  const isValidOTP = await verifyLoginOTP(email, otp);
  if (!isValidOTP) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
  }

  return trainer;
};

/**
 * Logout trainer
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const trainer = await trainerService.getTrainerById(refreshTokenDoc.user);
    if (!trainer) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return generateAuthTokens(trainer);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const trainer = await trainerService.getTrainerById(resetPasswordTokenDoc.user);
    if (!trainer) {
      throw new Error();
    }
    await trainerService.updateTrainerById(trainer.id, { password: newPassword });
    await Token.deleteMany({ user: trainer.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

export {
  sendLoginOTPForTrainer,
  loginTrainerWithOTP,
  logout,
  refreshAuth,
  resetPassword,
};
