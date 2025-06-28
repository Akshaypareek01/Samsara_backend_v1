import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index';

const TemperatureTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    temperature: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['F', 'C'], default: 'F' },
    },
    status: {
      type: String,
      enum: ['Normal', 'Elevated', 'Low'],
      default: 'Normal',
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
TemperatureTrackerSchema.plugin(toJSON);
TemperatureTrackerSchema.plugin(paginate);

// Indexes
TemperatureTrackerSchema.index({ userId: 1, measurementDate: -1 });
TemperatureTrackerSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to set status based on value
TemperatureTrackerSchema.pre('save', function (next) {
  if (this.temperature && this.temperature.value) {
    const temp = this.temperature.value;
    if (this.temperature.unit === 'F') {
      if (temp < 97.8) this.status = 'Low';
      else if (temp > 99.5) this.status = 'Elevated';
      else this.status = 'Normal';
    } else if (this.temperature.unit === 'C') {
      if (temp < 36.5) this.status = 'Low';
      else if (temp > 37.5) this.status = 'Elevated';
      else this.status = 'Normal';
    }
  }
  next();
});

// Static: Get latest reading for user
TemperatureTrackerSchema.statics.getLatestByUserId = function (userId) {
  return this.findOne({ userId, isActive: true }).sort({ measurementDate: -1 });
};

// Static: Get reading history for user
TemperatureTrackerSchema.statics.getHistoryByUserId = function (userId, limit = 10) {
  return this.find({ userId }).sort({ measurementDate: -1 }).limit(limit);
};

export const TemperatureTracker = mongoose.model('TemperatureTracker', TemperatureTrackerSchema);
