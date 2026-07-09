import httpStatus from 'http-status';
import { Booking, Trainer, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
import { validateEapTrainingForBooking } from './eap-training.service.js';
import {
  getBookingChangedFieldLabels,
  notifyBookingCreated,
  notifyBookingStatusChanged,
  notifyBookingUpdated,
  queueBookingNotification,
} from './bookingNotification.service.js';
import bookingInvoiceService from './booking-invoice.service.js';
import {
  AVAILABILITY_OUTSIDE_MESSAGE,
  isWithinWeeklyAvailability,
} from '../utils/trainerAvailabilityUtils.js';
import {
  bookingIncludesTrainer,
  getSessionsForBooking,
  getTrainerApprovalProgress,
  getTrainerIdFromRef,
  trainerBookingFilter,
} from '../utils/bookingSessionUtils.js';

const BOOKING_POPULATE = [
    'company',
    'trainer',
    'eapTraining',
    { path: 'sessions.trainer' },
    { path: 'sessions.eapTraining' },
];

/**
 * Normalize incoming payload into session rows.
 *
 * @param {Object} bookingBody - Create payload.
 * @returns {Array<Object>}
 */
const normalizeCreateSessions = (bookingBody) => {
    if (Array.isArray(bookingBody.sessions) && bookingBody.sessions.length > 0) {
        return bookingBody.sessions;
    }
    return [
        {
            trainer: bookingBody.trainer,
            startTime: bookingBody.startTime,
            duration: bookingBody.duration,
            typeOfTraining: bookingBody.typeOfTraining,
            eapTraining: bookingBody.eapTraining,
        },
    ];
};

/**
 * Validate a single session row at create time.
 *
 * @param {Object} session - Session input.
 * @param {Date} bookingDate - Shared booking date.
 * @param {Set<string>} usedTrainerIds - Trainers already in this booking.
 * @returns {Promise<Object>} Normalized session document fields.
 */
const validateAndBuildSession = async (session, bookingDate, usedTrainerIds) => {
    const trainerId = String(session.trainer);
    if (usedTrainerIds.has(trainerId)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Each trainer can only appear once per booking.'
        );
    }
    usedTrainerIds.add(trainerId);

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
    }
    if (trainer.status === false) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Trainer ${trainer.name} is inactive and cannot accept bookings.`);
    }
    if (trainer.acceptingBookings === false) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Trainer ${trainer.name} is not accepting new bookings at the moment.`
        );
    }

    let typeOfTraining = session.typeOfTraining;
    let eapTraining = session.eapTraining;

    if (eapTraining) {
        const eapTrainingDoc = await validateEapTrainingForBooking(
            eapTraining,
            trainerId,
            session.duration
        );
        typeOfTraining = [eapTrainingDoc.title];
    } else {
        const invalidTypes = (typeOfTraining || []).filter(
            (type) => !trainer.typeOfTraining.includes(type)
        );
        if (invalidTypes.length > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid training types for ${trainer.name}: ${invalidTypes.join(', ')}`
            );
        }
    }

    if (!isWithinWeeklyAvailability(trainer, bookingDate, session.startTime, session.duration)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `${trainer.name}: ${AVAILABILITY_OUTSIDE_MESSAGE}`
        );
    }

    const dayBlocked = await Booking.isTrainerDayBlocked(trainerId, bookingDate);
    if (dayBlocked) {
        throw new ApiError(
            httpStatus.CONFLICT,
            `${trainer.name} already has a confirmed booking on this date.`
        );
    }

    const timeAvailable = await Booking.isSessionTimeAvailable(
        trainerId,
        bookingDate,
        session.startTime,
        session.duration
    );
    if (!timeAvailable) {
        throw new ApiError(
            httpStatus.CONFLICT,
            `${trainer.name} has another booking overlapping ${session.startTime} on this date.`
        );
    }

    return {
        trainer: trainerId,
        startTime: session.startTime,
        duration: session.duration,
        typeOfTraining,
        eapTraining: eapTraining || undefined,
        trainerStatus: 'pending',
    };
};

/**
 * Recompute parent booking status from session trainer approvals.
 *
 * @param {import('../models/booking.model.js').default} booking - Booking document.
 */
const syncParentStatusFromSessions = (booking) => {
    const sessions = booking.sessions || [];
    if (sessions.length === 0) return;

    if (sessions.some((s) => s.trainerStatus === 'rejected')) {
        booking.status = 'rejected';
        return;
    }
    if (sessions.every((s) => s.trainerStatus === 'approved')) {
        if (['pending_approval', 'approved'].includes(booking.status)) {
            booking.status = 'approved';
        }
        return;
    }
    if (booking.status === 'pending_approval' || booking.status === 'approved') {
        booking.status = 'pending_approval';
    }
};

/**
 * Create a booking (single or multi-session).
 * @param {Object} bookingBody
 * @returns {Promise<Booking>}
 */
const createBooking = async (bookingBody) => {
    const company = await Company.findById(bookingBody.company);
    if (!company) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
    }

    const sessionInputs = normalizeCreateSessions(bookingBody);
    if (sessionInputs.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'At least one session is required.');
    }
    if (sessionInputs.length > 10) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'A booking cannot have more than 10 sessions.');
    }

    const bookingDate = new Date(bookingBody.bookingDate);
    const usedTrainerIds = new Set();
    const builtSessions = [];

    for (const session of sessionInputs) {
        builtSessions.push(await validateAndBuildSession(session, bookingDate, usedTrainerIds));
    }

    const first = builtSessions[0];
    const doc = {
        company: bookingBody.company,
        bookingDate,
        notes: bookingBody.notes,
        trainer: first.trainer,
        startTime: first.startTime,
        duration: first.duration,
        typeOfTraining: first.typeOfTraining,
        eapTraining: first.eapTraining,
        sessions: builtSessions,
        status: 'pending_approval',
    };

    const booking = await Booking.create(doc);
    const populated = await booking.populate(BOOKING_POPULATE);
    queueBookingNotification(notifyBookingCreated(populated));
    return populated;
};

/**
 * Pre-check session availability without creating a booking.
 *
 * @param {Object} body - { bookingDate, sessions: [{ trainer, startTime, duration }] }
 * @returns {Promise<{ results: Array<{ index: number, available: boolean, reason?: string }> }>}
 */
const checkBookingAvailability = async (body) => {
    const bookingDate = new Date(body.bookingDate);
    const results = [];

    for (let i = 0; i < body.sessions.length; i++) {
        const session = body.sessions[i];
        const trainerId = String(session.trainer);
        try {
            const trainer = await Trainer.findById(trainerId);
            if (!trainer) {
                results.push({ index: i, available: false, reason: 'Trainer not found' });
                continue;
            }
            if (trainer.status === false) {
                results.push({ index: i, available: false, reason: 'Trainer is inactive' });
                continue;
            }
            if (trainer.acceptingBookings === false) {
                results.push({ index: i, available: false, reason: 'Trainer is not accepting bookings' });
                continue;
            }
            if (!isWithinWeeklyAvailability(trainer, bookingDate, session.startTime, session.duration)) {
                results.push({ index: i, available: false, reason: AVAILABILITY_OUTSIDE_MESSAGE });
                continue;
            }
            const dayBlocked = await Booking.isTrainerDayBlocked(trainerId, bookingDate);
            if (dayBlocked) {
                results.push({
                    index: i,
                    available: false,
                    reason: 'Trainer already has a confirmed booking on this date',
                });
                continue;
            }
            const timeAvailable = await Booking.isSessionTimeAvailable(
                trainerId,
                bookingDate,
                session.startTime,
                session.duration
            );
            if (!timeAvailable) {
                results.push({
                    index: i,
                    available: false,
                    reason: 'Time slot overlaps with another active booking',
                });
                continue;
            }
            results.push({ index: i, available: true });
        } catch (err) {
            results.push({
                index: i,
                available: false,
                reason: err.message || 'Availability check failed',
            });
        }
    }

    return { results };
};

/**
 * Query for bookings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {string} [options.populate] - Populate fields
 * @returns {Promise<QueryResult>}
 */
const queryBookings = async (filter, options) => {
    const queryOptions = {
        ...options,
        populate: options.populate || 'company,trainer,eapTraining,sessions.trainer,sessions.eapTraining',
    };
    const bookings = await Booking.paginate(filter, queryOptions);
    return bookings;
};

/**
 * Populate paths for a booking document.
 *
 * @param {import('mongoose').Query} query - Booking query.
 * @param {object} [opts]
 * @param {boolean} [opts.trainerPortal] - Limit company fields for trainer viewers.
 */
const applyBookingPopulates = (query, opts = {}) => {
    if (opts.trainerPortal) {
        return query.populate([
            { path: 'company', select: 'companyName companyLogo' },
            { path: 'trainer' },
            { path: 'eapTraining' },
            { path: 'sessions.trainer' },
            { path: 'sessions.eapTraining' },
        ]);
    }
    return query.populate(BOOKING_POPULATE);
};

/**
 * Get booking by id with role-appropriate populated fields.
 *
 * @param {import('mongoose').Types.ObjectId|string} id - Booking id.
 * @param {object} [opts]
 * @param {boolean} [opts.trainerPortal] - Limit company fields for trainer viewers.
 * @returns {Promise<import('../models/booking.model.js').default>}
 */
const getBookingById = async (id, opts = {}) => {
    const booking = await applyBookingPopulates(Booking.findById(id), opts);
    if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    return booking;
};

/**
 * Update booking status (trainer session approval or completion).
 * @param {ObjectId} id
 * @param {string} status
 * @param {string} [trainerNotes]
 * @param {ObjectId} [trainerId] - Authenticated trainer id.
 * @returns {Promise<Booking>}
 */
const updateBookingStatus = async (id, status, trainerNotes, trainerId) => {
    const booking = await getBookingById(id);
    const previousStatus = booking.status;

    if (status === 'completed') {
        if (booking.status !== 'confirmed') {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Cannot change status from ${booking.status} to completed`
            );
        }
        if (trainerId && !bookingIncludesTrainer(booking, trainerId)) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only complete bookings assigned to you');
        }
        booking.status = 'completed';
        if (trainerNotes) booking.trainerNotes = trainerNotes;
        await booking.save();
        const populated = await booking.populate(BOOKING_POPULATE);
        queueBookingNotification(notifyBookingStatusChanged(populated, previousStatus));
        return populated;
    }

    if (!['approved', 'rejected'].includes(status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Trainers can only approve or reject their session');
    }

    if (!trainerId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Trainer id is required');
    }

    if (!['pending_approval', 'approved'].includes(booking.status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot change session status when booking is ${booking.status}`
        );
    }

    const sessions = booking.sessions || [];
    if (sessions.length === 0) {
        if (getTrainerIdFromRef(booking.trainer) !== String(trainerId)) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only update bookings assigned to you');
        }
        if (status === 'approved') {
            const dayBlocked = await Booking.isTrainerDayBlocked(
                trainerId,
                booking.bookingDate,
                booking._id
            );
            if (dayBlocked) {
                throw new ApiError(
                    httpStatus.CONFLICT,
                    'You already have a confirmed booking on this date.'
                );
            }
            booking.status = 'approved';
            if (trainerNotes) booking.trainerNotes = trainerNotes;
        } else {
            booking.status = 'rejected';
            if (trainerNotes) booking.trainerNotes = trainerNotes;
        }
    } else {
        const sessionIdx = sessions.findIndex(
            (s) => getTrainerIdFromRef(s.trainer) === String(trainerId)
        );
        if (sessionIdx === -1) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You are not assigned to any session in this booking');
        }

        const session = sessions[sessionIdx];
        if (session.trainerStatus !== 'pending') {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Your session is already ${session.trainerStatus}`
            );
        }

        if (status === 'approved') {
            const dayBlocked = await Booking.isTrainerDayBlocked(
                trainerId,
                booking.bookingDate,
                booking._id
            );
            if (dayBlocked) {
                throw new ApiError(
                    httpStatus.CONFLICT,
                    'You already have a confirmed booking on this date.'
                );
            }
            session.trainerStatus = 'approved';
            session.approvedAt = new Date();
        } else {
            session.trainerStatus = 'rejected';
        }

        if (trainerNotes) {
            session.trainerNotes = trainerNotes;
        }

        syncParentStatusFromSessions(booking);
    }

    await booking.save();
    const populated = await booking.populate(BOOKING_POPULATE);
    const progress = getTrainerApprovalProgress(populated);
    queueBookingNotification(
        notifyBookingStatusChanged(populated, previousStatus, { approvalProgress: progress })
    );
    return populated;
};

