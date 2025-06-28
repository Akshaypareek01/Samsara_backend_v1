import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index';

const WeightTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentWeight: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
    },
    goalWeight: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
    },
    startingWeight: {
      value: { type: Number },
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
    },
    totalLoss: {
      type: Number, // currentWeight - startingWeight
    },
    weeklyChange: {
      type: Number, // change in weight this week
    },
    bmi: {
      value: { type: Number },
      category: { type: String, enum: ['Underweight', 'Normal', 'Overweight', 'Obese'] },
    },
    status: {
      type: String,
      enum: ['On Track', 'Behind', 'Ahead'],
    },
    goalETA: {
      type: Date,
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
WeightTrackerSchema.plugin(toJSON);
WeightTrackerSchema.plugin(paginate);

// Indexes
WeightTrackerSchema.index({ userId: 1, measurementDate: -1 });
WeightTrackerSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to calculate BMI
WeightTrackerSchema.pre('save', function (next) {
  if (this.currentWeight && this.height) {
    let heightInMeters = this.height.value;
    let weightInKg = this.currentWeight.value;
    if (this.height.unit === 'cm') heightInMeters = heightInMeters / 100;
    else if (this.height.unit === 'ft') heightInMeters = heightInMeters * 0.3048;
    if (this.currentWeight.unit === 'lbs') weightInKg = weightInKg * 0.453592;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    this.bmi = {
      value: Math.round(bmiValue * 100) / 100,
      category: this.getBMICategory(bmiValue),
    };
  }
  // Calculate totalLoss if startingWeight is present
  if (this.startingWeight && this.currentWeight) {
    let start = this.startingWeight.value;
    let curr = this.currentWeight.value;
    if (this.currentWeight.unit === 'lbs' && this.startingWeight.unit === 'kg') {
      start = start * 2.20462;
    } else if (this.currentWeight.unit === 'kg' && this.startingWeight.unit === 'lbs') {
      curr = curr * 2.20462;
    }
    this.totalLoss = Math.round((start - curr) * 10) / 10;
  }
  next();
});

// BMI Category helper
WeightTrackerSchema.methods.getBMICategory = function (bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
};

// Static: Get latest measurement for user
WeightTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get measurement history for user
WeightTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const WeightTracker = mongoose.model('WeightTracker', WeightTrackerSchema);
