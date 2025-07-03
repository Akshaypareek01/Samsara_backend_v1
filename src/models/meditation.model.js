import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const MeditationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    imageUrl: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterCategory',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    benefits: {
      type: String,
    },
    howToPractice: [{
      type: String,
    }],
    focus: {
      type: Number, // percentage (0-100)
    },
    mood: {
      type: String, // e.g., Ecstatic, Calm, Relaxed, Neutral, Restless, Sleepy
    },
    recommended: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meditation',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

MeditationSchema.plugin(toJSON);
MeditationSchema.plugin(paginate);

export const Meditation = mongoose.model('Meditation', MeditationSchema);
