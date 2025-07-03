import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMasterCategory = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    description: Joi.string().trim(),
    imageUrl: Joi.string().uri(),
    soundUrl: Joi.string().uri(),
    tags: Joi.array().items(Joi.string().trim()),
    order: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }),
};

const getMasterCategories = {
  query: Joi.object().keys({
    name: Joi.string(),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMasterCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId).required(),
  }),
};

const updateMasterCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      description: Joi.string().trim(),
      imageUrl: Joi.string().uri(),
      soundUrl: Joi.string().uri(),
      tags: Joi.array().items(Joi.string().trim()),
      order: Joi.number().integer().min(0),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteMasterCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId).required(),
  }),
};

const getActiveMasterCategories = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const searchMasterCategories = {
  query: Joi.object().keys({
    searchTerm: Joi.string().required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateCategoryOrder = {
  body: Joi.object().keys({
    orderData: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
        order: Joi.number().integer().min(0).required(),
      })
    ).required(),
  }),
};

export {
  createMasterCategory,
  getMasterCategories,
  getMasterCategory,
  updateMasterCategory,
  deleteMasterCategory,
  getActiveMasterCategories,
  searchMasterCategories,
  updateCategoryOrder,
}; 