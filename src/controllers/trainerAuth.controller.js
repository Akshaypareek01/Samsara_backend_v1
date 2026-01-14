import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import trainerService from '../services/trainer.service.js';
import { Trainer } from '../models/index.js';
import { generateTrainerAuthTokens } from '../services/token.service.js';
import {
  sendLoginOTPForTrainer,
  loginTrainerWithOTP,
  logout as logoutService,
  refreshAuth,
  resetPassword as resetPasswordService,
} from '../services/trainerAuth.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Register a new trainer
 */
const register = catchAsync(async (req, res) => {
  const { email, mobile } = req.body;

  // Check if email is already taken
  if (await Trainer.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Check if mobile is already taken
  if (await Trainer.isMobileTaken(mobile)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
  }

  const trainer = await trainerService.createTrainer(req.body);
  const tokens = await generateTrainerAuthTokens(trainer);
  res.status(httpStatus.CREATED).send({ trainer, tokens });
});

/**
 * Send login OTP
 */
const sendLoginOTPController = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await sendLoginOTPForTrainer(email);
  res.send(result);
});

/**
 * Login trainer with OTP
 */
const login = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const trainer = await loginTrainerWithOTP(email, otp);
  const tokens = await generateTrainerAuthTokens(trainer);
  res.send({ trainer, tokens });
});

/**
 * Logout trainer
 */
const logout = catchAsync(async (req, res) => {
  await logoutService(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Refresh tokens
 */
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res) => {
  await resetPasswordService(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get current trainer profile
 */
const getMe = catchAsync(async (req, res) => {
  const trainer = await trainerService.getTrainerById(req.user.id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  res.send(trainer);
});

/**
 * Update current trainer profile
 */
const updateMe = catchAsync(async (req, res) => {
  const updateBody = req.body;
  const trainerId = req.user.id;

  // Don't allow updating email or mobile through this endpoint
  delete updateBody.email;
  delete updateBody.mobile;

  const trainer = await trainerService.updateTrainerById(trainerId, updateBody);
  res.send(trainer);
});

export {
  register,
  sendLoginOTPController,
  login,
  logout,
  refreshTokens,
  resetPassword,
  getMe,
  updateMe,
};
