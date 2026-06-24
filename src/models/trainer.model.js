import mongoose from 'mongoose';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_CITY_ENUM,
  TRAINER_EXPERIENCE_ENUM,
  TRAINER_SPECIALIST_IN_ALL,
  TRAINER_TYPE_OF_TRAINING_ALL,
} from '../constants/trainerProfileEnums.js';
import {
  filterFilledCertificationEntries,
  filterFilledEducationEntries,
  normalizeCertificationList,
  normalizeEducationList,
} from '../utils/trainerQualificationUtils.js';
import { normalizeWeeklyAvailability } from '../utils/trainerAvailabilityUtils.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

const trainerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Mobile number must be 10 digits',
      },
    },
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Trainer title is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Trainer bio is required'],
      maxlength: [2000, 'Bio must be less than or equal to 2000 characters (approximately 400 words)'],
      trim: true,
    },
    category: {
      type: [String],
      enum: TRAINER_CATEGORY_ENUM,
      required: [true, 'Trainer category is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: 'At least one trainer category is required',
      },
    },
    // Audience the trainer works with (UI label: "Training For")
    specialistIn: {
      type: [String],
      required: [true, 'Specialist field is required'],
      enum: TRAINER_SPECIALIST_IN_ALL,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one specialty is required',
      },
    },
    // Wellness disciplines the trainer offers (UI label: "Specializations")
    typeOfTraining: {
      type: [String],
      required: [true, 'Type of training is required'],
      enum: TRAINER_TYPE_OF_TRAINING_ALL,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one type of training is required',
      },
    },
    // Date of birth (optional; collected at registration)
    dateOfBirth: {
      type: Date,
    },
    /** @deprecated Legacy single city — prefer `cities`. Removed after data migration. */
    city: {
      type: String,
      trim: true,
    },
    cities: {
      type: [String],
      enum: TRAINER_CITY_ENUM,
      default: [],
    },
    pinCode: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => v == null || v === '' || /^[0-9]{6}$/.test(v),
        message: 'PIN code must be 6 digits',
      },
    },
    experience: {
      type: String,
      enum: TRAINER_EXPERIENCE_ENUM,
      trim: true,
    },
    // Academic qualification entries (max 5)
    education: [
      {
        qualification: { type: String, trim: true },
        university: { type: String, trim: true },
        yearOfCompletion: { type: Number, min: 1900, max: 2100 },
      },
    ],
    // Professional certification / course entries (max 5)
    certification: [
      {
        name: { type: String, trim: true },
        institute: { type: String, trim: true },
        year: { type: Number, min: 1900, max: 2100 },
      },
    ],
    images: [
      {
        key: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
      },
    ],
    profilePhoto: {
      key: {
        type: String,
        default: null,
      },
      path: {
        type: String,
        default: null,
      },
    },
    /** Payout account details — only exposed on GET /trainers/me (select: false). */
    accountDetails: {
      type: {
        upiId: { type: String, trim: true, default: '' },
        bankName: { type: String, trim: true, default: '' },
        accountNumber: { type: String, trim: true, default: '' },
        ifscCode: { type: String, trim: true, uppercase: true, default: '' },
        accountHolderName: { type: String, trim: true, default: '' },
        panNumber: { type: String, trim: true, uppercase: true, default: '' },
        panDocument: {
          key: { type: String, default: '' },
          path: { type: String, default: '' },
        },
        gstNumber: { type: String, trim: true, uppercase: true, default: '' },
        gstDocument: {
          key: { type: String, default: '' },
          path: { type: String, default: '' },
        },
      },
      default: () => ({}),
      select: false,
    },
    /** Denormalized aggregate from TrainerRating collection. */
    ratingSummary: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    status: {
      type: Boolean,
      default: true,
    },
    /** When false, companies cannot create new bookings for this trainer (existing bookings unchanged). */
    acceptingBookings: {
      type: Boolean,
      default: true,
    },
    /** Recurring weekly windows when the trainer accepts sessions (optional). */
    weeklyAvailability: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          slots: [
            {
              startTime: { type: String, trim: true, required: true },
              endTime: { type: String, trim: true, required: true },
            },
          ],
        },
      ],
      default: () => [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Normalize legacy single-object education/certification shapes after load.
 *
 * @param {import('mongoose').Document} doc - Trainer document.
 */
function normalizeLegacyQualificationsOnInit(doc) {
  if (doc.education != null && !Array.isArray(doc.education)) {
    doc.education = normalizeEducationList(doc.education);
  }
  if (doc.certification != null && !Array.isArray(doc.certification)) {
    doc.certification = normalizeCertificationList(doc.certification);
  }
  if (doc.weeklyAvailability == null || !Array.isArray(doc.weeklyAvailability)) {
    doc.weeklyAvailability = [];
  }
  if ((!doc.cities || doc.cities.length === 0) && doc.city) {
    const legacyCity = String(doc.city).trim();
    if (legacyCity) {
      doc.cities = [legacyCity];
    }
  }
  if (doc.category != null && !Array.isArray(doc.category)) {
    doc.category = normalizeTrainerCategories(doc.category);
  }
}

trainerSchema.post('init', normalizeLegacyQualificationsOnInit);

trainerSchema.pre('save', function preSaveNormalizeQualifications(next) {
  if (this.education !== undefined) {
    this.education = filterFilledEducationEntries(normalizeEducationList(this.education));
  }
  if (this.certification !== undefined) {
    this.certification = filterFilledCertificationEntries(normalizeCertificationList(this.certification));
  }
  if (this.weeklyAvailability !== undefined) {
    this.weeklyAvailability = normalizeWeeklyAvailability(this.weeklyAvailability);
  }
  if (Array.isArray(this.cities) && this.cities.length > 0) {
    this.city = undefined;
  } else if (this.city) {
    const legacyCity = String(this.city).trim();
    if (legacyCity) {
      this.cities = [legacyCity];
    }
  }
  if (this.category !== undefined) {
    this.category = normalizeTrainerCategories(this.category);
  }
  next();
});

// add plugin that converts mongoose to json
trainerSchema.plugin(toJSON);
trainerSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The trainer's email
 * @param {ObjectId} [excludeTrainerId] - The id of the trainer to be excluded
 * @returns {Promise<boolean>}
 */
trainerSchema.statics.isEmailTaken = async function (email, excludeTrainerId) {
  const trainer = await this.findOne({ email, _id: { $ne: excludeTrainerId } });
  return !!trainer;
};

/**
 * Check if mobile is taken
 * @param {string} mobile - The trainer's mobile number
 * @param {ObjectId} [excludeTrainerId] - The id of the trainer to be excluded
 * @returns {Promise<boolean>}
 */
trainerSchema.statics.isMobileTaken = async function (mobile, excludeTrainerId) {
  const trainer = await this.findOne({ mobile, _id: { $ne: excludeTrainerId } });
  return !!trainer;
};

const Trainer = mongoose.model('Trainer', trainerSchema);

export default Trainer;

