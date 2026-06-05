import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const EAP_DURATION_OPTIONS = [1, 2, 4, 6];

const syllabusEntrySchema = new mongoose.Schema(
  {
    durationHours: {
      type: Number,
      required: true,
      enum: EAP_DURATION_OPTIONS,
    },
    points: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.every((p) => String(p).trim().length > 0),
        message: 'Each duration must have at least one point',
      },
    },
  },
  { _id: false }
);

const eapTrainingSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    coverImage: {
      type: String,
      required: true,
      trim: true,
    },
    durationOptions: {
      type: [Number],
      required: true,
      validate: {
        validator(v) {
          return (
            Array.isArray(v) &&
            v.length > 0 &&
            v.every((h) => EAP_DURATION_OPTIONS.includes(h))
          );
        },
        message: 'durationOptions must contain at least one of: 1, 2, 4, 6',
      },
    },
    syllabus: {
      type: [syllabusEntrySchema],
      required: true,
      default: [],
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

eapTrainingSchema.plugin(toJSON);
eapTrainingSchema.plugin(paginate);

const EapTraining = mongoose.model('EapTraining', eapTrainingSchema);

export default EapTraining;
export { EAP_DURATION_OPTIONS };
