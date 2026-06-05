import Joi from 'joi';
import { objectId } from './custom.validation.js';
const statusEnum = ['pending_approval', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed'];

const paymentModeEnum = ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'online', 'other'];
const paymentTypeEnum = ['full', 'partial', 'advance'];

const createBooking = {
    body: Joi.object().keys({
        company: Joi.string().custom(objectId).required(),
        trainer: Joi.string().custom(objectId).required(),
        bookingDate: Joi.date()
            .required()
            .min('now')
            .messages({
                'date.min': 'Booking date must be today or in the future',
            }),
        startTime: Joi.string()
            .required()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .messages({
                'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
            }),
        duration: Joi.number().required().min(0.5).max(24).messages({
            'number.min': 'Duration must be at least 0.5 hours',
            'number.max': 'Duration cannot exceed 24 hours',
        }),
        typeOfTraining: Joi.array()
            .items(Joi.string().trim().min(1).max(300))
            .min(1)
            .required()
            .messages({
                'array.min': 'At least one type of training is required',
            }),
        notes: Joi.string().max(1000).trim().empty('').optional(),
        eapTraining: Joi.string().custom(objectId).optional(),
    }),
};

const getBookings = {
    query: Joi.object().keys({
        company: Joi.string().custom(objectId),
        trainer: Joi.string().custom(objectId),
        status: Joi.string().valid(...statusEnum),
        bookingDate: Joi.date(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1),
        page: Joi.number().integer().min(1),
        populate: Joi.string(),
    }),
};

const getBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
};

const updateBookingStatus = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        status: Joi.string()
            .valid('approved', 'completed')
            .required()
            .messages({
                'any.only': 'Status must be one of: approved, completed',
            }),
        trainerNotes: Joi.string().max(1000).trim().empty('').optional(),
    }),
};

const updateBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object()
        .keys({
            bookingDate: Joi.date().min('now'),
            startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
            duration: Joi.number().min(0.5).max(24),
            typeOfTraining: Joi.array().items(Joi.string().trim().min(1).max(300)).min(1),
            notes: Joi.string().max(1000).trim().empty(''),
            trainerNotes: Joi.string().max(1000).trim().empty(''),
        })
        .min(1),
};

const getTrainerBookings = {
    params: Joi.object().keys({
        trainerId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        status: Joi.string().valid(...statusEnum),
        bookingDate: Joi.date(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1),
        page: Joi.number().integer().min(1),
        populate: Joi.string(),
    }),
};

const getCompanyBookings = {
    params: Joi.object().keys({
        companyId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        status: Joi.string().valid(...statusEnum),
        bookingDate: Joi.date(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1),
        page: Joi.number().integer().min(1),
        populate: Joi.string(),
    }),
};

const cancelBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        cancellationReason: Joi.string().trim().min(1).max(1000).empty('').optional(),
    }),
};

const deleteBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
};

// Admin approval and payment confirmation
const approveBookingAndConfirmPayment = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        paymentMode: Joi.string().valid(...paymentModeEnum).required(),
        transactionId: Joi.string().required().trim(),
        paymentType: Joi.string().valid(...paymentTypeEnum).required(),
        paymentAmount: Joi.number().required().min(0),
        adminNotes: Joi.string().max(1000).trim().empty('').optional(),
    }),
};

const rejectBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        adminNotes: Joi.string().max(1000).trim().empty('').optional(),
    }),
};

const adminCancelBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        adminNotes: Joi.string().trim().min(1).max(1000).required(),
    }),
};

export {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    updateBooking,
    getTrainerBookings,
    getCompanyBookings,
    cancelBooking,
    deleteBooking,
    approveBookingAndConfirmPayment,
    rejectBooking,
    adminCancelBooking,
};

