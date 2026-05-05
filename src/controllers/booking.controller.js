import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import bookingService from '../services/booking.service.js';

/**
 * Create a new booking
 */
const createBooking = catchAsync(async (req, res) => {
    const bookingBody = { ...req.body };
    if (req.user.role === 'company') {
        bookingBody.company = req.user.id;
    }
    const booking = await bookingService.createBooking(bookingBody);
    res.status(httpStatus.CREATED).send(booking);
});

/**
 * Get all bookings with pagination and filtering
 */
const getAllBookings = catchAsync(async (req, res) => {
    if (req.user.role === 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Companies cannot list all bookings');
    }
    const filter = pick(req.query, ['company', 'trainer', 'status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.queryBookings(filter, options);
    res.send(result);
});

/**
 * Get current user's bookings (works for both trainer and company)
 */
const getMyBookings = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    let result;
    // Check if user is a trainer or company based on the user object
    if (req.user.role === 'trainer') {
        // Trainers only see approved bookings
        result = await bookingService.getTrainerApprovedBookings(req.user.id, filter, options);
    } else if (req.user.role === 'company') {
        result = await bookingService.getCompanyBookings(req.user.id, filter, options);
    } else {
        return res.status(httpStatus.FORBIDDEN).json({
            status: 'fail',
            message: 'Only trainers and companies can view bookings',
        });
    }

    res.send(result);
});

/**
 * Dashboard summary for current month (company or trainer).
 * Query: month=YYYY-MM (required)
 */
const getMyBookingsSummary = catchAsync(async (req, res) => {
    const { month } = req.query;
    if (!month || typeof month !== 'string') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'month query is required (YYYY-MM)');
    }
    if (req.user.role === 'company') {
        const data = await bookingService.getActorBookingMonthSummary(req.user.id, month, 'company');
        return res.send(data);
    }
    if (req.user.role === 'trainer') {
        const data = await bookingService.getActorBookingMonthSummary(req.user.id, month, 'trainer');
        return res.send(data);
    }
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies and trainers can view this summary');
});

/**
 * Get a booking by ID
 */
const getBookingById = catchAsync(async (req, res) => {
    const booking = await bookingService.getBookingById(req.params.id);
    if (req.user.role === 'company') {
        const ownerId =
            booking.company && typeof booking.company === 'object' && booking.company._id
                ? booking.company._id.toString()
                : booking.company?.toString?.() || String(booking.company);
        if (ownerId !== req.user.id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own bookings');
        }
    } else if (req.user.role === 'trainer') {
        const trainerRef =
            booking.trainer && typeof booking.trainer === 'object' && booking.trainer._id
                ? booking.trainer._id.toString()
                : booking.trainer?.toString?.() || String(booking.trainer);
        if (trainerRef !== req.user.id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only view bookings assigned to you');
        }
    }
    res.send(booking);
});

/**
 * Get bookings for a specific trainer
 */
const getTrainerBookings = catchAsync(async (req, res) => {
    if (req.user.role === 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Companies cannot list bookings by trainer');
    }
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getTrainerBookings(req.params.trainerId, filter, options);
    res.send(result);
});

/**
 * Get bookings for a specific company
 */
const getCompanyBookings = catchAsync(async (req, res) => {
    if (req.user.role === 'company' && req.params.companyId !== req.user.id.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only view bookings for your company');
    }
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getCompanyBookings(req.params.companyId, filter, options);
    res.send(result);
});

/**
 * Update booking status (trainer confirms/rejects)
 */
const updateBookingStatus = catchAsync(async (req, res) => {
    if (req.user.role === 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Companies cannot change booking status');
    }
    const { status, trainerNotes } = req.body;
    const booking = await bookingService.updateBookingStatus(req.params.id, status, trainerNotes);
    res.send(booking);
});

/**
 * Update booking details
 */
const updateBooking = catchAsync(async (req, res) => {
    if (req.user.role === 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Companies cannot update booking details here');
    }
    const booking = await bookingService.updateBookingById(req.params.id, req.body);
    res.send(booking);
});

/**
 * Cancel a booking
 */
const cancelBooking = catchAsync(async (req, res) => {
    if (req.user.role !== 'trainer' && req.user.role !== 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only companies and trainers can cancel bookings');
    }
    const userType = req.user.role === 'trainer' ? 'trainer' : 'company';
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id, userType);
    res.send(booking);
});

/**
 * Delete a booking by ID (admin only)
 */
const deleteBooking = catchAsync(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can delete bookings');
    }
    await bookingService.deleteBookingById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Admin approves booking and confirms payment
 */
const approveBookingAndConfirmPayment = catchAsync(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can approve bookings');
    }
    const { paymentMode, transactionId, paymentType, paymentAmount, adminNotes } = req.body;
    const adminId = req.user.id; // Assuming admin is authenticated

    const paymentDetails = {
        paymentMode,
        transactionId,
        paymentType,
        paymentAmount,
    };

    const booking = await bookingService.approveBookingAndConfirmPayment(
        req.params.id,
        adminId,
        paymentDetails,
        adminNotes
    );
    res.send(booking);
});

/**
 * Get bookings pending admin approval (for CRM)
 */
const getPendingApprovals = catchAsync(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can view pending approvals');
    }
    const filter = pick(req.query, ['company', 'trainer', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getPendingApprovals(filter, options);
    res.send(result);
});

/**
 * Admin rejects booking
 */
const rejectBooking = catchAsync(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can reject bookings');
    }
    const { adminNotes } = req.body;
    const adminId = req.user.id;
    const booking = await bookingService.rejectBooking(req.params.id, adminId, adminNotes);
    res.send(booking);
});

/**
 * Get trainer's approved bookings only
 */
const getTrainerApprovedBookings = catchAsync(async (req, res) => {
    if (req.user.role === 'company') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Companies cannot use this endpoint');
    }
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getTrainerApprovedBookings(req.params.trainerId, filter, options);
    res.send(result);
});

export {
    createBooking,
    getAllBookings,
    getMyBookings,
    getMyBookingsSummary,
    getBookingById,
    getTrainerBookings,
    getCompanyBookings,
    updateBookingStatus,
    updateBooking,
    cancelBooking,
    deleteBooking,
    approveBookingAndConfirmPayment,
    getPendingApprovals,
    rejectBooking,
    getTrainerApprovedBookings,
};

