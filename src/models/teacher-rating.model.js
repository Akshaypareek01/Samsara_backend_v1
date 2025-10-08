import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const teacherRatingSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    userId: {
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
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per user per teacher
teacherRatingSchema.index({ teacherId: 1, userId: 1 }, { unique: true });

// Apply plugins
teacherRatingSchema.plugin(toJSON);
teacherRatingSchema.plugin(paginate);

export const TeacherRating = mongoose.model('TeacherRating', teacherRatingSchema);

