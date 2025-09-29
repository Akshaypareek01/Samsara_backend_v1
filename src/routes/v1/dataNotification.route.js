import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import dataNotificationValidation from '../../validations/dataNotification.validation.js';
import dataNotificationController from '../../controllers/dataNotification.controller.js';
import { roles } from '../../config/roles.js';

const router = express.Router();

// All routes require authentication
router.use(auth());

// Class notifications
router.post(
  '/class/create',
  validate(dataNotificationValidation.createClassWithNotification),
  dataNotificationController.createClassWithNotification
);

router.patch(
  '/class/update',
  validate(dataNotificationValidation.updateClassWithNotification),
  dataNotificationController.updateClassWithNotification
);

// Event notifications
router.post(
  '/event/create',
  validate(dataNotificationValidation.createEventWithNotification),
  dataNotificationController.createEventWithNotification
);

// Appointment notifications
router.post(
  '/appointment/create',
  validate(dataNotificationValidation.createAppointmentWithNotification),
  dataNotificationController.createAppointmentWithNotification
);

// App update notifications
router.post(
  '/app-update',
  validate(dataNotificationValidation.sendAppUpdateNotification),
  dataNotificationController.sendAppUpdateNotification
);

// Payment notifications
router.post(
  '/payment',
  validate(dataNotificationValidation.sendPaymentNotification),
  dataNotificationController.sendPaymentNotification
);

// Membership notifications
router.post(
  '/membership',
  validate(dataNotificationValidation.sendMembershipNotification),
  dataNotificationController.sendMembershipNotification
);

// Assessment notifications
router.post(
  '/assessment',
  validate(dataNotificationValidation.sendAssessmentNotification),
  dataNotificationController.sendAssessmentNotification
);

// Meditation notifications
router.post(
  '/meditation',
  validate(dataNotificationValidation.sendMeditationNotification),
  dataNotificationController.sendMeditationNotification
);

// Diet notifications
router.post(
  '/diet',
  validate(dataNotificationValidation.sendDietNotification),
  dataNotificationController.sendDietNotification
);

// Period tracker notifications
router.post(
  '/period-tracker',
  validate(dataNotificationValidation.sendPeriodTrackerNotification),
  dataNotificationController.sendPeriodTrackerNotification
);

// Custom notifications (admin only)
router.post(
  '/custom',
  auth(roles.ADMIN),
  validate(dataNotificationValidation.sendCustomNotification),
  dataNotificationController.sendCustomNotification
);

// Bulk notifications (admin only)
router.post(
  '/bulk',
  auth(roles.ADMIN),
  validate(dataNotificationValidation.sendBulkNotifications),
  dataNotificationController.sendBulkNotifications
);

export default router;
