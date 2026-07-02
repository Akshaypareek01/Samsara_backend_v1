import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const HeartRateTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Daily summary of heart-rate samples (device) or a single manual reading.
    summary: {
      avg: { type: Number },
      min: { type: Number },
      max: { type: Number },
      latest: { type: Number },
      unit: { type: String, default: 'count/min' },
    },
    // Timestamp of the latest sample that fed the summary.
    measuredAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['healthkit', 'healthconnect', 'manual', 'system'],
      default: 'manual',
    },
    // The day this summary belongs to (used for daily upsert).
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
HeartRateTrackerSchema.plugin(toJSON);
HeartRateTrackerSchema.plugin(paginate);

// Indexes
HeartRateTrackerSchema.index({ userId: 1, measurementDate: -1 });
HeartRateTrackerSchema.index({ userId: 1, isActive: 1 });

// Static: Get latest reading for user
HeartRateTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get reading history for user
HeartRateTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const HeartRateTracker = mongoose.model('HeartRateTracker', HeartRateTrackerSchema);
