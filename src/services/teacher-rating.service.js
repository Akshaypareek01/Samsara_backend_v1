import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { TeacherRating } from '../models/teacher-rating.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Add teacher rating
 */
const addTeacherRating = async (userId, teacherId, ratingData) => {
  const { rating, review, isAnonymous = false } = ratingData;

  // Check if teacher exists and is actually a teacher
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher not found');
  }
  if (teacher.role !== 'teacher') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is not a teacher');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user already rated this teacher
  const existingRating = await TeacherRating.findOne({ teacherId, userId });
  if (existingRating) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already rated this teacher');
  }

  const teacherRating = await TeacherRating.create({
    teacherId,
    userId,
    rating,
    review,
    isAnonymous,
  });

  return teacherRating;
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

  const ratings = await TeacherRating.find(query)
    .populate('userId', 'name email profileImage')
    .populate('teacherId', 'name email teacherCategory')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await TeacherRating.countDocuments(query);

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

  const ratings = await TeacherRating.find(query)
    .populate('userId', 'name email profileImage')
    .populate('teacherId', 'name email teacherCategory profileImage')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await TeacherRating.countDocuments(query);

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
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const { averageRating, totalRatings, ratingDistribution } = result[0];

  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach((rating) => {
    distribution[rating]++;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
    ratingDistribution: distribution,
  };
};

/**
 * Get specific teacher rating by user and teacher
 */
const getTeacherRatingByUserAndTeacher = async (userId, teacherId) => {
  const rating = await TeacherRating.findOne({ userId, teacherId })
    .populate('userId', 'name email profileImage')
    .populate('teacherId', 'name email teacherCategory profileImage');

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

