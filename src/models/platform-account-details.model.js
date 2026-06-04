import mongoose from 'mongoose';
import { toJSON } from './plugins/index.js';

const SINGLETON_KEY = 'platform';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    documentNumber: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, trim: true, default: '' },
  },
  { _id: true, timestamps: true }
);

const platformAccountDetailsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      unique: true,
      required: true,
      default: SINGLETON_KEY,
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true, default: '' },
      accountNumber: { type: String, trim: true, default: '' },
      ifscCode: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

platformAccountDetailsSchema.plugin(toJSON);

/**
 * Load or create the singleton platform account-details record.
 *
 * @returns {Promise<import('mongoose').Document>}
 */
platformAccountDetailsSchema.statics.getSingleton = async function getSingleton() {
  let record = await this.findOne({ singletonKey: SINGLETON_KEY });
  if (!record) {
    record = await this.create({ singletonKey: SINGLETON_KEY });
  }
  return record;
};

const PlatformAccountDetails = mongoose.model('PlatformAccountDetails', platformAccountDetailsSchema);

export default PlatformAccountDetails;
export { SINGLETON_KEY };
