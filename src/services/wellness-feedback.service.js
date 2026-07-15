import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../config/config.js';
import WellnessFeedback from '../models/wellness-feedback.model.js';
import bookingService from './booking.service.js';
import ApiError from '../utils/ApiError.js';
import { signWellnessFeedbackToken, verifyWellnessFeedbackToken } from '../utils/wellnessFeedbackToken.js';
import { buildWellnessFeedbackPrefill } from '../utils/wellnessFeedbackPrefill.js';
import { getSessionsForBooking, getTrainerIdFromRef } from '../utils/bookingSessionUtils.js';

/**
 * Resolves company id from a booking document.
 *
 * @param {object} booking
 * @returns {string}
 */
function getBookingCompanyId(booking) {
    const company = booking.company;
    if (!company) return '';
    if (typeof company === 'object' && company._id) return company._id.toString();
    return company.toString();
}

/**
 * Ensures booking is completed and owned by the company.
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @returns {Promise<object>}
 */
async function assertCompanyOwnsCompletedBooking(bookingId, companyId) {
    const booking = await bookingService.getBookingById(bookingId);
    if (booking.status !== 'completed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Only completed sessions can share feedback links');
    }
    if (getBookingCompanyId(booking) !== companyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only share feedback for your own sessions');
    }
    return booking;
}

/**
 * Loads booking for token context and validates it is still completed.
 *
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
async function getCompletedBookingForFeedback(bookingId) {
    const booking = await bookingService.getBookingById(bookingId);
    if (booking.status !== 'completed') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This session is no longer available for feedback');
    }
    return booking;
}

/**
 * Collects unique trainer ids from a booking.
 *
 * @param {object} booking
 * @returns {string[]}
 */
function collectBookingTrainerIds(booking) {
    const ids = new Set();
    for (const session of getSessionsForBooking(booking)) {
        const trainerId = getTrainerIdFromRef(session.trainer);
        if (trainerId) ids.add(trainerId);
    }
    if (ids.size === 0) {
        const legacyId = getTrainerIdFromRef(booking.trainer);
        if (legacyId) ids.add(legacyId);
    }
    return Array.from(ids);
}

/**
 * Builds the public CRM feedback form URL with a signed token.
 *
 * @param {string} token
 * @returns {string}
 */
function buildShareUrl(token) {
    const origin = config.wellnessFeedback.crmPublicOrigin.replace(/\/$/, '');
    return `${origin}/wellness-feedback?token=${encodeURIComponent(token)}`;
}

/**
 * Creates a signed share link for a completed booking (company only).
 *
 * @param {string} companyId
 * @param {string} bookingId
 * @returns {Promise<{ url: string, expiresAt: Date }>}
 */
const createBookingShareLink = async (companyId, bookingId) => {
    const booking = await assertCompanyOwnsCompletedBooking(bookingId, companyId);
    const trainerIds = collectBookingTrainerIds(booking);
    const { token, expiresAt } = signWellnessFeedbackToken({
        bookingId: booking._id.toString(),
        companyId: getBookingCompanyId(booking),
        trainerIds,
    });
    return { url: buildShareUrl(token), expiresAt };
};

/**
 * Resolves token to prefill context for the public form.
 *
 * @param {string} token
 * @returns {Promise<object>}
 */
const getFeedbackContext = async (token) => {
    const { bookingId, companyId } = verifyWellnessFeedbackToken(token);
    const booking = await getCompletedBookingForFeedback(bookingId);
    if (getBookingCompanyId(booking) !== companyId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'This feedback link is invalid or has expired');
    }
    return buildWellnessFeedbackPrefill(booking);
};

/**
 * Normalizes trainer feedback rows for persistence.
 *
 * @param {Array<object>} trainers
 * @returns {Array<object>}
 */
function normalizeTrainerRows(trainers = []) {
    return trainers.map((row, index) => ({
        trainerNumber: row.trainerNumber,
        trainerId: row.trainerId ? new mongoose.Types.ObjectId(row.trainerId) : undefined,
        order: row.order ?? index + 1,
        name: row.name || '',
        ratings: row.ratings || {},
        likedMost: row.likedMost || '',
        suggestions: row.suggestions || '',
    }));
}

/**
 * Persist a corporate wellness feedback submission.
 *
 * @param {Object} payload - Validated feedback body
 * @param {Object} meta - Request metadata (ip, userAgent)
 * @returns {Promise<import('mongoose').Document>}
 */
const createWellnessFeedback = async (payload, meta = {}) => {
    const body = { ...payload };
    let bookingId;
    let companyId;
    let trainerIds = [];

    if (body.token) {
        const decoded = verifyWellnessFeedbackToken(body.token);
        bookingId = decoded.bookingId;
        companyId = decoded.companyId;
        trainerIds = decoded.trainerIds;
        await getCompletedBookingForFeedback(bookingId);
        body.booking = new mongoose.Types.ObjectId(bookingId);
        body.company = new mongoose.Types.ObjectId(companyId);
        body.trainerIds = trainerIds.map((id) => new mongoose.Types.ObjectId(id));
    }

    delete body.token;

    const sessionDate = body.sessionDate ? new Date(body.sessionDate) : undefined;
    const trainers = normalizeTrainerRows(body.trainers);

    return WellnessFeedback.create({
        ...body,
        trainers,
        sessionDate,
        submittedFromIp: meta.ip,
        userAgent: meta.userAgent,
    });
};

/**
 * Paginated list of wellness feedback submissions for admin review.
 *
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const queryWellnessFeedback = async (filter, options) => {
    return WellnessFeedback.paginate(filter, options);
};

export {
    createWellnessFeedback,
    queryWellnessFeedback,
    createBookingShareLink,
    getFeedbackContext,
};
