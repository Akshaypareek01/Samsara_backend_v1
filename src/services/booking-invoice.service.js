import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { BookingInvoice, Booking, Trainer, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import {
    aggregateTrainerFeeTotals,
    buildTrainerFeeLine,
    roundMoney,
} from '../utils/invoiceCalculationUtils.js';
import { getSessionsForBooking } from '../utils/bookingSessionUtils.js';

/**
 * Build trainer fee lines from admin input aligned to booking sessions.
 *
 * @param {Object} booking - Populated booking document.
 * @param {Array<Object>} trainerFeeLines - Admin input lines.
 * @returns {Promise<Array<Object>>}
 */
const buildTrainerLinesForInvoice = async (booking, trainerFeeLines) => {
    const sessions = getSessionsForBooking(booking);
    const lines = [];

    for (let i = 0; i < trainerFeeLines.length; i++) {
        const input = trainerFeeLines[i];
        const trainer = await Trainer.findById(input.trainer).select('+accountDetails name');
        if (!trainer) {
            throw new ApiError(httpStatus.NOT_FOUND, `Trainer not found for line ${i + 1}`);
        }

        const session = sessions[input.sessionIndex ?? i] || sessions[i] || {};
        const calc = buildTrainerFeeLine({
            baseFee: input.baseFee,
            gstRate: input.gstRate ?? 18,
            otherTaxes: input.otherTaxes || [],
            deductions: input.deductions || [],
        });

        lines.push({
            trainer: trainer._id,
            sessionIndex: input.sessionIndex ?? i,
            startTime: session.startTime || booking.startTime,
            duration: session.duration || booking.duration,
            typeOfTraining: session.typeOfTraining || booking.typeOfTraining || [],
            ...calc,
            trainerName: trainer.name,
            trainerGstNumber: trainer.accountDetails?.gstNumber || '',
            trainerPanNumber: trainer.accountDetails?.panNumber || '',
        });
    }

    return lines;
};

/**
 * Build session payment lines for invoice from admin input.
 *
 * @param {Object} booking - Booking document.
 * @param {Array<Object>} sessionPayments - Admin session payment rows.
 * @returns {Array<Object>}
 */
const buildSessionPaymentsForInvoice = (booking, sessionPayments) => {
    const sessions = getSessionsForBooking(booking);

    return sessionPayments.map((payment, index) => {
        const sessionIndex = payment.sessionIndex ?? index;
        const session = sessions[sessionIndex] || sessions[index] || {};

        return {
            sessionIndex,
            startTime: session.startTime || booking.startTime,
            duration: session.duration || booking.duration,
            paymentMode: payment.paymentMode,
            transactionId: payment.transactionId,
            paymentType: payment.paymentType,
            paymentAmount: roundMoney(payment.paymentAmount),
        };
    });
};

/**
 * Create a booking invoice when admin confirms payment.
 *
 * @param {Object} params - Invoice creation params.
 * @returns {Promise<import('../models/booking-invoice.model.js').default>}
 */
const createBookingInvoice = async ({
    booking,
    adminId,
    companyPayment,
    sessionPayments = [],
    trainerFeeLines,
}) => {
    const existing = await BookingInvoice.findOne({ booking: booking._id, status: 'confirmed' });
    if (existing) {
        throw new ApiError(httpStatus.CONFLICT, 'Invoice already exists for this booking');
    }

    const builtLines = await buildTrainerLinesForInvoice(booking, trainerFeeLines);
    const builtSessionPayments = buildSessionPaymentsForInvoice(booking, sessionPayments);
    const totals = aggregateTrainerFeeTotals(builtLines);
    const invoiceNumber = await BookingInvoice.generateInvoiceNumber();

    const invoice = await BookingInvoice.create({
        invoiceNumber,
        booking: booking._id,
        company: booking.company._id || booking.company,
        bookingDate: booking.bookingDate,
        status: 'confirmed',
        companyPayment: {
            paymentMode: companyPayment.paymentMode,
            transactionId: companyPayment.transactionId,
            paymentType: companyPayment.paymentType,
            paymentAmount: roundMoney(companyPayment.paymentAmount),
            adminNotes: companyPayment.adminNotes,
        },
        sessionPayments: builtSessionPayments,
        trainerLines: builtLines,
        totals,
        approvedBy: adminId,
        approvedAt: new Date(),
    });

    return invoice.populate([
        { path: 'booking', populate: [{ path: 'company' }, { path: 'trainer' }, { path: 'sessions.trainer' }] },
        { path: 'company' },
        { path: 'trainerLines.trainer', select: 'name email title' },
        { path: 'approvedBy', select: 'name email' },
    ]);
};

/**
 * Query booking invoices with pagination.
 *
 * @param {Object} filter - Mongo filter.
 * @param {Object} options - Pagination options.
 */
const queryBookingInvoices = async (filter, options) => {
    const queryOptions = {
        ...options,
        populate: options.populate ||
            'booking,company,trainerLines.trainer,approvedBy',
        sortBy: options.sortBy || 'createdAt:desc',
    };
    return BookingInvoice.paginate(filter, queryOptions);
};

/**
 * Get invoice by id.
 *
 * @param {string} id - Invoice id.
 */
const getBookingInvoiceById = async (id) => {
    const invoice = await BookingInvoice.findById(id).populate([
        { path: 'booking', populate: [{ path: 'company' }, { path: 'sessions.trainer' }] },
        { path: 'company' },
        { path: 'trainerLines.trainer', select: 'name email title' },
        { path: 'approvedBy', select: 'name email' },
    ]);
    if (!invoice) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found');
    }
    return invoice;
};

