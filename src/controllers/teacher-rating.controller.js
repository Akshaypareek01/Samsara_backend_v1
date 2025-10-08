import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as teacherRatingService from '../services/teacher-rating.service.js';

/**
 * Rate a teacher
 */
const rateTeacher = catchAsync(async (req, res) => {
  const rating = await teacherRatingService.addTeacherRating(req.user.id, req.params.teacherId, req.body);
  res.status(httpStatus.CREATED).send(rating);
});

/**
 * Update teacher rating
 */
const updateTeacherRating = catchAsync(async (req, res) => {
  const rating = await teacherRatingService.updateTeacherRating(req.user.id, req.params.teacherId, req.body);
  res.send(rating);
});

/**
 * Delete teacher rating
 */
const deleteTeacherRating = catchAsync(async (req, res) => {
  await teacherRatingService.deleteTeacherRating(req.user.id, req.params.teacherId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get teacher ratings by teacher ID
 */
const getTeacherRatingsByTeacherId = catchAsync(async (req, res) => {
  const options = {
    minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
    page: req.query.page ? parseInt(req.query.page) : 1,
  };

  const result = await teacherRatingService.getTeacherRatingsByTeacherId(req.params.teacherId, options);
  res.send(result);
});

/**
 * Get teacher ratings by user ID
 */
const getTeacherRatingsByUserId = catchAsync(async (req, res) => {
  const options = {
    minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
    page: req.query.page ? parseInt(req.query.page) : 1,
  };

  const result = await teacherRatingService.getTeacherRatingsByUserId(req.params.userId, options);
  res.send(result);
});

/**
 * Get teacher average rating
 */
const getTeacherAverageRating = catchAsync(async (req, res) => {
  const result = await teacherRatingService.getTeacherAverageRating(req.params.teacherId);
  res.send(result);
});

/**
 * Get specific teacher rating by user and teacher
 */
const getTeacherRatingByUserAndTeacher = catchAsync(async (req, res) => {
  const rating = await teacherRatingService.getTeacherRatingByUserAndTeacher(req.params.userId, req.params.teacherId);
  res.send(rating);
});

export {
  rateTeacher,
  updateTeacherRating,
  deleteTeacherRating,
  getTeacherRatingsByTeacherId,
  getTeacherRatingsByUserId,
  getTeacherAverageRating,
  getTeacherRatingByUserAndTeacher,
};

