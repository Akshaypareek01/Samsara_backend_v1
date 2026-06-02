import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { membershipValidation } from '../../validations/membership.validation.js';
import {
  getUserMembershipOverview,
  getUserMembershipHistory,
  assignLifetimePlan,
  assignWithCoupon,
  assignByEmailAndPlanName,
  assignByUserAndPlan,
} from '../../controllers/admin-membership.controller.js';

const router = express.Router();

router.get('/users/:userId/overview', auth(), getUserMembershipOverview);
router.get('/users/:userId/history', auth(), getUserMembershipHistory);

router.post('/users/:userId/assign-lifetime', auth(), assignLifetimePlan);
router.post('/assign-with-coupon', auth(), assignWithCoupon);
router.post(
  '/assign',
  auth(),
  validate(membershipValidation.assignMembershipByUserAndPlan),
  assignByUserAndPlan
);

// Intentionally unauthenticated (internal/script use). Do not expose publicly without network controls.
router.post(
  '/assign-by-email-plan',
  validate(membershipValidation.assignMembershipByEmailAndPlan),
  assignByEmailAndPlanName
);

export default router;
