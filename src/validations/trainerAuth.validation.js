import Joi from 'joi';
import { objectId } from './custom.validation.js';

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    mobile: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .message('Mobile number must be exactly 10 digits'),
    name: Joi.string().required().trim(),
    title: Joi.string().required().trim(),
    bio: Joi.string().required().max(2000).trim(),
    specialistIn: Joi.array()
      .items(Joi.string().valid('Employees', 'Mid Level Managers', 'Leadership', 'GenZ'))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one specialty is required',
        'any.required': 'Specialist field is required',
      }),
    typeOfTraining: Joi.array()
      .items(
        Joi.string().valid(
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
          'Thriving as a Fresher: Adapting to the Corporate World'
        )
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one type of training is required',
        'any.required': 'Type of training is required',
      }),
    images: Joi.array()
      .items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      )
      .optional(),
    profilePhoto: Joi.object()
      .keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      })
      .optional(),
    status: Joi.boolean().optional(),
  }),
};

const sendLoginOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    otp: Joi.string().required().length(4).pattern(/^[0-9]{4}$/).message('OTP must be a 4-digit number'),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    // Password reset can be removed or kept for future use
  }),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      title: Joi.string().trim(),
      bio: Joi.string().max(2000).trim(),
      specialistIn: Joi.array()
        .items(Joi.string().valid('Employees', 'Mid Level Managers', 'Leadership', 'GenZ'))
        .min(1),
      typeOfTraining: Joi.array()
        .items(
          Joi.string().valid(
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
            'Strategic Leadership in Evolving Workplaces',
            'Building Inclusive Leadership Practices',
            'Leading Change with Emotional Intelligence',
            'Resilient Leadership: Thriving Through Disruption',
            'Fostering a Culture of Innovation and Growth',
            'Mentoring and Coaching for High-Performance Teams',
            'Leadership Agility: Adapting to Uncertainty',
            'Mental Health Leadership: Supporting Workforce Wellbeing',
            'From Campus to Corporate: The Real-World Starter Pack',
            'Emotional Intelligence 2.0: Thriving Beyond IQ',
            'The Resilience Playbook: Fail Fast, Rise Faster',
            'Unstoppable Confidence: Owning Your Story at Work',
            'Digital Detox for Digital Natives: Reclaiming Focus & Energy',
            'Collaborate & Conquer: Cracking Multigenerational Workplaces',
            'EQ in Action: Empathy as Your Superpower',
            'Thriving as a Fresher: Adapting to the Corporate World'
          )
        )
        .min(1),
      images: Joi.array().items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      ),
      profilePhoto: Joi.object().keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      }),
      status: Joi.boolean(),
    })
    .min(1),
};

export { register, sendLoginOTP, login, logout, refreshTokens, resetPassword, updateProfile };
