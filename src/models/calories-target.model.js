import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';
import { dayRange } from '../utils/trackerDayRange.js';

const CaloriesTargetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Daily calories target
    dailyTarget: {
      type: Number,
      required: true,
      default: 2000, // Default globally accepted calories target
      min: 500,
      max: 5000,
    },
    // Current day's calories burned
    currentCalories: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Date for tracking
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Calories sources breakdown
    caloriesBreakdown: {
      workout: { type: Number, default: 0 },
      steps: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    // Progress percentage
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Status based on progress
    status: {
      type: String,
      enum: ['Below Target', 'On Track', 'Above Target'],
      default: 'Below Target',
    },
    // Weekly summary
    weeklySummary: [
      {
        date: { type: Date, required: true },
        totalCalories: { type: Number, default: 0 },
        targetCalories: { type: Number, required: true },
        progressPercentage: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['Below Target', 'On Track', 'Above Target'],
          default: 'Below Target',
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
CaloriesTargetSchema.plugin(toJSON);
CaloriesTargetSchema.plugin(paginate);

// Create indexes for efficient queries
CaloriesTargetSchema.index({ userId: 1, date: -1 });
CaloriesTargetSchema.index({ userId: 1, isActive: 1 });

/**
 * Cap progress at 100 before validators run. Existing docs can already store >100,
 * and pre('save') is too late — mongoose rejects them first.
 * @param {Function} next
 */
function applyCaloriesProgress(next) {
  const target = Number(this.dailyTarget) || 2000;
  const rawPct = target > 0
    ? (Number(this.currentCalories) / target) * 100
    : 0;
  this.progressPercentage = Math.min(100, Math.max(0, Math.round(rawPct)));

  if (rawPct >= 100) {
    this.status = 'Above Target';
  } else if (this.progressPercentage >= 80) {
    this.status = 'On Track';
  } else {
    this.status = 'Below Target';
  }

  (this.weeklySummary || []).forEach((row) => {
    const rowTarget = Number(row.targetCalories) || target;
    const rowRaw = rowTarget > 0
      ? (Number(row.totalCalories) / rowTarget) * 100
      : 0;
    row.progressPercentage = Math.min(100, Math.max(0, Math.round(rowRaw)));
  });

  next();
}

CaloriesTargetSchema.pre('validate', applyCaloriesProgress);

// Method to get latest calories target for a user
CaloriesTargetSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ date: -1 });
};

// Method to get today's calories target
/**
 * Today's calories target using the UTC calendar-day window (not IST setHours).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string|Date} [date]
 * @returns {Promise<import('mongoose').Document|null>}
 */
CaloriesTargetSchema.statics.getTodayByUserId = function (userId, date) {
  const { end, lookupStart } = dayRange(date);

  return this.findOne({
    userId,
    date: {
      $gte: lookupStart,
      $lt: end,
    },
    isActive: true,
  }).sort({ date: -1 });
};

// Method to update calories from different sources
CaloriesTargetSchema.methods.updateCalories = function (source, calories) {
  if (source === 'workout') {
    this.caloriesBreakdown.workout = calories;
  } else if (source === 'steps') {
    this.caloriesBreakdown.steps = calories;
  } else {
    this.caloriesBreakdown.other = calories;
  }

  this.currentCalories = Math.min(
    (Number(this.caloriesBreakdown.workout) || 0) +
      (Number(this.caloriesBreakdown.steps) || 0),
    16000,
  );
  const target = Number(this.dailyTarget) || 2000;
  const rawPct = target > 0 ? (this.currentCalories / target) * 100 : 0;
  this.progressPercentage = Math.min(100, Math.max(0, Math.round(rawPct)));
  this.status = rawPct >= 100 ? 'Above Target' : rawPct >= 80 ? 'On Track' : 'Below Target';

  return this.save();
};

export const CaloriesTarget = mongoose.model('CaloriesTarget', CaloriesTargetSchema);
