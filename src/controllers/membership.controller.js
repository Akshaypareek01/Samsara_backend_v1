import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { 
  assignTrialPlan, 
  assignLifetimePlan,
  hasUsedTrialPlan, 
  getActiveMembership, 
  getUserMemberships,
  createMembership,
  updateMembership,
  cancelMembership
} from '../services/membership.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get user's active membership
 */
const getActiveMembershipController = catchAsync(async (req, res) => {
  const membership = await getActiveMembership(req.user.id);
  
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active membership found');
  }

  res.send({
    success: true,
    data: membership
  });
});

/**
 * Get user's membership history
 */
const getMembershipHistory = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const memberships = await getUserMemberships(req.user.id, parseInt(limit));
  
  res.send({
    success: true,
    data: memberships
  });
});

/**
 * Check if user has used trial plan
 */
const checkTrialPlanUsage = catchAsync(async (req, res) => {
  const hasUsed = await hasUsedTrialPlan(req.user.id);
  
  res.send({
    success: true,
    data: {
      hasUsedTrialPlan: hasUsed,
      canUseTrialPlan: !hasUsed
    }
  });
});

/**
 * Manually assign trial plan (admin only)
 */
const assignTrialPlanController = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const membership = await assignTrialPlan(userId);
  
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Trial plan assigned successfully',
    data: membership
  });
});

/**
 * Manually assign lifetime plan to teacher (admin only)
 */
const assignLifetimePlanController = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const membership = await assignLifetimePlan(userId);
  
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Lifetime plan assigned successfully',
    data: membership
  });
});

/**
 * Create a new membership
 */
const createMembershipController = catchAsync(async (req, res) => {
  const membershipData = {
    ...req.body,
    userId: req.user.id
  };
  
  const membership = await createMembership(membershipData);
  
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Membership created successfully',
    data: membership
  });
});

/**
 * Update membership
 */
const updateMembershipController = catchAsync(async (req, res) => {
  const { membershipId } = req.params;
  
  const membership = await updateMembership(membershipId, req.body);
  
  res.send({
    success: true,
    message: 'Membership updated successfully',
    data: membership
  });
});

/**
 * Cancel membership
 */
const cancelMembershipController = catchAsync(async (req, res) => {
  const { membershipId } = req.params;
  const { reason } = req.body;
  
  const membership = await cancelMembership(membershipId, reason);
  
  res.send({
    success: true,
    message: 'Membership cancelled successfully',
    data: membership
  });
});

export {
  getActiveMembershipController,
  getMembershipHistory,
  checkTrialPlanUsage,
  assignTrialPlanController,
  assignLifetimePlanController,
  createMembershipController,
  updateMembershipController,
  cancelMembershipController
};
