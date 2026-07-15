import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const trainerRatingSchema = new mongoose.Schema(
  {
    knowledge: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    engagement: { type: Number, min: 1, max: 5 },
    energy: { type: Number, min: 1, max: 5 },
    usefulness: { type: Number, min: 1, max: 5 },
  },
  { _id: false }
);

const trainerFeedbackSchema = new mongoose.Schema(
  {
    trainerNumber: { type: Number, enum: [1, 2] },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    order: { type: Number, min: 1 },
    name: { type: String, trim: true, default: '' },
    ratings: { type: trainerRatingSchema, default: () => ({}) },
    likedMost: { type: String, trim: true, default: '' },
    suggestions: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const wellnessFeedbackSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    trainerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' }],
    employeeName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    city: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    sessionDate: { type: Date },
    sessionsAttended: {
      type: [String],
      default: [],
    },
    sessionOther: { type: String, trim: true, default: '' },
    trainerMode: {
      type: String,
      enum: ['trainer', 'both', 'one', 'two'],
      default: 'trainer',
    },
    trainers: {
      type: [trainerFeedbackSchema],
      default: [],
    },
    overallSatisfaction: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
    },
    enjoyedActivities: {
      type: [String],
      default: [],
    },
    stressRelief: {
      type: String,
      enum: ['Yes, significantly', 'Somewhat', 'Neutral', 'Not really'],
    },
    wantMoreSessions: {
      type: String,
      enum: ['Yes', 'Maybe', 'No'],
    },
    preferredTopics: {
      type: [String],
      default: [],
    },
    additionalComments: { type: String, trim: true, default: '' },
    submittedFromIp: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

wellnessFeedbackSchema.index({ createdAt: -1 });
wellnessFeedbackSchema.index({ companyName: 1, createdAt: -1 });
wellnessFeedbackSchema.index({ booking: 1, createdAt: -1 });
wellnessFeedbackSchema.index({ company: 1, createdAt: -1 });

wellnessFeedbackSchema.plugin(toJSON);
wellnessFeedbackSchema.plugin(paginate);

const WellnessFeedback = mongoose.model('WellnessFeedback', wellnessFeedbackSchema);

export default WellnessFeedback;
