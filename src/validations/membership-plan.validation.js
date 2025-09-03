import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMembershipPlan = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().max(100),
    description: Joi.string().required().trim().max(500),
    basePrice: Joi.number().required().min(0),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    validityDays: Joi.number().required().min(0).max(3650), // Allow 0 for special plans, max 10 years
    features: Joi.array().items(Joi.string().trim()).min(1).required(),
    planType: Joi.string().valid('basic', 'premium', 'enterprise', 'trial', 'limited-time').default('basic'),
    maxUsers: Joi.number().min(1).default(1),
    availableFrom: Joi.date().default(Date.now),
    availableUntil: Joi.date().allow(null).default(null),
    taxConfig: Joi.object({
      gst: Joi.object({
        rate: Joi.number().min(0).max(100).default(18),
        type: Joi.string().valid('percentage', 'fixed').default('percentage'),
        amount: Joi.number().min(0).default(0)
      }).default({}),
      otherTaxes: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        rate: Joi.number().min(0).max(100).default(0),
        type: Joi.string().valid('percentage', 'fixed').default('percentage'),
        amount: Joi.number().min(0).default(0)
      })).default([])
    }).default({}),
    discountConfig: Joi.object({
      maxDiscountPercentage: Joi.number().min(0).max(100).default(100),
      maxDiscountAmount: Joi.number().min(0).allow(null).default(null)
    }).default({}),
    razorpayPlanId: Joi.string().allow('', null),
    metadata: Joi.object().default({}),
  }),
};

const getMembershipPlans = {
  query: Joi.object().keys({
    name: Joi.string(),
    planType: Joi.string().valid('basic', 'premium', 'enterprise', 'trial'),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getMembershipPlan = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  }),
};

const updateMembershipPlan = {
  params: Joi.object().keys({
    planId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().max(100),
      description: Joi.string().trim().max(500),
      basePrice: Joi.number().min(0),
      currency: Joi.string().valid('INR', 'USD', 'EUR'),
      validityDays: Joi.number().min(0).max(3650),
      features: Joi.array().items(Joi.string().trim()).min(1),
          planType: Joi.string().valid('basic', 'premium', 'enterprise', 'trial', 'limited-time'),
    maxUsers: Joi.number().min(1),
          availableFrom: Joi.date(),
      availableUntil: Joi.date().allow(null),
      taxConfig: Joi.object({
        gst: Joi.object({
          rate: Joi.number().min(0).max(100),
          type: Joi.string().valid('percentage', 'fixed'),
          amount: Joi.number().min(0)
        }),
        otherTaxes: Joi.array().items(Joi.object({
          name: Joi.string().required(),
          rate: Joi.number().min(0).max(100),
          type: Joi.string().valid('percentage', 'fixed'),
          amount: Joi.number().min(0)
        }))
      }),
      discountConfig: Joi.object({
        maxDiscountPercentage: Joi.number().min(0).max(100),
        maxDiscountAmount: Joi.number().min(0).allow(null)
      }),
      razorpayPlanId: Joi.string().allow('', null),
      isActive: Joi.boolean(),
      metadata: Joi.object(),
    })
    .min(1),
};

const deleteMembershipPlan = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  }),
};

const getMembershipPlansByType = {
  params: Joi.object().keys({
    planType: Joi.string().valid('basic', 'premium', 'enterprise', 'trial', 'limited-time').required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const toggleMembershipPlanStatus = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  }),
};

export {
  createMembershipPlan,
  getMembershipPlans,
  getMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getMembershipPlansByType,
  toggleMembershipPlanStatus,
};
