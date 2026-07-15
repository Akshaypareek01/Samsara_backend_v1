import Joi from 'joi';

const trainerRatingSchema = Joi.object({
  knowledge: Joi.number().integer().min(1).max(5),
  communication: Joi.number().integer().min(1).max(5),
  engagement: Joi.number().integer().min(1).max(5),
  energy: Joi.number().integer().min(1).max(5),
  usefulness: Joi.number().integer().min(1).max(5),
});

const trainerFeedbackSchema = Joi.object({
  trainerNumber: Joi.number().valid(1, 2),
  trainerId: Joi.string().trim().hex().length(24),
  order: Joi.number().integer().min(1),
  name: Joi.string().trim().allow('').max(200),
  ratings: trainerRatingSchema.default({}),
  likedMost: Joi.string().trim().allow('').max(1000),
  suggestions: Joi.string().trim().allow('').max(1000),
});

const submitWellnessFeedback = {
  body: Joi.object({
    token: Joi.string().trim(),
    employeeName: Joi.string().trim().allow('').max(200),
    email: Joi.string().trim().lowercase().max(320).empty('').email({ tlds: { allow: false } }),
    city: Joi.string().trim().allow('').max(120),
    companyName: Joi.string().trim().allow('').max(200),
    sessionDate: Joi.date().iso().allow(null, ''),
    sessionsAttended: Joi.array().items(Joi.string().trim().max(100)).default([]),
    sessionOther: Joi.string().trim().allow('').max(300),
    trainerMode: Joi.string().valid('trainer', 'both', 'one', 'two').default('trainer'),
    trainers: Joi.array().items(trainerFeedbackSchema).default([]),
    overallSatisfaction: Joi.string()
      .valid('Excellent', 'Good', 'Average', 'Needs Improvement')
      .required(),
    enjoyedActivities: Joi.array().items(Joi.string().trim().max(100)).default([]),
    stressRelief: Joi.string()
      .valid('Yes, significantly', 'Somewhat', 'Neutral', 'Not really')
      .required(),
    wantMoreSessions: Joi.string().valid('Yes', 'Maybe', 'No').required(),
    preferredTopics: Joi.array().items(Joi.string().trim().max(100)).default([]),
    additionalComments: Joi.string().trim().allow('').max(5000),
  }),
};

const listWellnessFeedback = {
  query: Joi.object({
    companyName: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getFeedbackContext = {
  query: Joi.object({
    token: Joi.string().trim().required(),
  }),
};

const createBookingShareLink = {
  params: Joi.object({
    bookingId: Joi.string().trim().hex().length(24).required(),
  }),
};

export { submitWellnessFeedback, listWellnessFeedback, getFeedbackContext, createBookingShareLink };
