import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { createUser, getUserByEmail } from '../services/user.service.js';
import { generateAuthTokens, generateResetPasswordToken, generateVerifyEmailToken } from '../services/token.service.js';
import {
  loginUserWithEmailAndPassword,
  sendLoginOTPForUser,
  loginUserWithOTP,
  logout as logout2,
  refreshAuth,
  resetPassword as resetPassword2,
  verifyEmail as verifyEmail2,
} from '../services/auth.service.js';
import { sendResetPasswordEmail, sendVerificationEmail as sendVerificationEmail2 } from '../services/email.service.js';
import { sendRegistrationOTP, verifyRegistrationOTP } from '../services/otp.service.js';
import ApiError from '../utils/ApiError.js';
// import { authService, userService, tokenService, emailService } from '../services/index.js';
// import { authService, userService, tokenService, emailService } from '../services';

const register = catchAsync(async (req, res) => {
  const user = await createUser(req.body);
  const tokens = await generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await loginUserWithEmailAndPassword(email, password);
  const tokens = await generateAuthTokens(user);
  res.send({ user, tokens });
});

// OTP-based registration flow
const sendRegistrationOTPController = catchAsync(async (req, res) => {
  const { email, name, mobile, role, userCategory, corporate_id, teacherCategory } = req.body;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'User already exists with this email');
  }

  // Validate role-specific requirements
  if (role === 'user') {
    if (!userCategory) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User category is required for user registration');
    }
    if (userCategory === 'Corporate' && !corporate_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Corporate ID is required for corporate users');
    }
  } else if (role === 'teacher') {
    if (!teacherCategory) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher category is required for teacher registration');
    }
  }

  await sendRegistrationOTP(email);
  res.status(httpStatus.OK).send({
    message: 'OTP sent successfully to your email',
    email,
    role,
    userCategory: role === 'user' ? userCategory : undefined,
    teacherCategory: role === 'teacher' ? teacherCategory : undefined,
  });
});

const verifyRegistrationOTPController = catchAsync(async (req, res) => {
  const { email, otp, name, mobile, role, userCategory, corporate_id, teacherCategory } = req.body;

  const isValidOTP = await verifyRegistrationOTP(email, otp);
  if (!isValidOTP) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
  }

  // Create user with role-specific details
  const userData = {
    email,
    name: name || 'Demo User', // Use 'Demo User' as default if name is null/undefined
    role,
    active: true, // Mark as active since email is verified
  };

  // Add mobile if provided
  if (mobile) {
    userData.mobile = mobile;
  }

  // Add role-specific fields
  if (role === 'user') {
    userData.userCategory = userCategory;
    if (userCategory === 'Corporate') {
      userData.corporate_id = corporate_id;
    }
  } else if (role === 'teacher') {
    userData.teacherCategory = teacherCategory;
  }

  const user = await createUser(userData);
  const tokens = await generateAuthTokens(user);

  res.status(httpStatus.CREATED).send({
    user,
    tokens,
    message: 'Registration successful',
  });
});

// OTP-based login flow
const sendLoginOTPController = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await sendLoginOTPForUser(email);
  res.status(httpStatus.OK).send(result);
});

const verifyLoginOTPController = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await loginUserWithOTP(email, otp);
  const tokens = await generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await logout2(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await generateResetPasswordToken(req.body.email);
  await sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await resetPassword2(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await generateVerifyEmailToken(req.user);
  await sendVerificationEmail2(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await verifyEmail2(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

export {
  register,
  login,
  sendRegistrationOTPController,
  verifyRegistrationOTPController,
  sendLoginOTPController,
  verifyLoginOTPController,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
