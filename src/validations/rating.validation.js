import Joi from 'joi';
import { objectId } from './custom.validation.js';

// ==================== CLASS RATINGS ====================

const addClassRating = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        rating: Joi.number().integer().min(1).max(5).required(),
        review: Joi.string().max(1000).optional(),
        isAnonymous: Joi.boolean().default(false),
    }),
};

const updateClassRating = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        rating: Joi.number().integer().min(1).max(5).required(),
        review: Joi.string().max(1000).optional(),
        isAnonymous: Joi.boolean(),
    }),
};

const deleteClassRating = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
};

const getClassRatings = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        minRating: Joi.number().min(1).max(5),
        maxRating: Joi.number().min(1).max(5),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getClassAverageRating = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== EVENT RATINGS ====================

const addEventRating = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        rating: Joi.number().integer().min(1).max(5).required(),
        review: Joi.string().max(1000).optional(),
        isAnonymous: Joi.boolean().default(false),
    }),
};

const updateEventRating = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        rating: Joi.number().integer().min(1).max(5).required(),
        review: Joi.string().max(1000).optional(),
        isAnonymous: Joi.boolean(),
    }),
};

const deleteEventRating = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
};

const getEventRatings = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        minRating: Joi.number().min(1).max(5),
        maxRating: Joi.number().min(1).max(5),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getEventAverageRating = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== TEACHER RATINGS ====================

const getTeacherRatings = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        minRating: Joi.number().min(1).max(5),
        maxRating: Joi.number().min(1).max(5),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getTeacherAverageRating = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== FAVORITES ====================

const addClassToFavorites = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
};

const removeClassFromFavorites = {
    params: Joi.object().keys({
        classId: Joi.string().custom(objectId).required(),
    }),
};

const addEventToFavorites = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
};

const removeEventFromFavorites = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(objectId).required(),
    }),
};

const addTeacherToFavorites = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
    }),
};

const removeTeacherFromFavorites = {
    params: Joi.object().keys({
        teacherId: Joi.string().custom(objectId).required(),
    }),
};

const checkFavoriteStatus = {
    params: Joi.object().keys({
        type: Joi.string().valid('class', 'event', 'teacher').required(),
        itemId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== SCHEDULE ====================

const getScheduleByPeriod = {
    params: Joi.object().keys({
        period: Joi.string().valid('today', 'tomorrow', 'week', 'month').default('week'),
    }),
};

const getScheduleByDateRange = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
    }),
};

const getUpcomingActivities = {
    query: Joi.object().keys({
        limit: Joi.number().integer().min(1).max(50).default(10),
    }),
};

export {
    // Class ratings
    addClassRating,
    updateClassRating,
    deleteClassRating,
    getClassRatings,
    getClassAverageRating,
    
    // Event ratings
    addEventRating,
    updateEventRating,
    deleteEventRating,
    getEventRatings,
    getEventAverageRating,
    
    // Teacher ratings
    getTeacherRatings,
    getTeacherAverageRating,
    
    // Favorites
    addClassToFavorites,
    removeClassFromFavorites,
    addEventToFavorites,
    removeEventFromFavorites,
    addTeacherToFavorites,
    removeTeacherFromFavorites,
    checkFavoriteStatus,
    
    // Schedule
    getScheduleByPeriod,
    getScheduleByDateRange,
    getUpcomingActivities
}; 