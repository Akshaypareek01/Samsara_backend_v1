import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const QuestionSchema = new mongoose.Schema(
  {
    assessmentType: {
      type: String,
      enum: ['Prakriti', 'Vikriti'],
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        dosha: {
          type: String,
          enum: ['Vata', 'Pitta', 'Kapha'],
          required: true,
        },
        description: {
          type: String,
        }, // optional
        severityWeight: {
          type: Number,
          default: 1,
          min: 1,
          max: 5,
        }, // For Vikriti assessments: 1=mild, 2=moderate, 3=severe, 4=very severe, 5=extreme
      },
    ],
    order: {
      type: Number,
    }, // to keep questions in order
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
QuestionSchema.plugin(toJSON);
QuestionSchema.plugin(paginate);

// Create indexes for efficient queries
QuestionSchema.index({ assessmentType: 1, order: 1 });
QuestionSchema.index({ isActive: 1 });

export const QuestionMaster = mongoose.model('QuestionMaster', QuestionSchema);
