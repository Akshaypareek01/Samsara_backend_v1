import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const emailCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    bodyHtml: {
      type: String,
      default: '',
    },
    bodyText: {
      type: String,
      default: '',
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      default: null,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingFolder',
      default: null,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingContact',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent', 'partial', 'failed'],
      default: 'draft',
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    sentAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

emailCampaignSchema.plugin(toJSON);
emailCampaignSchema.plugin(paginate);

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);

export default EmailCampaign;
