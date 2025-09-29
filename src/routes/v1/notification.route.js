import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import notificationValidation from '../../validations/notification.validation.js';
import notificationController from '../../controllers/notification.controller.js';
import { roles } from '../../config/roles.js';

const router = express.Router();

// User routes (authenticated users)
router.use(auth());

// Get user's notifications
router.get(
  '/my-notifications',
  validate(notificationValidation.getUserNotifications),
  notificationController.getUserNotifications
);

// Get unread notification count
router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  validate(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  notificationController.markAllAsRead
);

// Admin routes (admin only)
router.use(auth(roles.ADMIN));

// Create notification
router.post(
  '/',
  validate(notificationValidation.createNotification),
  notificationController.createNotification
);

// Create bulk notifications
router.post(
  '/bulk',
  validate(notificationValidation.createBulkNotifications),
  notificationController.createBulkNotifications
);

// Get all notifications
router.get(
  '/',
  validate(notificationValidation.getAllNotifications),
  notificationController.getAllNotifications
);

// Get notification by ID
router.get(
  '/:notificationId',
  validate(notificationValidation.getNotificationById),
  notificationController.getNotificationById
);

// Update notification
router.patch(
  '/:notificationId',
  validate(notificationValidation.updateNotification),
  notificationController.updateNotification
);

// Delete notification
router.delete(
  '/:notificationId',
  validate(notificationValidation.deleteNotification),
  notificationController.deleteNotification
);

// Send notification immediately
router.post(
  '/:notificationId/send',
  validate(notificationValidation.sendNotification),
  notificationController.sendNotification
);

// Schedule notification
router.patch(
  '/:notificationId/schedule',
  validate(notificationValidation.scheduleNotification),
  notificationController.scheduleNotification
);

// Get notification statistics
router.get(
  '/stats/overview',
  notificationController.getNotificationStats
);

export default router;
