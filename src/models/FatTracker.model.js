import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const FatTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    age: {
      type: Number,
      required: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: false,
    },
    height: {
      value: { type: Number, required: false },
      unit: { type: String, enum: ['cm', 'ft'], default: 'cm' },
    },
    weight: {
      value: { type: Number, required: false },
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
    },
    bmi: {
      value: { type: Number },
      category: { type: String, enum: ['Underweight', 'Normal', 'Overweight', 'Obese'] },
    },
    bodyFat: {
      value: { type: Number, required: false },
      unit: { type: String, enum: ['%'], default: '%' },
    },
    goal: {
      type: Number,
    },
    change: {
      type: Number, // Change from previous measurement
    },
    healthRangeCategory: {
      type: String,
      enum: ['Athletes', 'Fitness', 'Acceptable', 'Above Range'],
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
FatTrackerSchema.plugin(toJSON);
FatTrackerSchema.plugin(paginate);

// Indexes
FatTrackerSchema.index({ userId: 1, measurementDate: -1 });
FatTrackerSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to calculate BMI
FatTrackerSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;
    if (this.height.unit === 'cm') heightInMeters = heightInMeters / 100;
    else if (this.height.unit === 'ft') heightInMeters = heightInMeters * 0.3048;
    if (this.weight.unit === 'lbs') weightInKg = weightInKg * 0.453592;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    this.bmi = {
      value: Math.round(bmiValue * 100) / 100,
      category: this.getBMICategory(bmiValue),
    };
  }
  next();
});

// BMI Category helper
FatTrackerSchema.methods.getBMICategory = function (bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
};

// Static: Get latest measurement for user
FatTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get measurement history for user
FatTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const FatTracker = mongoose.model('FatTracker', FatTrackerSchema);
