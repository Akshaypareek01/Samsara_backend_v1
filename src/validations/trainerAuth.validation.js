import Joi from 'joi';
import { objectId } from './custom.validation.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_EXPERIENCE_ENUM,
  TRAINER_SPECIALIST_IN_ALL,
  TRAINER_SPECIALIST_IN_CURRENT,
  TRAINER_TYPE_OF_TRAINING_ALL,
  TRAINER_TYPE_OF_TRAINING_CURRENT,
} from '../constants/trainerProfileEnums.js';
import {
  MAX_TRAINER_CERTIFICATION_ENTRIES,
  MAX_TRAINER_EDUCATION_ENTRIES,
  normalizeQualificationListForValidation,
} from '../utils/trainerQualificationUtils.js';

const categoryEnum = TRAINER_CATEGORY_ENUM;
const specialistInEnum = TRAINER_SPECIALIST_IN_CURRENT;
const specialistInUpdateEnum = TRAINER_SPECIALIST_IN_ALL;
const typeOfTrainingEnum = TRAINER_TYPE_OF_TRAINING_CURRENT;
const typeOfTrainingUpdateEnum = TRAINER_TYPE_OF_TRAINING_ALL;
const experienceEnum = TRAINER_EXPERIENCE_ENUM;

const educationSchema = Joi.object().keys({
  qualification: Joi.string().trim().allow('', null),
  university: Joi.string().trim().allow('', null),
  yearOfCompletion: Joi.number().integer().min(1900).max(2100).allow(null),
  _id: Joi.any().strip(),
});

const certificationSchema = Joi.object().keys({
  name: Joi.string().trim().allow('', null),
  institute: Joi.string().trim().allow('', null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  _id: Joi.any().strip(),
});

const educationListSchema = Joi.alternatives()
  .try(
    Joi.array().items(educationSchema).max(MAX_TRAINER_EDUCATION_ENTRIES),
    educationSchema
  )
  .custom((value) =>
    normalizeQualificationListForValidation(
      value,
      ['qualification', 'university', 'yearOfCompletion'],
      MAX_TRAINER_EDUCATION_ENTRIES
    )
  );

const certificationListSchema = Joi.alternatives()
  .try(
    Joi.array().items(certificationSchema).max(MAX_TRAINER_CERTIFICATION_ENTRIES),
    certificationSchema
  )
  .custom((value) =>
    normalizeQualificationListForValidation(
      value,
      ['name', 'institute', 'year'],
      MAX_TRAINER_CERTIFICATION_ENTRIES
    )
  );

// Personal/profile detail keys shared by register and updateProfile payloads
const profileDetailKeys = {
  dateOfBirth: Joi.date().allow(null),
  city: Joi.string().trim().allow('', null),
  pinCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow('', null)
    .messages({ 'string.pattern.base': 'PIN code must be 6 digits' }),
  experience: Joi.string()
    .valid(...experienceEnum)
    .allow('', null),
  education: educationListSchema,
  certification: certificationListSchema,
};

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    mobile: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .message('Mobile number must be exactly 10 digits'),
    name: Joi.string().required().trim(),
    title: Joi.string().required().trim(),
    bio: Joi.string().required().max(2000).trim(),
    category: Joi.string()
      .valid(...categoryEnum)
      .required()
      .messages({
        'any.required': 'Trainer category is required',
      }),
    specialistIn: Joi.array()
      .items(Joi.string().valid(...specialistInEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one specialty is required',
        'any.required': 'Specialist field is required',
      }),
    typeOfTraining: Joi.array()
      .items(Joi.string().valid(...typeOfTrainingEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one type of training is required',
        'any.required': 'Type of training is required',
      }),
    ...profileDetailKeys,
    images: Joi.array()
      .items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      )
      .optional(),
    profilePhoto: Joi.object()
      .keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      })
      .optional(),
    status: Joi.boolean().optional(),
  }),
};

const sendLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string().required().length(4).pattern(/^[0-9]{4}$/).message('OTP must be a 4-digit number'),
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

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    // Password reset can be removed or kept for future use
  }),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      title: Joi.string().trim(),
      bio: Joi.string().max(2000).trim(),
      category: Joi.string().valid(...categoryEnum),
      specialistIn: Joi.array()
        .items(Joi.string().valid(...specialistInUpdateEnum))
        .min(1),
      typeOfTraining: Joi.array()
        .items(Joi.string().valid(...typeOfTrainingUpdateEnum))
        .min(1),
      ...profileDetailKeys,
      images: Joi.array().items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      ),
      profilePhoto: Joi.object().keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      }),
      status: Joi.boolean(),
      acceptingBookings: Joi.boolean(),
    })
    .min(1),
};

export { register, sendLoginOTP, login, logout, refreshTokens, resetPassword, updateProfile };
