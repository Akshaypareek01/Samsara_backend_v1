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

export const membershipValidation = {
  createMembership,
  updateMembership,
  cancelMembership
};