/**
 * Get invoice by booking id.
 *
 * @param {string} bookingId - Booking id.
 */
const getBookingInvoiceByBookingId = async (bookingId) => {
    const invoice = await BookingInvoice.findOne({ booking: bookingId, status: 'confirmed' }).populate([
        { path: 'booking', populate: [{ path: 'company' }, { path: 'sessions.trainer' }] },
        { path: 'company' },
        { path: 'trainerLines.trainer', select: 'name email title' },
        { path: 'approvedBy', select: 'name email' },
    ]);
    if (!invoice) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found for this booking');
    }
    return invoice;
};

/**
 * Format INR for invoice display.
 *
 * @param {number} amount - Amount.
 * @returns {string}
 */
const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(Number(amount) || 0);

/**
 * Build printable HTML invoice document.
 *
 * @param {Object} invoice - Populated invoice document.
 * @returns {string}
 */
const buildInvoiceHtml = (invoice) => {
    const companyName =
        invoice.company?.companyName || invoice.company?.name || 'Company';
    const companyGst = invoice.company?.gstNumber || '—';
    const bookingDate = new Date(invoice.bookingDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const issuedAt = new Date(invoice.approvedAt || invoice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const trainerRows = (invoice.trainerLines || [])
        .map(
            (line, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${line.trainerName || line.trainer?.name || 'Trainer'}</td>
        <td>${line.startTime || '—'} (${line.duration || 0}h)</td>
        <td>${(line.typeOfTraining || []).join(', ') || '—'}</td>
        <td class="num">${formatInr(line.baseFee)}</td>
        <td class="num">${line.gstRate}%<br/>${formatInr(line.gstAmount)}</td>
        <td class="num">${formatInr(line.totalOtherTaxes)}</td>
        <td class="num">${formatInr(line.totalDeductions)}</td>
        <td class="num"><strong>${formatInr(line.netPayable)}</strong></td>
      </tr>`
        )
        .join('');

    const sessionPaymentRows = (invoice.sessionPayments || [])
        .map(
            (payment, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${payment.startTime || '—'} (${payment.duration || 0}h)</td>
        <td class="capitalize">${(payment.paymentMode || '—').replace(/_/g, ' ')}</td>
        <td>${payment.transactionId || '—'}</td>
        <td class="capitalize">${payment.paymentType || '—'}</td>
        <td class="num"><strong>${formatInr(payment.paymentAmount)}</strong></td>
      </tr>`
        )
        .join('');

    const sessionPaymentsSection =
        (invoice.sessionPayments || []).length > 0
            ? `
  <h2 style="font-size:16px;margin-top:28px;">Company session payments</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Session</th>
        <th>Mode</th>
        <th>Transaction ID</th>
        <th>Type</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${sessionPaymentRows}</tbody>
  </table>`
            : '';

    const deductionDetails = (invoice.trainerLines || [])
        .map((line, idx) => {
            if (!line.deductions?.length) return '';
            const items = line.deductions
                .map((d) => `<li>${line.trainerName || 'Trainer'} — ${d.name}: ${formatInr(d.amount)}</li>`)
                .join('');
            return `<p><strong>Session ${idx + 1} deductions</strong></p><ul>${items}</ul>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #666; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    .num { text-align: right; white-space: nowrap; }
    .capitalize { text-transform: capitalize; }
    .totals { margin-top: 20px; width: 360px; margin-left: auto; }
    .totals td { border: none; padding: 4px 0; }
    .totals .label { color: #555; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Trainer Fee Invoice</h1>
  <p class="muted">Invoice No: <strong>${invoice.invoiceNumber}</strong> · Issued: ${issuedAt}</p>

  <div class="grid">
    <div>
      <p><strong>Bill To</strong></p>
      <p>${companyName}<br/>GSTIN: ${companyGst}</p>
    </div>
    <div>
      <p><strong>Booking</strong></p>
      <p>Date: ${bookingDate}<br/>
      Company payment total: ${formatInr(invoice.companyPayment?.paymentAmount || 0)}<br/>
      ${(invoice.sessionPayments || []).length > 1 ? `Sessions paid: ${invoice.sessionPayments.length}<br/>` : ''}
      Txn ID: ${invoice.companyPayment?.transactionId || '—'}</p>
    </div>
  </div>

  ${sessionPaymentsSection}

  <h2 style="font-size:16px;margin-top:28px;">Trainer fee lines</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Trainer</th>
        <th>Session</th>
        <th>Training</th>
        <th>Base Fee</th>
        <th>GST</th>
        <th>Other Tax</th>
        <th>Deductions</th>
        <th>Net Payable</th>
      </tr>
    </thead>
    <tbody>${trainerRows}</tbody>
  </table>

  ${deductionDetails}

  <table class="totals">
    <tr><td class="label">Total base fees</td><td class="num">${formatInr(invoice.totals?.baseFee)}</td></tr>
    <tr><td class="label">Total GST</td><td class="num">${formatInr(invoice.totals?.gstAmount)}</td></tr>
    <tr><td class="label">Total other taxes</td><td class="num">${formatInr(invoice.totals?.totalOtherTaxes)}</td></tr>
    <tr><td class="label">Total deductions</td><td class="num">${formatInr(invoice.totals?.totalDeductions)}</td></tr>
    <tr><td class="label"><strong>Total trainer payout</strong></td><td class="num"><strong>${formatInr(invoice.totals?.netPayable)}</strong></td></tr>
  </table>

  <p class="muted" style="margin-top:32px;">This is a system-generated invoice for corporate wellness session trainer fees.</p>
</body>
</html>`;
};

/**
 * Suggest default trainer fee lines from a booking's sessions.
 *
 * @param {string} bookingId - Booking id.
 * @returns {Promise<Array<Object>>}
 */
const getDefaultTrainerFeeLines = async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate('sessions.trainer', 'name');
    if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    const sessions = getSessionsForBooking(booking);
    return sessions.map((session, index) => {
        const trainerRef = session.trainer;
        const trainerId =
            typeof trainerRef === 'object' && trainerRef?._id
                ? String(trainerRef._id)
                : String(trainerRef);
        return {
            sessionIndex: index,
            trainer: trainerId,
            trainerName:
                typeof trainerRef === 'object' && trainerRef?.name ? trainerRef.name : 'Trainer',
            startTime: session.startTime,
            duration: session.duration,
            typeOfTraining: session.typeOfTraining || [],
            baseFee: 0,
            gstRate: 18,
            otherTaxes: [],
            deductions: [{ name: 'TDS (10%)', amount: 0 }],
        };
    });
};

export default {
    createBookingInvoice,
    queryBookingInvoices,
    getBookingInvoiceById,
    getBookingInvoiceByBookingId,
    buildInvoiceHtml,
    getDefaultTrainerFeeLines,
    buildTrainerLinesForInvoice,
    buildSessionPaymentsForInvoice,
};
