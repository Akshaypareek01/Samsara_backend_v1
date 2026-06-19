import mongoose from 'mongoose';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_CITY_ENUM,
  TRAINER_LEAD_EXPERIENCE_ENUM,
} from '../constants/trainerProfileEnums.js';

/**
 * TrainerLead — quick/partial trainer registration captured from the short
 * lead-capture form. Intentionally separate from the `Trainer` collection:
 * this only stores the handful of fields collected on that form so it can be
 * reviewed, filtered, and exported by admins before a full registration
 * happens (if ever).
 */
const trainerLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: (v) => /^[0-9]{10}$/.test(v),
        message: 'Mobile number must be 10 digits',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: TRAINER_CATEGORY_ENUM,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: TRAINER_CITY_ENUM,
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      validate: {
        validator: (v) => /^[0-9]{6}$/.test(v),
        message: 'PIN code must be 6 digits',
      },
    },
    experience: {
      type: String,
      required: [true, 'Years of experience is required'],
      enum: TRAINER_LEAD_EXPERIENCE_ENUM,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    instagram: {
      type: String,
      trim: true,
      default: '',
    },
    /** Marks a lead as reviewed/contacted by an admin (manual triage). */
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Converted', 'Rejected'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

trainerLeadSchema.plugin(toJSON);
trainerLeadSchema.plugin(paginate);

const TrainerLead = mongoose.model('TrainerLead', trainerLeadSchema);

export default TrainerLead;
