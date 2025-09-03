import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createCouponCode = {
  body: Joi.object().keys({
    code: Joi.string().required().trim().uppercase().min(3).max(20),
    name: Joi.string().required().trim().max(100),
    description: Joi.string().trim().max(500),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().required().min(0),
    maxDiscountAmount: Joi.number().min(0).allow(null),
    minOrderAmount: Joi.number().min(0).default(0),
    maxDiscountPercentage: Joi.number().min(0).max(100).default(100),
    startDate: Joi.date().required(),
    endDate: Joi.date().required().greater(Joi.ref('startDate')),
    usageLimit: Joi.number().min(1).allow(null),
    usageLimitPerUser: Joi.number().min(1).default(1),
    applicablePlans: Joi.array().items(Joi.string().custom(objectId)).default([]),
    applicableUserCategories: Joi.array().items(Joi.string().valid('Personal', 'Corporate')).default([]),
    metadata: Joi.object().default({}),
  }),
};

const getCouponCodes = {
  query: Joi.object().keys({
    code: Joi.string(),
    discountType: Joi.string().valid('percentage', 'fixed'),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getCouponCode = {
  params: Joi.object().keys({
    couponId: Joi.string().custom(objectId),
  }),
};

const getCouponCodeByCode = {
  params: Joi.object().keys({
    code: Joi.string().required().trim().uppercase(),
  }),
};

const updateCouponCode = {
  params: Joi.object().keys({
    couponId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().trim().uppercase().min(3).max(20),
      name: Joi.string().trim().max(100),
      description: Joi.string().trim().max(500),
      discountType: Joi.string().valid('percentage', 'fixed'),
      discountValue: Joi.number().min(0),
      maxDiscountAmount: Joi.number().min(0).allow(null),
      minOrderAmount: Joi.number().min(0),
      maxDiscountPercentage: Joi.number().min(0).max(100),
      startDate: Joi.date(),
      endDate: Joi.date().greater(Joi.ref('startDate')),
      usageLimit: Joi.number().min(1).allow(null),
      usageLimitPerUser: Joi.number().min(1),
      applicablePlans: Joi.array().items(Joi.string().custom(objectId)),
      applicableUserCategories: Joi.array().items(Joi.string().valid('Personal', 'Corporate')),
      isActive: Joi.boolean(),
      metadata: Joi.object(),
    })
    .min(1),
};

const deleteCouponCode = {
  params: Joi.object().keys({
    couponId: Joi.string().custom(objectId),
  }),
};

const validateCouponCode = {
  body: Joi.object().keys({
    code: Joi.string().required().trim().uppercase(),
    planId: Joi.string().required().custom(objectId),
    userCategory: Joi.string().valid('Personal', 'Corporate').required(),
    orderAmount: Joi.number().required().min(0),
  }),
};

const getCouponCodesForPlan = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const toggleCouponCodeStatus = {
  params: Joi.object().keys({
    couponId: Joi.string().custom(objectId),
  }),
};

export {
  createCouponCode,
  getCouponCodes,
  getCouponCode,
  getCouponCodeByCode,
  updateCouponCode,
  deleteCouponCode,
  validateCouponCode,
  getCouponCodesForPlan,
  toggleCouponCodeStatus,
};
