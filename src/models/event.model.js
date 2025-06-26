import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const requirementSchema = new mongoose.Schema({
  point: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    eventMode: {
      type: String,
      required: true,
      enum: ['offline', 'online'],
    },
    location: {
      type: String,
      trim: true,
      required: function() {
        return this.eventMode === 'offline';
      },
    },
    meetingLink: {
      type: String,
      trim: true,
      required: function() {
        return this.eventMode === 'online';
      },
    },
    meetingPassword: {
      type: String,
      trim: true,
      required: function() {
        return this.eventMode === 'online';
      },
    },
    eventImage: {
      type: String,
      required: false,
      trim: true,
    },
    eventDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: false,
    },
    maxSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventTime: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480, // 8 hours max
    },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    offlineRequirements: [requirementSchema],
    onlineRequirements: [requirementSchema],
    isPaid: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    registrationStartDate: {
      type: Date,
    },
    registrationEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
eventSchema.plugin(toJSON);
eventSchema.plugin(paginate);

/**
 * Check if event name is taken
 * @param {string} eventName - The event name
 * @param {ObjectId} [excludeEventId] - The id of the event to be excluded
 * @returns {Promise<boolean>}
 */
eventSchema.statics.isEventNameTaken = async function (eventName, excludeEventId) {
  const event = await this.findOne({ eventName, _id: { $ne: excludeEventId } });
  return !!event;
};

/**
 * Check if event is full
 * @returns {boolean}
 */
eventSchema.methods.isFull = function () {
  return this.currentEnrollment >= this.maxSeats;
};

/**
 * Check if student can enroll
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
eventSchema.methods.canEnroll = function (studentId) {
  if (this.isFull()) return false;
  if (this.status !== 'upcoming') return false;
  if (this.students.includes(studentId)) return false;
  
  const now = new Date();
  if (this.registrationEndDate && now > this.registrationEndDate) return false;
  if (this.registrationStartDate && now < this.registrationStartDate) return false;
  
  return true;
};

/**
 * Enroll student in event
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
eventSchema.methods.enrollStudent = function (studentId) {
  if (!this.canEnroll(studentId)) return false;
  
  this.students.push(studentId);
  this.currentEnrollment += 1;
  return true;
};

/**
 * Remove student from event
 * @param {ObjectId} studentId - The student's id
 * @returns {boolean}
 */
eventSchema.methods.removeStudent = function (studentId) {
  const studentIndex = this.students.indexOf(studentId);
  if (studentIndex === -1) return false;
  
  this.students.splice(studentIndex, 1);
  this.currentEnrollment = Math.max(0, this.currentEnrollment - 1);
  return true;
};

/**
 * Get remaining seats
 * @returns {number}
 */
eventSchema.methods.getRemainingSeats = function () {
  return Math.max(0, this.maxSeats - this.currentEnrollment);
};

/**
 * Check if event is ongoing
 * @returns {boolean}
 */
eventSchema.methods.isOngoing = function () {
  const now = new Date();
  const eventDateTime = new Date(this.eventDate);
  const endDateTime = new Date(eventDateTime.getTime() + this.duration * 60000); // duration in minutes
  
  return now >= eventDateTime && now <= endDateTime;
};

/**
 * Check if event is completed
 * @returns {boolean}
 */
eventSchema.methods.isCompleted = function () {
  const now = new Date();
  const eventDateTime = new Date(this.eventDate);
  const endDateTime = new Date(eventDateTime.getTime() + this.duration * 60000);
  
  return now > endDateTime;
};

/**
 * Update event status based on current time
 */
eventSchema.methods.updateStatus = function () {
  if (this.isCompleted()) {
    this.status = 'completed';
  } else if (this.isOngoing()) {
    this.status = 'ongoing';
  } else {
    this.status = 'upcoming';
  }
};

// Pre-save middleware to update status
eventSchema.pre('save', function (next) {
  // Update status based on current time
  this.updateStatus();
  
  next();
});

/**
 * @typedef Event
 */
const Event = mongoose.model('Event', eventSchema);

export default Event;
