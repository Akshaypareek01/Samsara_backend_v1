// Assuming you're using ES6 syntax and have already imported mongoose
import mongoose from 'mongoose';

// New model for time slots
const timeSlotSchema = new mongoose.Schema({
  timeRange: {
    type: String,
    required: true,
  },
  available: {
    type: Boolean,
    default: true, // Slots are available by default
  },
});

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

// Modified CustomSession model
const customSessionSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true,
  },
  password: { type: String},
  meeting_number:{ type: String},
  message: {
    type: String,
    required: true,
  },
  date:{
    type: String,
    required: true,
  },
  sessionValue: {
    type: String,
    default: 'pending', // Sessions are pending by default
  },
  status: {
    type: Boolean,
    default: false,
  },
});

const CustomSession = mongoose.model('CustomSession', customSessionSchema);

export { CustomSession, TimeSlot };
