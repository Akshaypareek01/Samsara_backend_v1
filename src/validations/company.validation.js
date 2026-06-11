import Joi from 'joi';
import { objectId } from './custom.validation.js';
import { TRAINER_CITY_ENUM } from '../constants/trainerProfileEnums.js';

const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PERSON_NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const COMPANY_COUNTRY_ENUM = ['India'];

const personNameSchema = (label) =>
  Joi.string()
    .required()
    .trim()
    .pattern(PERSON_NAME_REGEX)
    .messages({
      'any.required': `${label} is required`,
      'string.empty': `${label} is required`,
      'string.pattern.base': `${label} must contain only letters, spaces, and . ' -`,
    });

/**
 * Normalize a user-entered domain (strip protocol, www, path).
 *
 * @param {string} raw
 * @returns {string}
 */
const normalizeCompanyDomain = (raw) => {
  let value = String(raw || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/^www\./, '');
  value = value.split('/')[0] ?? '';
  return value;
};

const contactPersonSchema = (label) =>
  Joi.object().keys({
    name: personNameSchema(`${label} name`),
    email: Joi.string().required().trim().email().messages({
      'any.required': `${label} email is required`,
      'string.empty': `${label} email is required`,
      'string.email': 'Please enter a valid email address',
    }),
    mobileNumber: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .messages({
        'any.required': `${label} mobile number is required`,
        'string.empty': `${label} mobile number is required`,
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
      }),
    designation: Joi.string().required().trim().messages({
      'any.required': `${label} designation is required`,
      'string.empty': `${label} designation is required`,
    }),
  });

const createCompany = {
  body: Joi.object()
    .keys({
      companyName: personNameSchema('Company name'),
      companyLogo: Joi.string().uri().required().messages({
        'any.required': 'Company logo is required',
        'string.empty': 'Company logo is required',
        'string.uri': 'Company logo must be a valid URL',
      }),
      email: Joi.string().required().trim().email().messages({
        'any.required': 'Company email is required',
        'string.empty': 'Company email is required',
        'string.email': 'Please enter a valid email address',
      }),
      domain: Joi.string()
        .required()
        .trim()
        .custom((value, helpers) => {
          const normalized = normalizeCompanyDomain(value);
          if (!normalized) {
            return helpers.error('any.required');
          }
          if (normalized.includes('@')) {
            return helpers.message('Enter a domain only (e.g. example.com), not an email address');
          }
          if (!DOMAIN_REGEX.test(normalized)) {
            return helpers.message('Please enter a valid domain (e.g. example.com)');
          }
          return normalized;
        })
        .messages({
          'any.required': 'Company domain is required',
          'string.empty': 'Company domain is required',
        }),
      numberOfEmployees: Joi.number().integer().min(1).required().messages({
        'any.required': 'Number of employees is required',
        'number.base': 'Number of employees is required',
        'number.min': 'Enter a valid employee count (minimum 1)',
      }),
      gstNumber: Joi.string()
        .required()
        .trim()
        .uppercase()
        .pattern(GST_REGEX)
        .messages({
          'any.required': 'GST number is required',
          'string.empty': 'GST number is required',
          'string.pattern.base': 'Please enter a valid 15-character GSTIN',
        }),
      panNumber: Joi.string()
        .required()
        .trim()
        .uppercase()
        .pattern(PAN_REGEX)
        .messages({
          'any.required': 'PAN number is required',
          'string.empty': 'PAN number is required',
          'string.pattern.base': 'Please enter a valid 10-character PAN (e.g. ABCDE1234F)',
        }),
      address: Joi.string().required().trim().messages({
        'any.required': 'Address is required',
        'string.empty': 'Address is required',
      }),
      city: Joi.string()
        .required()
        .valid(...TRAINER_CITY_ENUM)
        .messages({
          'any.required': 'City is required',
          'string.empty': 'City is required',
          'any.only': 'Please select a valid city',
        }),
      pincode: Joi.string()
        .required()
        .pattern(/^[0-9]{6}$/)
        .messages({
          'any.required': 'Pincode is required',
          'string.empty': 'Pincode is required',
          'string.pattern.base': 'Pincode must be exactly 6 digits',
        }),
      country: Joi.string()
        .required()
        .valid(...COMPANY_COUNTRY_ENUM)
        .messages({
          'any.required': 'Country is required',
          'string.empty': 'Country is required',
          'any.only': 'Please select a valid country',
        }),
      contactPerson1: contactPersonSchema('Primary contact').required().messages({
        'any.required': 'Primary contact person is required',
      }),
      contactPerson2: contactPersonSchema('Secondary contact').required().messages({
        'any.required': 'Secondary contact person is required',
      }),
      status: Joi.boolean().optional(),
    })
    .custom((value, helpers) => {
      const emailDomain = String(value.email || '')
        .split('@')[1]
        ?.toLowerCase();
      const companyDomain = normalizeCompanyDomain(value.domain);
      if (emailDomain && companyDomain && emailDomain !== companyDomain) {
        return helpers.message(`Company email must use your domain (@${companyDomain})`);
      }
      return value;
    }),
};

