import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import bookingService from '../services/booking.service.js';

/**
 * Create a new booking
 */
const createBooking = catchAsync(async (req, res) => {
    const booking = await bookingService.createBooking(req.body);
    res.status(httpStatus.CREATED).send(booking);
});

/**
 * Get all bookings with pagination and filtering
 */
const getAllBookings = catchAsync(async (req, res) => {
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
 * Get a booking by ID
 */
const getBookingById = catchAsync(async (req, res) => {
    const booking = await bookingService.getBookingById(req.params.id);
    res.send(booking);
});

/**
 * Get bookings for a specific trainer
 */
const getTrainerBookings = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getTrainerBookings(req.params.trainerId, filter, options);
    res.send(result);
});

/**
 * Get bookings for a specific company
 */
const getCompanyBookings = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getCompanyBookings(req.params.companyId, filter, options);
    res.send(result);
});

/**
 * Update booking status (trainer confirms/rejects)
 */
const updateBookingStatus = catchAsync(async (req, res) => {
    const { status, trainerNotes } = req.body;
    const booking = await bookingService.updateBookingStatus(req.params.id, status, trainerNotes);
    res.send(booking);
});

/**
 * Update booking details
 */
const updateBooking = catchAsync(async (req, res) => {
    const booking = await bookingService.updateBookingById(req.params.id, req.body);
    res.send(booking);
});

/**
 * Cancel a booking
 */
const cancelBooking = catchAsync(async (req, res) => {
    // Determine user type based on role
    const userType = req.user.role === 'trainer' ? 'trainer' : 'company';
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id, userType);
    res.send(booking);
});

/**
 * Delete a booking by ID (admin only)
 */
const deleteBooking = catchAsync(async (req, res) => {
    await bookingService.deleteBookingById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Admin approves booking and confirms payment
 */
const approveBookingAndConfirmPayment = catchAsync(async (req, res) => {
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
    const filter = pick(req.query, ['company', 'trainer', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getPendingApprovals(filter, options);
    res.send(result);
});

/**
 * Admin rejects booking
 */
const rejectBooking = catchAsync(async (req, res) => {
    const { adminNotes } = req.body;
    const adminId = req.user.id;
    const booking = await bookingService.rejectBooking(req.params.id, adminId, adminNotes);
    res.send(booking);
});

/**
 * Get trainer's approved bookings only
 */
const getTrainerApprovedBookings = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status', 'bookingDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const result = await bookingService.getTrainerApprovedBookings(req.params.trainerId, filter, options);
    res.send(result);
});

export {
    createBooking,
    getAllBookings,
    getMyBookings,
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

