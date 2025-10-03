import httpStatus from 'http-status';
import Notification from '../models/notification.model.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/index.js';

// Ensure User model is registered
User;

/**
 * Create a notification
 * @param {Object} notificationBody
 * @returns {Promise<Notification>}
 */
const createNotification = async (notificationBody) => {
  const notification = await Notification.create(notificationBody);
  return notification;
};

/**
 * Get notifications for a user
 * @param {ObjectId} userId
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const getUserNotifications = async (userId, options = {}) => {
  const { type, unreadOnly, limit = 50, page = 1 } = options;
  
  const query = {
    $and: [
      {
        $or: [
          { userId: userId },
          { userId: null } // Global notifications
        ]
      },
      {
        status: { $in: ['sent', 'delivered'] }
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ]
  };
  
  if (type) {
    query.$and.push({ type: type });
  }
  
  if (unreadOnly) {
    query.$and.push({ 'readBy.user': { $ne: userId } });
  }
  
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Add read status for each notification
  const notificationsWithReadStatus = notifications.map(notification => ({
    ...notification,
    isRead: notification.readBy.some(read => read.user.toString() === userId.toString())
  }));
  
  return notificationsWithReadStatus;
};

/**
 * Get all notifications (admin)
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const getAllNotifications = async (filter, options) => {
  const { sortBy, limit = 50, page = 1 } = options;
  
  const query = { ...filter };
  
  // Handle date range filters
  if (filter.createdAfter) {
    query.createdAt = { $gte: new Date(filter.createdAfter) };
  }
  if (filter.createdBefore) {
    query.createdAt = { ...query.createdAt, $lte: new Date(filter.createdBefore) };
  }
  
  const skip = (page - 1) * limit;
  const sort = sortBy ? { [sortBy]: -1 } : { createdAt: -1 };
  
  const notifications = await Notification.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
  
  return notifications;
};

/**
 * Get notification by id
 * @param {ObjectId} id
 * @returns {Promise<Notification>}
 */
const getNotificationById = async (id) => {
  const notification = await Notification.findById(id);
  
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  return notification;
};

/**
 * Update notification by id
 * @param {ObjectId} notificationId
 * @param {Object} updateBody
 * @returns {Promise<Notification>}
 */
const updateNotificationById = async (notificationId, updateBody) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    updateBody,
    { new: true, runValidators: true }
  );
  
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  return notification;
};

/**
 * Delete notification by id
 * @param {ObjectId} notificationId
 * @returns {Promise<void>}
 */
const deleteNotificationById = async (notificationId) => {
  const notification = await Notification.findByIdAndDelete(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
};

/**
 * Mark notification as read
 * @param {ObjectId} notificationId
 * @param {ObjectId} userId
 * @returns {Promise<void>}
 */
const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  await notification.markAsRead(userId);
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId
 * @returns {Promise<void>}
 */
const markAllNotificationsAsRead = async (userId) => {
  await Notification.updateMany(
    {
      $or: [
        { userId: userId },
        { userId: null }
      ],
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
};

/**
 * Get unread notification count for a user
 * @param {ObjectId} userId
 * @returns {Promise<number>}
 */
const getUnreadNotificationCount = async (userId) => {
  const count = await Notification.countDocuments({
    $and: [
      {
        $or: [
          { userId: userId },
          { userId: null }
        ]
      },
      {
        status: { $in: ['sent', 'delivered'] }
      },
      {
        'readBy.user': { $ne: userId }
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ]
  });
  
  return count;
};

/**
 * Send notification immediately
 * @param {ObjectId} notificationId
 * @returns {Promise<void>}
 */
const sendNotification = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { 
      status: 'sent',
      scheduledAt: new Date()
    },
    { new: true }
  );
  
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  // Here you would integrate with push notification services
  // like Firebase, OneSignal, etc.
  await sendPushNotification(notification);
  
  return notification;
};

/**
 * Create bulk notifications
 * @param {Array} notifications
 * @returns {Promise<Array>}
 */
const createBulkNotifications = async (notifications) => {
  const createdNotifications = await Notification.insertMany(notifications);
  return createdNotifications;
};

/**
 * Get notification statistics
 * @returns {Promise<Object>}
 */
const getNotificationStats = async () => {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }
    }
  ]);
  
  const typeStats = await Notification.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    overview: stats[0] || { total: 0, sent: 0, pending: 0, failed: 0 },
    byType: typeStats
  };
};

/**
 * Schedule notification for future delivery
 * @param {ObjectId} notificationId
 * @param {Date} scheduledAt
 * @returns {Promise<Notification>}
 */
const scheduleNotification = async (notificationId, scheduledAt) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { 
      scheduledAt: new Date(scheduledAt),
      status: 'pending'
    },
    { new: true }
  );
  
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  return notification;
};

/**
 * Send push notification (placeholder for actual implementation)
 * @param {Notification} notification
 * @returns {Promise<void>}
 */
const sendPushNotification = async (notification) => {
  // This is a placeholder for actual push notification implementation
  // You would integrate with services like:
  // - Firebase Cloud Messaging (FCM)
  // - OneSignal
  // - Pusher
  // - Expo Push Notifications
  
  console.log(`Sending notification: ${notification.title} to ${notification.userId || 'all users'}`);
  
  // Example implementation would look like:
  // if (notification.userId) {
  //   // Send to specific user
  //   await fcmService.sendToUser(notification.userId, {
  //     title: notification.title,
  //     body: notification.message,
  //     data: notification.metadata
  //   });
  // } else {
  //   // Send to all users
  //   await fcmService.sendToAll({
  //     title: notification.title,
  //     body: notification.message,
  //     data: notification.metadata
  //   });
  // }
};

/**
 * Process scheduled notifications
 * @returns {Promise<void>}
 */
const processScheduledNotifications = async () => {
  const now = new Date();
  
  const scheduledNotifications = await Notification.find({
    status: 'pending',
    scheduledAt: { $lte: now }
  });
  
  for (const notification of scheduledNotifications) {
    await sendNotification(notification._id);
  }
};

/**
 * Clean up expired notifications
 * @returns {Promise<void>}
 */
const cleanupExpiredNotifications = async () => {
  await Notification.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

export default {
  createNotification,
  getUserNotifications,
  getAllNotifications,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  sendNotification,
  createBulkNotifications,
  getNotificationStats,
  scheduleNotification,
  processScheduledNotifications,
  cleanupExpiredNotifications
};
