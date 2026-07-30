import mongoose from 'mongoose';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';

const marketingContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingFolder',
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'import'],
      default: 'manual',
    },
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      default: null,
    },
    linkedCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

marketingContactSchema.index({ email: 1 });
marketingContactSchema.index({ folderId: 1 });

marketingContactSchema.plugin(toJSON);
marketingContactSchema.plugin(paginate);

const MarketingContact = mongoose.model('MarketingContact', marketingContactSchema);

export default MarketingContact;
