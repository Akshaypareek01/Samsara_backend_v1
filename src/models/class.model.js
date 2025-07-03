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
    
  whoitsfor:{
    type: String,
    required: false
  },
  whoitsnotfor:{
    type: String,
    required: false
  },
  howItWillHelp:{
    type: String,
    required: false
  },
  howItWillnotHelp:{
    type: String,
    required: false
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
  // Add other fields as needed
});

export const Class = mongoose.model('Class', classSchema);

