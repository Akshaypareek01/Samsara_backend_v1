import Joi from 'joi';

const createClassWithNotification = {
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
    description: Joi.string().max(1000).optional(),
    instructor: Joi.string().required().max(100),
    scheduledAt: Joi.date().required(),
    participants: Joi.array().items(Joi.string().hex().length(24)).optional(),
    metadata: Joi.object().optional()
  })
};

const createEventWithNotification = {
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
    description: Joi.string().max(1000).optional(),
    eventDate: Joi.date().required(),
    location: Joi.string().required().max(200),
    attendees: Joi.array().items(Joi.string().hex().length(24)).optional(),
    metadata: Joi.object().optional()
  })
};

const createAppointmentWithNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    title: Joi.string().required().max(200),
    appointmentDate: Joi.date().required(),
    doctor: Joi.string().required().max(100),
    type: Joi.string().required().max(100),
    metadata: Joi.object().optional()
  })
};

const updateClassWithNotification = {
  body: Joi.object().keys({
    classId: Joi.string().hex().length(24).required(),
    updates: Joi.object().required(),
    notifyParticipants: Joi.boolean().default(true)
  })
};

const sendAppUpdateNotification = {
  body: Joi.object().keys({
    version: Joi.string().required().max(20),
    features: Joi.array().items(Joi.string().max(100)).required(),
    updateType: Joi.string().valid('minor', 'major', 'critical').default('minor'),
    metadata: Joi.object().optional()
  })
};

const sendPaymentNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    amount: Joi.number().positive().required(),
    status: Joi.string().valid('successful', 'failed', 'pending', 'refunded').required(),
    paymentMethod: Joi.string().required().max(50),
    metadata: Joi.object().optional()
  })
};

const sendMembershipNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    membershipType: Joi.string().required().max(100),
    status: Joi.string().valid('active', 'expired', 'cancelled', 'renewed').required(),
    expiryDate: Joi.date().optional(),
    metadata: Joi.object().optional()
  })
};

const sendAssessmentNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    assessmentType: Joi.string().required().max(100),
    status: Joi.string().valid('completed', 'pending', 'failed').required(),
    score: Joi.number().min(0).max(100).optional(),
    metadata: Joi.object().optional()
  })
};

const sendMeditationNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    meditationType: Joi.string().required().max(100),
    duration: Joi.number().positive().required(),
    metadata: Joi.object().optional()
  })
};

const sendDietNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    dietPlan: Joi.string().required().max(200),
    metadata: Joi.object().optional()
  })
};

const sendPeriodTrackerNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).required(),
    cyclePhase: Joi.string().valid('menstrual', 'follicular', 'ovulation', 'luteal').required(),
    daysUntilNext: Joi.number().integer().min(0).required(),
    metadata: Joi.object().optional()
  })
};

const sendCustomNotification = {
  body: Joi.object().keys({
    userId: Joi.string().hex().length(24).optional(),
    title: Joi.string().required().max(200),
    message: Joi.string().required().max(1000),
    type: Joi.string().valid(
      'class_update',
      'upcoming_class',
      'upcoming_event',
      'upcoming_appointment',
      'app_update',
      'general',
      'payment',
      'membership',
      'assessment',
      'meditation',
      'diet',
      'period_tracker'
    ).default('general'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    metadata: Joi.object().optional(),
    actionUrl: Joi.string().uri().optional(),
    actionText: Joi.string().max(50).optional()
  })
};

const sendBulkNotifications = {
  body: Joi.object().keys({
    userIds: Joi.array().items(Joi.string().hex().length(24)).min(1).max(1000).required(),
    title: Joi.string().required().max(200),
    message: Joi.string().required().max(1000),
    type: Joi.string().valid(
      'class_update',
      'upcoming_class',
      'upcoming_event',
      'upcoming_appointment',
      'app_update',
      'general',
      'payment',
      'membership',
      'assessment',
      'meditation',
      'diet',
      'period_tracker'
    ).default('general'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    metadata: Joi.object().optional()
  })
};

export default {
  createClassWithNotification,
  createEventWithNotification,
  createAppointmentWithNotification,
  updateClassWithNotification,
  sendAppUpdateNotification,
  sendPaymentNotification,
  sendMembershipNotification,
  sendAssessmentNotification,
  sendMeditationNotification,
  sendDietNotification,
  sendPeriodTrackerNotification,
  sendCustomNotification,
  sendBulkNotifications
};
