import Joi from 'joi';
import { objectId } from './custom.validation.js';

// ==================== UPCOMING ACTIVITIES ====================

const getUserUpcomingClasses = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserTodaysClasses = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserTomorrowsClasses = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserPastClasses = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserUpcomingEvents = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserUpcomingCustomSessions = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== BOOKED ACTIVITIES BY DATE RANGE ====================

const getUserBookedClassesByDateRange = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
    }),
};

const getUserBookedEventsByDateRange = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
    }),
};

const getUserCustomSessionsByDateRange = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
    }),
};

// ==================== ATTENDED ACTIVITIES ====================

const getUserAttendedClasses = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserAttendedClassesByDateRange = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required(),
    }),
};

// ==================== ACTIVITIES BY PERIOD ====================

const getUserActivitiesByPeriod = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    query: Joi.object().keys({
        period: Joi.string().valid('today', 'tomorrow', 'week', 'month').default('week'),
    }),
};

// ==================== STATISTICS ====================

const getUserStatistics = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserDashboard = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== FAVORITES ====================

const getUserFavorites = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== RECENT ACTIVITY ====================

const getRecentActivity = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

// ==================== SUMMARY ENDPOINTS ====================

const getUserBookingSummary = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserAttendanceSummary = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

const getUserFavoritesSummary = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
};

export {
    // Upcoming activities
    getUserUpcomingClasses,
    getUserTodaysClasses,
    getUserTomorrowsClasses,
    getUserPastClasses,
    getUserUpcomingEvents,
    getUserUpcomingCustomSessions,
    
    // Booked activities by date range
    getUserBookedClassesByDateRange,
    getUserBookedEventsByDateRange,
    getUserCustomSessionsByDateRange,
    
    // Attended activities
    getUserAttendedClasses,
    getUserAttendedClassesByDateRange,
    
    // Activities by period
    getUserActivitiesByPeriod,
    
    // Statistics
    getUserStatistics,
    getUserDashboard,
    
    // Favorites
    getUserFavorites,
    
    // Recent activity
    getRecentActivity,
    
    // Summary endpoints
    getUserBookingSummary,
    getUserAttendanceSummary,
    getUserFavoritesSummary
}; 