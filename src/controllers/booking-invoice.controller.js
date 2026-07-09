import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import isAdminUser from '../utils/isAdminUser.js';
import bookingInvoiceService from '../services/booking-invoice.service.js';

/**
 * List booking invoices (admin).
 */
const getBookingInvoices = catchAsync(async (req, res) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can view booking invoices');
    }

    const filter = pick(req.query, ['company', 'booking']);
    if (req.query.trainer) {
        filter['trainerLines.trainer'] = req.query.trainer;
    }

    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await bookingInvoiceService.queryBookingInvoices(filter, options);
    res.send(result);
});

/**
 * Get invoice by id (admin).
 */
const getBookingInvoiceById = catchAsync(async (req, res) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can view booking invoices');
    }
    const invoice = await bookingInvoiceService.getBookingInvoiceById(req.params.id);
    res.send(invoice);
});

/**
 * Get invoice for a booking (admin).
 */
const getBookingInvoiceByBookingId = catchAsync(async (req, res) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can view booking invoices');
    }
    const invoice = await bookingInvoiceService.getBookingInvoiceByBookingId(req.params.bookingId);
    res.send(invoice);
});

/**
 * Download invoice as HTML (admin) — browser can print to PDF.
 */
const downloadBookingInvoice = catchAsync(async (req, res) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can download invoices');
    }
    const invoice = await bookingInvoiceService.getBookingInvoiceById(req.params.id);
    const html = bookingInvoiceService.buildInvoiceHtml(invoice);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${invoice.invoiceNumber}.html"`
    );
    res.status(httpStatus.OK).send(html);
});

/**
 * Default trainer fee lines for approval form (admin).
 */
const getDefaultTrainerFeeLines = catchAsync(async (req, res) => {
    if (!isAdminUser(req.user)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only administrators can access fee defaults');
    }
    const lines = await bookingInvoiceService.getDefaultTrainerFeeLines(req.params.bookingId);
    res.send({ trainerFeeLines: lines });
});

export {
    getBookingInvoices,
    getBookingInvoiceById,
    getBookingInvoiceByBookingId,
    downloadBookingInvoice,
    getDefaultTrainerFeeLines,
};
