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
  type: {
    type: String,
    enum: ['Prescription', 'Supplement'],
    required: true
  },
  name: { 
    type: String, 
    required: true 
  }, // e.g., "Metformin" or "Vitamin D3"
  dosage: { 
    type: String 
  }, // e.g., "500mg" or "2000 IU"
  instruction: { 
    type: String 
  }, // e.g., "Take 1 pill with breakfast"
  quantityLeft: { 
    type: Number, 
    default: 0 
  }, // e.g., 28
  frequency: { 
    type: String 
  }, // e.g., "Once daily"
  times: [{ 
    type: String 
  }], // e.g., ["Morning", "Evening"]
  isActive: { 
    type: Boolean, 
    default: true 
  },
  schedulePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  daysOfWeek: [{ 
    type: String 
  }], // ["Mon", "Wed", "Fri"] for weekly patterns
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
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
