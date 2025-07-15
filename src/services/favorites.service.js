import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import Event from '../models/event.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Add class to favorites
 */
const addClassToFavorites = async (userId, classId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    if (user.favoriteClasses.includes(classId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class already in favorites');
    }

    user.favoriteClasses.push(classId);
    await user.save();

    return user;
};

/**
 * Remove class from favorites
 */
const removeClassFromFavorites = async (userId, classId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const index = user.favoriteClasses.indexOf(classId);
    if (index === -1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Class not in favorites');
    }

    user.favoriteClasses.splice(index, 1);
    await user.save();

    return user;
};

/**
 * Add event to favorites
 */
const addEventToFavorites = async (userId, eventId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }

    if (user.favoriteEvents.includes(eventId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Event already in favorites');
    }

    user.favoriteEvents.push(eventId);
    await user.save();

    return user;
};

/**
 * Remove event from favorites
 */
const removeEventFromFavorites = async (userId, eventId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const index = user.favoriteEvents.indexOf(eventId);
    if (index === -1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Event not in favorites');
    }

    user.favoriteEvents.splice(index, 1);
    await user.save();

    return user;
};

/**
 * Add teacher to favorites
 */
const addTeacherToFavorites = async (userId, teacherId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
        throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
    }

    if (user.favoriteTeachers.includes(teacherId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher already in favorites');
    }

    user.favoriteTeachers.push(teacherId);
    await user.save();

    return user;
};

/**
 * Remove teacher from favorites
 */
const removeTeacherFromFavorites = async (userId, teacherId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const index = user.favoriteTeachers.indexOf(teacherId);
    if (index === -1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Teacher not in favorites');
    }

    user.favoriteTeachers.splice(index, 1);
    await user.save();

    return user;
};

/**
 * Get user's favorite classes
 */
const getFavoriteClasses = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'favoriteClasses',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user.favoriteClasses;
};

/**
 * Get user's favorite events
 */
const getFavoriteEvents = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'favoriteEvents',
            populate: {
                path: 'teacher',
                select: 'name email teacherCategory expertise teachingExperience qualification images'
            }
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user.favoriteEvents;
};

/**
 * Get user's favorite teachers
 */
const getFavoriteTeachers = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'favoriteTeachers',
            select: 'name email teacherCategory expertise teachingExperience qualification images'
        });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user.favoriteTeachers;
};

/**
 * Get all user favorites
 */
const getAllFavorites = async (userId) => {
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
        teachers: user.favoriteTeachers,
        summary: {
            totalClasses: user.favoriteClasses.length,
            totalEvents: user.favoriteEvents.length,
            totalTeachers: user.favoriteTeachers.length
        }
    };
};

/**
 * Check if item is in favorites
 */
const checkFavoriteStatus = async (userId, itemId, type) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    switch (type) {
        case 'class':
            return user.favoriteClasses.includes(itemId);
        case 'event':
            return user.favoriteEvents.includes(itemId);
        case 'teacher':
            return user.favoriteTeachers.includes(itemId);
        default:
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid type. Use: class, event, teacher');
    }
};

export {
    addClassToFavorites,
    removeClassFromFavorites,
    addEventToFavorites,
    removeEventFromFavorites,
    addTeacherToFavorites,
    removeTeacherFromFavorites,
    getFavoriteClasses,
    getFavoriteEvents,
    getFavoriteTeachers,
    getAllFavorites,
    checkFavoriteStatus
}; 