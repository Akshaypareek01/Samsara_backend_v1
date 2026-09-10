import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ClassRating } from '../models/class-rating.model.js';
import { EventRating } from '../models/event-rating.model.js';
import { Class } from '../models/class.model.js';
import Event from '../models/event.model.js';
import ApiError from '../utils/ApiError.js';
import {
  formatRatingStats,
  isDuplicateKeyError,
  ratingStatsGroupStage,
} from '../utils/rating-stats.util.js';

const CLASS_ENROLL_SELECT = 'teacher';
const EVENT_ENROLL_SELECT = 'teacher';

/**
 * Load class teacher only if the student is on the roster (indexed `students` query).
 * @param {string} classId
 * @param {string} userId
 * @returns {Promise<{ teacher: import('mongoose').Types.ObjectId }>}
 */
const getEnrolledClassForRating = async (classId, userId) => {
  const enrolled = await Class.findOne({ _id: classId, students: userId }).select(CLASS_ENROLL_SELECT).lean();
  if (enrolled) {
    return enrolled;
  }

  const classExists = await Class.exists({ _id: classId });
  if (!classExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  throw new ApiError(httpStatus.FORBIDDEN, 'You must be enrolled in the class to rate it');
};

/**
 * Load event teacher only if the student is registered.
 * @param {string} eventId
 * @param {string} userId
 * @returns {Promise<{ teacher?: import('mongoose').Types.ObjectId }>}
 */
const getRegisteredEventForRating = async (eventId, userId) => {
  const enrolled = await Event.findOne({ _id: eventId, students: userId }).select(EVENT_ENROLL_SELECT).lean();
  if (enrolled) {
    return enrolled;
  }

  const eventExists = await Event.exists({ _id: eventId });
  if (!eventExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  throw new ApiError(httpStatus.FORBIDDEN, 'You must be registered for the event to rate it');
};

/**
 * Add class rating
 */
const addClassRating = async (userId, classId, ratingData) => {
  const { rating, review, isAnonymous = false } = ratingData;
  const classDoc = await getEnrolledClassForRating(classId, userId);

  try {
    return await ClassRating.create({
      classId,
      userId,
      teacherId: classDoc.teacher,
      rating,
      review,
      isAnonymous,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this class');
    }
    throw error;
  }
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
  const eventDoc = await getRegisteredEventForRating(eventId, userId);

  try {
    return await EventRating.create({
      eventId,
      userId,
      teacherId: eventDoc.teacher,
      rating,
      review,
      isAnonymous,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this event');
    }
    throw error;
  }
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

  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    ClassRating.find(query)
      .select('-reported -helpfulCount')
      .populate('userId', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
    ClassRating.countDocuments(query),
  ]);

  return {
    ratings,
    total,
    page: page * 1,
    limit: limit * 1,
    pages: Math.ceil(total / limit),
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

  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    EventRating.find(query)
      .select('-reported -helpfulCount')
      .populate('userId', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
    EventRating.countDocuments(query),
  ]);

  return {
    ratings,
    total,
    page: page * 1,
    limit: limit * 1,
    pages: Math.ceil(total / limit),
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
  const skip = (page - 1) * limit;
  const [classRatings, eventRatings] = await Promise.all([
    ClassRating.find(query)
      .select('-reported -helpfulCount')
      .populate('userId', 'name')
      .populate('classId', 'title')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
    EventRating.find(query)
      .select('-reported -helpfulCount')
      .populate('userId', 'name')
      .populate('eventId', 'eventName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
  ]);

  const [classTotal, eventTotal] = await Promise.all([ClassRating.countDocuments(query), EventRating.countDocuments(query)]);

  const total = classTotal + eventTotal;

  return {
    classRatings,
    eventRatings,
    total,
    page: page * 1,
    limit: limit * 1,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get average rating for class
 */
const getClassAverageRating = async (classId) => {
  const result = await ClassRating.aggregate([
    { $match: { classId: new mongoose.Types.ObjectId(classId) } },
    ratingStatsGroupStage(),
  ]);
  return formatRatingStats(result[0]);
};

/**
 * Get average rating for event
 */
const getEventAverageRating = async (eventId) => {
  const result = await EventRating.aggregate([
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    ratingStatsGroupStage(),
  ]);
  return formatRatingStats(result[0]);
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
          totalRatings: { $sum: 1 },
        },
      },
    ]),
    EventRating.aggregate([
      { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
  ]);

  const classAvg = classResult.length > 0 ? classResult[0].averageRating : 0;
  const classTotal = classResult.length > 0 ? classResult[0].totalRatings : 0;
  const eventAvg = eventResult.length > 0 ? eventResult[0].averageRating : 0;
  const eventTotal = eventResult.length > 0 ? eventResult[0].totalRatings : 0;

  const totalRatings = classTotal + eventTotal;
  const averageRating = totalRatings > 0 ? (classAvg * classTotal + eventAvg * eventTotal) / totalRatings : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
    classRatings: classTotal,
    eventRatings: eventTotal,
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
  getTeacherAverageRating,
};
