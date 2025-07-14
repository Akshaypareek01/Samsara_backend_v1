import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as userAnalyticsValidation from '../../validations/userAnalytics.validation.js';
import * as userAnalyticsController from '../../controllers/userAnalytics.controller.js';

const router = express.Router();

// ==================== UPCOMING ACTIVITIES ====================

router
    .route('/:userId/upcoming/classes')
    .get(validate(userAnalyticsValidation.getUserUpcomingClasses), userAnalyticsController.getUserUpcomingClasses);

router
    .route('/:userId/today/classes')
    .get(validate(userAnalyticsValidation.getUserTodaysClasses), userAnalyticsController.getUserTodaysClasses);

router
    .route('/:userId/tomorrow/classes')
    .get(validate(userAnalyticsValidation.getUserTomorrowsClasses), userAnalyticsController.getUserTomorrowsClasses);

router
    .route('/:userId/past/classes')
    .get(validate(userAnalyticsValidation.getUserPastClasses), userAnalyticsController.getUserPastClasses);

router
    .route('/:userId/upcoming/events')
    .get(validate(userAnalyticsValidation.getUserUpcomingEvents), userAnalyticsController.getUserUpcomingEvents);

router
    .route('/:userId/upcoming/sessions')
    .get(validate(userAnalyticsValidation.getUserUpcomingCustomSessions), userAnalyticsController.getUserUpcomingCustomSessions);

// ==================== BOOKED ACTIVITIES BY DATE RANGE ====================

router
    .route('/:userId/booked/classes')
    .get(validate(userAnalyticsValidation.getUserBookedClassesByDateRange), userAnalyticsController.getUserBookedClassesByDateRange);

router
    .route('/:userId/booked/events')
    .get(validate(userAnalyticsValidation.getUserBookedEventsByDateRange), userAnalyticsController.getUserBookedEventsByDateRange);

router
    .route('/:userId/booked/sessions')
    .get(validate(userAnalyticsValidation.getUserCustomSessionsByDateRange), userAnalyticsController.getUserCustomSessionsByDateRange);

// ==================== ATTENDED ACTIVITIES ====================

router
    .route('/:userId/attended/classes')
    .get(validate(userAnalyticsValidation.getUserAttendedClasses), userAnalyticsController.getUserAttendedClasses);

router
    .route('/:userId/attended/classes/range')
    .get(validate(userAnalyticsValidation.getUserAttendedClassesByDateRange), userAnalyticsController.getUserAttendedClassesByDateRange);

// ==================== ACTIVITIES BY PERIOD ====================

router
    .route('/:userId/activities/period')
    .get(validate(userAnalyticsValidation.getUserActivitiesByPeriod), userAnalyticsController.getUserActivitiesByPeriod);

// ==================== COMPREHENSIVE STATISTICS ====================

router
    .route('/:userId/statistics')
    .get(validate(userAnalyticsValidation.getUserStatistics), userAnalyticsController.getUserStatistics);

router
    .route('/:userId/dashboard')
    .get(validate(userAnalyticsValidation.getUserDashboard), userAnalyticsController.getUserDashboard);

// ==================== FAVORITES ====================

router
    .route('/:userId/favorites')
    .get(validate(userAnalyticsValidation.getUserFavorites), userAnalyticsController.getUserFavorites);

// ==================== RECENT ACTIVITY ====================

router
    .route('/:userId/recent-activity')
    .get(validate(userAnalyticsValidation.getRecentActivity), userAnalyticsController.getRecentActivity);

// ==================== SUMMARY ENDPOINTS ====================

router
    .route('/:userId/summary/booking')
    .get(validate(userAnalyticsValidation.getUserBookingSummary), userAnalyticsController.getUserBookingSummary);

router
    .route('/:userId/summary/attendance')
    .get(validate(userAnalyticsValidation.getUserAttendanceSummary), userAnalyticsController.getUserAttendanceSummary);

router
    .route('/:userId/summary/favorites')
    .get(validate(userAnalyticsValidation.getUserFavoritesSummary), userAnalyticsController.getUserFavoritesSummary);

export default router; 