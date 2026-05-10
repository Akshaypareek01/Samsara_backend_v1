import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  adminGetUserMembershipOverview,
  adminGetUserMembershipHistory,
  adminAssignLifetimePlan,
  adminAssignMembershipWithCoupon,
  adminAssignMembershipByEmailAndPlanName,
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
  const membership = await adminAssignMembershipWithCoupon(req.body);

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
