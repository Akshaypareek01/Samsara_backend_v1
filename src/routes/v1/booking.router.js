import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as bookingValidation from '../../validations/booking.validation.js';
import * as bookingController from '../../controllers/booking.controller.js';

const router = express.Router();

// Create a new booking
router.post(
    '/',
    auth(),
    validate(bookingValidation.createBooking),
    bookingController.createBooking
);

// Get all bookings with pagination and filtering
router.get(
    '/',
    auth(),
    validate(bookingValidation.getBookings),
    bookingController.getAllBookings
);

// Get current user's bookings (must be before /:id route)
router.get(
    '/my-bookings',
    auth(),
    bookingController.getMyBookings
);

// Get bookings pending admin approval (for CRM)
router.get(
    '/pending-approvals',
    auth(),
    bookingController.getPendingApprovals
);

// Get trainer's approved bookings only
router.get(
    '/trainer/:trainerId/approved',
    auth(),
    validate(bookingValidation.getTrainerBookings),
    bookingController.getTrainerApprovedBookings
);

// Get bookings for a specific trainer
router.get(
    '/trainer/:trainerId',
    auth(),
    validate(bookingValidation.getTrainerBookings),
    bookingController.getTrainerBookings
);

// Get bookings for a specific company
router.get(
    '/company/:companyId',
    auth(),
    validate(bookingValidation.getCompanyBookings),
    bookingController.getCompanyBookings
);

// Get a booking by ID
router.get(
    '/:id',
    auth(),
    validate(bookingValidation.getBooking),
    bookingController.getBookingById
);

// Admin approves booking and confirms payment
router.patch(
    '/:id/approve',
    auth(),
    validate(bookingValidation.approveBookingAndConfirmPayment),
    bookingController.approveBookingAndConfirmPayment
);

// Admin rejects booking
router.patch(
    '/:id/reject',
    auth(),
    validate(bookingValidation.rejectBooking),
    bookingController.rejectBooking
);

// Update booking status (trainer confirms/rejects)
router.patch(
    '/:id/status',
    auth(),
    validate(bookingValidation.updateBookingStatus),
    bookingController.updateBookingStatus
);

// Cancel a booking
router.patch(
    '/:id/cancel',
    auth(),
    validate(bookingValidation.cancelBooking),
    bookingController.cancelBooking
);

// Update booking details
router.patch(
    '/:id',
    auth(),
    validate(bookingValidation.updateBooking),
    bookingController.updateBooking
);

// Delete a booking by ID (admin only)
router.delete(
    '/:id',
    auth(),
    validate(bookingValidation.deleteBooking),
    bookingController.deleteBooking
);

export default router;
