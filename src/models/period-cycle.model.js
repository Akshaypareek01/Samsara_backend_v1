import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

// Daily log subdocument for a single calendar day inside a cycle
const DailyLogSchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const PeriodCycleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cycleNumber: { type: Number, required: true }, // Sequential cycle number for this user
    cycleStartDate: { type: Date, required: true, index: true },
    cycleEndDate: { type: Date }, // When cycle ends (when next period starts)
    periodEndDate: { type: Date }, // When bleeding/period ends (separate from cycle end)
    periodDurationDays: { type: Number },
    cycleLengthDays: { type: Number },
    predictedNextPeriodDate: { type: Date },
    predictedOvulationDate: { type: Date },
    predictedFertileWindowStart: { type: Date },
    predictedFertileWindowEnd: { type: Date },
    cycleStatus: {
      type: String,
      enum: ['Active', 'Completed', 'Predicted'],
      default: 'Active',
      index: true,
    },
    regularity: { type: String, enum: ['Regular', 'Irregular'], default: 'Regular' },
    currentPhase: {
      type: String,
      enum: ['Menstruation', 'Follicular', 'Ovulation', 'Luteal'],
    },
    dailyLogs: { type: [DailyLogSchema], default: [] },
    // Enhanced tracking fields
    actualOvulationDate: { type: Date },
    actualFertileWindowStart: { type: Date },
    actualFertileWindowEnd: { type: Date },
    cycleNotes: { type: String },
    predictionAccuracy: { type: Number, min: 0, max: 100 }, // How accurate were our predictions
    // Irregularity tracking
    varianceFromAverage: { type: Number }, // Days difference from average
    isOutlier: { type: Boolean, default: false }, // If cycle is extreme outlier
    // PMS tracking
    pmsStartDate: { type: Date },
    pmsEndDate: { type: Date },
    pmsSymptoms: [{ type: String }],
    // Flow tracking
    spottingDays: { type: Number, default: 0 }, // Days with light flow/spotting
    heavyFlowDays: { type: Number, default: 0 }, // Days with heavy flow
  },
  { timestamps: true }
);

PeriodCycleSchema.plugin(toJSON);
PeriodCycleSchema.plugin(paginate);

// Compound indexes for efficient queries
PeriodCycleSchema.index({ userId: 1, cycleStartDate: -1 });
PeriodCycleSchema.index({ userId: 1, cycleStatus: 1 });
PeriodCycleSchema.index({ userId: 1, cycleNumber: -1 });
PeriodCycleSchema.index({ userId: 1, predictedNextPeriodDate: 1 }); // For reminders
PeriodCycleSchema.index({ 'dailyLogs.date': 1 }); // For log queries

// Index for active cycles (unique constraint handled in application logic)
PeriodCycleSchema.index({ userId: 1, cycleStatus: 1 });

// Validation: Ensure cycleEndDate >= cycleStartDate and periodEndDate >= cycleStartDate
PeriodCycleSchema.pre('save', function(next) {
  if (this.cycleEndDate && this.cycleStartDate && this.cycleEndDate < this.cycleStartDate) {
    return next(new Error('cycleEndDate cannot be before cycleStartDate'));
  }
  if (this.periodEndDate && this.cycleStartDate && this.periodEndDate < this.cycleStartDate) {
    return next(new Error('periodEndDate cannot be before cycleStartDate'));
  }
  if (this.periodEndDate && this.cycleEndDate && this.periodEndDate > this.cycleEndDate) {
    return next(new Error('periodEndDate cannot be after cycleEndDate'));
  }
  next();
});

export const PeriodCycle = mongoose.model('PeriodCycle', PeriodCycleSchema);
