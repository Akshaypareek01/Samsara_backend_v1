import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import notificationService from '../services/notification.service.js';
import { User } from '../models/index.js';

/**
 * Create class and send notification
 */
const createClassWithNotification = catchAsync(async (req, res) => {
  const { title, description, instructor, scheduledAt, participants, metadata } = req.body;
  
  // Here you would create the class in your database
  // const newClass = await Class.create({ title, description, instructor, scheduledAt, participants });
  
  // Create notification for class creation
  const notificationData = {
    userId: null, // Can be specific user or null for all
    title: `New Class: ${title}`,
    message: `A new class "${title}" has been scheduled for ${new Date(scheduledAt).toLocaleDateString()}`,
    type: 'upcoming_class',
    priority: 'medium',
    metadata: {
      classTitle: title,
      instructor: instructor,
      scheduledAt: scheduledAt,
      participants: participants,
      ...metadata
    },
    actionUrl: `/classes/${title.toLowerCase().replace(/\s+/g, '-')}`,
    actionText: 'View Class',
    tags: ['class', 'new', 'schedule'],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Class created and notification sent',
    data: {
      // class: newClass,
      notification: notification
    }
  });
});

/**
 * Create event and send notification
 */
const createEventWithNotification = catchAsync(async (req, res) => {
  const { title, description, eventDate, location, attendees, metadata } = req.body;
  
  // Here you would create the event in your database
  // const newEvent = await Event.create({ title, description, eventDate, location, attendees });
  
  // Create notification for event creation
  const notificationData = {
    userId: null,
    title: `New Event: ${title}`,
    message: `A new event "${title}" has been scheduled for ${new Date(eventDate).toLocaleDateString()} at ${location}`,
    type: 'upcoming_event',
    priority: 'medium',
    metadata: {
      eventTitle: title,
      eventDate: eventDate,
      location: location,
      attendees: attendees,
      ...metadata
    },
    actionUrl: `/events/${title.toLowerCase().replace(/\s+/g, '-')}`,
    actionText: 'View Event',
    tags: ['event', 'new', 'schedule'],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Event created and notification sent',
    data: {
      // event: newEvent,
      notification: notification
    }
  });
});

/**
 * Create appointment and send notification
 */
const createAppointmentWithNotification = catchAsync(async (req, res) => {
  const { userId, title, appointmentDate, doctor, type, metadata } = req.body;
  
  // Here you would create the appointment in your database
  // const newAppointment = await Appointment.create({ userId, title, appointmentDate, doctor, type });
  
  // Create notification for appointment creation
  const notificationData = {
    userId: userId,
    title: `Appointment Scheduled: ${title}`,
    message: `Your ${type} appointment with ${doctor} has been scheduled for ${new Date(appointmentDate).toLocaleDateString()}`,
    type: 'upcoming_appointment',
    priority: 'high',
    metadata: {
      appointmentTitle: title,
      appointmentDate: appointmentDate,
      doctor: doctor,
      appointmentType: type,
      ...metadata
    },
    actionUrl: `/appointments/${userId}`,
    actionText: 'View Appointment',
    tags: ['appointment', 'medical', 'schedule'],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Appointment created and notification sent',
    data: {
      // appointment: newAppointment,
      notification: notification
    }
  });
});

/**
 * Update class and send notification
 */
const updateClassWithNotification = catchAsync(async (req, res) => {
  const { classId, updates, notifyParticipants } = req.body;
  
  // Here you would update the class in your database
  // const updatedClass = await Class.findByIdAndUpdate(classId, updates, { new: true });
  
  if (notifyParticipants) {
    const notificationData = {
      userId: null, // or specific participants
      title: 'Class Update',
      message: `The class has been updated. Please check the new details.`,
      type: 'class_update',
      priority: 'medium',
      metadata: {
        classId: classId,
        updates: updates,
        updatedAt: new Date()
      },
      actionUrl: `/classes/${classId}`,
      actionText: 'View Updated Class',
      tags: ['class', 'update'],
      source: 'system'
    };
    
    const notification = await notificationService.createNotification(notificationData);
    
    res.json({
      success: true,
      message: 'Class updated and notification sent',
      data: {
        // class: updatedClass,
        notification: notification
      }
    });
  } else {
    res.json({
      success: true,
      message: 'Class updated successfully',
      data: {
        // class: updatedClass
      }
    });
  }
});

/**
 * Send app update notification
 */
const sendAppUpdateNotification = catchAsync(async (req, res) => {
  const { version, features, updateType, metadata } = req.body;
  
  const notificationData = {
    userId: null, // All users
    title: `App Update v${version}`,
    message: `New features available! ${features.join(', ')}`,
    type: 'app_update',
    priority: updateType === 'critical' ? 'urgent' : 'medium',
    metadata: {
      version: version,
      features: features,
      updateType: updateType,
      ...metadata
    },
    actionUrl: '/app-update',
    actionText: 'Update Now',
    tags: ['app', 'update', 'features'],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'App update notification sent',
    data: notification
  });
});

/**
 * Send payment notification
 */
