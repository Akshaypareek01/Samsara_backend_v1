import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const BodyStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Personal information
    age: {
      type: Number,
      min: 1,
      max: 120,
      required: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: false,
    },
    // Basic measurements
    height: {
      value: {
        type: Number,
        required: false,
      },
      unit: {
        type: String,
        enum: ['cm', 'ft'],
        default: 'cm',
      },
    },
    weight: {
      value: {
        type: Number,
        required: false,
      },
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
      },
    },
    // Body measurements
    chest: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm',
      },
    },
    waist: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm',
      },
    },
    hips: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm',
      },
    },
    arms: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm',
      },
    },
    thighs: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm',
      },
    },
    // Calculated metrics
    bmi: {
      value: {
        type: Number,
      },
      category: {
        type: String,
        enum: ['Underweight', 'Normal', 'Overweight', 'Obese'],
      },
    },
    bodyFat: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['%'],
        default: '%',
      },
    },
    // Additional tracking
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

// Apply plugins
BodyStatusSchema.plugin(toJSON);
BodyStatusSchema.plugin(paginate);

// Create indexes for efficient queries
BodyStatusSchema.index({ userId: 1, measurementDate: -1 });
BodyStatusSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to calculate BMI
BodyStatusSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    // Convert to meters and kg for BMI calculation
    let heightInMeters = this.height.value;
    let weightInKg = this.weight.value;

    // Convert height to meters if in cm
    if (this.height.unit === 'cm') {
      heightInMeters = heightInMeters / 100;
    } else if (this.height.unit === 'ft') {
      heightInMeters = heightInMeters * 0.3048;
    }

    // Convert weight to kg if in lbs
    if (this.weight.unit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }

    // Calculate BMI
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    this.bmi = {
      value: Math.round(bmiValue * 100) / 100, // Round to 2 decimal places
      category: this.getBMICategory(bmiValue),
    };
  }
  next();
});

// Method to determine BMI category
BodyStatusSchema.methods.getBMICategory = function (bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
};

// Method to get latest body status for a user
BodyStatusSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Method to get body status history for a user
BodyStatusSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId })
    .sort({ measurementDate: -1 })
    .limit(limit);
};

export const BodyStatus = mongoose.model('BodyStatus', BodyStatusSchema);
