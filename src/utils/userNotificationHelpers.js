import { createUserNotification, createGlobalNotification, scheduleNotification } from './notificationUtils.js';

/**
 * USER REGISTRATION & ONBOARDING NOTIFICATIONS
 */

/**
 * Send welcome notification to new user
 */
export const sendWelcomeNotification = async (userId, userData) => {
  return await createUserNotification(
    userId,
    'Welcome to Samsara! 🎉',
    `Hi ${userData.name}! Welcome to your wellness journey. Complete your profile to get personalized recommendations.`,
    {
      type: 'general',
      priority: 'high',
      metadata: {
        userId: userId,
        userName: userData.name,
        userEmail: userData.email,
        registrationDate: new Date()
      },
      actionUrl: '/profile/complete',
      actionText: 'Complete Profile',
      tags: ['welcome', 'onboarding', 'new-user']
    }
  );
};

/**
 * Send profile completion reminder
 */
export const sendProfileCompletionReminder = async (userId, userName) => {
  return await createUserNotification(
    userId,
    'Complete Your Profile 📝',
    `Hi ${userName}! Complete your profile to unlock personalized features and recommendations.`,
    {
      type: 'general',
      priority: 'medium',
      metadata: {
        userId: userId,
        reminderType: 'profile_completion'
      },
      actionUrl: '/profile/complete',
      actionText: 'Complete Now',
      tags: ['reminder', 'profile', 'onboarding']
    }
  );
};

/**
 * MEMBERSHIP NOTIFICATIONS
 */

/**
 * Send membership expiry warning (7 days before)
 */
export const sendMembershipExpiryWarning = async (userId, membershipData) => {
  return await createUserNotification(
    userId,
    'Membership Expiring Soon ⏰',
    `Your ${membershipData.type} membership expires in 7 days. Renew now to continue enjoying all features.`,
    {
      type: 'membership',
      priority: 'high',
      metadata: {
        membershipId: membershipData.id,
        membershipType: membershipData.type,
        expiryDate: membershipData.expiryDate,
        daysRemaining: 7
      },
      actionUrl: '/membership/renew',
      actionText: 'Renew Membership',
      tags: ['membership', 'expiry', 'warning']
    }
  );
};

/**
 * Send membership expired notification
 */
export const sendMembershipExpiredNotification = async (userId, membershipData) => {
  return await createUserNotification(
    userId,
    'Membership Expired ❌',
    `Your ${membershipData.type} membership has expired. Renew now to restore access to premium features.`,
    {
      type: 'membership',
      priority: 'urgent',
      metadata: {
        membershipId: membershipData.id,
        membershipType: membershipData.type,
        expiryDate: membershipData.expiryDate
      },
      actionUrl: '/membership/renew',
      actionText: 'Renew Now',
      tags: ['membership', 'expired', 'urgent']
    }
  );
};

/**
 * Send membership renewal success
 */
export const sendMembershipRenewedNotification = async (userId, membershipData) => {
  return await createUserNotification(
    userId,
    'Membership Renewed Successfully! ✅',
    `Your ${membershipData.type} membership has been renewed until ${new Date(membershipData.newExpiryDate).toLocaleDateString()}.`,
    {
      type: 'membership',
      priority: 'medium',
      metadata: {
        membershipId: membershipData.id,
        membershipType: membershipData.type,
        newExpiryDate: membershipData.newExpiryDate
      },
      actionUrl: '/membership',
      actionText: 'View Membership',
      tags: ['membership', 'renewed', 'success']
    }
  );
};

/**
 * CLASS & EVENT NOTIFICATIONS
 */

/**
 * Send class registration confirmation
 */
export const sendClassRegistrationConfirmation = async (userId, classData) => {
  return await createUserNotification(
    userId,
    'Class Registration Confirmed! 🧘‍♀️',
    `You're registered for "${classData.title}" on ${new Date(classData.schedule).toLocaleDateString()} at ${new Date(classData.schedule).toLocaleTimeString()}.`,
    {
      type: 'class_update',
      priority: 'medium',
      metadata: {
        classId: classData.id,
        className: classData.title,
        instructor: classData.instructor,
        scheduledDate: classData.schedule,
        duration: classData.duration,
        classType: classData.classType
      },
      actionUrl: `/classes/${classData.id}`,
      actionText: 'View Class',
      tags: ['class', 'registration', 'confirmed']
    }
  );
};

/**
 * Send class reminder (1 hour before)
 */
