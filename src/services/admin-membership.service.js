import { Membership } from '../models/index.js';
import {
  assignTrialPlan,
  assignLifetimePlan,
  assignMembershipWithCoupon,
} from './membership.service.js';

/**
 * Admin: overview for CRM
 */
export const adminGetUserMembershipOverview = async (userId) => {
  const activeMembership = await Membership.findOne({
    userId,
    status: 'active',
  }).populate('planId');

  const totalMemberships = await Membership.countDocuments({ userId });

  return {
    hasMembership: !!activeMembership,
    activeMembership,
    totalMemberships,
  };
};

/**
 * Admin: full membership history
 */
export const adminGetUserMembershipHistory = async (userId) => {
  return Membership.find({ userId })
    .populate('planId')
    .populate('couponCode')
    .sort({ createdAt: -1 });
};

// Thin wrappers (reuse your existing logic)
export const adminAssignTrialPlan = assignTrialPlan;
export const adminAssignLifetimePlan = assignLifetimePlan;
export const adminAssignMembershipWithCoupon = async ({
  userId,
  planId,
  couponCode,
}) => assignMembershipWithCoupon(userId, planId, couponCode);
