import express from 'express';
import auth from '../../middlewares/auth.js';
import {
  getUserMembershipOverview,
  getUserMembershipHistory,
  assignTrialPlan,
  assignLifetimePlan,
  assignWithCoupon,
} from '../../controllers/admin-membership.controller.js';

const router = express.Router();

router.get('/users/:userId/overview', auth(), getUserMembershipOverview);
router.get('/users/:userId/history', auth(), getUserMembershipHistory);

router.post('/users/:userId/assign-trial', auth(), assignTrialPlan);
router.post('/users/:userId/assign-lifetime', auth(), assignLifetimePlan);
router.post('/assign-with-coupon', auth(), assignWithCoupon);

export default router;
