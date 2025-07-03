import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    meetingName: {
        type: String,
        required: [true, 'Meeting name is required'],
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    meetingId: {
        type: String,
        required: [true, 'Meeting ID is required'],
        unique: true
    },
    meetingPassword: {
        type: String,
        default: ''
    },
    hostName: {
        type: String,
        required: [true, 'Host name is required'],
        trim: true
    },
    teacherName: {
        type: String,
        required: [true, 'Teacher name is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

// Index for efficient querying
meetingSchema.index({ meetingId: 1 });
meetingSchema.index({ hostName: 1 });
meetingSchema.index({ status: 1 });

export const Meeting = mongoose.model('Meeting', meetingSchema);