/**
 * Cancel booking
 * @param {ObjectId} id
 * @param {ObjectId} userId
 * @param {string} userType - 'company' or 'trainer'
 * @param {string} [cancellationReason] - Reason for cancellation
 * @returns {Promise<Booking>}
 */
const cancelBooking = async (id, userId, userType, cancellationReason) => {
    const booking = await getBookingById(id);

    // Verify user owns this booking
    if (userType === 'company' && booking.company._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
    }
    if (userType === 'trainer' && !bookingIncludesTrainer(booking, userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
    }

    if (userType === 'company' || userType === 'trainer') {
        const reason = typeof cancellationReason === 'string' ? cancellationReason.trim() : '';
        if (!reason) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cancellation reason is required');
        }
        booking.cancellationReason = reason;
    }

    if (!['pending_approval', 'approved'].includes(booking.status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot cancel a ${booking.status} booking. Confirmed sessions cannot be cancelled.`
        );
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save();
    const populated = await booking.populate(BOOKING_POPULATE);
    queueBookingNotification(
        notifyBookingStatusChanged(populated, previousStatus, { cancelledBy: userType })
    );
    return populated;
};

/**
 * Admin cancels a booking at any stage (except already cancelled/rejected).
 * @param {import('mongoose').Types.ObjectId|string} id
 * @param {import('mongoose').Types.ObjectId|string} adminId
 * @param {string} adminNotes - Required remark explaining the cancellation
 * @returns {Promise<Booking>}
 */
const adminCancelBooking = async (id, adminId, adminNotes) => {
    const booking = await getBookingById(id);
    const notes = typeof adminNotes === 'string' ? adminNotes.trim() : '';

    if (!notes) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cancellation remark is required');
    }

    if (['cancelled', 'rejected'].includes(booking.status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot cancel a booking that is already ${booking.status}`
        );
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    booking.adminNotes = notes;
    booking.cancellationReason = notes;
    booking.approvedBy = adminId;
    booking.approvedAt = new Date();

    await booking.save();
    const populated = await booking.populate(['company', 'trainer', 'approvedBy']);
    queueBookingNotification(
        notifyBookingStatusChanged(populated, previousStatus, { cancelledBy: 'admin' })
    );
    return populated;
};

/**
 * Get trainer's bookings
 * @param {ObjectId} trainerId
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTrainerBookings = async (trainerId, filter, options) => {
    const trainerFilter = { ...trainerBookingFilter(trainerId), ...filter };
    return queryBookings(trainerFilter, options);
};

/**
 * Get company's bookings
 * @param {ObjectId} companyId
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getCompanyBookings = async (companyId, filter, options) => {
    const companyFilter = { company: companyId, ...filter };
    return queryBookings(companyFilter, options);
};

/**
 * Update booking by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Booking>}
 */
const updateBookingById = async (id, updateBody) => {
    const booking = await getBookingById(id);
    const beforeSnapshot = {
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        duration: booking.duration,
        trainer: booking.trainer,
        typeOfTraining: [...(booking.typeOfTraining || [])],
        notes: booking.notes,
    };

    // If updating date/time, check availability
    if (
        updateBody.bookingDate ||
        updateBody.startTime ||
        updateBody.duration ||
        updateBody.trainer
    ) {
        const checkDate = updateBody.bookingDate
            ? new Date(updateBody.bookingDate)
            : booking.bookingDate;
        const checkStartTime = updateBody.startTime || booking.startTime;
        const checkDuration = updateBody.duration || booking.duration;
        const checkTrainerId = updateBody.trainer || booking.trainer;
        const trainerDoc = await Trainer.findById(checkTrainerId);
        if (!trainerDoc) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
        }

        if (!isWithinWeeklyAvailability(trainerDoc, checkDate, checkStartTime, checkDuration)) {
            throw new ApiError(httpStatus.BAD_REQUEST, AVAILABILITY_OUTSIDE_MESSAGE);
        }

        const isAvailable = await Booking.isTimeSlotAvailable(
            checkTrainerId,
            checkDate,
            checkStartTime,
            checkDuration,
            id
        );

        if (!isAvailable) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'This time slot is not available. The trainer has another booking at this time.'
            );
        }
    }

    Object.assign(booking, updateBody);
    await booking.save();
    const populated = await booking.populate(['company', 'trainer', 'eapTraining']);
    const changedFields = getBookingChangedFieldLabels(beforeSnapshot, populated);
    queueBookingNotification(notifyBookingUpdated(populated, changedFields));
    return populated;
};

