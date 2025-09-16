import mongoose from 'mongoose';
import paginate from './plugins/paginate.plugin.js';

const moodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    mood: {
      type: String,
      required: true,
      enum: ['Normal', 'Angry', 'Happy', 'Sad', 'Exhausted', 'Anxious', 'Depressed', 'In Love', 'Bored', 'Confident', 'Excited', 'Relaxed'],
    },
    moodId: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Corresponding IDs for each mood
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient queries
moodSchema.index({ userId: 1, createdAt: -1 });

// Add pagination plugin
moodSchema.plugin(paginate);

export const Mood = mongoose.model('Mood', moodSchema);
