import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../config/config.js';
import WellnessFeedback from '../models/wellness-feedback.model.js';
import { Booking } from '../models/index.js';
import bookingService from './booking.service.js';
import trainerRatingService from './trainer-rating.service.js';
import ApiError from '../utils/ApiError.js';
import { signWellnessFeedbackToken, verifyWellnessFeedbackToken } from '../utils/wellnessFeedbackToken.js';
import { buildWellnessFeedbackPrefill } from '../utils/wellnessFeedbackPrefill.js';
import { getSessionsForBooking, getTrainerIdFromRef, getBookingPaymentTotal } from '../utils/bookingSessionUtils.js';

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

    const wellnessFeedback = await WellnessFeedback.create({
        ...body,
        trainers,
        sessionDate,
        submittedFromIp: meta.ip,
        userAgent: meta.userAgent,
    });

    if (bookingId && companyId) {
        await trainerRatingService.syncTrainerRatingFromWellnessFeedback(
            bookingId,
            companyId,
            trainers
        );
    }

    return wellnessFeedback;
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

const SATISFACTION_SCORES = {
    Excellent: 4,
    Good: 3,
    Average: 2,
    'Needs Improvement': 1,
};

const STRESS_POSITIVE = new Set(['Yes, significantly', 'Somewhat']);
const ENGAGEMENT_POSITIVE = new Set(['Yes', 'Maybe']);

/**
 * Sums expected attendees across booking sessions.
 *
 * @param {object} booking
 * @returns {number}
 */
function getBookingEmployeeCount(booking) {
    const sessions = getSessionsForBooking(booking);
    if (sessions.length > 0) {
        return sessions.reduce((sum, session) => sum + (session.employeeCount || 0), 0);
    }
    return booking.employeeCount || 0;
}

/**
 * Increments a label counter map.
 *
 * @param {Record<string, number>} map
 * @param {string} label
 */
function bumpCount(map, label) {
    if (!label) return;
    map[label] = (map[label] || 0) + 1;
}

/**
 * Converts a counter map to sorted chart rows.
 *
 * @param {Record<string, number>} map
 * @param {number} [limit]
 * @returns {Array<{ label: string, count: number, percentage: number }>}
 */
