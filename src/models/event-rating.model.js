import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const eventRatingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
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
      required: false, // Events might not always have teachers
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
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per user per event
eventRatingSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Apply plugins
eventRatingSchema.plugin(toJSON);
eventRatingSchema.plugin(paginate);

export const EventRating = mongoose.model('EventRating', eventRatingSchema);
