import Joi from 'joi';
import { objectId } from './custom.validation.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_CITY_ENUM,
  TRAINER_LEAD_EXPERIENCE_ENUM,
} from '../constants/trainerProfileEnums.js';

const PERSON_NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const URL_REGEX = /^https?:\/\/.+/i;

const createTrainerLead = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().pattern(PERSON_NAME_REGEX).messages({
      'any.required': 'Name is required',
      'string.empty': 'Name is required',
      'string.pattern.base': "Name must contain only letters, spaces, and . ' -",
    }),
    mobile: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .messages({
        'any.required': 'Mobile number is required',
        'string.empty': 'Mobile number is required',
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
      }),
    email: Joi.string().required().trim().email().messages({
      'any.required': 'Email is required',
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    specialization: Joi.string()
      .required()
      .valid(...TRAINER_CATEGORY_ENUM)
      .messages({
        'any.required': 'Specialization is required',
        'any.only': 'Please select a valid specialization',
      }),
    city: Joi.string()
      .required()
      .valid(...TRAINER_CITY_ENUM)
      .messages({
        'any.required': 'City is required',
        'any.only': 'Please select a valid city',
      }),
    pinCode: Joi.string()
      .required()
      .pattern(/^[0-9]{6}$/)
      .messages({
        'any.required': 'PIN code is required',
        'string.empty': 'PIN code is required',
        'string.pattern.base': 'PIN code must be exactly 6 digits',
      }),
    experience: Joi.string()
      .required()
      .valid(...TRAINER_LEAD_EXPERIENCE_ENUM)
      .messages({
        'any.required': 'Years of experience is required',
        'any.only': 'Please select a valid experience range',
      }),
    linkedin: Joi.string().trim().pattern(URL_REGEX).allow('', null).messages({
      'string.pattern.base': 'LinkedIn link must be a valid URL',
    }),
    instagram: Joi.string().trim().pattern(URL_REGEX).allow('', null).messages({
      'string.pattern.base': 'Instagram link must be a valid URL',
    }),
  }),
};

const getTrainerLeads = {
  query: Joi.object().keys({
    name: Joi.string(),
    city: Joi.string().valid(...TRAINER_CITY_ENUM),
    specialization: Joi.string().valid(...TRAINER_CATEGORY_ENUM),
    experience: Joi.string().valid(...TRAINER_LEAD_EXPERIENCE_ENUM),
    status: Joi.string().valid('New', 'Contacted', 'Converted', 'Rejected'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const exportTrainerLeads = {
  query: Joi.object().keys({
    name: Joi.string(),
    city: Joi.string().valid(...TRAINER_CITY_ENUM),
    specialization: Joi.string().valid(...TRAINER_CATEGORY_ENUM),
    experience: Joi.string().valid(...TRAINER_LEAD_EXPERIENCE_ENUM),
    status: Joi.string().valid('New', 'Contacted', 'Converted', 'Rejected'),
  }),
};

const updateTrainerLead = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('New', 'Contacted', 'Converted', 'Rejected'),
    })
    .min(1),
};

const deleteTrainerLead = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

export { createTrainerLead, getTrainerLeads, exportTrainerLeads, updateTrainerLead, deleteTrainerLead };
