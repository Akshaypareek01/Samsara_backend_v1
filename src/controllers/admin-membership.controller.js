import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  adminGetUserMembershipOverview,
  adminGetUserMembershipHistory,
  adminAssignTrialPlan,
  adminAssignLifetimePlan,
  adminAssignMembershipWithCoupon,
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

export const assignTrialPlan = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const membership = await adminAssignTrialPlan(userId);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Trial plan assigned successfully',
    data: membership,
  });
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
