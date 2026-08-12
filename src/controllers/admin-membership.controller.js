import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import isAdminUser from '../utils/isAdminUser.js';
import {
  adminGetUserMembershipOverview,
  adminGetUserMembershipHistory,
  adminAssignLifetimePlan,
  adminAssignMembershipWithCoupon,
  adminAssignMembershipByEmailAndPlanName,
  adminAssignMembershipByUserAndPlan,
} from '../services/admin-membership.service.js';

export const getUserMembershipOverview = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const data = await adminGetUserMembershipOverview(userId);
  res.send({ success: true, data });
});

export const getUserMembershipHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const data = await adminGetUserMembershipHistory(userId);
  res.send({ success: true, data });
});

export const assignLifetimePlan = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const membership = await adminAssignLifetimePlan(userId);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Lifetime plan assigned successfully',
    data: membership,
  });
});

export const assignWithCoupon = catchAsync(async (req, res) => {
  // Reachable from the consumer app (user redeems a 100%-off coupon), so a
  // non-admin may only ever assign to themselves — never to an arbitrary userId.
  const payload = isAdminUser(req.user) ? req.body : { ...req.body, userId: req.user.id };

  const membership = await adminAssignMembershipWithCoupon(payload);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Membership assigned successfully',
    data: membership,
  });
});

/**
 * POST body: { email, planName } — resolves user by email and creates membership for the named plan.
 */
export const assignByEmailAndPlanName = catchAsync(async (req, res) => {
  const membership = await adminAssignMembershipByEmailAndPlanName(req.body);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Membership assigned successfully',
    data: membership,
  });
});

export const assignByUserAndPlan = catchAsync(async (req, res) => {
  const membership = await adminAssignMembershipByUserAndPlan(req.body);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Membership assigned successfully',
    data: membership,
  });
});
