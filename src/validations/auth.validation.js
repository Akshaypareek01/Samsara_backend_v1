import Joi from 'joi';
import { password } from './custom.validation.js';


const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

// OTP-based registration validation for users (Personal/Corporate)
const sendRegistrationOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required().max(20),
    mobile: Joi.string().optional().min(10),
    role: Joi.string().valid('user', 'teacher').required(),
    // For users: category is required
    userCategory: Joi.when('role', {
      is: 'user',
      then: Joi.string().valid('Personal', 'Corporate').required(),
      otherwise: Joi.forbidden()
    }),
    // For corporate users: corporate_id is required
    corporate_id: Joi.when('userCategory', {
      is: 'Corporate',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    // For teachers: teacher category is required
    teacherCategory: Joi.when('role', {
      is: 'teacher',
      then: Joi.string().valid('Fitness Coach', 'Ayurveda Specialist', 'Mental Health Specialist', 'Yoga Trainer', 'General Trainer').required(),
      otherwise: Joi.forbidden()
    }),
  }),
};

const verifyRegistrationOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string().required().length(4).pattern(/^\d{4}$/),
    name: Joi.string().required().max(20),
    mobile: Joi.string().optional().min(10),
    role: Joi.string().valid('user', 'teacher').required(),
    // For users: category is required
    userCategory: Joi.when('role', {
      is: 'user',
      then: Joi.string().valid('Personal', 'Corporate').required(),
      otherwise: Joi.forbidden()
    }),
    // For corporate users: corporate_id is required
    corporate_id: Joi.when('userCategory', {
      is: 'Corporate',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    }),
    // For teachers: teacher category is required
    teacherCategory: Joi.when('role', {
      is: 'teacher',
      then: Joi.string().valid('Fitness Coach', 'Ayurveda Specialist', 'Mental Health Specialist', 'Yoga Trainer', 'General Trainer').required(),
      otherwise: Joi.forbidden()
    }),
  }),
};

// OTP-based login validation
const sendLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const verifyLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string().required().length(4).pattern(/^\d{4}$/),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export { 
  register, 
  login, 
  sendRegistrationOTP,
  verifyRegistrationOTP,
  sendLoginOTP,
  verifyLoginOTP,
  logout, 
  refreshTokens, 
  forgotPassword, 
  resetPassword, 
  verifyEmail 
};

