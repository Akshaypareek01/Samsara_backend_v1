import Joi from 'joi';

const createMembership = {
  body: Joi.object().keys({
    planId: Joi.string().required(),
    couponCode: Joi.string().optional(),
    autoRenewal: Joi.boolean().default(false),
    metadata: Joi.object().optional()
  })
};

const updateMembership = {
  params: Joi.object().keys({
    membershipId: Joi.string().required()
  }),
  body: Joi.object().keys({
    autoRenewal: Joi.boolean().optional(),
    metadata: Joi.object().optional()
  })
};

const cancelMembership = {
  params: Joi.object().keys({
    membershipId: Joi.string().required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().optional()
  })
};

const assignMembershipWithCoupon = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    planId: Joi.string().required(),
    couponCode: Joi.string().required()
  })
};

const verifyIosReceipt = {
  body: Joi.object().keys({
    productId: Joi.string().required(),
    receiptData: Joi.string().required()
  })
};

/** Admin: attach membership using user email + plan display name */
const assignMembershipByEmailAndPlan = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    planName: Joi.string().trim().min(1).required()
  })
};

/** Admin CRM: attach membership using user id + plan id */
const assignMembershipByUserAndPlan = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    planId: Joi.string().required()
  })
};

export const membershipValidation = {
  createMembership,
  updateMembership,
  cancelMembership,
  assignMembershipWithCoupon,
  verifyIosReceipt,
  assignMembershipByEmailAndPlan,
  assignMembershipByUserAndPlan
};
