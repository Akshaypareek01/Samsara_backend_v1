import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import docsRoute from './docs.route.js';
import uploadRoute from './upload.route.js';
import trackerRoute from './tracker.route.js';
import companyRoute from './company.router.js';
import eventsRoute from './events.router.js';
import eventApplicationRoute from './eventApplication.routes.js';
import classeRoute from './classe.router.js';
import customSessionRoute from './customSession.router.js';
import meetingRoute from './meeting.router.js';
import recordedClassRoute from './recordedClass.Router.js';
import teacherAvailabilityRoute from './teacherAvailability.Router.js';
import zoomRoute from './zoom.Router.js';
import assessmentRoute from './assessment.router.js';
import questionMasterRoute from './questionMaster.router.js';
import meditationRoute from './meditation.router.js';
import masterCategoryRoute from './masterCategory.router.js';
import medicationRoute from './medication.router.js';
import ratingRoute from './rating.router.js';
import teacherRatingRoute from './teacher-rating.router.js';
import userAnalyticsRoute from './userAnalytics.router.js';
import config from '../../config/config.js';
import doshaRoute from './dosha.router.js';
import menopauseAssessmentRoute from './menopauseAssessment.router.js';
import pcosAssessmentRoute from './pcosAssessment.router.js';
import thyroidAssessmentRoute from './thyroidAssessment.router.js';
import periodTrackerRoute from './periodTracker.router.js';
import periodCycleRoute from './periodCycle.router.js';
import dietGenerationRoute from './dietGeneration.router.js';
import membershipPlanRoute from './membership-plan.route.js';
import membershipRoute from './membership.route.js';
import couponRoute from './coupon.route.js';
import paymentRoute from './payment.route.js';
import bloodReportRoute from './bloodReport.route.js';
import moodRoute from './mood.route.js';
import notificationRoute from './notification.route.js';
import dataNotificationRoute from './dataNotification.route.js';
import notificationPreferencesRoute from './notificationPreferences.route.js';
import globalConfigRoute from './globalConfig.route.js';
import whatsappRoute from './whatsapp.route.js';
import adminRoute from './admin.route.js';
import adminTrackerRoute from './admin-tracker.route.js';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/upload',
    route: uploadRoute,
  },
  {
    path: '/trackers',
    route: trackerRoute,
  },
  {
    path: '/company',
    route: companyRoute,
  },
  {
    path: '/events',
    route: eventsRoute,
  },
  {
    path: '/event-applications',
    route: eventApplicationRoute,
  },
  {
    path: '/classes',
    route: classeRoute,
  },
  {
    path: '/custom-sessions',
    route: customSessionRoute,
  },
  {
    path: '/meetings',
    route: meetingRoute,
  },
  {
    path: '/recorded-classes',
    route: recordedClassRoute,
  },
  {
    path: '/teacher-availability',
    route: teacherAvailabilityRoute,
  },
  {
    path: '/zoom',
    route: zoomRoute,
  },
  {
    path: '/assessments',
    route: assessmentRoute,
  },
  {
    path: '/question-master',
    route: questionMasterRoute,
  },
  {
    path: '/meditations',
    route: meditationRoute,
  },
  {
    path: '/master-categories',
    route: masterCategoryRoute,
  },
  {
    path: '/medications',
    route: medicationRoute,
  },
  {
    path: '/dosha',
    route: doshaRoute,
  },
  {
    path: '/menopause-assessment',
    route: menopauseAssessmentRoute,
  },
  {
    path: '/pcos-assessment',
    route: pcosAssessmentRoute,
  },
  {
    path: '/thyroid-assessment',
    route: thyroidAssessmentRoute,
  },
  {
    path: '/period-tracker',
    route: periodTrackerRoute,
  },
  {
    path: '/period-cycles',
    route: periodCycleRoute,
  },
  {
    path: '/diet-generation',
    route: dietGenerationRoute,
  },
  {
    path: '/ratings',
    route: ratingRoute,
  },
  {
    path: '/teacher-ratings',
    route: teacherRatingRoute,
  },
  {
    path: '/user-analytics',
    route: userAnalyticsRoute,
  },
  {
    path: '/membership-plans',
    route: membershipPlanRoute,
  },
  {
    path: '/memberships',
    route: membershipRoute,
  },
  {
    path: '/coupons',
    route: couponRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
  {
    path: '/blood-reports',
    route: bloodReportRoute,
  },
  {
    path: '/moods',
    route: moodRoute,
  },
  {
    path: '/notifications',
    route: notificationRoute,
  },
  {
    path: '/data-notifications',
    route: dataNotificationRoute,
  },
  {
    path: '/notification-preferences',
    route: notificationPreferencesRoute,
  },
  {
    path: '/globalconfig',
    route: globalConfigRoute,
  },
  {
    path: '/whatsapp',
    route: whatsappRoute,
  },
  {
    path: '/admin',
    route: adminRoute,
  },
  {
    path: '/admin/trackers',
    route: adminTrackerRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

console.log('🔧 Registering routes:');
defaultRoutes.forEach((route) => {
  console.log(`  - ${route.path}`);
  router.use(route.path, route.route);
});

console.log('✅ All routes registered!');

// ❌ REMOVED DUPLICATE REGISTRATION - was causing conflicts

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;