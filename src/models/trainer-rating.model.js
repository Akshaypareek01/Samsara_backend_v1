import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const trainerRatingSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
      unique: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: [true, 'Trainer is required'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback must be at most 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

trainerRatingSchema.index({ trainer: 1, createdAt: -1 });
trainerRatingSchema.index({ company: 1, createdAt: -1 });

trainerRatingSchema.plugin(toJSON);
trainerRatingSchema.plugin(paginate);

const TrainerRating = mongoose.model('TrainerRating', trainerRatingSchema);

export default TrainerRating;
