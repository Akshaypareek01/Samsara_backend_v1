import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const marketingFolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

marketingFolderSchema.plugin(toJSON);
marketingFolderSchema.plugin(paginate);

const MarketingFolder = mongoose.model('MarketingFolder', marketingFolderSchema);

export default MarketingFolder;
