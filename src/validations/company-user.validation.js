import Joi from 'joi';
import { objectId } from './custom.validation.js';

const levelValues = ['beginner', 'intermediate', 'advanced'];

const createCompanyUser = {
  body: Joi.object().keys({
    companyId: Joi.string().custom(objectId).required(),
    fullName: Joi.string().required().trim(),
    email: Joi.string().required().email().trim().lowercase(),
    level: Joi.string().valid(...levelValues).required(),
    status: Joi.boolean().optional(),
  }),
};

const getCompanyUsers = {
  query: Joi.object().keys({
    companyId: Joi.string().custom(objectId),
    companyKey: Joi.string().trim(),
    level: Joi.string().valid(...levelValues),
    status: Joi.boolean(),
    search: Joi.string().trim().allow(''),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
    populate: Joi.string(),
  }),
};

const getCompanyUsersByCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().required().min(1),
  }),
  query: Joi.object().keys({
    level: Joi.string().valid(...levelValues),
    status: Joi.boolean(),
    search: Joi.string().trim().allow(''),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
    populate: Joi.string(),
  }),
};

const getCompanyUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateCompanyUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      companyId: Joi.string().custom(objectId),
      fullName: Joi.string().trim(),
      email: Joi.string().email().trim().lowercase(),
      level: Joi.string().valid(...levelValues),
      status: Joi.boolean(),
    })
    .min(1),
};

const deleteCompanyUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

export {
  createCompanyUser,
  getCompanyUsers,
  getCompanyUsersByCompany,
  getCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
};