export const sendClassReminder = async (userId, classData) => {
  return await createUserNotification(
    userId,
    'Class Starting Soon! ⏰',
    `Your class "${classData.title}" starts in 1 hour. Get ready for your session!`,
    {
      type: 'upcoming_class',
      priority: 'high',
      metadata: {
        classId: classData.id,
        className: classData.title,
        instructor: classData.instructor,
        scheduledDate: classData.schedule,
        reminderTime: '1_hour'
      },
      actionUrl: `/classes/${classData.id}`,
      actionText: 'Join Class',
      tags: ['class', 'reminder', 'upcoming']
    }
  );
};

/**
 * Send missed class notification
 */
export const sendMissedClassNotification = async (userId, classData) => {
  return await createUserNotification(
    userId,
    'Missed Class 😔',
    `You missed "${classData.title}" scheduled for ${new Date(classData.schedule).toLocaleDateString()}. Don't worry, you can join the next one!`,
    {
      type: 'class_update',
      priority: 'low',
      metadata: {
        classId: classData.id,
        className: classData.title,
        instructor: classData.instructor,
        scheduledDate: classData.schedule,
        missedAt: new Date()
      },
      actionUrl: '/classes',
      actionText: 'View Classes',
      tags: ['class', 'missed', 'reminder']
    }
  );
};

/**
 * Send class cancellation notification
 */
export const sendClassCancellationNotification = async (userId, classData) => {
  return await createUserNotification(
    userId,
    'Class Cancelled ❌',
    `The class "${classData.title}" scheduled for ${new Date(classData.schedule).toLocaleDateString()} has been cancelled.`,
    {
      type: 'class_update',
      priority: 'high',
      metadata: {
        classId: classData.id,
        className: classData.title,
        instructor: classData.instructor,
        scheduledDate: classData.schedule,
        cancellationReason: classData.cancellationReason
      },
      actionUrl: '/classes',
      actionText: 'View Other Classes',
      tags: ['class', 'cancelled', 'update']
    }
  );
};

/**
 * Send event registration confirmation
 */
export const sendEventRegistrationConfirmation = async (userId, eventData) => {
  return await createUserNotification(
    userId,
    'Event Registration Confirmed! 🎉',
    `You're registered for "${eventData.title}" on ${new Date(eventData.eventDate).toLocaleDateString()}.`,
    {
      type: 'upcoming_event',
      priority: 'medium',
      metadata: {
        eventId: eventData.id,
        eventName: eventData.title,
        eventDate: eventData.eventDate,
        location: eventData.location,
        eventType: eventData.eventType
      },
      actionUrl: `/events/${eventData.id}`,
      actionText: 'View Event',
      tags: ['event', 'registration', 'confirmed']
    }
  );
};

/**
 * Send event reminder (1 day before)
 */
export const sendEventReminder = async (userId, eventData) => {
  return await createUserNotification(
    userId,
    'Event Tomorrow! 📅',
    `Don't forget! "${eventData.title}" is tomorrow at ${new Date(eventData.eventDate).toLocaleTimeString()}.`,
    {
      type: 'upcoming_event',
      priority: 'high',
      metadata: {
        eventId: eventData.id,
        eventName: eventData.title,
        eventDate: eventData.eventDate,
        location: eventData.location,
        reminderTime: '1_day'
      },
      actionUrl: `/events/${eventData.id}`,
      actionText: 'View Event',
      tags: ['event', 'reminder', 'upcoming']
    }
  );
};

/**
 * PAYMENT NOTIFICATIONS
 */

/**
 * Send payment success notification
 */
export const sendPaymentSuccessNotification = async (userId, paymentData) => {
  return await createUserNotification(
    userId,
    'Payment Successful! ✅',
    `Your payment of ₹${paymentData.amount} has been processed successfully.`,
    {
      type: 'payment',
      priority: 'medium',
      metadata: {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
        status: 'success'
      },
      actionUrl: `/payments/${paymentData.id}`,
      actionText: 'View Receipt',
      tags: ['payment', 'success', 'receipt']
    }
  );
};

/**
 * Send payment failure notification
 */
export const sendPaymentFailureNotification = async (userId, paymentData) => {
  return await createUserNotification(
    userId,
    'Payment Failed ❌',
    `Your payment of ₹${paymentData.amount} failed. Please try again or use a different payment method.`,
    {
      type: 'payment',
      priority: 'high',
      metadata: {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        failureReason: paymentData.failureReason,
        status: 'failed'
      },
      actionUrl: '/payments/retry',
      actionText: 'Retry Payment',
      tags: ['payment', 'failed', 'retry']
    }
  );
};

