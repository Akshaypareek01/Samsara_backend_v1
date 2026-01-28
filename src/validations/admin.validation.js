import Joi from 'joi';
import { objectId } from './custom.validation.js';

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const createTeamMember = {
  body: Joi.object().keys({
    name: Joi.string(),
    username: Joi.string(),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    role: Joi.string().custom(objectId),
    roleId: Joi.string().custom(objectId),
    status: Joi.boolean(),
  }),
};

const getTeamMembers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeamMember = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
  }),
};

const updateTeamMember = {
  params: Joi.object().keys({
    adminId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      username: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
      role: Joi.string().custom(objectId),
      roleId: Joi.string().custom(objectId),
      status: Joi.boolean(),
    })
    .min(1),
};

const deleteTeamMember = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
  }),
};

export {
  login,
  createTeamMember,
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember
};

