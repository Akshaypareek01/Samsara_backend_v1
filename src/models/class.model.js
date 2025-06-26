import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

const ratingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const classSchema = new mongoose.Schema(
  {
    classImage: {
      type: String,
      required: false,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    classType: {
      type: String,
      required: true,
      enum: ['online', 'offline'],
      default: 'online',
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480, // 8 hours max
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: false,
    },
    schedule: [scheduleSchema],
    classDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    perfectFor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    skipIf: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    whatYouWillGain: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    ratings: [ratingSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed', 'cancelled'],
      default: 'active',
    },
    classStartDate: {
      type: Date,
    },
    classEndDate: {
      type: Date,
    },
    prerequisites: [{
      type: String,
      trim: true,
    }],
    attendance: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present',
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Add plugins
classSchema.plugin(toJSON);
classSchema.plugin(paginate);

/**
 * Check if class name is taken
 * @param {string} className - The class name
 * @param {ObjectId} [excludeClassId] - The id of the class to be excluded
 * @returns {Promise<boolean>}
 */
classSchema.statics.isClassNameTaken = async function (className, excludeClassId) {
  const classDoc = await this.findOne({ className, _id: { $ne: excludeClassId } });
  return !!classDoc;
};

/**
 * Check if class is full
 * @returns {boolean}
 */
classSchema.methods.isFull = function () {
  return this.currentEnrollment >= this.maxCapacity;
};

/**
 * Check if student can enroll
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
classSchema.methods.canEnroll = function (studentId) {
  if (this.isFull()) return false;
  if (this.status !== 'active') return false;
  if (this.students.includes(studentId)) return false;
  return true;
};

/**
 * Enroll student in class
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
classSchema.methods.enrollStudent = function (studentId) {
  if (!this.canEnroll(studentId)) return false;
  
  this.students.push(studentId);
  this.currentEnrollment += 1;
  return true;
};

/**
 * Remove student from class
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
classSchema.methods.removeStudent = function (studentId) {
  const studentIndex = this.students.indexOf(studentId);
  if (studentIndex === -1) return false;
  
  this.students.splice(studentIndex, 1);
  this.currentEnrollment = Math.max(0, this.currentEnrollment - 1);
  return true;
};

/**
 * Calculate average rating
 */
classSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  this.averageRating = Math.round((totalRating / this.ratings.length) * 10) / 10;
  this.totalRatings = this.ratings.length;
};

/**
 * Add or update rating
 * @param {ObjectId} studentId - The student's id
 * @param {number} rating - The rating value
 * @param {string} review - The review text
 */
classSchema.methods.addRating = function (studentId, rating, review = '') {
  const existingRatingIndex = this.ratings.findIndex((r) => r.student.toString() === studentId.toString());
  
  if (existingRatingIndex !== -1) {
    // Update existing rating
    this.ratings[existingRatingIndex].rating = rating;
    this.ratings[existingRatingIndex].review = review;
    this.ratings[existingRatingIndex].updatedAt = new Date();
  } else {
    // Add new rating
    this.ratings.push({
      student: studentId,
      rating,
      review,
    });
  }
  
  this.calculateAverageRating();
};

/**
 * Remove rating
 * @param {ObjectId} studentId - The student's id
 */
classSchema.methods.removeRating = function (studentId) {
  const ratingIndex = this.ratings.findIndex((r) => r.student.toString() === studentId.toString());
  if (ratingIndex !== -1) {
    this.ratings.splice(ratingIndex, 1);
    this.calculateAverageRating();
  }
};

/**
 * Mark attendance
 * @param {ObjectId} studentId - The student's id
 * @param {Date} date - The date
 * @param {string} status - The attendance status
 * @param {string} notes - Additional notes
 */
classSchema.methods.markAttendance = function (studentId, date, status = 'present', notes = '') {
  const attendanceIndex = this.attendance.findIndex(
    (a) => a.student.toString() === studentId.toString() && a.date.toDateString() === date.toDateString()
  );
  
  if (attendanceIndex !== -1) {
    // Update existing attendance
    this.attendance[attendanceIndex].status = status;
    this.attendance[attendanceIndex].notes = notes;
    this.attendance[attendanceIndex].updatedAt = new Date();
  } else {
    // Add new attendance
    this.attendance.push({
      student: studentId,
      date,
      status,
      notes,
    });
  }
};

// Pre-save middleware to calculate average rating
classSchema.pre('save', function (next) {
  if (this.isModified('ratings')) {
    this.calculateAverageRating();
  }
  next();
});

/**
 * @typedef Class
 */
const Class = mongoose.model('Class', classSchema);

export default Class;