/**
 * ASSESSMENT & HEALTH NOTIFICATIONS
 */

/**
 * Send assessment completion notification
 */
export const sendAssessmentCompletionNotification = async (userId, assessmentData) => {
  return await createUserNotification(
    userId,
    'Assessment Completed! 📊',
    `Your ${assessmentData.type} assessment has been completed. View your personalized results and recommendations.`,
    {
      type: 'assessment',
      priority: 'medium',
      metadata: {
        assessmentId: assessmentData.id,
        assessmentType: assessmentData.type,
        completionDate: new Date(),
        score: assessmentData.score
      },
      actionUrl: `/assessments/${assessmentData.id}`,
      actionText: 'View Results',
      tags: ['assessment', 'completed', 'results']
    }
  );
};

/**
 * Send assessment reminder
 */
export const sendAssessmentReminder = async (userId, assessmentData) => {
  return await createUserNotification(
    userId,
    'Assessment Reminder 📋',
    `Don't forget to complete your ${assessmentData.type} assessment for personalized recommendations.`,
    {
      type: 'assessment',
      priority: 'medium',
      metadata: {
        assessmentId: assessmentData.id,
        assessmentType: assessmentData.type,
        reminderType: 'completion'
      },
      actionUrl: `/assessments/${assessmentData.id}`,
      actionText: 'Take Assessment',
      tags: ['assessment', 'reminder', 'pending']
    }
  );
};

/**
 * Send period tracker reminder
 */
export const sendPeriodTrackerReminder = async (userId, trackerData) => {
  return await createUserNotification(
    userId,
    'Period Tracker Reminder 📅',
    `It's time to log your period cycle. Keep track of your health patterns.`,
    {
      type: 'period_tracker',
      priority: 'low',
      metadata: {
        trackerId: trackerData.id,
        cycleDay: trackerData.cycleDay,
        reminderType: 'log_entry'
      },
      actionUrl: '/period-tracker',
      actionText: 'Log Entry',
      tags: ['period', 'tracker', 'reminder']
    }
  );
};

/**
 * Send mood tracking reminder
 */
export const sendMoodTrackingReminder = async (userId) => {
  return await createUserNotification(
    userId,
    'How are you feeling today? 😊',
    `Take a moment to log your mood and help us understand your wellness journey better.`,
    {
      type: 'general',
      priority: 'low',
      metadata: {
        reminderType: 'mood_tracking',
        reminderTime: 'daily'
      },
      actionUrl: '/mood-tracker',
      actionText: 'Log Mood',
      tags: ['mood', 'tracking', 'daily']
    }
  );
};

/**
 * ACHIEVEMENT NOTIFICATIONS
 */

/**
 * Send achievement unlocked notification
 */
export const sendAchievementUnlockedNotification = async (userId, achievementData) => {
  return await createUserNotification(
    userId,
    'Achievement Unlocked! 🏆',
    `Congratulations! You've unlocked the "${achievementData.title}" achievement. ${achievementData.description}`,
    {
      type: 'general',
      priority: 'medium',
      metadata: {
        achievementId: achievementData.id,
        achievementTitle: achievementData.title,
        achievementDescription: achievementData.description,
        unlockedAt: new Date(),
        category: achievementData.category
      },
      actionUrl: '/achievements',
      actionText: 'View Achievements',
      tags: ['achievement', 'unlocked', 'celebration']
    }
  );
};

/**
 * Send streak milestone notification
 */
export const sendStreakMilestoneNotification = async (userId, streakData) => {
  return await createUserNotification(
    userId,
    'Streak Milestone! 🔥',
    `Amazing! You've maintained a ${streakData.type} streak for ${streakData.days} days. Keep it up!`,
    {
      type: 'general',
      priority: 'medium',
      metadata: {
        streakType: streakData.type,
        streakDays: streakData.days,
        milestone: streakData.milestone,
        achievedAt: new Date()
      },
      actionUrl: '/streaks',
      actionText: 'View Streaks',
      tags: ['streak', 'milestone', 'motivation']
    }
  );
};

/**
 * SYSTEM & GENERAL NOTIFICATIONS
 */

/**
 * Send app update notification
 */
