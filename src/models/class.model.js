import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  password: { type: String, required: true },
  meeting_number:{ type: String},
  teacher: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    // Validate that the referenced user has role 'teacher'
    validate: {
      validator: async function(teacherId) {
        const User = mongoose.model('Users');
        const teacher = await User.findById(teacherId);
        return teacher && teacher.role === 'teacher';
      },
      message: 'Teacher must be a user with role "teacher"'
    }
  },
  status: {
    type: Boolean,
    default: false,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  schedule: { type: Date, default: Date.now, required: true },
  startTime:{ type: String, required: false },
  endTime:{ type: String, required: false },
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    required: false 
  },
  recordingPath: String,
  image: { type: String }, // URL or file path
  classType: { type: String, required: true }, // or enum
  duration: { type: Number, required: true },
  maxCapacity: { type: Number, required: true },
  schedules: [{
    days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    startTime: String,
    endTime: String,
  }],
  perfectFor: [{ type: String }],
  skipIf: [{ type: String }],
  whatYoullGain: [{ type: String }],
  // Add other fields as needed
});

export const Class = mongoose.model('Class', classSchema);

