import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    meetingName: String,
    title: String,
    duration: Number,
    meetingId: String,
    meetingPassword: String,
    hostName: String,
    teacherName: String,
  });
  
  export const Meeting = mongoose.model('Meeting', meetingSchema);