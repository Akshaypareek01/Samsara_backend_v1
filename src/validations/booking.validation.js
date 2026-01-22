import Joi from 'joi';
import { objectId } from './custom.validation.js';

// Import training types from trainer validation for consistency
const typeOfTrainingEnum = [
    // Employees
    'Masterclass for Employee Wellbeing',
    'Emotional Intelligence Skill Workshop',
    'Mindfulness at Work',
    'Resilience during Change & Uncertainty',
    'The Mental Health Toolkit: Daily Self-Care for Working Professionals',
    'Managing Anxiety at Work: Coping with High-Pressure Moments',
    'Work-Life Balance and Digital Wellbeing',
    'Stress Management and Emotional Resilience',
    'Peer Support & Mental Health Champions Program',
    'Building Psychological Safety at Work',
    'Enhancing Collaboration through Emotional Intelligence',
    // Mid-Level Managers
    "Myndwell's Emerging Leader Series",
    'Emerging Leader Skill Assessment',
    'Weekly Sessions',
    'Continuous Learning Support',
    'Personalized One-on-One Sessions',
    'Post-Intervention Assessment',
    'Mastering Managerial Effectiveness',
    'Understanding Stress and Burnout',
    'Impactful Communication: Fostering Genuine Connections',
    'Boosting Team Performance & Upholding Organizational Culture',
    'Cultivating Leadership Excellence in Managers',
    "Navigating Performance Appraisal Dynamics: A Manager's Guide",
    'Manager Sensitization Program',
    'How to Have Difficult Conversations: A Guide for Leaders',
    'Feedback Mastery: Enhancing Communication and Performance',
    'Leading with Empathy: Mental Health Leadership Training',
    'Creating a Mentally Healthy Environment: A Culture of Psychological Safety',
    'Preventing Burnout: A Leadership Lens',
    'Emotional Intelligence for Managers',
    // Leadership
    'Strategic Leadership in Evolving Workplaces',
    'Building Inclusive Leadership Practices',
    'Leading Change with Emotional Intelligence',
    'Resilient Leadership: Thriving Through Disruption',
    'Fostering a Culture of Innovation and Growth',
    'Mentoring and Coaching for High-Performance Teams',
    'Leadership Agility: Adapting to Uncertainty',
    'Mental Health Leadership: Supporting Workforce Wellbeing',
    // GenZ
    'From Campus to Corporate: The Real-World Starter Pack',
    'Emotional Intelligence 2.0: Thriving Beyond IQ',
    'The Resilience Playbook: Fail Fast, Rise Faster',
    'Unstoppable Confidence: Owning Your Story at Work',
    'Digital Detox for Digital Natives: Reclaiming Focus & Energy',
    'Collaborate & Conquer: Cracking Multigenerational Workplaces',
    'EQ in Action: Empathy as Your Superpower',
    'Thriving as a Fresher: Adapting to the Corporate World',
];

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
            .items(Joi.string().valid(...typeOfTrainingEnum))
            .min(1)
            .required()
            .messages({
                'array.min': 'At least one type of training is required',
            }),
        notes: Joi.string().max(1000).trim().optional(),
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
            .valid('confirmed', 'completed')
            .required()
            .messages({
                'any.only': 'Status must be one of: confirmed, completed',
            }),
        trainerNotes: Joi.string().max(1000).trim().optional(),
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
            typeOfTraining: Joi.array()
                .items(Joi.string().valid(...typeOfTrainingEnum))
                .min(1),
            notes: Joi.string().max(1000).trim(),
            trainerNotes: Joi.string().max(1000).trim(),
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
        adminNotes: Joi.string().max(1000).trim().optional(),
    }),
};

const rejectBooking = {
    params: Joi.object().keys({
        id: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        adminNotes: Joi.string().max(1000).trim().optional(),
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
};

