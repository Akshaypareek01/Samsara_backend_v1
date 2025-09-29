import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  updateSpecificPreference,
  toggleGlobalSetting,
  toggleQuietHours,
  updateQuietHoursTime,
  resetToDefault
} from '../../controllers/notificationPreferences.controller.js';
import {
  updateNotificationPreferences as updateNotificationPreferencesValidation,
  updateSpecificPreference as updateSpecificPreferenceValidation,
  toggleGlobalSetting as toggleGlobalSettingValidation,
  toggleQuietHours as toggleQuietHoursValidation,
  updateQuietHoursTime as updateQuietHoursTimeValidation
} from '../../validations/notificationPreferences.validation.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreferences:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *         preferences:
 *           type: object
 *           properties:
 *             class_update:
 *               type: boolean
 *             upcoming_class:
 *               type: boolean
 *             upcoming_event:
 *               type: boolean
 *             upcoming_appointment:
 *               type: boolean
 *             app_update:
 *               type: boolean
 *             general:
 *               type: boolean
 *             payment:
 *               type: boolean
 *             membership:
 *               type: boolean
 *             assessment:
 *               type: boolean
 *             meditation:
 *               type: boolean
 *             diet:
 *               type: boolean
 *             period_tracker:
 *               type: boolean
 *         emailNotifications:
 *           type: boolean
 *         pushNotifications:
 *           type: boolean
 *         smsNotifications:
 *           type: boolean
 *         quietHours:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             startTime:
 *               type: string
 *               format: time
 *               example: "22:00"
 *             endTime:
 *               type: string
 *               format: time
 *               example: "08:00"
 *         frequency:
 *           type: string
 *           enum: [immediate, daily_digest, weekly_digest]
 */

/**
 * @swagger
 * /api/v1/notification-preferences:
 *   get:
 *     summary: Get user's notification preferences
 *     description: Retrieve the current notification preferences for the authenticated user
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/', auth(), getNotificationPreferences);

/**
 * @swagger
 * /api/v1/notification-preferences:
 *   put:
 *     summary: Update user's notification preferences
 *     description: Update multiple notification preferences at once
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   class_update:
 *                     type: boolean
 *                   upcoming_class:
 *                     type: boolean
 *                   upcoming_event:
 *                     type: boolean
 *                   upcoming_appointment:
 *                     type: boolean
 *                   app_update:
 *                     type: boolean
 *                   general:
 *                     type: boolean
 *                   payment:
 *                     type: boolean
 *                   membership:
 *                     type: boolean
 *                   assessment:
 *                     type: boolean
 *                   meditation:
 *                     type: boolean
 *                   diet:
 *                     type: boolean
 *                   period_tracker:
 *                     type: boolean
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               quietHours:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   startTime:
 *                     type: string
 *                     example: "22:00"
 *                   endTime:
 *                     type: string
 *                     example: "08:00"
 *               frequency:
 *                 type: string
 *                 enum: [immediate, daily_digest, weekly_digest]
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreferences'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/', auth(), validate(updateNotificationPreferencesValidation), updateNotificationPreferences);

/**
 * @swagger
 * /api/v1/notification-preferences/preference/{type}/{enabled}:
 *   patch:
 *     summary: Update specific notification preference
 *     description: Update a single notification preference by type
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [class_update, upcoming_class, upcoming_event, upcoming_appointment, app_update, general, payment, membership, assessment, meditation, diet, period_tracker]
 *         description: The notification type to update
 *       - in: path
 *         name: enabled
 *         required: true
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to enable or disable the notification
 *     responses:
 *       200:
 *         description: Notification preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     enabled:
 *                       type: boolean
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/preference/:type/:enabled', auth(), validate(updateSpecificPreferenceValidation), updateSpecificPreference);

/**
 * @swagger
 * /api/v1/notification-preferences/global/{setting}/{enabled}:
 *   patch:
 *     summary: Toggle global notification setting
 *     description: Enable or disable global notification settings (email, push, SMS)
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setting
 *         required: true
 *         schema:
 *           type: string
 *           enum: [emailNotifications, pushNotifications, smsNotifications]
 *         description: The global setting to update
 *       - in: path
 *         name: enabled
 *         required: true
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to enable or disable the setting
 *     responses:
 *       200:
 *         description: Global setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     setting:
 *                       type: string
 *                     enabled:
 *                       type: boolean
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/global/:setting/:enabled', auth(), validate(toggleGlobalSettingValidation), toggleGlobalSetting);

/**
 * @swagger
 * /api/v1/notification-preferences/quiet-hours/{enabled}:
 *   patch:
 *     summary: Toggle quiet hours
 *     description: Enable or disable quiet hours
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enabled
 *         required: true
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to enable or disable quiet hours
 *     responses:
 *       200:
 *         description: Quiet hours toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     quietHours:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
/**
 * @swagger
 * /api/v1/notification-preferences/quiet-hours/time:
 *   patch:
 *     summary: Update quiet hours time
 *     description: Update the start and end time for quiet hours
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "22:00"
 *                 description: Start time in HH:MM format (24-hour)
 *               endTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "08:00"
 *                 description: End time in HH:MM format (24-hour)
 *     responses:
 *       200:
 *         description: Quiet hours time updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     quietHours:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/quiet-hours/time', auth(), validate(updateQuietHoursTimeValidation), updateQuietHoursTime);
router.patch('/quiet-hours/:enabled', auth(), validate(toggleQuietHoursValidation), toggleQuietHours);

/**
 * @swagger
 * /api/v1/notification-preferences/reset:
 *   post:
 *     summary: Reset notification preferences to default
 *     description: Reset all notification preferences to their default values
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences reset to default successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/reset', auth(), resetToDefault);

export default router;
