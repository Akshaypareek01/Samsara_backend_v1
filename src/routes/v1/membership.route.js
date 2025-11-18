import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  getActiveMembershipController,
  getMembershipHistory,
  checkTrialPlanUsage,
  assignTrialPlanController,
  assignLifetimePlanController,
  createMembershipController,
  updateMembershipController,
  cancelMembershipController,
  assignMembershipWithCouponController
} from '../../controllers/membership.controller.js';
import { membershipValidation } from '../../validations/membership.validation.js';

const router = express.Router();

// Get user's active membership
router.get('/active', auth(), getActiveMembershipController);

// Get user's membership history
router.get('/history', auth(), getMembershipHistory);

// Check if user has used trial plan
router.get('/trial-status', auth(), checkTrialPlanUsage);

// Create new membership
router.post('/', auth(), validate(membershipValidation.createMembership), createMembershipController);

// Update membership
router.patch('/:membershipId', auth(), validate(membershipValidation.updateMembership), updateMembershipController);

// Cancel membership
router.patch('/:membershipId/cancel', auth(), validate(membershipValidation.cancelMembership), cancelMembershipController);

// Admin routes
// Manually assign trial plan (admin only)
router.post('/assign-trial/:userId', auth(), assignTrialPlanController);

// Manually assign lifetime plan to teacher (admin only)
router.post('/assign-lifetime/:userId', auth(), assignLifetimePlanController);

// Assign membership with 100% off coupon code (admin only)
router.post('/assign-with-coupon', auth(), validate(membershipValidation.assignMembershipWithCoupon), assignMembershipWithCouponController);

export default router;
