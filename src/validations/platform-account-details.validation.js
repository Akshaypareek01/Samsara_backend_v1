import Joi from 'joi';

const bankDetailsSchema = Joi.object().keys({
  accountHolderName: Joi.string().trim().allow('', null).optional(),
  accountNumber: Joi.string().trim().allow('', null).optional(),
  ifscCode: Joi.string().trim().uppercase().allow('', null).optional(),
  bankName: Joi.string().trim().allow('', null).optional(),
});

const documentSchema = Joi.object().keys({
  title: Joi.string().trim().allow('', null).optional(),
  documentNumber: Joi.string().trim().allow('', null).optional(),
  fileUrl: Joi.string().uri().required(),
  fileName: Joi.string().trim().allow('', null).optional(),
});

const updatePlatformAccountDetails = {
  body: Joi.object()
    .keys({
      bankDetails: bankDetailsSchema.optional(),
      documents: Joi.array().items(documentSchema).optional(),
    })
    .min(1),
};

export { updatePlatformAccountDetails };
