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
    /** Optional org unit for company reporting filters */
    department: {
      type: String,
      trim: true,
      default: 'Wellness',
    },
    status: {
      type: Boolean,
      default: true,
    },
    /** false after company-portal soft delete */
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      trim: true,
      default: '',
    },
    deletionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

companyUserSchema.plugin(toJSON);
companyUserSchema.plugin(paginate);

companyUserSchema.index(
  { companyId: 1, email: 1 },
  {
    unique: true,
    // Atlas / some MongoDB deployments reject `$exists` in partial indexes. `$ne: false`
    // keeps legacy docs (no `isActive`) and `true`; excludes soft-deleted `isActive: false`.
    partialFilterExpression: {
      isActive: { $ne: false },
    },
  }
);

const CompanyUser = mongoose.model('CompanyUser', companyUserSchema);

export default CompanyUser;
