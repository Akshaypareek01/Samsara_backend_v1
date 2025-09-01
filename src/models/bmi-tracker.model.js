import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const BmiTrackerSchema = new mongoose.Schema(
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
    change: {
      type: Number, // Change from previous measurement
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
BmiTrackerSchema.plugin(toJSON);
BmiTrackerSchema.plugin(paginate);

// Indexes
BmiTrackerSchema.index({ userId: 1, measurementDate: -1 });
BmiTrackerSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to calculate BMI
BmiTrackerSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;
    if (this.height.unit === 'cm') heightInMeters /= 100;
    else if (this.height.unit === 'ft') heightInMeters *= 0.3048;
    if (this.weight.unit === 'lbs') weightInKg *= 0.453592;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    this.bmi = {
      value: Math.round(bmiValue * 100) / 100,
      category: this.getBMICategory(bmiValue),
    };
  }
  next();
});

// BMI Category helper
BmiTrackerSchema.methods.getBMICategory = function (bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
};

// Static: Get latest measurement for user
BmiTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get measurement history for user
BmiTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const BmiTracker = mongoose.model('BmiTracker', BmiTrackerSchema);
