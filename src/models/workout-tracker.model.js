import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const WorkoutEntrySchema = new mongoose.Schema(
  {
    workoutType: {
      type: String,
      enum: ['Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing'],
      required: true,
    },
    intensity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    distance: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['km', 'mi'], default: 'km' },
    },
    duration: {
      value: { type: Number, min: 0 }, // in hours
      unit: { type: String, default: 'h' },
    },
    calories: {
      type: Number,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      max: 500,
    },
  },
  { _id: false }
);

const WeeklySummaryEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalTime: { type: Number, required: true }, // in hours
    totalCalories: { type: Number, required: true },
    workoutCount: { type: Number, required: true },
  },
  { _id: false }
);

const WorkoutTypeSummarySchema = new mongoose.Schema(
  {
    workoutType: {
      type: String,
      enum: ['Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing'],
      required: true,
    },
    totalTime: { type: Number, required: true }, // in hours
    totalCalories: { type: Number, required: true },
    workoutCount: { type: Number, required: true },
    averageTime: { type: Number, required: true }, // in hours
    averageCalories: { type: Number, required: true },
  },
  { _id: false }
);

const WorkoutTrackerSchema = new mongoose.Schema(
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
    workoutEntries: [WorkoutEntrySchema],
    totalWorkoutTime: {
      type: Number, // total hours for the day
      required: false,
      default: 0,
    },
    totalCaloriesBurned: {
      type: Number,
      required: false,
      default: 0,
    },
    weeklySummary: [WeeklySummaryEntrySchema],
    workoutTypeSummary: [WorkoutTypeSummarySchema],
    totalWeeklyTime: {
      type: Number, // total hours for the week
      required: false,
      default: 0,
    },
    totalWeeklyCalories: {
      type: Number,
      required: false,
      default: 0,
    },
    dailyAverage: {
      type: Number, // average hours per day
      required: false,
    },
    bestDay: {
      type: Number, // best day calories
      required: false,
    },
    streak: {
      type: Number, // consecutive days with workouts
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
WorkoutTrackerSchema.plugin(toJSON);
WorkoutTrackerSchema.plugin(paginate);

// Indexes
WorkoutTrackerSchema.index({ userId: 1, date: -1 });
WorkoutTrackerSchema.index({ userId: 1, 'workoutEntries.workoutType': 1 });

export const WorkoutTracker = mongoose.model('WorkoutTracker', WorkoutTrackerSchema);
