import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

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
                    // Allow dates from today onwards
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
                    // Validate time format HH:MM (24-hour format)
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
        status: {
            type: String,
            enum: ['pending_approval', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed'],
            default: 'pending_approval',
        },
        // Payment Information
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
        // Admin Approval Information
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
        // Booking Notes
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
    },
    {
        timestamps: true,
    }
);

// Add indexes for efficient queries
bookingSchema.index({ company: 1, status: 1 });
bookingSchema.index({ trainer: 1, status: 1 });
bookingSchema.index({ bookingDate: 1 });

// Virtual field for end time
bookingSchema.virtual('endTime').get(function () {
    if (!this.startTime || !this.duration) return null;

    const [hours, minutes] = this.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + this.duration * 60;

    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = Math.floor(endMinutes % 60);

    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
});

// Add plugin that converts mongoose to json
bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

/**
 * Check if booking time slot is available for trainer
 * @param {ObjectId} trainerId - The trainer's ID
 * @param {Date} bookingDate - The booking date
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} duration - Duration in hours
 * @param {ObjectId} [excludeBookingId] - The id of the booking to be excluded
 * @returns {Promise<boolean>}
 */
bookingSchema.statics.isTimeSlotAvailable = async function (
    trainerId,
    bookingDate,
    startTime,
    duration,
    excludeBookingId
) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const requestedStartMinutes = startHours * 60 + startMinutes;
    const requestedEndMinutes = requestedStartMinutes + duration * 60;

    // Find all bookings for this trainer on this date (excluding cancelled/rejected)
    const existingBookings = await this.find({
        trainer: trainerId,
        bookingDate: {
            $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
            $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
        },
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: excludeBookingId },
    });

    // Check for time conflicts
    for (const booking of existingBookings) {
        const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number);
        const existingStartMinutes = bookingStartHours * 60 + bookingStartMinutes;
        const existingEndMinutes = existingStartMinutes + booking.duration * 60;

        // Check if time slots overlap
        if (
            (requestedStartMinutes >= existingStartMinutes && requestedStartMinutes < existingEndMinutes) ||
            (requestedEndMinutes > existingStartMinutes && requestedEndMinutes <= existingEndMinutes) ||
            (requestedStartMinutes <= existingStartMinutes && requestedEndMinutes >= existingEndMinutes)
        ) {
            return false;
        }
    }

    return true;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
