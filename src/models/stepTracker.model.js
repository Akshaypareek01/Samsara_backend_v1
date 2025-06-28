import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index';

const StepTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    steps: {
      type: Number,
      required: true,
    },
    goal: {
      type: Number,
      default: 10000, // default daily goal
    },
    distance: {
      value: { type: Number }, // e.g., 3.9
      unit: { type: String, enum: ['km', 'mi'], default: 'km' },
    },
    calories: {
      type: Number, // calories burned
    },
    activeTime: {
      type: Number, // in minutes
    },
    measurementDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
StepTrackerSchema.plugin(toJSON);
StepTrackerSchema.plugin(paginate);

// Indexes
StepTrackerSchema.index({ userId: 1, measurementDate: -1 });
StepTrackerSchema.index({ userId: 1, isActive: 1 });

// Static: Get latest entry for user
StepTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get step history for user
StepTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const StepTracker = mongoose.model('StepTracker', StepTrackerSchema);
