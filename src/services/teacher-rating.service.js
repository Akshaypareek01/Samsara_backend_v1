import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { TeacherRating } from '../models/teacher-rating.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import {
  formatRatingStats,
  isDuplicateKeyError,
  ratingStatsGroupStage,
} from '../utils/rating-stats.util.js';

/**
 * Add teacher rating
 */
const addTeacherRating = async (userId, teacherId, ratingData) => {
  const { rating, review, isAnonymous = false } = ratingData;

  const teacher = await User.findById(teacherId).select('role').lean();
  if (!teacher) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
  }
  if (teacher.role !== 'teacher') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is not a teacher');
  }

  try {
    return await TeacherRating.create({
      teacherId,
      userId,
      rating,
      review,
      isAnonymous,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this teacher');
    }
    throw error;
  }
};

/**
 * Update teacher rating
 */
const updateTeacherRating = async (userId, teacherId, ratingData) => {
  const { rating, review, isAnonymous } = ratingData;

  const teacherRating = await TeacherRating.findOne({ teacherId, userId });
  if (!teacherRating) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
  }

  Object.assign(teacherRating, { rating, review, isAnonymous });
  await teacherRating.save();

  return teacherRating;
};

/**
 * Delete teacher rating
 */
const deleteTeacherRating = async (userId, teacherId) => {
  const teacherRating = await TeacherRating.findOneAndDelete({ teacherId, userId });
  if (!teacherRating) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
  }

  return { message: 'Rating deleted successfully' };
};

/**
 * Get teacher ratings by teacher ID
 */
const getTeacherRatingsByTeacherId = async (teacherId, options = {}) => {
  const { minRating, maxRating, sortBy = 'createdAt', limit = 10, page = 1 } = options;

  const query = { teacherId };
  if (minRating) query.rating = { $gte: minRating };
  if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

  const sortOptions = {};
  sortOptions[sortBy] = -1;

  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    TeacherRating.find(query)
      .select('-reported -helpfulCount')
      .populate('userId', 'name profileImage')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
    TeacherRating.countDocuments(query),
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
 * Get teacher ratings by user ID
 */
const getTeacherRatingsByUserId = async (userId, options = {}) => {
  const { minRating, maxRating, sortBy = 'createdAt', limit = 10, page = 1 } = options;

  const query = { userId };
  if (minRating) query.rating = { $gte: minRating };
  if (maxRating) query.rating = { ...query.rating, $lte: maxRating };

  const sortOptions = {};
  sortOptions[sortBy] = -1;

  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    TeacherRating.find(query)
      .select('-reported -helpfulCount')
      .populate('teacherId', 'name teacherCategory profileImage')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec(),
    TeacherRating.countDocuments(query),
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
 * Get average rating for teacher
 */
const getTeacherAverageRating = async (teacherId) => {
  const result = await TeacherRating.aggregate([
    { $match: { teacherId: new mongoose.Types.ObjectId(teacherId) } },
    ratingStatsGroupStage(),
  ]);
  return formatRatingStats(result[0]);
};

/**
 * Get specific teacher rating by user and teacher
 */
const getTeacherRatingByUserAndTeacher = async (userId, teacherId) => {
  const rating = await TeacherRating.findOne({ userId, teacherId })
    .select('-reported -helpfulCount')
    .populate('teacherId', 'name teacherCategory profileImage');

  return rating;
};

export {
  addTeacherRating,
  updateTeacherRating,
  deleteTeacherRating,
  getTeacherRatingsByTeacherId,
  getTeacherRatingsByUserId,
  getTeacherAverageRating,
  getTeacherRatingByUserAndTeacher,
};

