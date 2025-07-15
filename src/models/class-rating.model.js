import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const classRatingSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        maxlength: 1000,
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    helpfulCount: {
        type: Number,
        default: 0,
    },
    reported: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Ensure one rating per user per class
classRatingSchema.index({ classId: 1, userId: 1 }, { unique: true });

// Apply plugins
classRatingSchema.plugin(toJSON);
classRatingSchema.plugin(paginate);

export const ClassRating = mongoose.model('ClassRating', classRatingSchema); 