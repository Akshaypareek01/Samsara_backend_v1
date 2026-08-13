import notificationService from '../services/notification.service.js';

/**
 * Resolves a User id from an ObjectId, populated doc, or string.
 * @param {import('mongoose').Types.ObjectId|object|string|null|undefined} ref
 * @returns {string|null}
 */
const resolveUserId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref._id) return String(ref._id);
  if (typeof ref.toString === 'function') {
    const id = ref.toString();
    if (id && id !== '[object Object]') return id;
  }
  return null;
};

/**
 * Creates an in-app notification for a user or (when userId is null) everyone.
 * @param {Object} data Notification fields
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (data) => {
  try {
    const now = new Date();
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : now;
    const isDue = Number.isNaN(scheduledAt.getTime()) || scheduledAt <= now;

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
      scheduledAt: Number.isNaN(scheduledAt.getTime()) ? now : scheduledAt,
      expiresAt: data.expiresAt || null,
      source: data.source || 'system',
      // Inbox queries only return sent/delivered — due items must not stay pending.
      status: isDue ? 'sent' : 'pending',
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

/**
 * Notifies the host teacher and the student after a class or event enrollment.
 * Failures should be caught by the caller so booking is not rolled back.
 * @param {Object} params
 * @param {import('mongoose').Types.ObjectId|object|string|null} params.teacherId
 * @param {string} params.studentId
 * @param {string} params.studentName
 * @param {string} [params.studentEmail]
 * @param {string} params.title Resource title
 * @param {'class'|'event'} params.kind
 * @param {string} params.resourceId
 * @param {Date|string} [params.scheduledAt]
 * @param {Object} [params.extraMetadata]
 */
const notifyEnrollment = async ({
  teacherId,
  studentId,
  studentName,
  studentEmail,
  title,
  kind,
  resourceId,
  scheduledAt,
  extraMetadata = {},
}) => {
  const teacherUserId = resolveUserId(teacherId);
  const isEvent = kind === 'event';
  const noun = isEvent ? 'event' : 'class';
  const actionUrl = isEvent ? `/events/${resourceId}` : `/classes/${resourceId}`;
  const actionText = isEvent ? 'View Event' : 'View Class';
  const displayName = studentName || 'A student';

  if (teacherUserId) {
    await createUserNotification(
      teacherUserId,
      isEvent ? 'New Event Registration' : 'New Student Enrolled',
      `${displayName} has enrolled in your ${noun} "${title}"`,
      {
        type: isEvent ? 'upcoming_event' : 'class_update',
        priority: 'medium',
        metadata: {
          ...extraMetadata,
          studentId,
          studentName: displayName,
          studentEmail,
        },
        actionUrl,
        actionText,
        tags: [kind, 'enrollment', 'teacher'],
        source: 'automated',
      }
    );
  }

  if (studentId) {
    const when = scheduledAt
      ? ` scheduled for ${new Date(scheduledAt).toLocaleDateString()}`
      : '';
    await createUserNotification(
      studentId,
      isEvent ? 'Event Registration Successful' : 'Class Enrollment Successful',
      `You have successfully enrolled in "${title}"${when}`,
      {
        type: isEvent ? 'upcoming_event' : 'upcoming_class',
        priority: 'medium',
        metadata: extraMetadata,
        actionUrl,
        actionText,
        tags: [kind, 'enrollment', 'student'],
        source: 'automated',
      }
    );
  }
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
  scheduleNotification,
  notifyEnrollment,
  resolveUserId,
};
