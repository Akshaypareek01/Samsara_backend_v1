import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const PeriodSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  trackingReminderEnabled: { type: Boolean, default: false },
  trackingReminderTime: { type: String, default: '20:00' }, // HH:mm
  defaultCycleLengthDays: { type: Number, default: 28 },
  lutealPhaseDays: { type: Number, default: 14 },
}, { timestamps: true });

PeriodSettingsSchema.plugin(toJSON);
PeriodSettingsSchema.plugin(paginate);

export const PeriodSettings = mongoose.model('PeriodSettings', PeriodSettingsSchema);


