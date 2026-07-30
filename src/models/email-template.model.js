import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
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
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

emailTemplateSchema.plugin(toJSON);
emailTemplateSchema.plugin(paginate);

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
