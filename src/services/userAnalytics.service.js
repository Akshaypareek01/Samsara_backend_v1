import mongoose from 'mongoose';
import { User, Class, Event, CustomSession, ClassRating, EventRating } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import { 
    getTodaysClasses, 
    getTomorrowsClasses, 
    getClassesByDateRange, 
    getUpcomingClasses, 
    getPastClasses 
} from './scheduleService.js';

/**
 * Get user's upcoming classes
 */
const getUserUpcomingClasses = async (userId) => {
    return await getUpcomingClasses(userId);
};

/**
 * Get user's booked classes by date range
 */
const getUserBookedClassesByDateRange = async (userId, startDate, endDate) => {
    return await getClassesByDateRange(userId, new Date(startDate), new Date(endDate));
};

/**
 * Get user's today's classes
 */
const getUserTodaysClasses = async (userId) => {
    return await getTodaysClasses(userId);
};

/**
 * Get user's tomorrow's classes
 */
const getUserTomorrowsClasses = async (userId) => {
    return await getTomorrowsClasses(userId);
};

/**
 * Get user's past classes
 */
const getUserPastClasses = async (userId) => {
    return await getPastClasses(userId);
};

/**
 * Get user's attended classes
 */
const getUserAttendedClasses = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'attendance.classId',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user.attendance.filter(att => att.classId);
};

/**
 * Get user's attended classes by date range
 */
const getUserAttendedClassesByDateRange = async (userId, startDate, endDate) => {
    const user = await User.findById(userId)
        .populate({
            path: 'attendance.classId',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return user.attendance.filter(att => {
        if (!att.classId) return false;
        const joinedDate = new Date(att.joinedAt);
        return joinedDate >= start && joinedDate <= end;
    });
};

/**
 * Get user's upcoming events
 */
const getUserUpcomingEvents = async (userId) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const events = await Event.find({
        students: userId,
        startDate: { $gte: now },
        status: true
    })
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
    .sort({ startDate: 1 })
    .exec();

    return events;
};

/**
 * Get user's booked events by date range
 */
const getUserBookedEventsByDateRange = async (userId, startDate, endDate) => {
    const events = await Event.find({
        students: userId,
        startDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    })
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
    .sort({ startDate: 1 })
    .exec();

    return events;
};

/**
 * Get user's custom sessions
 */
const getUserCustomSessions = async (userId) => {
    const sessions = await CustomSession.find({ user: userId })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .populate('timeSlot', 'timeRange')
        .sort({ date: 1 })
        .exec();

    return sessions;
};

/**
 * Get user's custom sessions by date range
 */
const getUserCustomSessionsByDateRange = async (userId, startDate, endDate) => {
    const sessions = await CustomSession.find({
        user: userId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    })
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
    .populate('timeSlot', 'timeRange')
    .sort({ date: 1 })
    .exec();

    return sessions;
};

/**
 * Get user's upcoming custom sessions
 */
const getUserUpcomingCustomSessions = async (userId) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const sessions = await CustomSession.find({
        user: userId,
        date: { $gte: today },
        status: true
    })
    .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
    .populate('timeSlot', 'timeRange')
    .sort({ date: 1 })
    .exec();

    return sessions;
};

/**
 * Get user's comprehensive statistics
 */
