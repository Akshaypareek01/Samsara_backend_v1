import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Booking, Trainer } from '../models/index.js';
import TrainerRating from '../models/trainer-rating.model.js';
import ApiError from '../utils/ApiError.js';
import bookingService from './booking.service.js';

/**
 * Recompute and persist denormalized rating summary on a trainer.
 *
 * @param {import('mongoose').Types.ObjectId|string} trainerId
 * @returns {Promise<void>}
 */
const recomputeTrainerRatingSummary = async (trainerId) => {
  const trainerObjectId = new mongoose.Types.ObjectId(trainerId);
  const [agg] = await TrainerRating.aggregate([
    { $match: { trainer: trainerObjectId } },
    {
      $group: {
        _id: '$trainer',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = agg ? Math.round(agg.averageRating * 10) / 10 : 0;
  const totalReviews = agg ? agg.totalReviews : 0;

  await Trainer.findByIdAndUpdate(trainerId, {
    $set: {
      ratingSummary: { averageRating, totalReviews },
    },
  });
};

/**
 * Resolve company id from a booking document (populated or raw).
 *
 * @param {object} booking
 * @returns {string}
 */
const getBookingCompanyId = (booking) => {
  const company = booking.company;
  if (!company) return '';
  if (typeof company === 'object' && company._id) return company._id.toString();
  return company.toString();
};

/**
 * Resolve trainer id from a booking document (populated or raw).
 *
 * @param {object} booking
 * @returns {string}
 */
const getBookingTrainerId = (booking) => {
  const trainer = booking.trainer;
  if (!trainer) return '';
  if (typeof trainer === 'object' && trainer._id) return trainer._id.toString();
  return trainer.toString();
};

/**
 * Ensure booking is completed and owned by the company.
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @returns {Promise<object>}
 */
const assertCompanyOwnsCompletedBooking = async (bookingId, companyId) => {
  const booking = await bookingService.getBookingById(bookingId);
  if (booking.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only completed sessions can be rated');
  }
  if (getBookingCompanyId(booking) !== companyId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only rate your own sessions');
  }
  const trainerId = getBookingTrainerId(booking);
  if (!trainerId || !(await Trainer.findById(trainerId))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found for this session');
  }
  return booking;
};

/**
 * Completed bookings for a company that have no rating yet.
 *
 * @param {string} companyId
 * @param {object} options
 * @returns {Promise<{ results: object[], totalResults: number, page: number, limit: number }>}
 */
const getPendingRatings = async (companyId, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 20;
  const skip = (page - 1) * limit;

  const ratedBookingIds = await TrainerRating.find({ company: companyId }).distinct('booking');

  const filter = {
    company: companyId,
    status: 'completed',
    _id: { $nin: ratedBookingIds },
  };

  const [bookings, totalResults] = await Promise.all([
    Booking.find(filter)
      .populate('trainer', 'name title profilePhoto category')
      .populate('eapTraining', 'title')
      .sort({ bookingDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const results = bookings.map((booking) => ({
    bookingId: booking._id.toString(),
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    duration: booking.duration,
    typeOfTraining: booking.typeOfTraining,
    trainer: booking.trainer,
    eapTraining: booking.eapTraining,
  }));

  return { results, totalResults, page, limit };
};

/**
 * Submit a session rating for a completed booking.
 *
 * @param {string} companyId
 * @param {{ bookingId: string, rating: number, feedback?: string }} body
 * @returns {Promise<object>}
 */
const createTrainerRating = async (companyId, body) => {
  const { bookingId, rating, feedback = '' } = body;
  const booking = await assertCompanyOwnsCompletedBooking(bookingId, companyId);

  const existing = await TrainerRating.findOne({ booking: bookingId });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, 'This session has already been rated');
  }

  const trainerId = getBookingTrainerId(booking);
  const trainerRating = await TrainerRating.create({
    booking: bookingId,
    trainer: trainerId,
    company: companyId,
    rating,
    feedback: (feedback || '').trim(),
  });

  await recomputeTrainerRatingSummary(trainerId);
  return trainerRating.populate(['trainer', 'booking', 'company']);
};

/**
 * Update an existing session rating.
 *
 * @param {string} companyId
 * @param {string} bookingId
 * @param {{ rating: number, feedback?: string }} body
 * @returns {Promise<object>}
 */
const updateTrainerRating = async (companyId, bookingId, body) => {
  await assertCompanyOwnsCompletedBooking(bookingId, companyId);

  const trainerRating = await TrainerRating.findOne({ booking: bookingId });
  if (!trainerRating) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found for this session');
  }
  if (trainerRating.company.toString() !== companyId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own ratings');
  }

  trainerRating.rating = body.rating;
  if (body.feedback !== undefined) {
    trainerRating.feedback = (body.feedback || '').trim();
  }
  await trainerRating.save();

  await recomputeTrainerRatingSummary(trainerRating.trainer);
  return trainerRating.populate(['trainer', 'booking', 'company']);
};

/**
 * Get rating for a specific booking (company-owned).
 *
 * @param {string} companyId
 * @param {string} bookingId
 * @returns {Promise<object|null>}
 */
const getRatingByBooking = async (companyId, bookingId) => {
  await assertCompanyOwnsCompletedBooking(bookingId, companyId);
  const rating = await TrainerRating.findOne({ booking: bookingId })
    .populate('trainer', 'name title profilePhoto')
    .populate({
      path: 'booking',
      populate: [{ path: 'trainer' }, { path: 'eapTraining', select: 'title' }],
    });
  return rating;
};

/**
 * Public aggregate summary for a trainer.
 *
 * @param {string} trainerId
 * @returns {Promise<{ averageRating: number, totalReviews: number }>}
 */
const getTrainerRatingSummary = async (trainerId) => {
  const trainer = await Trainer.findById(trainerId).select('ratingSummary');
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  return {
    averageRating: trainer.ratingSummary?.averageRating ?? 0,
    totalReviews: trainer.ratingSummary?.totalReviews ?? 0,
  };
};

/**
 * Paginated session reviews for a trainer.
 *
 * @param {string} trainerId
 * @param {object} options
 * @param {string} [requesterRole]
 * @param {string} [requesterId]
 * @returns {Promise<object>}
 */
const getTrainerReviews = async (trainerId, options = {}, requesterRole, requesterId) => {
  const trainer = await Trainer.findById(trainerId);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }

  if (requesterRole === 'trainer' && requesterId !== trainerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own reviews');
  }

  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const filter = { trainer: trainerId };

  const result = await TrainerRating.paginate(filter, {
    page,
    limit,
    sortBy: options.sortBy || 'createdAt:desc',
    populate: 'company,booking',
  });

  return result;
};

export default {
  recomputeTrainerRatingSummary,
  getPendingRatings,
  createTrainerRating,
  updateTrainerRating,
  getRatingByBooking,
  getTrainerRatingSummary,
  getTrainerReviews,
};
