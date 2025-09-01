// models/recordedClass.Model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const classSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  classRecordingLink: {
    type: String,
    required: true,
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
  // You can add more fields as needed, such as date, duration, etc.

  // Timestamps to track when the class was created and last updated
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const RecordedClass = mongoose.model('RecordedClasses', classSchema);

export default RecordedClass;
