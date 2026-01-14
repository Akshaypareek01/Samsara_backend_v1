import mongoose from 'mongoose';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';

const trainerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Mobile number must be 10 digits',
      },
    },
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Trainer title is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Trainer bio is required'],
      maxlength: [2000, 'Bio must be less than or equal to 2000 characters (approximately 400 words)'],
      trim: true,
    },
    specialistIn: {
      type: [String],
      required: [true, 'Specialist field is required'],
      enum: ['Employees', 'Mid Level Managers', 'Leadership', 'GenZ'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one specialty is required',
      },
    },
    typeOfTraining: {
      type: [String],
      required: [true, 'Type of training is required'],
      enum: [
        // Employees
        'Masterclass for Employee Wellbeing',
        'Emotional Intelligence Skill Workshop',
        'Mindfulness at Work',
        'Resilience during Change & Uncertainty',
        'The Mental Health Toolkit: Daily Self-Care for Working Professionals',
        'Managing Anxiety at Work: Coping with High-Pressure Moments',
        'Work-Life Balance and Digital Wellbeing',
        'Stress Management and Emotional Resilience',
        'Peer Support & Mental Health Champions Program',
        'Building Psychological Safety at Work',
        'Enhancing Collaboration through Emotional Intelligence',
        // Mid-Level Managers
        "Myndwell's Emerging Leader Series",
        'Emerging Leader Skill Assessment',
        'Weekly Sessions',
        'Continuous Learning Support',
        'Personalized One-on-One Sessions',
        'Post-Intervention Assessment',
        'Mastering Managerial Effectiveness',
        'Understanding Stress and Burnout',
        'Impactful Communication: Fostering Genuine Connections',
        'Boosting Team Performance & Upholding Organizational Culture',
        'Cultivating Leadership Excellence in Managers',
        "Navigating Performance Appraisal Dynamics: A Manager's Guide",
        'Manager Sensitization Program',
        'How to Have Difficult Conversations: A Guide for Leaders',
        'Feedback Mastery: Enhancing Communication and Performance',
        'Leading with Empathy: Mental Health Leadership Training',
        'Creating a Mentally Healthy Environment: A Culture of Psychological Safety',
        'Preventing Burnout: A Leadership Lens',
        'Emotional Intelligence for Managers',
        // Leadership
        'Strategic Leadership in Evolving Workplaces',
        'Building Inclusive Leadership Practices',
        'Leading Change with Emotional Intelligence',
        'Resilient Leadership: Thriving Through Disruption',
        'Fostering a Culture of Innovation and Growth',
        'Mentoring and Coaching for High-Performance Teams',
        'Leadership Agility: Adapting to Uncertainty',
        'Mental Health Leadership: Supporting Workforce Wellbeing',
        // GenZ
        'From Campus to Corporate: The Real-World Starter Pack',
        'Emotional Intelligence 2.0: Thriving Beyond IQ',
        'The Resilience Playbook: Fail Fast, Rise Faster',
        'Unstoppable Confidence: Owning Your Story at Work',
        'Digital Detox for Digital Natives: Reclaiming Focus & Energy',
        'Collaborate & Conquer: Cracking Multigenerational Workplaces',
        'EQ in Action: Empathy as Your Superpower',
        'Thriving as a Fresher: Adapting to the Corporate World',
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one type of training is required',
      },
    },
    images: [
      {
        key: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
      },
    ],
    profilePhoto: {
      key: {
        type: String,
        default: null,
      },
      path: {
        type: String,
        default: null,
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
trainerSchema.plugin(toJSON);
trainerSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The trainer's email
 * @param {ObjectId} [excludeTrainerId] - The id of the trainer to be excluded
 * @returns {Promise<boolean>}
 */
trainerSchema.statics.isEmailTaken = async function (email, excludeTrainerId) {
  const trainer = await this.findOne({ email, _id: { $ne: excludeTrainerId } });
  return !!trainer;
};

/**
 * Check if mobile is taken
 * @param {string} mobile - The trainer's mobile number
 * @param {ObjectId} [excludeTrainerId] - The id of the trainer to be excluded
 * @returns {Promise<boolean>}
 */
trainerSchema.statics.isMobileTaken = async function (mobile, excludeTrainerId) {
  const trainer = await this.findOne({ mobile, _id: { $ne: excludeTrainerId } });
  return !!trainer;
};

const Trainer = mongoose.model('Trainer', trainerSchema);

export default Trainer;