const sendPaymentNotification = catchAsync(async (req, res) => {
  const { userId, amount, status, paymentMethod, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: `Payment ${status}`,
    message: `Your payment of ₹${amount} via ${paymentMethod} has been ${status}`,
    type: 'payment',
    priority: status === 'failed' ? 'high' : 'medium',
    metadata: {
      amount: amount,
      status: status,
      paymentMethod: paymentMethod,
      ...metadata
    },
    actionUrl: `/payments/${userId}`,
    actionText: 'View Payment',
    tags: ['payment', status],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Payment notification sent',
    data: notification
  });
});

/**
 * Send membership notification
 */
const sendMembershipNotification = catchAsync(async (req, res) => {
  const { userId, membershipType, status, expiryDate, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: `Membership ${status}`,
    message: `Your ${membershipType} membership has been ${status}${expiryDate ? `. Expires on ${new Date(expiryDate).toLocaleDateString()}` : ''}`,
    type: 'membership',
    priority: status === 'expired' ? 'high' : 'medium',
    metadata: {
      membershipType: membershipType,
      status: status,
      expiryDate: expiryDate,
      ...metadata
    },
    actionUrl: `/membership/${userId}`,
    actionText: 'View Membership',
    tags: ['membership', status],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Membership notification sent',
    data: notification
  });
});

/**
 * Send assessment notification
 */
const sendAssessmentNotification = catchAsync(async (req, res) => {
  const { userId, assessmentType, status, score, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: `Assessment ${status}`,
    message: `Your ${assessmentType} assessment has been ${status}${score ? ` with score ${score}` : ''}`,
    type: 'assessment',
    priority: 'medium',
    metadata: {
      assessmentType: assessmentType,
      status: status,
      score: score,
      ...metadata
    },
    actionUrl: `/assessments/${userId}`,
    actionText: 'View Results',
    tags: ['assessment', assessmentType, status],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Assessment notification sent',
    data: notification
  });
});

/**
 * Send meditation notification
 */
const sendMeditationNotification = catchAsync(async (req, res) => {
  const { userId, meditationType, duration, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: 'Meditation Reminder',
    message: `Time for your ${duration}-minute ${meditationType} meditation session`,
    type: 'meditation',
    priority: 'medium',
    metadata: {
      meditationType: meditationType,
      duration: duration,
      ...metadata
    },
    actionUrl: `/meditation/${meditationType}`,
    actionText: 'Start Meditation',
    tags: ['meditation', meditationType],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Meditation notification sent',
    data: notification
  });
});

/**
 * Send diet notification
 */
const sendDietNotification = catchAsync(async (req, res) => {
  const { userId, mealType, dietPlan, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: `${mealType} Meal Plan`,
    message: `Your ${mealType} meal plan is ready! Check out your personalized diet recommendations.`,
    type: 'diet',
    priority: 'medium',
    metadata: {
      mealType: mealType,
      dietPlan: dietPlan,
      ...metadata
    },
    actionUrl: `/diet/${userId}`,
    actionText: 'View Meal Plan',
    tags: ['diet', mealType],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Diet notification sent',
    data: notification
  });
});

/**
 * Send period tracker notification
 */
const sendPeriodTrackerNotification = catchAsync(async (req, res) => {
  const { userId, cyclePhase, daysUntilNext, metadata } = req.body;
  
  const notificationData = {
    userId: userId,
    title: 'Period Tracker Update',
    message: `You're in ${cyclePhase} phase. ${daysUntilNext > 0 ? `${daysUntilNext} days until next period` : 'Your period is due'}`,
    type: 'period_tracker',
    priority: 'medium',
    metadata: {
      cyclePhase: cyclePhase,
      daysUntilNext: daysUntilNext,
      ...metadata
    },
    actionUrl: `/period-tracker/${userId}`,
    actionText: 'Update Tracker',
    tags: ['period', 'tracker', cyclePhase],
    source: 'system'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Period tracker notification sent',
    data: notification
  });
});

/**
 * Send custom notification
 */
const sendCustomNotification = catchAsync(async (req, res) => {
  const { userId, title, message, type, priority, metadata, actionUrl, actionText } = req.body;
  
  const notificationData = {
    userId: userId,
    title: title,
    message: message,
    type: type || 'general',
    priority: priority || 'medium',
    metadata: metadata || {},
    actionUrl: actionUrl,
    actionText: actionText,
    tags: ['custom'],
    source: 'admin'
  };
  
  const notification = await notificationService.createNotification(notificationData);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Custom notification sent',
    data: notification
  });
});

/**
 * Send bulk notifications to multiple users
 */
const sendBulkNotifications = catchAsync(async (req, res) => {
  const { userIds, title, message, type, priority, metadata } = req.body;
  
  const notifications = userIds.map(userId => ({
    userId: userId,
    title: title,
    message: message,
    type: type || 'general',
    priority: priority || 'medium',
    metadata: metadata || {},
    tags: ['bulk'],
    source: 'admin'
  }));
  
  const createdNotifications = await notificationService.createBulkNotifications(notifications);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: `${createdNotifications.length} notifications sent`,
    data: createdNotifications
  });
});

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
