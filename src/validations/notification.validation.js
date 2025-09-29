import Joi from 'joi';

const createNotification = {
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
    metadata: Joi.object().default({}),
    scheduledAt: Joi.date().optional(),
    expiresAt: Joi.date().optional(),
    actionUrl: Joi.string().uri().optional(),
    actionText: Joi.string().max(50).optional(),
    imageUrl: Joi.string().uri().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    source: Joi.string().valid('system', 'admin', 'automated', 'user').default('system')
  })
};

const createBulkNotifications = {
  body: Joi.object().keys({
    notifications: Joi.array().items(
      Joi.object().keys({
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
        metadata: Joi.object().default({}),
        scheduledAt: Joi.date().optional(),
        expiresAt: Joi.date().optional(),
        actionUrl: Joi.string().uri().optional(),
        actionText: Joi.string().max(50).optional(),
        imageUrl: Joi.string().uri().optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        source: Joi.string().valid('system', 'admin', 'automated', 'user').default('system')
      })
    ).min(1).max(100)
  })
};

const getUserNotifications = {
  query: Joi.object().keys({
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
    ).optional(),
    unreadOnly: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    page: Joi.number().integer().min(1).default(1)
  })
};

const getAllNotifications = {
  query: Joi.object().keys({
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
    ).optional(),
    status: Joi.string().valid('pending', 'sent', 'delivered', 'read', 'failed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    userId: Joi.string().hex().length(24).optional(),
    source: Joi.string().valid('system', 'admin', 'automated', 'user').optional(),
    createdAfter: Joi.date().optional(),
    createdBefore: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'scheduledAt', 'priority').default('createdAt'),
    limit: Joi.number().integer().min(1).max(100).default(50),
    page: Joi.number().integer().min(1).default(1)
  })
};

const getNotificationById = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  })
};

const updateNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().max(200).optional(),
    message: Joi.string().max(1000).optional(),
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
    ).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    metadata: Joi.object().optional(),
    status: Joi.string().valid('pending', 'sent', 'delivered', 'read', 'failed').optional(),
    scheduledAt: Joi.date().optional(),
    expiresAt: Joi.date().optional(),
    actionUrl: Joi.string().uri().optional(),
    actionText: Joi.string().max(50).optional(),
    imageUrl: Joi.string().uri().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    source: Joi.string().valid('system', 'admin', 'automated', 'user').optional()
  }).min(1)
};

const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  })
};

const markAsRead = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  })
};

const sendNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  })
};

const scheduleNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object().keys({
    scheduledAt: Joi.date().min('now').required()
  })
};

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  sendNotification,
  scheduleNotification
};
