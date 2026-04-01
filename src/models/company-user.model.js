import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const companyUserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
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

companyUserSchema.plugin(toJSON);
companyUserSchema.plugin(paginate);

companyUserSchema.index({ companyId: 1, email: 1 }, { unique: true });

const CompanyUser = mongoose.model('CompanyUser', companyUserSchema);

export default CompanyUser;
