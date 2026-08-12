import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';
import NotificationPreferences from './notificationPreferences.model.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      trim: true,
      maxlength: [60, 'Name must be 60 characters or fewer.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      // Case-sensitive emails let Foo@x.com and foo@x.com become two accounts
      // with separate memberships and health data.
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    gender: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'teacher'],
      default: 'user',
    },
    // User category (for regular users)
    userCategory: {
      type: String,
      enum: ['Personal', 'Corporate'],
      required() {
        return this.role === 'user';
      },
    },
    // Teacher specific fields
    teacherCategory: {
      type: String,
      enum: [
        'Fitness Coach',
        'Ayurveda Specialist',
        'Mental Health Specialist',
        'Yoga Trainer',
        'Sound Healing',
        'Psychologist',
        'General Trainer',
      ],
      required() {
        return this.role === 'teacher';
      },
    },
    teachingExperience: {
      type: String,
      required: false,
    },
    expertise: [String],
    qualification: [Object],
    additional_courses: [Object],

    // Company related fields (for corporate users)
    company_name: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
    },
    companyId: {
      type: String,
      ref: 'Company',
      required: false,
    },
    corporate_id: {
      type: String,
      required() {
        return this.role === 'user' && this.userCategory === 'Corporate';
      },
    },

    password: {
      type: String,
      // Stripped by the toJSON plugin. Without this the bcrypt hash was
      // returned by every endpoint that serialises a user — /users/profile,
      // /users/:userId, the admin list, and any populated `teacher`/`students`.
      // Admin already had it; Users did not.
      private: true,
      // Defence in depth. Every entry point already applies the same rule via
      // Joi's `custom(password)`, but the model must not be the weak link if a
      // script or new code path sets a password directly.
      // Only applies to plaintext on the way in — the pre-save hash runs after
      // validation, and bcrypt output satisfies both rules anyway.
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator(value) {
          if (value == null || value === '') return true; // OTP-only accounts
          return /\d/.test(value) && /[a-zA-Z]/.test(value);
        },
        message: 'Password must contain at least one letter and one number',
      },
    },
    passwordResetToken: {
      type: String,
      private: true,
    },
    mobile: {
      type: String,
      required: [false, 'Please provide a mobile number'],
      minlength: 10,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    emergencyMobile: {
      type: String,
      required: [false, 'Please provide a emergency mobile number'],
      minlength: 10,
      sparse: true, // Allow multiple null values
    },
    dob: {
      type: String,
      required: [false, 'Please provide date of birth'],
    },
    age: {
      type: String,
      required: [false, 'Please provide user age'],
    },
    Address: {
      type: String,
      required: [false, 'Please provide address'],
    },
    city: {
      type: String,
      required: [false, 'A user must have a city'],
    },
    pincode: {
      type: String,
      required: [false, 'A user must have a pincode'],
    },
    country: {
      type: String,
      required: [false, 'A user must have a country'],
    },
    height: {
      type: String,
      required: [false, 'user height is required'],
    },
    weight: {
      type: String,
      required: [false, 'user weight is required'],
    },
    targetWeight: {
      type: String,
      required: [false, 'Please provide user target weight'],
    },
    bodyshape: {
      type: String,
      required: [false, 'Please provide user body shape'],
    },
    weeklyyogaplan: {
      type: String,
      required: [false, 'Please provide user weekly yoga plan'],
    },
    practicetime: {
      type: String,
      required: [false, 'Please provide user practice time'],
    },
    focusarea: [String],
    goal: [String],
    health_issues: [String],
    howyouknowus: {
      type: String,
      required: [false, 'howyouknowus is required'],
    },
    PriorExperience: {
      type: String,
      required: [false, 'PriorExperience is required'],
    },
    description: {
      type: String,
    },
    attendance: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        joinedAt: Date,
        leftAt: Date,
        durationMinutes: Number,
        kcalBurned: Number,
      },
    ],
    achievements: [String],
    assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
    classFeedback: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        formData: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    status: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        filename: String, // Store the filename of the image
        path: String,
        key: String, // Store the path to the image in the media folder
      },
    ],
    profileImage: {
      type: String,
      default: 'https://pub-4471af5ad08f4d59887c139e8f2cd164.r2.dev/c774f4eb-1c3c-400b-85b8-2f09b83d89a1.jpg',
    },
    AboutMe: {
      type: String,
      default: '',
    },

    notificationToken: {
      type: String,
      default: '',
    },
    // Favorites system
    favoriteClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    favoriteEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    favoriteTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    
    // Membership tracking
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Notification preferences reference
    notificationPreferences: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationPreferences',
      default: null,
    },

    /** Public shareable code (generated server-side; unique when set) */
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    /** User who referred this account (set only at signup) */
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      default: null,
    },
    referredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {},
  }
);

// Apply plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

const REFERRAL_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Builds a random referral code prefix SAM + 5 chars (collisions retried in pre-save).
 * @returns {string}
 */
function buildReferralCodeCandidate() {
  const bytes = crypto.randomBytes(8);
  let s = 'SAM';
  for (let i = 0; i < 5; i += 1) {
    s += REFERRAL_CHARSET[bytes[i] % REFERRAL_CHARSET.length];
  }
  return s;
}

// Assign persistent referral code when missing (new or legacy users on next save)
userSchema.pre('save', async function (next) {
  try {
    if (this.referralCode) return next();
    const UserModel = this.constructor;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const candidate = buildReferralCodeCandidate();
      // eslint-disable-next-line no-await-in-loop
      const exists = await UserModel.findOne({ referralCode: candidate }).select('_id').lean();
      if (!exists) {
        this.referralCode = candidate;
        break;
      }
    }
    if (!this.referralCode) {
      return next(new Error('Failed to assign unique referral code'));
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// Create notification preferences when user is created
userSchema.post('save', async function (doc, next) {
  try {
    // Only create preferences if this is a new user and preferences don't exist
    if (this.isNew && !this.notificationPreferences) {
      const preferences = await NotificationPreferences.createDefaultPreferences(this._id);
      this.notificationPreferences = preferences._id;
      await this.save();
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Reset Password
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime());
    return JWTTimestamp < changedTimestamp;
  }
  // False means Not Changed
  return false;
};

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const normalized = String(email || '').trim().toLowerCase();
  const user = await this.findOne({ email: normalized, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Get user's notification preferences
 * @returns {Promise<Object>} User's notification preferences
 */
userSchema.methods.getNotificationPreferences = async function () {
  if (!this.notificationPreferences) {
    // Create preferences if they don't exist
    const preferences = await NotificationPreferences.createDefaultPreferences(this._id);
    this.notificationPreferences = preferences._id;
    await this.save();
    return preferences;
  }
  
  return await NotificationPreferences.findById(this.notificationPreferences);
};

/**
 * Check if user can receive a specific type of notification
 * @param {string} notificationType - The type of notification
 * @returns {Promise<boolean>} Whether user can receive the notification
 */
userSchema.methods.canReceiveNotification = async function (notificationType) {
  const preferences = await this.getNotificationPreferences();
  return preferences.canReceiveNotification(notificationType);
};

// perf indexes — admin list filters and teacher lookups
userSchema.index({ role: 1, userCategory: 1 });
userSchema.index({ companyId: 1 });

export const User = mongoose.model('Users', userSchema);