const getUserStatistics = async (userId) => {
    const user = await User.findById(userId)
        .populate('favoriteClasses')
        .populate('favoriteEvents')
        .populate('favoriteTeachers');

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get counts
    const [
        upcomingClassesList,
        upcomingEvents,
        upcomingSessions,
        totalBookedClasses,
        totalBookedEvents,
        totalBookedSessions,
        totalAttendedClasses,
        totalHours,
        totalKcalBurned,
        classRatings,
        eventRatings
    ] = await Promise.all([
        // Upcoming counts
        getUpcomingClasses(userId),
        Event.countDocuments({ students: userId, startDate: { $gte: now }, status: true }),
        CustomSession.countDocuments({ user: userId, date: { $gte: today }, status: true }),
        
        // Total booked counts
        Class.countDocuments({ students: userId }),
        Event.countDocuments({ students: userId }),
        CustomSession.countDocuments({ user: userId }),
        
        // Attendance stats
        user.attendance.length,
        user.attendance.reduce((sum, att) => sum + (att.durationMinutes || 0), 0),
        user.attendance.reduce((sum, att) => sum + (att.kcalBurned || 0), 0),
        
        // Rating counts
        ClassRating.countDocuments({ userId }),
        EventRating.countDocuments({ userId })
    ]);

    const upcomingClasses = upcomingClassesList.length;

    // Calculate past classes (booked but not attended or past schedule)
    const pastClasses = totalBookedClasses - upcomingClasses;

    return {
        // Upcoming activities
        upcomingClasses,
        upcomingEvents,
        upcomingSessions,
        totalUpcoming: upcomingClasses + upcomingEvents + upcomingSessions,

        // Booking statistics
        totalBookedClasses,
        totalBookedEvents,
        totalBookedSessions,
        totalBooked: totalBookedClasses + totalBookedEvents + totalBookedSessions,

        // Attendance statistics
        totalAttendedClasses,
        totalHours: Math.round(totalHours / 60 * 10) / 10, // Convert minutes to hours
        totalKcalBurned,
        attendanceRate: totalBookedClasses > 0 ? Math.round((totalAttendedClasses / totalBookedClasses) * 100) : 0,

        // Past activities
        pastClasses,
        pastEvents: totalBookedEvents - upcomingEvents,
        pastSessions: totalBookedSessions - upcomingSessions,

        // Favorites
        favoriteClasses: user.favoriteClasses.length,
        favoriteEvents: user.favoriteEvents.length,
        favoriteTeachers: user.favoriteTeachers.length,

        // Reviews
        totalReviews: classRatings + eventRatings,

        // Summary
        summary: {
            totalActivities: totalBookedClasses + totalBookedEvents + totalBookedSessions,
            totalHoursSpent: Math.round(totalHours / 60 * 10) / 10,
            totalCaloriesBurned: totalKcalBurned,
            averageAttendanceRate: totalBookedClasses > 0 ? Math.round((totalAttendedClasses / totalBookedClasses) * 100) : 0
        }
    };
};

/**
 * Get user's activities by period
 */
const getUserActivitiesByPeriod = async (userId, period = 'week') => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'tomorrow':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
        default:
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid period. Use: today, tomorrow, week, month');
    }

    const [classes, events, sessions] = await Promise.all([
        getClassesByDateRange(userId, startDate, endDate),
        getUserBookedEventsByDateRange(userId, startDate, endDate),
        getUserCustomSessionsByDateRange(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
    ]);

    return {
        period,
        startDate,
        endDate,
        activities: {
            classes,
            events,
            sessions
        },
        summary: {
            totalClasses: classes.length,
            totalEvents: events.length,
            totalSessions: sessions.length,
            totalActivities: classes.length + events.length + sessions.length
        }
    };
};

/**
 * Get user's dashboard data
 */
const getUserDashboard = async (userId) => {
    const [statistics, upcomingClasses, upcomingEvents, upcomingSessions, favorites] = await Promise.all([
        getUserStatistics(userId),
        getUserUpcomingClasses(userId),
        getUserUpcomingEvents(userId),
        getUserUpcomingCustomSessions(userId),
        getUserFavorites(userId)
    ]);

    return {
        statistics,
        upcomingActivities: {
            classes: upcomingClasses.slice(0, 5),
            events: upcomingEvents.slice(0, 5),
            sessions: upcomingSessions.slice(0, 5)
        },
        favorites,
        recentActivity: await getRecentActivity(userId)
    };
};

/**
 * Get user's favorites
 */
const getUserFavorites = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'favoriteClasses',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        })
        .populate({
            path: 'favoriteEvents',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        })
        .populate({
            path: 'favoriteTeachers',
            select: 'name email teacherCategory expertise teachingExperience qualification images'
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return {
        classes: user.favoriteClasses,
        events: user.favoriteEvents,
        teachers: user.favoriteTeachers
    };
};

/**
 * Get recent activity
 */
const getRecentActivity = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'attendance.classId',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory'
            }
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Get last 10 attendance records
    const recentAttendance = user.attendance
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
        .slice(0, 10);

    return recentAttendance;
};

export {
    getUserUpcomingClasses,
    getUserBookedClassesByDateRange,
    getUserTodaysClasses,
    getUserTomorrowsClasses,
    getUserPastClasses,
    getUserAttendedClasses,
    getUserAttendedClassesByDateRange,
    getUserUpcomingEvents,
    getUserBookedEventsByDateRange,
    getUserCustomSessions,
    getUserCustomSessionsByDateRange,
    getUserUpcomingCustomSessions,
    getUserStatistics,
    getUserActivitiesByPeriod,
    getUserDashboard,
    getUserFavorites,
    getRecentActivity
}; 