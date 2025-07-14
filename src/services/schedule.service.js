import mongoose from 'mongoose';
import { Class } from '../models/class.model.js';
import Event from '../models/event.model.js';
import { CustomSession } from '../models/custom-session.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Get classes by date range with filters
 */
const getClassesByDateRange = async (filters = {}) => {
    const {
        startDate,
        endDate,
        teacherId,
        level,
        classType,
        userId, // for user-specific classes
        status = 'active'
    } = filters;

    const query = {};

    // Date range filter
    if (startDate && endDate) {
        query.schedule = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    // Other filters
    if (teacherId) query.teacher = teacherId;
    if (level) query.level = level;
    if (classType) query.classType = classType;
    if (status) query.status = status === 'active';
    if (userId) query.students = userId;

    const classes = await Class.find(query)
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .populate('students', 'name email')
        .sort({ schedule: 1 })
        .exec();

    return classes;
};

/**
 * Get events by date range with filters
 */
const getEventsByDateRange = async (filters = {}) => {
    const {
        startDate,
        endDate,
        teacherId,
        level,
        type,
        userId, // for user-specific events
        status = true
    } = filters;

    const query = {};

    // Date range filter
    if (startDate && endDate) {
        query.startDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    // Other filters
    if (teacherId) query.teacher = teacherId;
    if (level) query.level = level;
    if (type) query.type = type;
    if (status !== undefined) query.status = status;
    if (userId) query.students = userId;

    const events = await Event.find(query)
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .populate('students', 'name email')
        .sort({ startDate: 1 })
        .exec();

    return events;
};

/**
 * Get custom sessions by date range
 */
const getCustomSessionsByDateRange = async (filters = {}) => {
    const {
        startDate,
        endDate,
        teacherId,
        userId,
        status
    } = filters;

    const query = {};

    // Date range filter
    if (startDate && endDate) {
        query.date = {
            $gte: startDate,
            $lte: endDate
        };
    }

    // Other filters
    if (teacherId) query.teacher = teacherId;
    if (userId) query.user = userId;
    if (status !== undefined) query.status = status;

    const sessions = await CustomSession.find(query)
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .populate('user', 'name email')
        .populate('timeSlot', 'timeRange')
        .sort({ date: 1 })
        .exec();

    return sessions;
};

/**
 * Get schedule for specific time periods
 */
const getScheduleByPeriod = async (userId, period = 'week') => {
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
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
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

    // Get all types of activities
    const [classes, events, sessions] = await Promise.all([
        getClassesByDateRange({ startDate, endDate, userId }),
        getEventsByDateRange({ startDate, endDate, userId }),
        getCustomSessionsByDateRange({ startDate, endDate, userId })
    ]);

    // Combine and sort by date/time
    const allActivities = [
        ...classes.map(c => ({ ...c.toObject(), type: 'class' })),
        ...events.map(e => ({ ...e.toObject(), type: 'event' })),
        ...sessions.map(s => ({ ...s.toObject(), type: 'session' }))
    ];

    allActivities.sort((a, b) => {
        const dateA = a.type === 'session' ? new Date(a.date) : new Date(a.schedule || a.startDate);
        const dateB = b.type === 'session' ? new Date(b.date) : new Date(b.schedule || b.startDate);
        return dateA - dateB;
    });

    return {
        period,
        startDate,
        endDate,
        activities: allActivities,
        summary: {
            totalClasses: classes.length,
            totalEvents: events.length,
            totalSessions: sessions.length,
            totalActivities: allActivities.length
        }
    };
};

/**
 * Get user's upcoming activities
 */
const getUserUpcomingActivities = async (userId, limit = 10) => {
    const now = new Date();

    const [classes, events, sessions] = await Promise.all([
        Class.find({
            students: userId,
            schedule: { $gte: now },
            status: true
        })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .sort({ schedule: 1 })
        .limit(limit)
        .exec(),

        Event.find({
            students: userId,
            startDate: { $gte: now },
            status: true
        })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .sort({ startDate: 1 })
        .limit(limit)
        .exec(),

        CustomSession.find({
            user: userId,
            date: { $gte: now.toISOString().split('T')[0] },
            status: true
        })
        .populate('teacher', 'name email teacherCategory expertise teachingExperience qualification images')
        .populate('timeSlot', 'timeRange')
        .sort({ date: 1 })
        .limit(limit)
        .exec()
    ]);

    const allActivities = [
        ...classes.map(c => ({ ...c.toObject(), type: 'class' })),
        ...events.map(e => ({ ...e.toObject(), type: 'event' })),
        ...sessions.map(s => ({ ...s.toObject(), type: 'session' }))
    ];

    allActivities.sort((a, b) => {
        const dateA = a.type === 'session' ? new Date(a.date) : new Date(a.schedule || a.startDate);
        const dateB = b.type === 'session' ? new Date(b.date) : new Date(b.schedule || b.startDate);
        return dateA - dateB;
    });

    return allActivities.slice(0, limit);
};

export {
    getClassesByDateRange,
    getEventsByDateRange,
    getCustomSessionsByDateRange,
    getScheduleByPeriod,
    getUserUpcomingActivities
}; 