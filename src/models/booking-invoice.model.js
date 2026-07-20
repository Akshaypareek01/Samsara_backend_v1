import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const taxRowSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        rate: { type: Number, default: 0, min: 0 },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        amount: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const deductionRowSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const sessionPaymentLineSchema = new mongoose.Schema(
    {
        sessionIndex: { type: Number, default: 0 },
        startTime: { type: String, trim: true },
        duration: { type: Number, min: 0 },
        paymentMode: { type: String, trim: true },
        transactionId: { type: String, trim: true },
        paymentType: { type: String, trim: true },
        paymentAmount: { type: Number, min: 0 },
    },
    { _id: false }
);

const trainerFeeLineSchema = new mongoose.Schema(
    {
        trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
        sessionIndex: { type: Number, default: 0 },
        startTime: { type: String, trim: true },
        duration: { type: Number, min: 0 },
        typeOfTraining: { type: [String], default: [] },
        baseFee: { type: Number, required: true, min: 0 },
        gstRate: { type: Number, default: 18, min: 0, max: 100 },
        gstAmount: { type: Number, default: 0, min: 0 },
        otherTaxes: { type: [taxRowSchema], default: [] },
        totalOtherTaxes: { type: Number, default: 0, min: 0 },
        deductions: { type: [deductionRowSchema], default: [] },
        totalDeductions: { type: Number, default: 0, min: 0 },
        grossAmount: { type: Number, default: 0, min: 0 },
        netPayable: { type: Number, default: 0, min: 0 },
        trainerName: { type: String, trim: true },
        trainerGstNumber: { type: String, trim: true },
        trainerPanNumber: { type: String, trim: true },
    },
    { _id: true }
);

const bookingInvoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            index: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        bookingDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['confirmed', 'cancelled'],
            default: 'confirmed',
        },
        companyPayment: {
            paymentMode: { type: String, trim: true },
            transactionId: { type: String, trim: true },
            paymentType: { type: String, trim: true },
            paymentAmount: { type: Number, min: 0 },
            adminNotes: { type: String, trim: true, maxlength: 1000 },
        },
        sessionPayments: {
            type: [sessionPaymentLineSchema],
            default: [],
        },
        trainerLines: {
            type: [trainerFeeLineSchema],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one trainer fee line is required',
            },
        },
        totals: {
            baseFee: { type: Number, default: 0 },
            gstAmount: { type: Number, default: 0 },
            totalOtherTaxes: { type: Number, default: 0 },
            totalDeductions: { type: Number, default: 0 },
            grossAmount: { type: Number, default: 0 },
            netPayable: { type: Number, default: 0 },
        },
        currency: { type: String, default: 'INR', enum: ['INR', 'USD', 'EUR'] },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        approvedAt: { type: Date },
    },
    { timestamps: true }
);

bookingInvoiceSchema.index({ company: 1, createdAt: -1 });
bookingInvoiceSchema.index({ 'trainerLines.trainer': 1, createdAt: -1 });
bookingInvoiceSchema.index({ invoiceNumber: 1 });

bookingInvoiceSchema.plugin(toJSON);
bookingInvoiceSchema.plugin(paginate);

/**
 * Generate next sequential invoice number for the current year.
 *
 * @returns {Promise<string>}
 */
bookingInvoiceSchema.statics.generateInvoiceNumber = async function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const latest = await this.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
        .sort({ createdAt: -1 })
        .select('invoiceNumber')
        .lean();

    let seq = 1;
    if (latest?.invoiceNumber) {
        const parts = latest.invoiceNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(5, '0')}`;
};

const BookingInvoice = mongoose.model('BookingInvoice', bookingInvoiceSchema);

export default BookingInvoice;
