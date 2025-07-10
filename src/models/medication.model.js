import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

// Health Condition Schema
const HealthConditionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }, // e.g., "Type 2 Diabetes"
  diagnosedYear: { 
    type: Number 
  }, // e.g., 2020
  analysis: { 
    type: String 
  }, // optional notes or doctor's input
  level: {
    type: String,
    enum: ['High', 'Moderate', 'Low'],
    default: 'Moderate'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }, // track if condition is active
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Medication Item Schema (for both prescriptions and supplements)
const MedicationItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Medication', 'Supplement'],
    required: true
  },
  medicineType: {
    type: String,
    enum: ['Pills', 'Capsule', 'Syrup', 'Injection', 'Other'],
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    quantity: { type: Number, required: true },
    unit: { type: String, required: true } // e.g., mg, ml, IU
  },
  duration: {
    startDate: { type: Date },
    endDate: { type: Date },
    preset: { type: String, enum: ['1 week', '1 month', '3 months', 'Ongoing'] }
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Custom'],
    required: true
  },
  daysOfWeek: [{
    type: String,
    enum: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  }],
  times: [
    {
      time: { type: String }, // e.g., "08:00"
      ampm: { type: String, enum: ['AM', 'PM'] }
    }
  ],
  consumptionInstructions: [{
    type: String,
    enum: ['Before Meals', 'During Meals', 'After Meals', 'Empty Stomach', 'Before Sleep']
  }],
  additionalNotes: { type: String },
  reminderNotifications: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Daily Schedule Schema
const DailyScheduleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  },
  date: { 
    type: Date, 
    required: true 
  }, // e.g., 2025-06-27
  schedule: [
    {
      time: { 
        type: String 
      }, // e.g., "08:00 AM"
      period: { 
        type: String 
      }, // e.g., "Morning"
      medications: [{ 
        type: String 
      }], // e.g., ["Metformin", "Lisinopril"]
      isCompleted: { 
        type: Boolean, 
        default: false 
      },
      completedAt: { 
        type: Date 
      }
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Main Medication Tracker Schema
const MedicationTrackerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  healthConditions: [HealthConditionSchema],
  medications: [MedicationItemSchema], // includes both prescriptions & supplements
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Apply plugins
MedicationTrackerSchema.plugin(toJSON);
MedicationTrackerSchema.plugin(paginate);

// Create indexes for efficient queries
MedicationTrackerSchema.index({ userId: 1 });
MedicationTrackerSchema.index({ 'healthConditions.isActive': 1 });
MedicationTrackerSchema.index({ 'medications.isActive': 1 });

// Daily Schedule Model (separate collection for better performance)
const DailyScheduleModel = mongoose.model('DailySchedule', DailyScheduleSchema);

// Main Medication Tracker Model
export const MedicationTracker = mongoose.model('MedicationTracker', MedicationTrackerSchema);

// Export DailySchedule as well for separate operations
export { DailyScheduleModel as DailySchedule };
