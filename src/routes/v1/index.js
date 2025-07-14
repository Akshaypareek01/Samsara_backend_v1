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
import userAnalyticsRoute from './userAnalytics.router.js';
import config from '../../config/config.js';

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
    path: '/ratings',
    route: ratingRoute,
  },
  {
    path: '/user-analytics',
    route: userAnalyticsRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
