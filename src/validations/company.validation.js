import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createCompany = {
  body: Joi.object().keys({
    companyName: Joi.string().optional(),
    companyLogo: Joi.string().uri().allow('').optional(),
    email: Joi.string().email().optional(),
    domain: Joi.string().optional(),
    numberOfEmployees: Joi.number().integer().min(0).optional(),
    gstNumber: Joi.string().optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    pincode: Joi.string().optional(),
    country: Joi.string().optional(),
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
      companyName: Joi.string().optional(),
      companyLogo: Joi.string().uri().allow('').optional(),
      email: Joi.string().email().optional(),
      domain: Joi.string().optional(),
      numberOfEmployees: Joi.number().integer().min(0).optional(),
      gstNumber: Joi.string().optional(),
      address: Joi.string().optional(),
      city: Joi.string().optional(),
      pincode: Joi.string().optional(),
      country: Joi.string().optional(),
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
};

