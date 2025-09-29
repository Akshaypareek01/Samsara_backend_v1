import notificationService from './notification.service.js';

/**
 * Helper function to create class notifications
 */
const createClassNotification = async (classData, notificationType = 'upcoming_class') => {
  const notificationData = {
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
    tags: ['class', notificationType],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create event notifications
 */
const createEventNotification = async (eventData, notificationType = 'upcoming_event') => {
  const notificationData = {
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
    tags: ['event', notificationType],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create appointment notifications
 */
const createAppointmentNotification = async (appointmentData, notificationType = 'upcoming_appointment') => {
  const notificationData = {
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
    tags: ['appointment', notificationType],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create payment notifications
 */
const createPaymentNotification = async (paymentData) => {
  const notificationData = {
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
    tags: ['payment', paymentData.status],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create membership notifications
 */
const createMembershipNotification = async (membershipData) => {
  const notificationData = {
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
    tags: ['membership', membershipData.status],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create assessment notifications
 */
const createAssessmentNotification = async (assessmentData) => {
  const notificationData = {
    userId: assessmentData.userId,
    title: `Assessment ${assessmentData.status}`,
    message: `Your ${assessmentData.assessmentType} assessment has been ${assessmentData.status}`,
    type: 'assessment',
    priority: 'medium',
    metadata: {
      assessmentId: assessmentData.assessmentId,
      assessmentType: assessmentData.assessmentType,
      status: assessmentData.status,
      score: assessmentData.score,
      ...assessmentData.metadata
    },
    actionUrl: assessmentData.actionUrl || `/assessments/${assessmentData.assessmentId}`,
    actionText: assessmentData.actionText || 'View Results',
    tags: ['assessment', assessmentData.assessmentType, assessmentData.status],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create meditation notifications
 */
const createMeditationNotification = async (meditationData) => {
  const notificationData = {
    userId: meditationData.userId,
    title: 'Meditation Reminder',
    message: `Time for your ${meditationData.duration}-minute ${meditationData.meditationType} meditation`,
    type: 'meditation',
    priority: 'medium',
    metadata: {
      meditationId: meditationData.meditationId,
      meditationType: meditationData.meditationType,
      duration: meditationData.duration,
      ...meditationData.metadata
    },
    actionUrl: meditationData.actionUrl || `/meditation/${meditationData.meditationId}`,
    actionText: meditationData.actionText || 'Start Meditation',
    tags: ['meditation', meditationData.meditationType],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create diet notifications
 */
const createDietNotification = async (dietData) => {
  const notificationData = {
    userId: dietData.userId,
    title: `${dietData.mealType} Meal Plan`,
    message: `Your ${dietData.mealType} meal plan is ready!`,
    type: 'diet',
    priority: 'medium',
    metadata: {
      dietId: dietData.dietId,
      mealType: dietData.mealType,
      dietPlan: dietData.dietPlan,
      ...dietData.metadata
    },
    actionUrl: dietData.actionUrl || `/diet/${dietData.dietId}`,
    actionText: dietData.actionText || 'View Meal Plan',
    tags: ['diet', dietData.mealType],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create period tracker notifications
 */
const createPeriodTrackerNotification = async (periodData) => {
  const notificationData = {
    userId: periodData.userId,
    title: 'Period Tracker Update',
    message: `You're in ${periodData.cyclePhase} phase`,
    type: 'period_tracker',
    priority: 'medium',
    metadata: {
      trackerId: periodData.trackerId,
      cyclePhase: periodData.cyclePhase,
      daysUntilNext: periodData.daysUntilNext,
      ...periodData.metadata
    },
    actionUrl: periodData.actionUrl || `/period-tracker/${periodData.trackerId}`,
    actionText: periodData.actionText || 'Update Tracker',
    tags: ['period', 'tracker', periodData.cyclePhase],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create app update notifications
 */
const createAppUpdateNotification = async (updateData) => {
  const notificationData = {
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
    tags: ['app', 'update', 'features'],
    source: 'system'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create custom notifications
 */
const createCustomNotification = async (customData) => {
  const notificationData = {
    userId: customData.userId || null,
    title: customData.title,
    message: customData.message,
    type: customData.type || 'general',
    priority: customData.priority || 'medium',
    metadata: customData.metadata || {},
    actionUrl: customData.actionUrl,
    actionText: customData.actionText,
    tags: customData.tags || ['custom'],
    source: customData.source || 'admin'
  };
  
  return await notificationService.createNotification(notificationData);
};

/**
 * Helper function to create bulk notifications
 */
const createBulkNotifications = async (bulkData) => {
  const notifications = bulkData.userIds.map(userId => ({
    userId: userId,
    title: bulkData.title,
    message: bulkData.message,
    type: bulkData.type || 'general',
    priority: bulkData.priority || 'medium',
    metadata: bulkData.metadata || {},
    tags: bulkData.tags || ['bulk'],
    source: bulkData.source || 'admin'
  }));
  
  return await notificationService.createBulkNotifications(notifications);
};

/**
 * Helper function to schedule notification for future delivery
 */
const scheduleNotification = async (notificationData, scheduledAt) => {
  const notification = await notificationService.createNotification(notificationData);
  return await notificationService.scheduleNotification(notification._id, scheduledAt);
};

/**
 * Helper function to create reminder notifications
 */
const createReminderNotification = async (reminderData) => {
  const notificationData = {
    userId: reminderData.userId,
    title: reminderData.title || 'Reminder',
    message: reminderData.message,
    type: reminderData.type || 'general',
    priority: reminderData.priority || 'medium',
    metadata: {
      reminderId: reminderData.reminderId,
      reminderType: reminderData.reminderType,
      ...reminderData.metadata
    },
    actionUrl: reminderData.actionUrl,
    actionText: reminderData.actionText,
    tags: ['reminder', reminderData.reminderType],
    source: 'system'
  };
  
  if (reminderData.scheduledAt) {
    return await scheduleNotification(notificationData, reminderData.scheduledAt);
  }
  
  return await notificationService.createNotification(notificationData);
};

export default {
  createClassNotification,
  createEventNotification,
  createAppointmentNotification,
  createPaymentNotification,
  createMembershipNotification,
  createAssessmentNotification,
  createMeditationNotification,
  createDietNotification,
  createPeriodTrackerNotification,
  createAppUpdateNotification,
  createCustomNotification,
  createBulkNotifications,
  scheduleNotification,
  createReminderNotification
};