const getCompanies = {
  query: Joi.object().keys({
    companyName: Joi.string(),
    email: Joi.string().email(),
    domain: Joi.string(),
    status: Joi.boolean(),
    companyId: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const getCompany = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const getCompanyByCompanyId = {
  params: Joi.object().keys({
    companyId: Joi.string().required(),
  }),
};

const checkCompanyExists = {
  params: Joi.object().keys({
    companyId: Joi.string().required(),
  }),
};

const updateCompany = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      companyName: Joi.string().allow('', null).optional(),
      companyLogo: Joi.string().uri().allow('', null).optional(),
      email: Joi.string().email().allow('', null).optional(),
      domain: Joi.string().allow('', null).optional(),
      numberOfEmployees: Joi.number().integer().min(0).optional(),
      gstNumber: Joi.string().allow('', null).optional(),
      panNumber: Joi.string().trim().uppercase().pattern(PAN_REGEX).allow('', null).optional(),
      address: Joi.string().allow('', null).optional(),
      city: Joi.string().allow('', null).optional(),
      pincode: Joi.string().allow('', null).optional(),
      country: Joi.string().allow('', null).optional(),
      contactPerson1: Joi.object().keys({
        name: Joi.string().allow('', null).optional(),
        email: Joi.string().email().allow('', null).optional(),
        mobileNumber: Joi.string().allow('', null).optional(),
        designation: Joi.string().allow('', null).optional(),
      }).optional(),
      contactPerson2: Joi.object().keys({
        name: Joi.string().allow('', null).optional(),
        email: Joi.string().email().allow('', null).optional(),
        mobileNumber: Joi.string().allow('', null).optional(),
        designation: Joi.string().allow('', null).optional(),
      }).optional(),
      status: Joi.boolean().optional(),
    })
    .min(1),
};

const deleteCompany = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const sendLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const verifyLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string()
      .required()
      .length(4)
      .pattern(/^\d{4}$/),
  }),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      companyName: Joi.string().allow('', null).optional(),
      companyLogo: Joi.string().uri().allow('', null).optional(),
      email: Joi.string().email().allow('', null).optional(),
      domain: Joi.string().allow('', null).optional(),
      numberOfEmployees: Joi.number().integer().min(0).optional(),
      gstNumber: Joi.string().allow('', null).optional(),
      panNumber: Joi.string().trim().uppercase().pattern(PAN_REGEX).allow('', null).optional(),
      address: Joi.string().allow('', null).optional(),
      city: Joi.string().allow('', null).optional(),
      pincode: Joi.string().allow('', null).optional(),
      country: Joi.string().allow('', null).optional(),
      contactPerson1: Joi.object().keys({
        name: Joi.string().allow('', null).optional(),
        email: Joi.string().email().allow('', null).optional(),
        mobileNumber: Joi.string().allow('', null).optional(),
        designation: Joi.string().allow('', null).optional(),
      }).optional(),
      contactPerson2: Joi.object().keys({
        name: Joi.string().allow('', null).optional(),
        email: Joi.string().email().allow('', null).optional(),
        mobileNumber: Joi.string().allow('', null).optional(),
        designation: Joi.string().allow('', null).optional(),
      }).optional(),
      // Note: status cannot be updated by company itself
    })
    .min(1),
};

const portalLevelValues = ['beginner', 'intermediate', 'advanced'];

const createPortalEmployee = {
  body: Joi.object().keys({
    fullName: Joi.string().required().trim(),
    email: Joi.string().required().email().trim().lowercase(),
    level: Joi.string().valid(...portalLevelValues).required(),
    status: Joi.boolean().optional(),
    department: Joi.string().trim().allow('').optional(),
  }),
};

const listPortalEmployees = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    search: Joi.string().trim().allow(''),
    status: Joi.string().trim().allow(''),
    department: Joi.string().trim().allow(''),
  }),
};

const portalEmployeeId = {
  params: Joi.object().keys({
    employeeId: Joi.string().custom(objectId).required(),
  }),
};

const updatePortalEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      fullName: Joi.string().trim(),
      email: Joi.string().email().trim().lowercase(),
      level: Joi.string().valid(...portalLevelValues),
      status: Joi.boolean(),
      department: Joi.string().trim().allow(''),
    })
    .min(1),
};

const deletePortalEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().custom(objectId).required(),
  }),
};

const listPortalDeletionHistory = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

const exportCompanyReports = {
  query: Joi.object().keys({
    type: Joi.string().valid('bookings', 'employees').required(),
  }),
};

const getDashboardOverview = {
  query: Joi.object().keys({
    period: Joi.string().valid('Weekly', 'Monthly', 'Quarterly', 'Yearly').optional(),
  }),
};

export {
  createCompany,
  getCompanies,
  getCompany,
  getCompanyByCompanyId,
  checkCompanyExists,
  updateCompany,
  deleteCompany,
  sendLoginOTP,
  verifyLoginOTP,
  updateProfile,
  createPortalEmployee,
  listPortalEmployees,
  portalEmployeeId,
  updatePortalEmployee,
  deletePortalEmployee,
  listPortalDeletionHistory,
  exportCompanyReports,
  getDashboardOverview,
};

