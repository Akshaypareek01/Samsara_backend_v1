import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Add other fields as needed
  },
  {
    timestamps: true,
  }
);

// Create index for efficient queries
assessmentSchema.index({ userId: 1, date: -1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
