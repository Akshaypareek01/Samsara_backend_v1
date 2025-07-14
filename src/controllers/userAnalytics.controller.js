import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as userAnalyticsService from '../services/userAnalytics.service.js';

// ==================== UPCOMING ACTIVITIES ====================

/**
 * Get user's upcoming classes
 */
const getUserUpcomingClasses = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const classes = await userAnalyticsService.getUserUpcomingClasses(userId);
    res.send(classes);
});

/**
 * Get user's today's classes
 */
const getUserTodaysClasses = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const classes = await userAnalyticsService.getUserTodaysClasses(userId);
    res.send({
        date: new Date().toISOString().split('T')[0],
        classes,
        totalClasses: classes.length
    });
});

/**
 * Get user's tomorrow's classes
 */
const getUserTomorrowsClasses = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const classes = await userAnalyticsService.getUserTomorrowsClasses(userId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    res.send({
        date: tomorrow.toISOString().split('T')[0],
        classes,
        totalClasses: classes.length
    });
});

/**
 * Get user's past classes
 */
const getUserPastClasses = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const classes = await userAnalyticsService.getUserPastClasses(userId);
    res.send({
        classes,
        totalClasses: classes.length
    });
});

/**
 * Get user's upcoming events
 */
const getUserUpcomingEvents = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const events = await userAnalyticsService.getUserUpcomingEvents(userId);
    res.send(events);
});

/**
 * Get user's upcoming custom sessions
 */
const getUserUpcomingCustomSessions = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const sessions = await userAnalyticsService.getUserUpcomingCustomSessions(userId);
    res.send(sessions);
});

// ==================== BOOKED ACTIVITIES BY DATE RANGE ====================

/**
 * Get user's booked classes by date range
 */
const getUserBookedClassesByDateRange = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'startDate and endDate are required' });
        return;
    }

    const classes = await userAnalyticsService.getUserBookedClassesByDateRange(userId, startDate, endDate);
    res.send({
        startDate,
        endDate,
        classes,
        totalClasses: classes.length
    });
});

/**
 * Get user's booked events by date range
 */
const getUserBookedEventsByDateRange = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'startDate and endDate are required' });
        return;
    }

    const events = await userAnalyticsService.getUserBookedEventsByDateRange(userId, startDate, endDate);
    res.send({
        startDate,
        endDate,
        events,
        totalEvents: events.length
    });
});

/**
 * Get user's custom sessions by date range
 */
const getUserCustomSessionsByDateRange = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'startDate and endDate are required' });
        return;
    }

    const sessions = await userAnalyticsService.getUserCustomSessionsByDateRange(userId, startDate, endDate);
    res.send({
        startDate,
        endDate,
        sessions,
        totalSessions: sessions.length
    });
});

// ==================== ATTENDED ACTIVITIES ====================

/**
 * Get user's attended classes
 */
const getUserAttendedClasses = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const attendance = await userAnalyticsService.getUserAttendedClasses(userId);
    res.send(attendance);
});

/**
 * Get user's attended classes by date range
 */
const getUserAttendedClassesByDateRange = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'startDate and endDate are required' });
        return;
    }

    const attendance = await userAnalyticsService.getUserAttendedClassesByDateRange(userId, startDate, endDate);
    res.send({
        startDate,
        endDate,
        attendance,
        totalAttended: attendance.length
    });
});

// ==================== ACTIVITIES BY PERIOD ====================

/**
 * Get user's activities by period (today, tomorrow, week, month)
 */
const getUserActivitiesByPeriod = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { period = 'week' } = req.query;
    
    const result = await userAnalyticsService.getUserActivitiesByPeriod(userId, period);
    res.send(result);
});

// ==================== COMPREHENSIVE STATISTICS ====================

/**
 * Get user's comprehensive statistics
 */
const getUserStatistics = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const statistics = await userAnalyticsService.getUserStatistics(userId);
    res.send(statistics);
});

/**
 * Get user's dashboard data
 */
const getUserDashboard = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const dashboard = await userAnalyticsService.getUserDashboard(userId);
    res.send(dashboard);
});

// ==================== FAVORITES ====================

/**
 * Get user's favorites
 */
const getUserFavorites = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const favorites = await userAnalyticsService.getUserFavorites(userId);
    res.send(favorites);
});

// ==================== RECENT ACTIVITY ====================

/**
 * Get user's recent activity
 */
const getRecentActivity = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const activity = await userAnalyticsService.getRecentActivity(userId);
    res.send(activity);
});

// ==================== SUMMARY ENDPOINTS ====================

/**
 * Get user's booking summary
 */
const getUserBookingSummary = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const statistics = await userAnalyticsService.getUserStatistics(userId);
    
    const summary = {
        totalBooked: statistics.totalBooked,
        totalBookedClasses: statistics.totalBookedClasses,
        totalBookedEvents: statistics.totalBookedEvents,
        totalBookedSessions: statistics.totalBookedSessions,
        upcomingActivities: statistics.totalUpcoming,
        pastActivities: statistics.totalBooked - statistics.totalUpcoming
    };
    
    res.send(summary);
});

/**
 * Get user's attendance summary
 */
const getUserAttendanceSummary = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const statistics = await userAnalyticsService.getUserStatistics(userId);
    
    const summary = {
        totalAttendedClasses: statistics.totalAttendedClasses,
        totalHours: statistics.totalHours,
        totalKcalBurned: statistics.totalKcalBurned,
        attendanceRate: statistics.attendanceRate,
        averageSessionDuration: statistics.totalAttendedClasses > 0 
            ? Math.round(statistics.totalHours / statistics.totalAttendedClasses * 10) / 10 
            : 0
    };
    
    res.send(summary);
});

/**
 * Get user's favorites summary
 */
const getUserFavoritesSummary = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const statistics = await userAnalyticsService.getUserStatistics(userId);
    
    const summary = {
        favoriteClasses: statistics.favoriteClasses,
        favoriteEvents: statistics.favoriteEvents,
        favoriteTeachers: statistics.favoriteTeachers,
        totalFavorites: statistics.favoriteClasses + statistics.favoriteEvents + statistics.favoriteTeachers
    };
    
    res.send(summary);
});

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