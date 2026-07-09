import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as validation from '../../validations/booking-invoice.validation.js';
import * as controller from '../../controllers/booking-invoice.controller.js';

const router = express.Router();

router.get(
    '/',
    auth(),
    validate(validation.getBookingInvoices),
    controller.getBookingInvoices
);

router.get(
    '/defaults/:bookingId',
    auth(),
    validate(validation.getDefaultFeeLines),
    controller.getDefaultTrainerFeeLines
);

router.get(
    '/booking/:bookingId',
    auth(),
    validate(validation.getBookingInvoiceByBooking),
    controller.getBookingInvoiceByBookingId
);

router.get(
    '/:id/download',
    auth(),
    validate(validation.getBookingInvoice),
    controller.downloadBookingInvoice
);

router.get(
    '/:id',
    auth(),
    validate(validation.getBookingInvoice),
    controller.getBookingInvoiceById
);

export default router;
