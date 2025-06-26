import mongoose from 'mongoose';

const teacherAvailabilitySchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teachers',
        required: [true, 'Teacher ID is required']
    },
    session: {
        type: String,
        required: [true, 'Session is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    availabilityFor: {
        type: String,
        enum: ['One on One', 'Group'],
        required: [true, 'Availability type is required']
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'cancelled'],
        default: 'available'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
teacherAvailabilitySchema.index({ teacherId: 1, date: 1, startTime: 1, endTime: 1 });

export const TeacherAvailability = mongoose.model('TeacherAvailability', teacherAvailabilitySchema); 