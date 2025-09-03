import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  createMembershipPlan,
  getMembershipPlans,
  getMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getActiveMembershipPlans,
  getMembershipPlansByType,
  toggleMembershipPlanStatus,
  getMembershipPlanStats,
  getPlanPricingBreakdown,
} from '../../controllers/membership-plan.controller.js';
import {
  createMembershipPlan as createMembershipPlanValidation,
  getMembershipPlans as getMembershipPlansValidation,
  getMembershipPlan as getMembershipPlanValidation,
  updateMembershipPlan as updateMembershipPlanValidation,
  deleteMembershipPlan as deleteMembershipPlanValidation,
  getMembershipPlansByType as getMembershipPlansByTypeValidation,
  toggleMembershipPlanStatus as toggleMembershipPlanStatusValidation,
} from '../../validations/membership-plan.validation.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveMembershipPlans);
router.get('/type/:planType', validate(getMembershipPlansByTypeValidation), getMembershipPlansByType);

// Protected routes (require authentication)
router.use(auth());

// User routes
router.get('/', validate(getMembershipPlansValidation), getMembershipPlans);
router.get('/stats', getMembershipPlanStats);
router.get('/:planId', validate(getMembershipPlanValidation), getMembershipPlan);
router.get('/:planId/pricing', validate(getMembershipPlanValidation), getPlanPricingBreakdown);

// Admin routes (require admin role)
router.post('/', auth('admin'), validate(createMembershipPlanValidation), createMembershipPlan);
router.patch('/:planId', auth('admin'), validate(updateMembershipPlanValidation), updateMembershipPlan);
router.delete('/:planId', auth('admin'), validate(deleteMembershipPlanValidation), deleteMembershipPlan);
router.patch('/:planId/toggle-status', auth('admin'), validate(toggleMembershipPlanStatusValidation), toggleMembershipPlanStatus);

export default router;
