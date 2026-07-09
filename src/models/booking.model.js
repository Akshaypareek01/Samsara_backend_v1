import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';
import {
    ACTIVE_STATUSES,
    getDayRange,
    getSessionsForBooking,
    getTrainerIdFromRef,
    timeToMinutes,
    timesOverlap,
} from '../utils/bookingSessionUtils.js';

const sessionSchema = new mongoose.Schema(
    {
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trainer',
            required: [true, 'Session trainer is required'],
        },
        startTime: {
            type: String,
            required: [true, 'Session start time is required'],
            validate: {
                validator: (v) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                message: 'Start time must be in HH:MM format (24-hour)',
            },
        },
        duration: {
            type: Number,
            required: [true, 'Session duration is required'],
            min: [0.5, 'Duration must be at least 0.5 hours'],
            max: [24, 'Duration cannot exceed 24 hours'],
        },
        typeOfTraining: {
            type: [String],
            required: [true, 'Type of training is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one type of training is required',
            },
        },
        eapTraining: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EapTraining',
        },
        trainerStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        trainerNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Trainer notes cannot exceed 1000 characters'],
        },
        approvedAt: {
            type: Date,
        },
    },
    { _id: true }
);

const bookingSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: [true, 'Company is required'],
        },
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trainer',
            required: [true, 'Trainer is required'],
        },
        bookingDate: {
            type: Date,
            required: [true, 'Booking date is required'],
            validate: {
                validator: function (value) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return value >= today;
                },
                message: 'Booking date must be today or in the future',
            },
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required'],
            validate: {
                validator: function (v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Start time must be in HH:MM format (24-hour)',
            },
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [0.5, 'Duration must be at least 0.5 hours'],
            max: [24, 'Duration cannot exceed 24 hours'],
        },
        typeOfTraining: {
            type: [String],
            required: [true, 'Type of training is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one type of training is required',
            },
        },
        sessions: {
            type: [sessionSchema],
            default: undefined,
        },
        eapTraining: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EapTraining',
        },
        status: {
            type: String,
            enum: ['pending_approval', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed'],
            default: 'pending_approval',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentMode: {
            type: String,
            enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'online', 'other'],
            trim: true,
        },
        transactionId: {
            type: String,
            trim: true,
        },
        paymentType: {
            type: String,
            enum: ['full', 'partial', 'advance'],
            trim: true,
        },
        paymentAmount: {
            type: Number,
            min: 0,
        },
        isApprovedByAdmin: {
            type: Boolean,
            default: false,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        approvedAt: {
            type: Date,
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
        trainerNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Trainer notes cannot exceed 1000 characters'],
        },
        cancellationReason: {
            type: String,
            trim: true,
            maxlength: [1000, 'Cancellation reason cannot exceed 1000 characters'],
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ company: 1, status: 1 });
bookingSchema.index({ trainer: 1, status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ 'sessions.trainer': 1, bookingDate: 1, status: 1 });

bookingSchema.virtual('endTime').get(function () {
    if (!this.startTime || !this.duration) return null;

    const startMinutes = timeToMinutes(this.startTime);
    const endMinutes = startMinutes + this.duration * 60;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = Math.floor(endMinutes % 60);

    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
});

bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

/**
 * Collect session slots from a booking document for conflict checks.
 *
 * @param {Object} booking - Booking document.
 * @returns {Array<{ startTime: string, duration: number }>}
 */
function collectSlotsFromBooking(booking) {
    const sessions = getSessionsForBooking(booking);
    if (sessions.length > 0) {
        return sessions.map((s) => ({ startTime: s.startTime, duration: s.duration }));
    }
    return [{ startTime: booking.startTime, duration: booking.duration }];
}

/**
 * Check if trainer has a confirmed booking on the given day.
 *
 * @param {ObjectId} trainerId - Trainer id.
 * @param {Date} bookingDate - Booking date.
 * @param {ObjectId} [excludeBookingId] - Booking to exclude.
 * @returns {Promise<boolean>}
 */
bookingSchema.statics.isTrainerDayBlocked = async function (trainerId, bookingDate, excludeBookingId) {
    const { dayStart, dayEnd } = getDayRange(bookingDate);
    const existing = await this.find({
        status: 'confirmed',
        bookingDate: { $gte: dayStart, $lte: dayEnd },
        $or: [{ trainer: trainerId }, { 'sessions.trainer': trainerId }],
        _id: { $ne: excludeBookingId },
    }).lean();

    return existing.some((b) =>
        getSessionsForBooking(b).some((s) => getTrainerIdFromRef(s.trainer) === String(trainerId))
    );
};

/**
 * Check if a session time slot is available for a trainer (overlap guard).
 *
 * @param {ObjectId} trainerId - Trainer id.
 * @param {Date} bookingDate - Booking date.
 * @param {string} startTime - HH:mm.
 * @param {number} duration - Hours.
 * @param {ObjectId} [excludeBookingId] - Booking to exclude.
 * @returns {Promise<boolean>}
 */
bookingSchema.statics.isSessionTimeAvailable = async function (
    trainerId,
    bookingDate,
    startTime,
    duration,
    excludeBookingId
) {
    const { dayStart, dayEnd } = getDayRange(bookingDate);

    const existingBookings = await this.find({
        bookingDate: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ACTIVE_STATUSES },
        $or: [{ trainer: trainerId }, { 'sessions.trainer': trainerId }],
        _id: { $ne: excludeBookingId },
    }).lean();

    for (const booking of existingBookings) {
        const sessions = getSessionsForBooking(booking).filter(
            (s) => getTrainerIdFromRef(s.trainer) === String(trainerId)
        );
        for (const session of sessions) {
            if (timesOverlap(startTime, duration, session.startTime, session.duration)) {
                return false;
            }
        }
    }

    return true;
};

/**
 * @deprecated Use isSessionTimeAvailable. Kept for backward compatibility.
 */
bookingSchema.statics.isTimeSlotAvailable = async function (
    trainerId,
    bookingDate,
    startTime,
    duration,
    excludeBookingId
) {
    return this.isSessionTimeAvailable(trainerId, bookingDate, startTime, duration, excludeBookingId);
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
export { getSessionsForBooking };
