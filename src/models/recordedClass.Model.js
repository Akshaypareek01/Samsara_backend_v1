// models/classModel.js
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
  teacher: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Teachers',
    required: true, },
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
