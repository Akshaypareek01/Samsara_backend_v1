import httpStatus from 'http-status';
import { Booking, Trainer, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

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

    // Check if time slot is available
    const isAvailable = await Booking.isTimeSlotAvailable(
        bookingBody.trainer,
        new Date(bookingBody.bookingDate),
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
    return booking.populate(['company', 'trainer']);
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
        populate: options.populate || 'company,trainer',
    };
    const bookings = await Booking.paginate(filter, queryOptions);
    return bookings;
};

/**
 * Get booking by id
 * @param {ObjectId} id
 * @returns {Promise<Booking>}
 */
const getBookingById = async (id) => {
    const booking = await Booking.findById(id).populate(['company', 'trainer']);
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

    // Validate status transitions
    const validTransitions = {
        pending_approval: ['approved', 'rejected', 'cancelled'],
        approved: ['confirmed', 'cancelled'],
        pending: ['confirmed', 'rejected', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
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

    booking.status = status;
    if (trainerNotes) {
        booking.trainerNotes = trainerNotes;
    }

    await booking.save();
    return booking.populate(['company', 'trainer']);
};

/**
 * Cancel booking
 * @param {ObjectId} id
 * @param {ObjectId} userId
 * @param {string} userType - 'company' or 'trainer'
 * @returns {Promise<Booking>}
 */
const cancelBooking = async (id, userId, userType) => {
    const booking = await getBookingById(id);

    // Verify user owns this booking
    if (userType === 'company' && booking.company._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
    }
    if (userType === 'trainer' && booking.trainer._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
    }

    // Can only cancel pending_approval, approved, or confirmed bookings
    if (!['pending_approval', 'approved', 'confirmed'].includes(booking.status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Cannot cancel a ${booking.status} booking`);
    }

    booking.status = 'cancelled';
    await booking.save();
    return booking.populate(['company', 'trainer']);
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
        const checkTrainer = updateBody.trainer || booking.trainer;

        const isAvailable = await Booking.isTimeSlotAvailable(
            checkTrainer,
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
    return booking.populate(['company', 'trainer']);
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

    // Can only approve bookings in pending_approval status
    if (booking.status !== 'pending_approval') {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot approve booking with status ${booking.status}. Only pending_approval bookings can be approved.`
        );
    }

    // Update booking with payment and approval details
    booking.status = 'approved';
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
    return booking.populate(['company', 'trainer', 'approvedBy']);
};

/**
 * Get bookings pending admin approval (for CRM)
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPendingApprovals = async (filter, options) => {
    const pendingFilter = { status: 'pending_approval', ...filter };
    return queryBookings(pendingFilter, options);
};

/**
 * Get trainer's approved bookings only (trainers should only see approved bookings)
 * @param {ObjectId} trainerId
 * @param {Object} filter - Additional filters
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTrainerApprovedBookings = async (trainerId, filter, options) => {
    // Trainers should only see bookings that are approved by admin
    const trainerFilter = {
        trainer: trainerId,
        isApprovedByAdmin: true,
        ...filter
    };
    return queryBookings(trainerFilter, options);
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

    if (booking.status !== 'pending_approval') {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Cannot reject booking with status ${booking.status}`
        );
    }

    booking.status = 'rejected';
    booking.approvedBy = adminId;
    booking.approvedAt = new Date();

    if (adminNotes) {
        booking.adminNotes = adminNotes;
    }

    await booking.save();
    return booking.populate(['company', 'trainer', 'approvedBy']);
};

export default {
    createBooking,
    queryBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    getTrainerBookings,
    getCompanyBookings,
    updateBookingById,
    deleteBookingById,
    approveBookingAndConfirmPayment,
    getPendingApprovals,
    getTrainerApprovedBookings,
    rejectBooking,
};