export const sendAppUpdateNotification = async (updateData) => {
  return await createGlobalNotification(
    'App Update Available! 📱',
    `New features and improvements are available. Update now to get the latest experience.`,
    {
      type: 'app_update',
      priority: updateData.updateType === 'critical' ? 'urgent' : 'medium',
      metadata: {
        version: updateData.version,
        features: updateData.features,
        updateType: updateData.updateType,
        releaseDate: new Date()
      },
      actionUrl: '/app-update',
      actionText: 'Update Now',
      tags: ['app', 'update', 'features']
    }
  );
};

/**
 * Send maintenance notification
 */
export const sendMaintenanceNotification = async (maintenanceData) => {
  return await createGlobalNotification(
    'Scheduled Maintenance 🔧',
    `We'll be performing scheduled maintenance on ${new Date(maintenanceData.scheduledAt).toLocaleDateString()} from ${new Date(maintenanceData.startTime).toLocaleTimeString()} to ${new Date(maintenanceData.endTime).toLocaleTimeString()}.`,
    {
      type: 'general',
      priority: 'medium',
      metadata: {
        scheduledAt: maintenanceData.scheduledAt,
        startTime: maintenanceData.startTime,
        endTime: maintenanceData.endTime,
        affectedServices: maintenanceData.affectedServices
      },
      actionUrl: '/maintenance-info',
      actionText: 'Learn More',
      tags: ['maintenance', 'scheduled', 'system']
    }
  );
};

/**
 * Send feature announcement
 */
export const sendFeatureAnnouncement = async (featureData) => {
  return await createGlobalNotification(
    'New Feature Available! ✨',
    `${featureData.title}: ${featureData.description}`,
    {
      type: 'general',
      priority: 'medium',
      metadata: {
        featureName: featureData.title,
        featureDescription: featureData.description,
        releaseDate: new Date(),
        category: featureData.category
      },
      actionUrl: featureData.actionUrl || '/features',
      actionText: featureData.actionText || 'Try Now',
      tags: ['feature', 'announcement', 'new']
    }
  );
};

/**
 * SCHEDULED NOTIFICATION HELPERS
 */

/**
 * Schedule class reminder (1 hour before)
 */
export const scheduleClassReminder = async (userId, classData) => {
  const reminderTime = new Date(classData.schedule);
  reminderTime.setHours(reminderTime.getHours() - 1);
  
  return await scheduleNotification(
    {
      userId: userId,
      title: 'Class Starting Soon! ⏰',
      message: `Your class "${classData.title}" starts in 1 hour. Get ready for your session!`,
      type: 'upcoming_class',
      priority: 'high',
      metadata: {
        classId: classData.id,
        className: classData.title,
        instructor: classData.instructor,
        scheduledDate: classData.schedule
      },
      actionUrl: `/classes/${classData.id}`,
      actionText: 'Join Class',
      tags: ['class', 'reminder', 'scheduled']
    },
    reminderTime
  );
};

/**
 * Schedule event reminder (1 day before)
 */
export const scheduleEventReminder = async (userId, eventData) => {
  const reminderTime = new Date(eventData.eventDate);
  reminderTime.setDate(reminderTime.getDate() - 1);
  
  return await scheduleNotification(
    {
      userId: userId,
      title: 'Event Tomorrow! 📅',
      message: `Don't forget! "${eventData.title}" is tomorrow.`,
      type: 'upcoming_event',
      priority: 'high',
      metadata: {
        eventId: eventData.id,
        eventName: eventData.title,
        eventDate: eventData.eventDate,
        location: eventData.location
      },
      actionUrl: `/events/${eventData.id}`,
      actionText: 'View Event',
      tags: ['event', 'reminder', 'scheduled']
    },
    reminderTime
  );
};

/**
 * Schedule membership expiry warning (7 days before)
 */
export const scheduleMembershipExpiryWarning = async (userId, membershipData) => {
  const warningTime = new Date(membershipData.expiryDate);
  warningTime.setDate(warningTime.getDate() - 7);
  
  return await scheduleNotification(
    {
      userId: userId,
      title: 'Membership Expiring Soon ⏰',
      message: `Your ${membershipData.type} membership expires in 7 days. Renew now to continue enjoying all features.`,
      type: 'membership',
      priority: 'high',
      metadata: {
        membershipId: membershipData.id,
        membershipType: membershipData.type,
        expiryDate: membershipData.expiryDate
      },
      actionUrl: '/membership/renew',
      actionText: 'Renew Membership',
      tags: ['membership', 'expiry', 'scheduled']
    },
    warningTime
  );
};
