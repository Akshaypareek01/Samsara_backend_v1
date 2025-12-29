import express from 'express';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import * as adminPeriodController from '../../controllers/admin-period.controller.js';

const router = express.Router();

// Protect all admin period routes
router.use(auth());
router.use(adminOnly());

// Period overview for a user
router.get(
  '/users/:userId/overview',
  adminPeriodController.getAdminUserPeriodOverview
);

// Period cycle history for a user
router.get(
  '/users/:userId/cycles',
  adminPeriodController.getAdminUserPeriodCycles
);

export default router;
