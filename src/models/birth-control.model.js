import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const BirthControlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  method: {
    type: String,
    enum: ['pill', 'iud', 'implant', 'condom', 'ring','spermicide','shot', 'patch', 'none', 'other'],
    default: 'none',
  },
  reminderEnabled: { type: Boolean, default: false },
  nextPillTime: { type: String }, // HH:mm
  pillTimezone: { type: String },
  pillPackStartDate: { type: Date },
  pillPackLength: { type: Number, default: 28 },
  pillFreeDays: { type: Number, default: 7 },
  pillsTakenDates: [{ type: Date }],
  pillPackStatus: { type: String, enum: ['Active', 'Break', 'Unknown'], default: 'Unknown' },
  lastCheckupDate: { type: Date },
  checkupReminderEnabled: { type: Boolean, default: false },
}, { timestamps: true });

BirthControlSchema.plugin(toJSON);
BirthControlSchema.plugin(paginate);

export const BirthControl = mongoose.model('BirthControl', BirthControlSchema);


