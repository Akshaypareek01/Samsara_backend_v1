import notificationService from '../services/notification.service.js';

/**
 * Simple function to create notification for user or all users
 * @param {Object} data - Notification data
 * @param {string|null} data.userId - User ID (null for all users)
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type
 * @param {string} data.priority - Priority level
 * @param {Object} data.metadata - Additional metadata
 * @param {string} data.actionUrl - Action URL (optional)
 * @param {string} data.actionText - Action button text (optional)
 * @param {string} data.imageUrl - Image URL (optional)
 * @param {Array} data.tags - Tags (optional)
 * @param {Date} data.scheduledAt - Schedule for future delivery (optional)
 * @param {Date} data.expiresAt - Expiry date (optional)
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (data) => {
  try {
    const notificationData = {
      userId: data.userId || null,
      title: data.title,
      message: data.message,
      type: data.type || 'general',
      priority: data.priority || 'medium',
      metadata: data.metadata || {},
      actionUrl: data.actionUrl || null,
      actionText: data.actionText || null,
      imageUrl: data.imageUrl || null,
      tags: data.tags || [],
      scheduledAt: data.scheduledAt || new Date(),
      expiresAt: data.expiresAt || null,
      source: data.source || 'system'
    };

    const notification = await notificationService.createNotification(notificationData);
    
    console.log(`Notification created: ${notification.title} for ${data.userId ? 'user ' + data.userId : 'all users'}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for specific user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
const createUserNotification = async (userId, title, message, options = {}) => {
  return await createNotification({
    userId: userId,
    title: title,
    message: message,
    ...options
  });
};

/**
 * Create notification for all users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
const createGlobalNotification = async (title, message, options = {}) => {
  return await createNotification({
    userId: null,
    title: title,
    message: message,
    ...options
  });
};

/**
 * Create class notification
 * @param {Object} classData - Class data
 * @param {string} notificationType - Type of notification
 * @returns {Promise<Object>} Created notification
 */
const createClassNotification = async (classData, notificationType = 'upcoming_class') => {
  return await createNotification({
    userId: classData.userId || null,
    title: `Class: ${classData.title}`,
    message: classData.message || `A new class "${classData.title}" has been scheduled`,
    type: notificationType,
    priority: classData.priority || 'medium',
    metadata: {
      classId: classData.classId,
      instructor: classData.instructor,
      scheduledAt: classData.scheduledAt,
      ...classData.metadata
    },
    actionUrl: classData.actionUrl || `/classes/${classData.classId}`,
    actionText: classData.actionText || 'View Class',
    tags: ['class', notificationType]
  });
};

/**
 * Create event notification
 * @param {Object} eventData - Event data
 * @param {string} notificationType - Type of notification
 * @returns {Promise<Object>} Created notification
 */
const createEventNotification = async (eventData, notificationType = 'upcoming_event') => {
  return await createNotification({
    userId: eventData.userId || null,
    title: `Event: ${eventData.title}`,
    message: eventData.message || `A new event "${eventData.title}" has been scheduled`,
    type: notificationType,
    priority: eventData.priority || 'medium',
    metadata: {
      eventId: eventData.eventId,
      eventDate: eventData.eventDate,
      location: eventData.location,
      ...eventData.metadata
    },
    actionUrl: eventData.actionUrl || `/events/${eventData.eventId}`,
    actionText: eventData.actionText || 'View Event',
    tags: ['event', notificationType]
  });
};

/**
 * Create appointment notification
 * @param {Object} appointmentData - Appointment data
 * @param {string} notificationType - Type of notification
 * @returns {Promise<Object>} Created notification
 */
