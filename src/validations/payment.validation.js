import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createPaymentOrder = {
  body: Joi.object().keys({
    planId: Joi.string().required().custom(objectId),
    couponCode: Joi.string().trim().uppercase().allow('', null),
    platform: Joi.string().valid('ios', 'android', 'web', 'admin', 'other').default('web'),
  }),
};

const verifyPayment = {
  body: Joi.object().keys({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    platform: Joi.string().valid('ios', 'android', 'web', 'admin', 'other').default('web'),
  }),
};

const getTransaction = {
  params: Joi.object().keys({
    transactionId: Joi.string().custom(objectId),
  }),
};

const getUserTransactions = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getUserMemberships = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const cancelMembership = {
  params: Joi.object().keys({
    membershipId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    reason: Joi.string().trim().max(500).allow('', null),
  }),
};

const requestRefund = {
  params: Joi.object().keys({
    membershipId: Joi.string().custom(objectId),
  }),
};

const processRefund = {
  params: Joi.object().keys({
    membershipId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    refundId: Joi.string().required(),
  }),
};

const getAllTransactions = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled', 'refunded'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export {
  createPaymentOrder,
  verifyPayment,
  getTransaction,
  getUserTransactions,
  getUserMemberships,
  cancelMembership,
  requestRefund,
  processRefund,
  getAllTransactions,
};
