import { ClassRating } from '../models/class-rating.model.js';
import { EventRating } from '../models/event-rating.model.js';
import { Class } from '../models/class.model.js';
import Event from '../models/event.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

/**
 * Add class rating
 */
const addClassRating = async (userId, classId, ratingData) => {
    const { rating, review, isAnonymous = false } = ratingData;

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
    }

    // Check if user is enrolled in the class
    if (!classExists.students.includes(userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You must be enrolled in the class to rate it');
    }

    // Check if user already rated this class
    const existingRating = await ClassRating.findOne({ classId, userId });
    if (existingRating) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this class');
    }

    const classRating = await ClassRating.create({
        classId,
        userId,
        teacherId: classExists.teacher,
        rating,
        review,
        isAnonymous
    });

    return classRating;
};

/**
 * Update class rating
 */
const updateClassRating = async (userId, classId, ratingData) => {
    const { rating, review, isAnonymous } = ratingData;

    const classRating = await ClassRating.findOne({ classId, userId });
    if (!classRating) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
    }

    Object.assign(classRating, { rating, review, isAnonymous });
    await classRating.save();

    return classRating;
};

/**
 * Delete class rating
 */
const deleteClassRating = async (userId, classId) => {
    const classRating = await ClassRating.findOneAndDelete({ classId, userId });
    if (!classRating) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
    }

    return { message: 'Rating deleted successfully' };
};

/**
 * Add event rating
 */
const addEventRating = async (userId, eventId, ratingData) => {
    const { rating, review, isAnonymous = false } = ratingData;

    // Check if event exists
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }

    // Check if user is registered for the event
    if (!eventExists.students.includes(userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You must be registered for the event to rate it');
    }

    // Check if user already rated this event
    const existingRating = await EventRating.findOne({ eventId, userId });
    if (existingRating) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this event');
    }

    const eventRating = await EventRating.create({
        eventId,
        userId,
        teacherId: eventExists.teacher,
        rating,
        review,
        isAnonymous
    });

    return eventRating;
};

/**
 * Update event rating
 */
const updateEventRating = async (userId, eventId, ratingData) => {
    const { rating, review, isAnonymous } = ratingData;

    const eventRating = await EventRating.findOne({ eventId, userId });
    if (!eventRating) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
    }

    Object.assign(eventRating, { rating, review, isAnonymous });
    await eventRating.save();

    return eventRating;
};

/**
 * Delete event rating
 */
const deleteEventRating = async (userId, eventId) => {
    const eventRating = await EventRating.findOneAndDelete({ eventId, userId });
    if (!eventRating) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
    }

    return { message: 'Rating deleted successfully' };
};

/**
 * Get class ratings
 */
const getClassRatings = async (classId, options = {}) => {
    const { minRating, maxRating, sortBy = 'createdAt', limit = 10, page = 1 } = options;

    const query = { classId };
    if (minRating) query.rating = { $gte: minRating };
    if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    const ratings = await ClassRating.find(query)
        .populate('userId', 'name email')
        .populate('teacherId', 'name email teacherCategory')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const total = await ClassRating.countDocuments(query);

    return {
        ratings,
        total,
        page: page * 1,
        limit: limit * 1,
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get event ratings
 */
const getEventRatings = async (eventId, options = {}) => {
    const { minRating, maxRating, sortBy = 'createdAt', limit = 10, page = 1 } = options;

    const query = { eventId };
    if (minRating) query.rating = { $gte: minRating };
    if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    const ratings = await EventRating.find(query)
        .populate('userId', 'name email')
        .populate('teacherId', 'name email teacherCategory')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const total = await EventRating.countDocuments(query);

    return {
        ratings,
        total,
        page: page * 1,
        limit: limit * 1,
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get teacher ratings (from classes and events)
 */
const getTeacherRatings = async (teacherId, options = {}) => {
    const { minRating, maxRating, sortBy = 'createdAt', limit = 10, page = 1 } = options;

    const query = { teacherId };
    if (minRating) query.rating = { $gte: minRating };
    if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    // Get both class and event ratings
    const [classRatings, eventRatings] = await Promise.all([
        ClassRating.find(query)
            .populate('userId', 'name email')
            .populate('classId', 'title')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec(),
        EventRating.find(query)
            .populate('userId', 'name email')
            .populate('eventId', 'eventName')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()
    ]);

    const [classTotal, eventTotal] = await Promise.all([
        ClassRating.countDocuments(query),
        EventRating.countDocuments(query)
    ]);

    const total = classTotal + eventTotal;

    return {
        classRatings,
        eventRatings,
        total,
        page: page * 1,
        limit: limit * 1,
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get average rating for class
 */
const getClassAverageRating = async (classId) => {
    const result = await ClassRating.aggregate([
        { $match: { classId: new mongoose.Types.ObjectId(classId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const { averageRating, totalRatings, ratingDistribution } = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(rating => {
        distribution[rating]++;
    });

    return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingDistribution: distribution
    };
};

/**
 * Get average rating for event
 */
const getEventAverageRating = async (eventId) => {
    const result = await EventRating.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const { averageRating, totalRatings, ratingDistribution } = result[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(rating => {
        distribution[rating]++;
    });

    return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingDistribution: distribution
    };
};

/**
 * Get average rating for teacher
 */
const getTeacherAverageRating = async (teacherId) => {
    const [classResult, eventResult] = await Promise.all([
        ClassRating.aggregate([
            { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]),
        EventRating.aggregate([
            { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ])
    ]);

    const classAvg = classResult.length > 0 ? classResult[0].averageRating : 0;
    const classTotal = classResult.length > 0 ? classResult[0].totalRatings : 0;
    const eventAvg = eventResult.length > 0 ? eventResult[0].averageRating : 0;
    const eventTotal = eventResult.length > 0 ? eventResult[0].totalRatings : 0;

    const totalRatings = classTotal + eventTotal;
    const averageRating = totalRatings > 0 
        ? ((classAvg * classTotal) + (eventAvg * eventTotal)) / totalRatings 
        : 0;

    return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        classRatings: classTotal,
        eventRatings: eventTotal
    };
};

export {
    addClassRating,
    updateClassRating,
    deleteClassRating,
    addEventRating,
    updateEventRating,
    deleteEventRating,
    getClassRatings,
    getEventRatings,
    getTeacherRatings,
    getClassAverageRating,
    getEventAverageRating,
    getTeacherAverageRating
}; 