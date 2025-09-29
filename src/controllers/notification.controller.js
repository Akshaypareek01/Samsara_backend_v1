import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import notificationService from '../services/notification.service.js';
import pick from '../utils/pick.js';

/**
 * Create a new notification
 */
const createNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  });
});

/**
 * Get notifications for a user
 */
const getUserNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = pick(req.query, ['type', 'unreadOnly', 'limit', 'page']);
  
  const notifications = await notificationService.getUserNotifications(userId, options);
  res.json({
    success: true,
    data: notifications
  });
});

/**
 * Get all notifications (admin only)
 */
const getAllNotifications = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['type', 'status', 'priority', 'userId', 'source']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const notifications = await notificationService.getAllNotifications(filter, options);
  res.json({
    success: true,
    data: notifications
  });
});

/**
 * Get notification by ID
 */
const getNotificationById = catchAsync(async (req, res) => {
  const notification = await notificationService.getNotificationById(req.params.notificationId);
  res.json({
    success: true,
    data: notification
  });
});

/**
 * Update notification
 */
const updateNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.updateNotificationById(
    req.params.notificationId,
    req.body
  );
  res.json({
    success: true,
    message: 'Notification updated successfully',
    data: notification
  });
});

/**
 * Delete notification
 */
const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotificationById(req.params.notificationId);
  res.status(httpStatus.NO_CONTENT).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * Mark notification as read
 */
const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.notificationId;
  
  await notificationService.markNotificationAsRead(notificationId, userId);
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  await notificationService.markAllNotificationsAsRead(userId);
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * Get unread notification count
 */
const getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const count = await notificationService.getUnreadNotificationCount(userId);
  res.json({
    success: true,
    data: { unreadCount: count }
  });
});

/**
 * Send notification immediately
 */
const sendNotification = catchAsync(async (req, res) => {
  const notificationId = req.params.notificationId;
  
  await notificationService.sendNotification(notificationId);
  res.json({
    success: true,
    message: 'Notification sent successfully'
  });
});

/**
 * Create bulk notifications
 */
const createBulkNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.createBulkNotifications(req.body.notifications);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: `${notifications.length} notifications created successfully`,
    data: notifications
  });
});

/**
 * Get notification statistics (admin only)
 */
const getNotificationStats = catchAsync(async (req, res) => {
  const stats = await notificationService.getNotificationStats();
  res.json({
    success: true,
    data: stats
  });
});

/**
 * Schedule notification for future delivery
 */
const scheduleNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.scheduleNotification(
    req.params.notificationId,
    req.body.scheduledAt
  );
  res.json({
    success: true,
    message: 'Notification scheduled successfully',
    data: notification
  });
});

export default {
  createNotification,
  getUserNotifications,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendNotification,
  createBulkNotifications,
  getNotificationStats,
  scheduleNotification
};
