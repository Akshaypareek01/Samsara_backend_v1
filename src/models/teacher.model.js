import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const qualificationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true,
    trim: true,
  },
  institution: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    trim: true,
  },
  certificate: {
    filename: String,
    path: String,
  },
}, {
  timestamps: true,
});

const additionalCourseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  institution: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
  },
  completionDate: {
    type: Date,
  },
  certificate: {
    filename: String,
    path: String,
  },
}, {
  timestamps: true,
});

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      private: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    teachingExperience: {
      type: Number,
    },
    dob: {
      type: Date,
      required: true,
    },
    images: [imageSchema],
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: 'India',
      },
    },
    expertise: [{
      type: String,
      trim: true,
    }],
    qualification: [qualificationSchema],
    additionalCourses: [additionalCourseSchema],
    description: {
      type: String,
      trim: true,
    },
    achievements: [{
      type: String,
      trim: true,
    }],
    attendance: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    }],
    passwordChangedAt: {
      type: Date,
      private: true,
    },
    passwordResetToken: {
      type: String,
      private: true,
    },
    passwordResetExpires: {
      type: Date,
      private: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
teacherSchema.plugin(toJSON);
teacherSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The teacher's email
 * @param {ObjectId} [excludeTeacherId] - The id of the teacher to be excluded
 * @returns {Promise<boolean>}
 */
teacherSchema.statics.isEmailTaken = async function (email, excludeTeacherId) {
  const teacher = await this.findOne({ email, _id: { $ne: excludeTeacherId } });
  return !!teacher;
};

/**
 * Check if mobile is taken
 * @param {string} mobile - The teacher's mobile
 * @param {ObjectId} [excludeTeacherId] - The id of the teacher to be excluded
 * @returns {Promise<boolean>}
 */
teacherSchema.statics.isMobileTaken = async function (mobile, excludeTeacherId) {
  const teacher = await this.findOne({ mobile, _id: { $ne: excludeTeacherId } });
  return !!teacher;
};

/**
 * Check if password matches the teacher's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
teacherSchema.methods.isPasswordMatch = async function (password) {
  const teacher = this;
  return bcrypt.compare(password, teacher.password);
};

/**
 * Check if password was changed after the given timestamp
 * @param {number} JWTTimestamp
 * @returns {boolean}
 */
teacherSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Create password reset token
 * @returns {string}
 */
teacherSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

/**
 * Calculate profile completion percentage
 */
teacherSchema.methods.calculateProfileCompletion = function () {
  const requiredFields = [
    'name',
    'email',
    'mobile',
    'dob',
    'address.street',
    'address.city',
    'address.state',
    'address.pincode',
    'address.country',
    'expertise',
    'qualification',
  ];

  let completedFields = 0;
  requiredFields.forEach((field) => {
    let value;
    if (field.includes('.')) {
      const keys = field.split('.');
      value = keys.reduce((obj, key) => obj && obj[key], this);
    } else {
      value = this[field];
    }

    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completedFields += 1;
    }
  });

  this.profileCompletionPercentage = Math.round((completedFields / requiredFields.length) * 100);
  this.isProfileComplete = this.profileCompletionPercentage >= 80;

  return this.profileCompletionPercentage;
};

// Pre-save middleware
teacherSchema.pre('save', async function (next) {
  const teacher = this;

  if (teacher.isModified('password')) {
    teacher.password = await bcrypt.hash(teacher.password, 12);
  }

  if (!teacher.isModified('password') || teacher.isNew) return next();

  teacher.passwordChangedAt = Date.now() - 1000;
  next();
});

// Pre-save middleware for profile completion
teacherSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.calculateProfileCompletion();
  }
  next();
});

/**
 * @typedef Teacher
 */
const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
