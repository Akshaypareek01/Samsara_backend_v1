import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createCompany = {
  body: Joi.object().keys({
    companyName: Joi.string().allow('', null).optional(),
    companyLogo: Joi.string().uri().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    domain: Joi.string().allow('', null).optional(),
    numberOfEmployees: Joi.number().integer().min(0).optional(),
    gstNumber: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    pincode: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    contactPerson1: Joi.object().keys({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
      designation: Joi.string().optional(),
    }).optional(),
    contactPerson2: Joi.object().keys({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
      designation: Joi.string().optional(),
    }).optional(),
    status: Joi.boolean().optional(),
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
};

