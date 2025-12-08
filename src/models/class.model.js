import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  password: { type: String, required: false },
  meeting_number: { type: String },
  zoomAccountUsed: { type: String }, // Track which Zoom account was used for this meeting
  zoomJoinUrl: { type: String }, // Store Zoom join URL for quick access
  zoomStartUrl: { type: String }, // Store Zoom start URL for host
  zoomMeetingId: { type: String }, // Store Zoom meeting ID (different from meeting number)
  zoomSettings: {
    hostVideo: { type: Boolean, default: true },
    participantVideo: { type: Boolean, default: true },
    joinBeforeHost: { type: Boolean, default: true },
    autoRecording: { type: String, enum: ['local', 'cloud', 'none'], default: 'local' },
    waitingRoom: { type: Boolean, default: false },
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    // Validate that the referenced user has role 'teacher'
    validate: {
      async validator(teacherId) {
        const User = mongoose.model('Users');
        const teacher = await User.findById(teacherId);
        return teacher && teacher.role === 'teacher';
      },
      message: 'Teacher must be a user with role "teacher"',
    },
  },
  status: {
    type: Boolean,
    default: false,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  schedule: { type: Date, default: Date.now, required: true },
  startTime: { type: String, required: false },
  endTime: { type: String, required: false },
  level: {
    type: [String],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: false,
  },
  recordingPath: String,
  image: { type: String }, // URL or file path
  classType: { type: String, required: true }, // or enum
  classCategory: {
    type: String,
    enum: ['yoga class', 'meditation class', 'pcos/pcod class', 'thyroid class'],
    default: 'yoga class',
    required: false,
  },
  duration: { type: Number, required: true },
  maxCapacity: { type: Number, required: true },
  schedules: [
    {
      date: { type: Date },
      days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
      startTime: String,
      endTime: String,
    },
  ],
  perfectFor: [{ type: String }],
  skipIf: [{ type: String }],
  whatYoullGain: [{ type: String }],
  // Add other fields as needed
});

// Pre-save hook to extract date from schedules and set it to schedule field
classSchema.pre('save', function(next) {
  // If schedules array exists and has at least one entry with a date
  if (this.schedules && this.schedules.length > 0 && this.schedules[0].date) {
    // Set schedule from the first schedule's date if schedule is not already set
    if (!this.schedule || this.isModified('schedules')) {
      this.schedule = new Date(this.schedules[0].date);
    }
  }
  next();
});

export const Class = mongoose.model('Class', classSchema);
