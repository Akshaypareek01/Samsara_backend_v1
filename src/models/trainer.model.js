import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Trainer title is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Trainer bio is required'],
      maxlength: [2000, 'Bio must be less than or equal to 2000 characters (approximately 400 words)'],
      trim: true,
    },
    specialistIn: {
      type: String,
      required: [true, 'Specialist field is required'],
      enum: [
        'Mental Health',
        'Fitness',
        'Yoga',
        'Pilates',
        'Strength Training',
        'Cardio',
        'Weight Loss',
        'Weight Gain',
        'Nutrition',
        'Ayurveda',
        'Meditation',
        'Wellness',
        'Rehabilitation',
        'Sports Training',
        'Dance Fitness',
        'HIIT',
        'CrossFit',
        'Bodybuilding',
        'General Training',
      ],
    },
    typeOfTraining: {
      type: String,
      required: [true, 'Type of training is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    images: [
      {
        key: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
      },
    ],
    profilePhoto: {
      key: {
        type: String,
        default: null,
      },
      path: {
        type: String,
        default: null,
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
trainerSchema.plugin(toJSON);
trainerSchema.plugin(paginate);

const Trainer = mongoose.model('Trainer', trainerSchema);

export default Trainer;