function toSortedBreakdown(map, limit = 8) {
    const total = Object.values(map).reduce((sum, value) => sum + value, 0);
    return Object.entries(map)
        .map(([label, count]) => ({
            label,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Aggregates wellness feedback into company-facing analytics.
 *
 * @param {string} companyId
 * @returns {Promise<object>}
 */
const getCompanyFeedbackAnalytics = async (companyId) => {
    const oid = new mongoose.Types.ObjectId(companyId);

    const [feedbacks, completedBookings] = await Promise.all([
        WellnessFeedback.find({ company: oid }).sort({ createdAt: -1 }).lean(),
        Booking.find({ company: oid, status: 'completed' }).lean(),
    ]);

    const totalResponses = feedbacks.length;
    const expectedParticipants = completedBookings.reduce(
        (sum, booking) => sum + getBookingEmployeeCount(booking),
        0
    );

    const satisfactionCounts = {};
    const stressCounts = {};
    const wantMoreCounts = {};
    const enjoyedActivityCounts = {};
    const preferredTopicCounts = {};
    const sessionsAttendedCounts = {};
    const trainerRatingTotals = {
        knowledge: 0,
        communication: 0,
        engagement: 0,
        energy: 0,
        usefulness: 0,
    };
    let trainerRatingCount = 0;
    let satisfactionScoreSum = 0;
    let satisfactionScoreCount = 0;
    let positiveStressCount = 0;
    let positiveEngagementCount = 0;

    for (const feedback of feedbacks) {
        bumpCount(satisfactionCounts, feedback.overallSatisfaction);
        bumpCount(stressCounts, feedback.stressRelief);
        bumpCount(wantMoreCounts, feedback.wantMoreSessions);

        if (feedback.overallSatisfaction && SATISFACTION_SCORES[feedback.overallSatisfaction]) {
            satisfactionScoreSum += SATISFACTION_SCORES[feedback.overallSatisfaction];
            satisfactionScoreCount += 1;
        }

        if (STRESS_POSITIVE.has(feedback.stressRelief)) {
            positiveStressCount += 1;
        }

        if (ENGAGEMENT_POSITIVE.has(feedback.wantMoreSessions)) {
            positiveEngagementCount += 1;
        }

        for (const activity of feedback.enjoyedActivities || []) {
            bumpCount(enjoyedActivityCounts, activity);
        }

        for (const topic of feedback.preferredTopics || []) {
            bumpCount(preferredTopicCounts, topic);
        }

        for (const session of feedback.sessionsAttended || []) {
            bumpCount(sessionsAttendedCounts, session);
        }

        for (const trainer of feedback.trainers || []) {
            const ratings = trainer.ratings || {};
            const keys = Object.keys(trainerRatingTotals);
            let hasRating = false;

            for (const key of keys) {
                if (typeof ratings[key] === 'number') {
                    trainerRatingTotals[key] += ratings[key];
                    hasRating = true;
                }
            }

            if (hasRating) {
                trainerRatingCount += 1;
            }
        }
    }

    const bookingById = new Map(completedBookings.map((booking) => [booking._id.toString(), booking]));
    const feedbackByBooking = new Map();

    for (const feedback of feedbacks) {
        const bookingId = feedback.booking?.toString?.();
        if (!bookingId) continue;
        if (!feedbackByBooking.has(bookingId)) {
            feedbackByBooking.set(bookingId, []);
        }
        feedbackByBooking.get(bookingId).push(feedback);
    }

    let totalSessionSpend = 0;
    let spendBookingCount = 0;

    for (const [bookingId, bookingFeedbacks] of feedbackByBooking.entries()) {
        const booking = bookingById.get(bookingId);
        const paymentTotal = booking ? getBookingPaymentTotal(booking) : null;
        if (!booking || paymentTotal == null) continue;
        totalSessionSpend += paymentTotal;
        spendBookingCount += 1;
    }

    const avgTrainerRatings = {};
    for (const [key, total] of Object.entries(trainerRatingTotals)) {
        avgTrainerRatings[key] =
            trainerRatingCount > 0 ? Math.round((total / trainerRatingCount) * 10) / 10 : null;
    }

    const sessionSummaries = completedBookings
        .filter((booking) => feedbackByBooking.has(booking._id.toString()))
        .map((booking) => {
            const bookingId = booking._id.toString();
            const sessionFeedbacks = feedbackByBooking.get(bookingId) || [];
            const paymentAmount = getBookingPaymentTotal(booking);
            const sessionSatisfaction = sessionFeedbacks.reduce((sum, feedback) => {
                return sum + (SATISFACTION_SCORES[feedback.overallSatisfaction] || 0);
            }, 0);
            const sessionPositiveStress = sessionFeedbacks.filter((feedback) =>
                STRESS_POSITIVE.has(feedback.stressRelief)
            ).length;

            return {
                bookingId,
                sessionDate: booking.bookingDate,
                responseCount: sessionFeedbacks.length,
                expectedParticipants: getBookingEmployeeCount(booking),
                responseRate:
                    getBookingEmployeeCount(booking) > 0
                        ? Math.round(
                              (sessionFeedbacks.length / getBookingEmployeeCount(booking)) * 100
                          )
                        : 0,
                avgSatisfaction:
                    sessionFeedbacks.length > 0
                        ? Math.round((sessionSatisfaction / sessionFeedbacks.length) * 10) / 10
                        : null,
                wellnessImpactPct:
                    sessionFeedbacks.length > 0
                        ? Math.round((sessionPositiveStress / sessionFeedbacks.length) * 100)
                        : 0,
                paymentAmount,
                costPerResponse:
                    paymentAmount != null && sessionFeedbacks.length > 0
                        ? Math.round(paymentAmount / sessionFeedbacks.length)
                        : null,
            };
        })
        .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
        .slice(0, 10);

    const recentResponses = feedbacks.slice(0, 8).map((feedback) => ({
        id: feedback._id.toString(),
        employeeName: feedback.employeeName || 'Anonymous',
        sessionDate: feedback.sessionDate,
        overallSatisfaction: feedback.overallSatisfaction,
        stressRelief: feedback.stressRelief,
        wantMoreSessions: feedback.wantMoreSessions,
        submittedAt: feedback.createdAt,
    }));

    return {
        summary: {
            totalResponses,
            completedSessions: completedBookings.length,
            sessionsWithFeedback: feedbackByBooking.size,
            expectedParticipants,
            responseRate:
                expectedParticipants > 0
                    ? Math.round((totalResponses / expectedParticipants) * 100)
                    : 0,
            avgSatisfactionScore:
                satisfactionScoreCount > 0
                    ? Math.round((satisfactionScoreSum / satisfactionScoreCount) * 10) / 10
                    : null,
            employeeEngagementPct:
                totalResponses > 0 ? Math.round((positiveEngagementCount / totalResponses) * 100) : 0,
            wellnessImpactPct:
                totalResponses > 0 ? Math.round((positiveStressCount / totalResponses) * 100) : 0,
            costPerParticipant:
                totalResponses > 0 && totalSessionSpend > 0
                    ? Math.round(totalSessionSpend / totalResponses)
                    : null,
            totalSessionSpend: totalSessionSpend > 0 ? totalSessionSpend : null,
            spendSessionsTracked: spendBookingCount,
        },
        overallSatisfaction: toSortedBreakdown(satisfactionCounts),
        stressRelief: toSortedBreakdown(stressCounts),
        wantMoreSessions: toSortedBreakdown(wantMoreCounts),
        enjoyedActivities: toSortedBreakdown(enjoyedActivityCounts),
        preferredTopics: toSortedBreakdown(preferredTopicCounts),
        sessionsAttended: toSortedBreakdown(sessionsAttendedCounts),
        avgTrainerRatings,
        sessionSummaries,
        recentResponses,
    };
};

export {
    createWellnessFeedback,
    queryWellnessFeedback,
    createBookingShareLink,
    getFeedbackContext,
    getCompanyFeedbackAnalytics,
};