/**
 * Delete booking by id
 * @param {ObjectId} id
 * @returns {Promise<Booking>}
 */
const deleteBookingById = async (id) => {
    const booking = await getBookingById(id);
    await booking.deleteOne();
    return booking;
};

/**
 * Admin approves booking and confirms payment
 * @param {ObjectId} id - Booking ID
 * @param {ObjectId} adminId - Admin ID
 * @param {Object} paymentDetails - Payment information
 * @param {string} paymentDetails.paymentMode - Mode of payment
 * @param {string} paymentDetails.transactionId - Transaction ID
 * @param {string} paymentDetails.paymentType - Type of payment
 * @param {number} paymentDetails.paymentAmount - Payment amount
 * @param {string} [adminNotes] - Optional admin notes
 * @returns {Promise<Booking>}
 */
const approveBookingAndConfirmPayment = async (id, adminId, paymentDetails, adminNotes, trainerFeeLines) => {
    const booking = await getBookingById(id);

    if (booking.status !== 'approved') {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot approve booking with status ${booking.status}. Only trainer-accepted (approved) bookings can be confirmed by admin.`
        );
    }

    if (!Array.isArray(trainerFeeLines) || trainerFeeLines.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Trainer fee lines are required');
    }

    const sessions = getSessionsForBooking(booking);
    for (const session of sessions) {
        const trainerId = getTrainerIdFromRef(session.trainer);
        if (!trainerId) continue;
        const dayBlocked = await Booking.isTrainerDayBlocked(trainerId, booking.bookingDate, booking._id);
        if (dayBlocked) {
            throw new ApiError(
                httpStatus.CONFLICT,
                `Cannot confirm: a trainer already has a confirmed booking on this date.`
            );
        }
    }

    const previousStatus = booking.status;

    booking.status = 'confirmed';
    booking.isApprovedByAdmin = true;
    booking.approvedBy = adminId;
    booking.approvedAt = new Date();
    booking.paymentStatus = 'confirmed';
    booking.paymentMode = paymentDetails.paymentMode;
    booking.transactionId = paymentDetails.transactionId;
    booking.paymentType = paymentDetails.paymentType;
    booking.paymentAmount = paymentDetails.paymentAmount;

    if (adminNotes) {
        booking.adminNotes = adminNotes;
    }

    await booking.save();

    const invoice = await bookingInvoiceService.createBookingInvoice({
        booking,
        adminId,
        companyPayment: {
            paymentMode: paymentDetails.paymentMode,
            transactionId: paymentDetails.transactionId,
            paymentType: paymentDetails.paymentType,
            paymentAmount: paymentDetails.paymentAmount,
            adminNotes,
        },
        trainerFeeLines,
    });

    const populated = await booking.populate([...BOOKING_POPULATE, 'approvedBy']);
    queueBookingNotification(notifyBookingStatusChanged(populated, previousStatus));
    return { booking: populated, invoice };
};

/**
 * Get bookings pending admin approval (for CRM)
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPendingApprovals = async (filter, options) => {
    const pendingFilter = { status: 'approved', ...filter };
    return queryBookings(pendingFilter, options);
};

/**
 * Get trainer's bookings (all statuses except rejected for list views).
 * @param {ObjectId} trainerId
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
/**
 * Strip company booking refs to name + logo only (trainer portal privacy).
 *
 * @param {object|null} company - Populated company subdocument.
 * @returns {object|null}
 */
const sanitizeCompanyRefForTrainerPortal = (company) => {
    if (!company || typeof company !== 'object') {
        return company;
    }
    return {
        _id: company._id,
        companyName: company.companyName || company.name,
        companyLogo: company.companyLogo,
    };
};

/**
 * Redact company details on paginated booking results for trainers.
 *
 * @param {import('../models/plugins/paginate.plugin.js').QueryResult} result
 * @returns {typeof result}
 */
const redactTrainerBookingListCompanies = (result) => {
    if (!result?.results?.length) {
        return result;
    }
    result.results = result.results.map((booking) => {
        const doc = booking.toObject ? booking.toObject() : { ...booking };
        doc.company = sanitizeCompanyRefForTrainerPortal(doc.company);
        return doc;
    });
    return result;
};

const getTrainerApprovedBookings = async (trainerId, filter, options) => {
    const trainerFilter = {
        ...trainerBookingFilter(trainerId),
        status: { $ne: 'rejected' },
        ...filter,
    };
    const result = await queryBookings(trainerFilter, options);
    return redactTrainerBookingListCompanies(result);
};

/**
 * Reject booking (admin rejects)
 * @param {ObjectId} id - Booking ID
 * @param {ObjectId} adminId - Admin ID
 * @param {string} [adminNotes] - Reason for rejection
 * @returns {Promise<Booking>}
 */
const rejectBooking = async (id, adminId, adminNotes) => {
    const booking = await getBookingById(id);

    if (booking.status !== 'approved' && booking.status !== 'pending_approval') {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot reject booking with status ${booking.status}`
        );
    }

    const previousStatus = booking.status;
    booking.status = 'rejected';
    booking.approvedBy = adminId;
    booking.approvedAt = new Date();

    if (adminNotes) {
        booking.adminNotes = adminNotes;
    }

    await booking.save();
    const populated = await booking.populate(['company', 'trainer', 'approvedBy']);
    queueBookingNotification(notifyBookingStatusChanged(populated, previousStatus));
    return populated;
};

