import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const PeriodSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    trackingReminderEnabled: { type: Boolean, default: false },
    trackingReminderTime: { type: String, default: '20:00' }, // HH:mm
    defaultCycleLengthDays: { type: Number, default: 28, min: 15, max: 60 },
    lutealPhaseDays: { type: Number, default: 14, min: 10, max: 20 },
    // Pregnancy mode
    pregnancyModeEnabled: { type: Boolean, default: false },
    pregnancyStartDate: { type: Date },
    pregnancyDueDate: { type: Date },
    pregnancyWeek: { type: Number, min: 0, max: 42 },
    // PMS settings
    pmsPredictionEnabled: { type: Boolean, default: true },
    pmsDaysBeforePeriod: { type: Number, default: 5, min: 1, max: 10 },
    // Auto-completion settings
    maxCycleDays: { type: Number, default: 60, min: 30, max: 90 }, // Auto-complete cycles exceeding this many days
    // Sync/Backup
    lastSyncDate: { type: Date },
    syncEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PeriodSettingsSchema.plugin(toJSON);
PeriodSettingsSchema.plugin(paginate);

export const PeriodSettings = mongoose.model('PeriodSettings', PeriodSettingsSchema);