const createAppointmentNotification = async (appointmentData, notificationType = 'upcoming_appointment') => {
  return await createNotification({
    userId: appointmentData.userId,
    title: `Appointment: ${appointmentData.title}`,
    message: appointmentData.message || `Your appointment "${appointmentData.title}" has been scheduled`,
    type: notificationType,
    priority: appointmentData.priority || 'high',
    metadata: {
      appointmentId: appointmentData.appointmentId,
      appointmentDate: appointmentData.appointmentDate,
      doctor: appointmentData.doctor,
      ...appointmentData.metadata
    },
    actionUrl: appointmentData.actionUrl || `/appointments/${appointmentData.appointmentId}`,
    actionText: appointmentData.actionText || 'View Appointment',
    tags: ['appointment', notificationType]
  });
};

/**
 * Create payment notification
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created notification
 */
const createPaymentNotification = async (paymentData) => {
  return await createNotification({
    userId: paymentData.userId,
    title: `Payment ${paymentData.status}`,
    message: `Your payment of ₹${paymentData.amount} has been ${paymentData.status}`,
    type: 'payment',
    priority: paymentData.status === 'failed' ? 'high' : 'medium',
    metadata: {
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      status: paymentData.status,
      paymentMethod: paymentData.paymentMethod,
      ...paymentData.metadata
    },
    actionUrl: paymentData.actionUrl || `/payments/${paymentData.paymentId}`,
    actionText: paymentData.actionText || 'View Payment',
    tags: ['payment', paymentData.status]
  });
};

/**
 * Create membership notification
 * @param {Object} membershipData - Membership data
 * @returns {Promise<Object>} Created notification
 */
const createMembershipNotification = async (membershipData) => {
  return await createNotification({
    userId: membershipData.userId,
    title: `Membership ${membershipData.status}`,
    message: `Your ${membershipData.membershipType} membership has been ${membershipData.status}`,
    type: 'membership',
    priority: membershipData.status === 'expired' ? 'high' : 'medium',
    metadata: {
      membershipId: membershipData.membershipId,
      membershipType: membershipData.membershipType,
      status: membershipData.status,
      expiryDate: membershipData.expiryDate,
      ...membershipData.metadata
    },
    actionUrl: membershipData.actionUrl || `/membership/${membershipData.membershipId}`,
    actionText: membershipData.actionText || 'View Membership',
    tags: ['membership', membershipData.status]
  });
};

/**
 * Create app update notification
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Created notification
 */
const createAppUpdateNotification = async (updateData) => {
  return await createNotification({
    userId: null, // All users
    title: `App Update v${updateData.version}`,
    message: `New features available! ${updateData.features.join(', ')}`,
    type: 'app_update',
    priority: updateData.updateType === 'critical' ? 'urgent' : 'medium',
    metadata: {
      version: updateData.version,
      features: updateData.features,
      updateType: updateData.updateType,
      ...updateData.metadata
    },
    actionUrl: updateData.actionUrl || '/app-update',
    actionText: updateData.actionText || 'Update Now',
    tags: ['app', 'update', 'features']
  });
};

/**
 * Create bulk notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Created notifications
 */
const createBulkNotifications = async (userIds, title, message, options = {}) => {
  const notifications = userIds.map(userId => ({
    userId: userId,
    title: title,
    message: message,
    type: options.type || 'general',
    priority: options.priority || 'medium',
    metadata: options.metadata || {},
    tags: options.tags || ['bulk'],
    source: options.source || 'system'
  }));

  return await notificationService.createBulkNotifications(notifications);
};

/**
 * Schedule notification for future delivery
 * @param {Object} data - Notification data
 * @param {Date} scheduledAt - When to deliver the notification
 * @returns {Promise<Object>} Scheduled notification
 */
const scheduleNotification = async (data, scheduledAt) => {
  const notification = await createNotification({
    ...data,
    scheduledAt: scheduledAt
  });
  
  return await notificationService.scheduleNotification(notification._id, scheduledAt);
};

export {
  createNotification,
  createUserNotification,
  createGlobalNotification,
  createClassNotification,
  createEventNotification,
  createAppointmentNotification,
  createPaymentNotification,
  createMembershipNotification,
  createAppUpdateNotification,
  createBulkNotifications,
  scheduleNotification
};