/**
 * Month summary for company or trainer dashboard (bookings UI).
 * @param {import('mongoose').Types.ObjectId|string} actorId
 * @param {string} monthStr - YYYY-MM
 * @param {'company'|'trainer'} role
 * @returns {Promise<Object>}
 */
const getActorBookingMonthSummary = async (actorId, monthStr, role) => {
    if (!/^\d{4}-\d{2}$/.test(monthStr)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'month must be YYYY-MM');
    }
    const [year, month] = monthStr.split('-').map((n) => parseInt(n, 10));
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const actorField = role === 'company' ? 'company' : 'trainer';
    const oid = mongoose.Types.ObjectId.isValid(actorId) ? new mongoose.Types.ObjectId(actorId) : actorId;

    const match =
        role === 'trainer'
            ? { ...trainerBookingFilter(oid), bookingDate: { $gte: start, $lte: end } }
            : { company: oid, bookingDate: { $gte: start, $lte: end } };

    const monthBookings = await Booking.find(match)
        .populate('trainer', 'name specialistIn acceptingBookings')
        .populate('company', 'companyName name')
        .populate('sessions.trainer', 'name specialistIn acceptingBookings')
        .sort({ bookingDate: 1, startTime: 1 })
        .lean();

    const companyLabel = (b) => {
        if (b.company && typeof b.company === 'object') {
            return b.company.companyName || b.company.name || 'Company';
        }
        return 'Company';
    };

    const trainerLabel = (b) => {
        if (b.trainer && typeof b.trainer === 'object' && b.trainer.name) {
            return b.trainer.name;
        }
        return 'Trainer';
    };

    const statusCounts = {};
    for (const b of monthBookings) {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const calendarDotCounts = {};
    const calendarDays = {};
    for (const b of monthBookings) {
        const d = new Date(b.bookingDate).getDate();
        calendarDotCounts[d] = (calendarDotCounts[d] || 0) + 1;
        if (!calendarDays[d]) {
            calendarDays[d] = [];
        }

        const sessions = getSessionsForBooking(b);
        const sessionCount = sessions.length;

        if (role === 'company') {
            calendarDays[d].push({
                id: String(b._id),
                trainerId: b.trainer && typeof b.trainer === 'object' && b.trainer._id
                    ? String(b.trainer._id)
                    : b.trainer
                      ? String(b.trainer)
                      : undefined,
                status: b.status,
                startTime: b.startTime,
                trainerName: trainerLabel(b),
                isPaid: Boolean(b.paymentStatus?.isPaid),
                duration: b.duration,
                typeOfTraining: b.typeOfTraining || [],
                cancellationReason: b.cancellationReason || undefined,
                sessionCount,
                sessions: sessions.map((s) => ({
                    startTime: s.startTime,
                    duration: s.duration,
                    trainerName:
                        s.trainer && typeof s.trainer === 'object' && s.trainer.name
                            ? s.trainer.name
                            : 'Trainer',
                    typeOfTraining: s.typeOfTraining || [],
                    trainerStatus: s.trainerStatus,
                })),
            });
        } else {
            for (const s of sessions) {
                const sTrainerId = getTrainerIdFromRef(s.trainer);
                if (sTrainerId !== String(oid)) continue;
                calendarDays[d].push({
                    id: String(b._id),
                    trainerId: sTrainerId,
                    status: b.status,
                    startTime: s.startTime,
                    companyName: companyLabel(b),
                    isPaid: Boolean(b.paymentStatus?.isPaid),
                    duration: s.duration,
                    typeOfTraining: s.typeOfTraining || [],
                    cancellationReason: b.cancellationReason || undefined,
                    sessionCount,
                    trainerStatus: s.trainerStatus,
                });
            }
        }
    }

    const activeReservations = statusCounts.confirmed || 0;
    const pendingTrainer = statusCounts.pending_approval || 0;
    const pendingAdmin = statusCounts.approved || 0;
    const waitingList = pendingTrainer + pendingAdmin;
    const totalBookings = monthBookings.length;

    const recentRaw = await Booking.find(
        role === 'trainer' ? trainerBookingFilter(oid) : { company: oid }
    )
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('trainer', 'name')
        .populate('company', 'companyName name')
        .populate('sessions.trainer', 'name')
        .lean();

    const statusColor = (s) => {
        const map = {
            pending_approval: '#F59E0B',
            approved: '#22C55E',
            confirmed: '#3B82F6',
            completed: '#6366F1',
            rejected: '#EF4444',
            cancelled: '#9CA3AF',
        };
        return map[s] || '#F97316';
    };

    const formatShortDate = (d) => {
        const dt = new Date(d);
        return dt.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const relativeTime = (d) => {
        const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
        if (sec < 60) return 'just now';
        if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
        return `${Math.floor(sec / 86400)} d ago`;
    };

    const recentActivities = recentRaw.map((b) => {
        const label = role === 'trainer' ? companyLabel(b) : trainerLabel(b);
        return {
            color: statusColor(b.status),
            title: `Booking ${String(b.status).replace(/_/g, ' ')}`,
            sub: `${label} · ${formatShortDate(b.bookingDate)}`,
            time: relativeTime(b.updatedAt),
        };
    });

    const dotPalette = ['#F97316', '#EF4444', '#3B82F6', '#22C55E'];
    const calendarDots = {};
    Object.entries(calendarDotCounts).forEach(([day, count]) => {
        const n = Number(day);
        calendarDots[n] = Array.from({ length: Math.min(count, 4) }, (_, i) => dotPalette[i % dotPalette.length]);
    });

    const statusUi = (s) => {
        if (s === 'confirmed') return 'Active';
        if (s === 'approved') return 'Nearly Full';
        if (s === 'pending_approval') return 'Nearly Full';
        if (s === 'completed') return 'Full';
        return 'Active';
    };

    const initials = (name) => {
        if (!name || typeof name !== 'string') return '?';
        const p = name.split(/\s+/).filter(Boolean);
        if (p.length === 0) return '?';
        if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
        return (p[0][0] + p[1][0]).toUpperCase();
    };

    const trainerBgPalette = ['#DBEAFE', '#FCE7F3', '#D1FAE5', '#FEF9C3', '#EDE9FE'];

    const classSchedule = [];
    monthBookings.forEach((b, idx) => {
        const sessions = getSessionsForBooking(b);
        sessions.forEach((s, sIdx) => {
            if (role === 'trainer' && getTrainerIdFromRef(s.trainer) !== String(oid)) {
                return;
            }
            const trainerName =
                s.trainer && typeof s.trainer === 'object' && s.trainer.name
                    ? s.trainer.name
                    : trainerLabel(b);
            const trainerId = getTrainerIdFromRef(s.trainer) || undefined;
            const dt = new Date(b.bookingDate);
            const types = (s.typeOfTraining || []).join(', ') || 'Session';
            classSchedule.push({
                dateLabel: `${dt.toLocaleDateString(undefined, { weekday: 'short' })}, ${s.startTime}`,
                dateSubLabel: formatShortDate(b.bookingDate),
                dotColor: statusColor(b.status),
                classType: types,
                trainerInitials: initials(trainerName),
                trainerBg: trainerBgPalette[(idx + sIdx) % trainerBgPalette.length],
                trainerName,
                trainerId,
                bookingId: String(b._id),
                capacity: 1,
                booked: 1,
                waitingList: b.status === 'pending_approval' || b.status === 'approved' ? 1 : 0,
                status: statusUi(b.status),
                sessionCount: sessions.length,
            });
        });
    });

    const trainerMap = new Map();
    for (const b of monthBookings) {
        for (const s of getSessionsForBooking(b)) {
            const tid = getTrainerIdFromRef(s.trainer);
            if (!tid || trainerMap.has(tid)) continue;
            const name =
                s.trainer && typeof s.trainer === 'object' && s.trainer.name
                    ? s.trainer.name
                    : trainerLabel(b);
            const spec =
                s.trainer && typeof s.trainer === 'object' && s.trainer.specialistIn
                    ? (Array.isArray(s.trainer.specialistIn)
                          ? s.trainer.specialistIn.join(', ')
                          : s.trainer.specialistIn)
                    : 'Trainer';
            const accepting = !(
                s.trainer &&
                typeof s.trainer === 'object' &&
                s.trainer.acceptingBookings === false
            );
            trainerMap.set(tid, {
                initials: initials(name),
                avatarBg: trainerBgPalette[trainerMap.size % trainerBgPalette.length],
                name,
                speciality: spec,
                status: accepting ? 'Available' : 'Unavailable',
            });
        }
    }
    const trainerAvailability = [...trainerMap.values()];

    const waitingListGroups = [];
    if (pendingTrainer > 0) {
        waitingListGroups.push({
            title: `Pending trainer approval (${pendingTrainer})`,
            count: pendingTrainer,
            people: monthBookings
                .filter((x) => x.status === 'pending_approval')
                .slice(0, 5)
                .map((x) => {
                    const nm =
                        role === 'company'
                            ? trainerLabel(x)
                            : companyLabel(x);
                    return `${nm} · ${formatShortDate(x.bookingDate)}`;
                }),
        });
    }
    if (pendingAdmin > 0) {
        waitingListGroups.push({
            title: `Pending admin approval (${pendingAdmin})`,
            count: pendingAdmin,
            people: monthBookings
                .filter((x) => x.status === 'approved')
                .slice(0, 5)
                .map((x) => {
                    const nm =
                        role === 'company'
                            ? trainerLabel(x)
                            : companyLabel(x);
                    return `${nm} · ${formatShortDate(x.bookingDate)}`;
                }),
        });
    }

    let occupancyRate = '—';
    if (totalBookings > 0) {
        const pct = Math.round((activeReservations / totalBookings) * 100);
        occupancyRate = `${pct}%`;
    }

    return {
        month: monthStr,
        totals: {
            totalBookings,
            activeReservations,
            waitingList,
            occupancyRate,
            statusCounts,
        },
        calendarDots,
        calendarDays,
        recentActivities,
        classSchedule,
        trainerAvailability,
        waitingListGroups,
    };
};

export default {
    createBooking,
    checkBookingAvailability,
    queryBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    adminCancelBooking,
    getTrainerBookings,
    getCompanyBookings,
    updateBookingById,
    deleteBookingById,
    approveBookingAndConfirmPayment,
    getPendingApprovals,
    getTrainerApprovedBookings,
    rejectBooking,
    getActorBookingMonthSummary,
};

