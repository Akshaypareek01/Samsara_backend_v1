import Joi from 'joi';
import { objectId } from './custom.validation.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_EXPERIENCE_ENUM,
  TRAINER_SPECIALIST_IN_ALL,
  TRAINER_SPECIALIST_IN_CURRENT,
  TRAINER_TYPE_OF_TRAINING_ALL,
  TRAINER_TYPE_OF_TRAINING_CURRENT,
  TRAINER_CITY_ENUM,
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
  city: Joi.string()
    .trim()
    .valid(...TRAINER_CITY_ENUM)
    .allow('', null),
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

const registrationProfileDetailKeys = {
  dateOfBirth: Joi.date().required().max('now').messages({
    'any.required': 'Date of birth is required',
    'date.base': 'Please enter a valid date of birth',
    'date.max': 'Date of birth cannot be in the future',
  }),
  city: Joi.string()
    .trim()
    .valid(...TRAINER_CITY_ENUM)
    .required()
    .messages({
      'any.required': 'City is required',
      'string.empty': 'City is required',
      'any.only': 'Please select a valid city',
    }),
  pinCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'any.required': 'PIN code is required',
      'string.empty': 'PIN code is required',
      'string.pattern.base': 'PIN code must be exactly 6 digits',
    }),
  experience: Joi.string()
    .valid(...experienceEnum)
    .required()
    .messages({
      'any.required': 'Years of experience is required',
      'any.only': 'Please select a valid experience range',
      'string.empty': 'Years of experience is required',
    }),
  education: educationListSchema,
  certification: certificationListSchema,
};

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().trim().email().messages({
      'any.required': 'Email is required',
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    mobile: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .messages({
        'any.required': 'Mobile number is required',
        'string.empty': 'Mobile number is required',
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
      }),
    name: Joi.string().required().trim().messages({
      'any.required': 'Full name is required',
      'string.empty': 'Full name is required',
    }),
    title: Joi.string().required().trim().messages({
      'any.required': 'Professional title is required',
      'string.empty': 'Professional title is required',
    }),
    bio: Joi.string().required().max(2000).trim().messages({
      'any.required': 'Bio is required',
      'string.empty': 'Bio is required',
      'string.max': 'Bio must be 2000 characters or less',
    }),
    category: Joi.string()
      .valid(...categoryEnum)
      .required()
      .messages({
        'any.only': `Category must be one of: ${categoryEnum.join(', ')}`,
        'any.required': 'Trainer category is required',
        'string.empty': 'Trainer category is required',
      }),
    specialistIn: Joi.array()
      .items(Joi.string().valid(...specialistInEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'Select at least one Training For option',
        'any.required': 'Training For is required',
      }),
    typeOfTraining: Joi.array()
      .items(Joi.string().valid(...typeOfTrainingEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'Select at least one specialization',
        'any.required': 'Specializations are required',
      }),
    ...registrationProfileDetailKeys,
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
