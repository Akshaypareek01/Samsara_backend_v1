import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import trainerRatingService from '../services/trainer-rating.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * List completed unrated sessions for the authenticated company.
 */
const getPendingRatings = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can view pending ratings');
  }
  const options = pick(req.query, ['page', 'limit']);
  const result = await trainerRatingService.getPendingRatings(req.user.id, options);
  res.send(result);
});

/**
 * Submit a rating for a completed session.
 */
const createTrainerRating = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can submit ratings');
  }
  const rating = await trainerRatingService.createTrainerRating(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(rating);
});

/**
 * Update an existing session rating.
 */
const updateTrainerRating = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can update ratings');
  }
  const rating = await trainerRatingService.updateTrainerRating(
    req.user.id,
    req.params.bookingId,
    req.body
  );
  res.send(rating);
});

/**
 * Get rating for a booking if it exists.
 */
const getRatingByBooking = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can view booking ratings');
  }
  const rating = await trainerRatingService.getRatingByBooking(
    req.user.id,
    req.params.bookingId
  );
  res.send(rating);
});

/**
 * Aggregate rating summary for a trainer.
 */
const getTrainerRatingSummary = catchAsync(async (req, res) => {
  const summary = await trainerRatingService.getTrainerRatingSummary(req.params.trainerId);
  res.send(summary);
});

/**
 * Paginated reviews for a trainer.
 */
const getTrainerReviews = catchAsync(async (req, res) => {
  const options = pick(req.query, ['page', 'limit', 'sortBy']);
  const result = await trainerRatingService.getTrainerReviews(
    req.params.trainerId,
    options,
    req.user?.role,
    req.user?.id
  );
  res.send(result);
});

export {
  getPendingRatings,
  createTrainerRating,
  updateTrainerRating,
  getRatingByBooking,
  getTrainerRatingSummary,
  getTrainerReviews,
};
