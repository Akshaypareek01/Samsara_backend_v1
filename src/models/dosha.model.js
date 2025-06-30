import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const AssessmentResultSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    assessmentType: {
      type: String,
      enum: ['Prakriti', 'Vikriti'],
      required: true,
    },
    answers: [
      {
        questionId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'QuestionMaster' 
        },
        selectedOptionIndex: { 
          type: Number 
        }, // 0, 1, or 2
      }
    ],
    doshaScore: {
      vata: { 
        type: Number,
        default: 0
      },
      pitta: { 
        type: Number,
        default: 0
      },
      kapha: { 
        type: Number,
        default: 0
      }
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Apply plugins
AssessmentResultSchema.plugin(toJSON);
AssessmentResultSchema.plugin(paginate);

// Create indexes for efficient queries
AssessmentResultSchema.index({ userId: 1, assessmentType: 1 });
AssessmentResultSchema.index({ submittedAt: -1 });

export const AssessmentResult = mongoose.model('AssessmentResult', AssessmentResultSchema);
