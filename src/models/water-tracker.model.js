import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const IntakeEventSchema = new mongoose.Schema(
  {
    amountMl: { type: Number, required: true }, // e.g., 250, 500, 750
    time: { type: String, required: true }, // e.g., '10:30 AM'
  },
  { _id: false }
);

const WeeklySummaryEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalMl: { type: Number, required: true },
  },
  { _id: false }
);

const WaterTrackerSchema = new mongoose.Schema(
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
    targetGlasses: {
      type: Number, // e.g., 8
      required: false,
      default: 8,
    },
    targetMl: {
      type: Number, // e.g., 2000
      required: false,
      default: 2000,
    },
    intakeTimeline: [IntakeEventSchema], // array of water intake events
    totalIntake: {
      type: Number, // total ml consumed for the day
      required: false,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Hydrated', 'Mildly dehydrated', 'Dehydrated'],
      default: 'Dehydrated',
    },
    weeklySummary: [WeeklySummaryEntrySchema], // for graphing
    dailyAverage: {
      type: Number, // e.g., 1500
      required: false,
    },
    bestDay: {
      type: Number, // e.g., 2250
      required: false,
    },
    streak: {
      type: Number, // e.g., 5
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
WaterTrackerSchema.plugin(toJSON);
WaterTrackerSchema.plugin(paginate);

// Indexes
WaterTrackerSchema.index({ userId: 1, date: -1 });

export const WaterTracker = mongoose.model('WaterTracker', WaterTrackerSchema);
