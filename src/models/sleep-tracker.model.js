import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const ProgressEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hours: { type: Number, required: true }, // hours slept on this date
  },
  { _id: false }
);

const SleepTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sleepRate: {
      type: Number, // e.g., 82
      required: false,
    },
    sleepRateChange: {
      type: Number, // e.g., 14 (for +14%)
      required: false,
    },
    sleepTime: {
      type: Number, // in minutes (e.g., 7h 2m = 422)
      required: false,
    },
    sleepTimeChange: {
      type: Number, // e.g., 14 (for +14%)
      required: false,
    },
    hoursSlept: {
      type: Number, // e.g., 6
      required: false,
    },
    bedtime: {
      type: String, // e.g., '22:00'
      required: false,
    },
    wakeUpTime: {
      type: String, // e.g., '06:00'
      required: false,
    },
    avgHours: {
      type: Number, // e.g., 7.5
      required: false,
    },
    weekTotal: {
      type: Number, // e.g., 52.5
      required: false,
    },
    goal: {
      type: Number, // e.g., 8 (hours per day)
      required: false,
    },
    progress: [ProgressEntrySchema], // for graphing sleep over time
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
SleepTrackerSchema.plugin(toJSON);
SleepTrackerSchema.plugin(paginate);

// Indexes
SleepTrackerSchema.index({ userId: 1, date: -1 });

export const SleepTracker = mongoose.model('SleepTracker', SleepTrackerSchema);
