import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

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
      max: 5000
    },
    // Current day's calories burned
    currentCalories: {
      type: Number,
      default: 0,
      min: 0
    },
    // Date for tracking
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Calories sources breakdown
    caloriesBreakdown: {
      workout: { type: Number, default: 0 },
      steps: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    // Progress percentage
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Status based on progress
    status: {
      type: String,
      enum: ['Below Target', 'On Track', 'Above Target'],
      default: 'Below Target'
    },
    // Weekly summary
    weeklySummary: [{
      date: { type: Date, required: true },
      totalCalories: { type: Number, default: 0 },
      targetCalories: { type: Number, required: true },
      progressPercentage: { type: Number, default: 0 },
      status: { 
        type: String, 
        enum: ['Below Target', 'On Track', 'Above Target'],
        default: 'Below Target'
      }
    }],
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

// Pre-save middleware to calculate progress
CaloriesTargetSchema.pre('save', function (next) {
  // Calculate progress percentage
  this.progressPercentage = Math.round((this.currentCalories / this.dailyTarget) * 100);
  
  // Determine status based on progress
  if (this.progressPercentage >= 100) {
    this.status = 'Above Target';
  } else if (this.progressPercentage >= 80) {
    this.status = 'On Track';
  } else {
    this.status = 'Below Target';
  }
  
  next();
});

// Method to get latest calories target for a user
CaloriesTargetSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ date: -1 });
};

// Method to get today's calories target
CaloriesTargetSchema.statics.getTodayByUserId = function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({ 
    userId, 
    date: { 
      $gte: today, 
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
    },
    isActive: true 
  });
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
  
  // Recalculate total calories
  this.currentCalories = this.caloriesBreakdown.workout + 
                        this.caloriesBreakdown.steps + 
                        this.caloriesBreakdown.other;
  
  return this.save();
};

export const CaloriesTarget = mongoose.model('CaloriesTarget', CaloriesTargetSchema); 