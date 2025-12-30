import express from 'express';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import * as adminTrackerController from '../../controllers/admin-tracker.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth());
router.use(adminOnly());

// Dashboard - path is relative to /admin/trackers
router.get('/users/:userId/dashboard', adminTrackerController.getAdminUserDashboard);

// Water tracking routes - paths are relative to /admin/trackers
router.get('/users/:userId/water/today', adminTrackerController.getAdminUserTodayWaterData);
router.get('/users/:userId/water/history', adminTrackerController.getAdminUserWaterHistory);
router.get('/users/:userId/water/hydration-status', adminTrackerController.getAdminUserHydrationStatus);

export default router;