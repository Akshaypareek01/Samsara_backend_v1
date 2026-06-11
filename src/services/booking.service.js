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
import {
  AVAILABILITY_OUTSIDE_MESSAGE,
  isWithinWeeklyAvailability,
} from '../utils/trainerAvailabilityUtils.js';

/**
 * Create a booking
 * @param {Object} bookingBody
 * @returns {Promise<Booking>}
 */
const createBooking = async (bookingBody) => {
    // Verify trainer exists
    const trainer = await Trainer.findById(bookingBody.trainer);
    if (!trainer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
    }

    // Verify company exists
    const company = await Company.findById(bookingBody.company);
    if (!company) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
    }

    if (trainer.status === false) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This trainer is inactive and cannot accept bookings.');
    }
    if (trainer.acceptingBookings === false) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'This trainer is not accepting new bookings at the moment.'
        );
    }

    let eapTrainingDoc = null;
    if (bookingBody.eapTraining) {
        eapTrainingDoc = await validateEapTrainingForBooking(
            bookingBody.eapTraining,
            bookingBody.trainer,
            bookingBody.duration
        );
        bookingBody.typeOfTraining = [eapTrainingDoc.title];
    } else {
        // Verify training types are valid for this trainer
        const invalidTypes = bookingBody.typeOfTraining.filter(
            (type) => !trainer.typeOfTraining.includes(type)
        );
        if (invalidTypes.length > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid training types for this trainer: ${invalidTypes.join(', ')}`
            );
        }
    }

    const bookingDate = new Date(bookingBody.bookingDate);
    if (
        !isWithinWeeklyAvailability(
            trainer,
            bookingDate,
            bookingBody.startTime,
            bookingBody.duration
        )
    ) {
        throw new ApiError(httpStatus.BAD_REQUEST, AVAILABILITY_OUTSIDE_MESSAGE);
    }

    // Check if time slot is available (no overlapping bookings)
    const isAvailable = await Booking.isTimeSlotAvailable(
        bookingBody.trainer,
        bookingDate,
        bookingBody.startTime,
        bookingBody.duration
    );

    if (!isAvailable) {
        throw new ApiError(
            httpStatus.CONFLICT,
            'This time slot is not available. The trainer has another booking at this time.'
        );
    }

    const booking = await Booking.create(bookingBody);
    const populated = await booking.populate(['company', 'trainer', 'eapTraining']);
    queueBookingNotification(notifyBookingCreated(populated));
    return populated;
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
    // Add populate option by default
    const queryOptions = {
        ...options,
        populate: options.populate || 'company,trainer,eapTraining',
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
        ]);
    }
    return query.populate(['company', 'trainer', 'eapTraining']);
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
 * Update booking status
 * @param {ObjectId} id
 * @param {string} status
 * @param {string} [trainerNotes]
 * @returns {Promise<Booking>}
 */
const updateBookingStatus = async (id, status, trainerNotes) => {
    const booking = await getBookingById(id);

    // Trainer: pending_approval → approved (accept). Admin: approved → confirmed (separate endpoint).
    const validTransitions = {
        pending_approval: ['approved'],
        approved: [],
        confirmed: ['completed'],
        rejected: [],
        cancelled: [],
        completed: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot change status from ${booking.status} to ${status}`
        );
    }

    const previousStatus = booking.status;

    booking.status = status;
    if (trainerNotes) {
        booking.trainerNotes = trainerNotes;
    }

    await booking.save();
    const populated = await booking.populate(['company', 'trainer', 'eapTraining']);
    queueBookingNotification(notifyBookingStatusChanged(populated, previousStatus));
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
    if (userType === 'trainer' && booking.trainer._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
    }

    if (userType === 'company') {
        const reason = typeof cancellationReason === 'string' ? cancellationReason.trim() : '';
        if (!reason) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cancellation reason is required');
        }
        booking.cancellationReason = reason;
    } else if (cancellationReason && String(cancellationReason).trim()) {
        booking.cancellationReason = String(cancellationReason).trim();
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
    const populated = await booking.populate(['company', 'trainer', 'eapTraining']);
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
    const trainerFilter = { trainer: trainerId, ...filter };
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
const approveBookingAndConfirmPayment = async (id, adminId, paymentDetails, adminNotes) => {
    const booking = await getBookingById(id);

    // Trainer accepted; admin confirms payment and finalizes the meeting
    if (booking.status !== 'approved') {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot approve booking with status ${booking.status}. Only trainer-accepted (approved) bookings can be confirmed by admin.`
        );
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
    const populated = await booking.populate(['company', 'trainer', 'approvedBy']);
    queueBookingNotification(notifyBookingStatusChanged(populated, previousStatus));
    return populated;
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
        trainer: trainerId,
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

    const match = {
        [actorField]: oid,
        bookingDate: { $gte: start, $lte: end },
    };

    const monthBookings = await Booking.find(match)
        .populate('trainer', 'name specialistIn acceptingBookings')
        .populate('company', 'companyName name')
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
        calendarDays[d].push({
            id: String(b._id),
            trainerId: b.trainer && typeof b.trainer === 'object' && b.trainer._id
                ? String(b.trainer._id)
                : b.trainer
                  ? String(b.trainer)
                  : undefined,
            status: b.status,
            startTime: b.startTime,
            companyName: role === 'trainer' ? companyLabel(b) : undefined,
            trainerName: role === 'company' ? trainerLabel(b) : undefined,
            isPaid: Boolean(b.paymentStatus?.isPaid),
            duration: b.duration,
            typeOfTraining: b.typeOfTraining || [],
        });
    }

    const activeReservations = statusCounts.confirmed || 0;
    const pendingTrainer = statusCounts.pending_approval || 0;
    const pendingAdmin = statusCounts.approved || 0;
    const waitingList = pendingTrainer + pendingAdmin;
    const totalBookings = monthBookings.length;

    const recentRaw = await Booking.find({ [actorField]: oid })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('trainer', 'name')
        .populate('company', 'companyName name')
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

    const classSchedule = monthBookings.map((b, idx) => {
        const trainerName =
            b.trainer && typeof b.trainer === 'object' && b.trainer.name
                ? b.trainer.name
                : 'Trainer';
        const trainerId =
            b.trainer && typeof b.trainer === 'object' && b.trainer._id
                ? String(b.trainer._id)
                : b.trainer
                  ? String(b.trainer)
                  : undefined;
        const dt = new Date(b.bookingDate);
        const types = (b.typeOfTraining || []).join(', ') || 'Session';
        return {
            dateLabel: `${dt.toLocaleDateString(undefined, { weekday: 'short' })}, ${b.startTime}`,
            dateSubLabel: formatShortDate(b.bookingDate),
            dotColor: statusColor(b.status),
            classType: types,
            trainerInitials: initials(trainerName),
            trainerBg: trainerBgPalette[idx % trainerBgPalette.length],
            trainerName,
            trainerId,
            bookingId: String(b._id),
            capacity: 1,
            booked: 1,
            waitingList: b.status === 'pending_approval' || b.status === 'approved' ? 1 : 0,
            status: statusUi(b.status),
        };
    });

    const trainerMap = new Map();
    for (const b of monthBookings) {
        const tid =
            b.trainer && b.trainer._id
                ? String(b.trainer._id)
                : b.trainer
                  ? String(b.trainer)
                  : null;
        if (!tid || trainerMap.has(tid)) continue;
        const name =
            b.trainer && typeof b.trainer === 'object' && b.trainer.name
                ? b.trainer.name
                : 'Trainer';
        const spec =
            b.trainer && typeof b.trainer === 'object' && b.trainer.specialistIn
                ? (Array.isArray(b.trainer.specialistIn)
                      ? b.trainer.specialistIn.join(', ')
                      : b.trainer.specialistIn)
                : 'Trainer';
        const accepting = !(
            b.trainer &&
            typeof b.trainer === 'object' &&
            b.trainer.acceptingBookings === false
        );
        trainerMap.set(tid, {
            initials: initials(name),
            avatarBg: trainerBgPalette[trainerMap.size % trainerBgPalette.length],
            name,
            speciality: spec,
            status: accepting ? 'Available' : 'Unavailable',
        });
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

