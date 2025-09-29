import Joi from 'joi';

const notificationTypes = [
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
];

const updateNotificationPreferences = {
  body: Joi.object().keys({
    preferences: Joi.object().keys({
      class_update: Joi.boolean(),
      upcoming_class: Joi.boolean(),
      upcoming_event: Joi.boolean(),
      upcoming_appointment: Joi.boolean(),
      app_update: Joi.boolean(),
      general: Joi.boolean(),
      payment: Joi.boolean(),
      membership: Joi.boolean(),
      assessment: Joi.boolean(),
      meditation: Joi.boolean(),
      diet: Joi.boolean(),
      period_tracker: Joi.boolean()
    }),
    emailNotifications: Joi.boolean(),
    pushNotifications: Joi.boolean(),
    smsNotifications: Joi.boolean(),
    quietHours: Joi.object().keys({
      enabled: Joi.boolean(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
        'string.pattern.base': 'Start time must be in HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"'
      }),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
        'string.pattern.base': 'End time must be in HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"'
      })
    }),
    frequency: Joi.string().valid('immediate', 'daily_digest', 'weekly_digest')
  }).min(1) // At least one field must be provided
};

const updateSpecificPreference = {
  params: Joi.object().keys({
    type: Joi.string().valid(...notificationTypes).required().messages({
      'any.only': `"type" must be one of [${notificationTypes.join(', ')}]`
    }),
    enabled: Joi.string().valid('true', 'false').required().messages({
      'any.only': '"enabled" must be either "true" or "false"'
    })
  })
};

const toggleGlobalSetting = {
  params: Joi.object().keys({
    setting: Joi.string().valid('emailNotifications', 'pushNotifications', 'smsNotifications').required(),
    enabled: Joi.string().valid('true', 'false').required()
  })
};

const toggleQuietHours = {
  params: Joi.object().keys({
    enabled: Joi.string().valid('true', 'false').required()
  })
};

const updateQuietHoursTime = {
  body: Joi.object().keys({
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
      'string.pattern.base': 'Start time must be in HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"'
    }),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
      'string.pattern.base': 'End time must be in HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"'
    })
  }).min(1) // At least one field must be provided
};

export {
  updateNotificationPreferences,
  updateSpecificPreference,
  toggleGlobalSetting,
  toggleQuietHours,
  updateQuietHoursTime
};
