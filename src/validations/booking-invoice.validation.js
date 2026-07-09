import Joi from 'joi';
import { objectId } from './custom.validation.js';

const taxRowSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    rate: Joi.number().min(0).max(100).default(0),
    type: Joi.string().valid('percentage', 'fixed').default('percentage'),
    amount: Joi.number().min(0).optional(),
});

const deductionRowSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    amount: Joi.number().min(0).required(),
});

const trainerFeeLineSchema = Joi.object({
    trainer: Joi.string().custom(objectId).required(),
    sessionIndex: Joi.number().integer().min(0).optional(),
    baseFee: Joi.number().min(0).required(),
    gstRate: Joi.number().min(0).max(100).default(18),
    otherTaxes: Joi.array().items(taxRowSchema).default([]),
    deductions: Joi.array().items(deductionRowSchema).default([]),
});

const getBookingInvoices = {
    query: Joi.object().keys({
        company: Joi.string().custom(objectId),
        trainer: Joi.string().custom(objectId),
        booking: Joi.string().custom(objectId),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1),
        page: Joi.number().integer().min(1),
    }),
};

const getBookingInvoice = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
};

const getBookingInvoiceByBooking = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
    }),
};

const getDefaultFeeLines = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
    }),
};

export {
    trainerFeeLineSchema,
    getBookingInvoices,
    getBookingInvoice,
    getBookingInvoiceByBooking,
    getDefaultFeeLines,
};
