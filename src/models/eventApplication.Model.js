// models/EventApplication.js
import mongoose from 'mongoose';

const eventApplicationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const EventApplication = mongoose.model('EventApplication', eventApplicationSchema);

export default EventApplication;
