import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

// Daily log subdocument for a single calendar day inside a cycle
const DailyLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  flowIntensity: { type: Number, min: 0, max: 5 },
  crampingIntensity: {
    type: String,
    enum: ['None', 'Mild', 'Moderate', 'Strong', 'Severe'],
  },
  painLevel: { type: Number, min: 0, max: 10 },
  energyPattern: {
    type: String,
    enum: ['Low', 'Low-Mid', 'Moderate', 'Mid-High', 'High'],
  },
  restNeeded: { type: Boolean, default: false },
  symptoms: [{ type: String }],
  cravings: [{ type: String }],
  medicationTaken: { type: Boolean, default: false },
  supplementTaken: { type: Boolean, default: false },
  exercise: {
    type: { type: String },
    minutes: { type: Number },
    intensity: { type: String },
  },
  discharge: {
    type: { type: String },
    color: { type: String },
    consistency: { type: String },
    amount: { type: String },
    notableChanges: [{ type: String }],
  },
  sexualActivity: {
    hadSex: { type: Boolean },
    protected: { type: Boolean },
  },
  pregnancyTest: {
    taken: { type: Boolean },
    result: { type: String, enum: ['Positive', 'Negative', 'Unknown'] },
  },
  notes: { type: String },
}, { _id: false });

const PeriodCycleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  cycleStartDate: { type: Date, required: true, index: true },
  cycleEndDate: { type: Date },
  periodDurationDays: { type: Number },
  cycleLengthDays: { type: Number },
  predictedNextPeriodDate: { type: Date },
  predictedOvulationDate: { type: Date },
  predictedFertileWindowStart: { type: Date },
  predictedFertileWindowEnd: { type: Date },
  regularity: { type: String, enum: ['Regular', 'Irregular'] },
  currentPhase: {
    type: String,
    enum: ['Menstruation', 'Follicular', 'Ovulation', 'Luteal'],
  },
  dailyLogs: { type: [DailyLogSchema], default: [] },
}, { timestamps: true });

PeriodCycleSchema.plugin(toJSON);
PeriodCycleSchema.plugin(paginate);

PeriodCycleSchema.index({ userId: 1, cycleStartDate: -1 });

export const PeriodCycle = mongoose.model('PeriodCycle', PeriodCycleSchema);


