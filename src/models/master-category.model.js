import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const MasterCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    soundUrl: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    order: {
      type: Number,
      default: 0,
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

MasterCategorySchema.plugin(toJSON);
MasterCategorySchema.plugin(paginate);

export const MasterCategory = mongoose.model('MasterCategory', MasterCategorySchema);
