import httpStatus from 'http-status';
import { Membership, MembershipPlan, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Assign trial plan to a new user
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<Membership>}
 */
const assignTrialPlan = async (userId) => {
  try {
    // Check if user already has a trial plan
    const existingTrialMembership = await Membership.findOne({
      userId,
      planName: 'Trial Plan',
      status: { $in: ['active', 'expired', 'cancelled'] }
    });

    if (existingTrialMembership) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User already has a trial plan');
    }

    // Find the trial plan
    const trialPlan = await MembershipPlan.findOne({ 
      name: 'Trial Plan',
      isActive: true 
    });

    if (!trialPlan) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Trial plan not found');
    }

    // Check if trial plan is available for purchase
    if (!trialPlan.isAvailable()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Trial plan is not currently available');
    }

    // Calculate end date (7 days from now)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + trialPlan.validityDays * 24 * 60 * 60 * 1000);

    // Create membership record
    const membership = new Membership({
      userId,
      planId: trialPlan._id,
      planName: trialPlan.name,
      validityDays: trialPlan.validityDays,
      status: 'active',
      startDate,
      endDate,
      amountPaid: 0, // Free trial
      originalAmount: trialPlan.basePrice,
      discountAmount: trialPlan.basePrice, // Full discount for trial
      currency: trialPlan.currency,
      couponCode: null,
      couponCodeString: 'TRIAL_FREE',
      autoRenewal: false,
      metadata: {
        isTrialPlan: true,
        assignedAt: new Date(),
        source: 'registration'
      }
    });

    await membership.save();

    // Update user to track trial plan usage
    await User.findByIdAndUpdate(userId, {
      $set: { 
        'metadata.trialPlanUsed': true,
        'metadata.trialPlanAssignedAt': new Date()
      }
    });

    console.log(`Trial plan assigned to user: ${userId}`);
    return membership;

  } catch (error) {
    console.error(`Failed to assign trial plan to user ${userId}:`, error);
    throw error;
  }
};

/**
 * Check if user has used trial plan
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<boolean>}
 */
const hasUsedTrialPlan = async (userId) => {
  const trialMembership = await Membership.findOne({
    userId,
    planName: 'Trial Plan'
  });
  
  return !!trialMembership;
};

/**
 * Get user's active membership
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<Membership>}
 */
const getActiveMembership = async (userId) => {
  return Membership.getActiveMembership(userId);
};

/**
 * Get user's membership history
 * @param {ObjectId} userId - The user ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>}
 */
const getUserMemberships = async (userId, limit = 10) => {
  return Membership.getUserMemberships(userId, limit);
};

/**
 * Create a new membership
 * @param {Object} membershipData - The membership data
 * @returns {Promise<Membership>}
 */
const createMembership = async (membershipData) => {
  // Check if user already has an active membership
  const existingActiveMembership = await Membership.findOne({
    userId: membershipData.userId,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });

  if (existingActiveMembership) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already has an active membership');
  }

  // If this is a trial plan, check if user has already used it
  if (membershipData.planName === 'Trial Plan') {
    const hasUsedTrial = await hasUsedTrialPlan(membershipData.userId);
    if (hasUsedTrial) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Trial plan can only be used once per account');
    }
  }

  const membership = new Membership(membershipData);
  await membership.save();
  return membership;
};

/**
 * Update membership status
 * @param {ObjectId} membershipId - The membership ID
 * @param {Object} updateData - The update data
 * @returns {Promise<Membership>}
 */
const updateMembership = async (membershipId, updateData) => {
  const membership = await Membership.findByIdAndUpdate(membershipId, updateData, { new: true });
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership not found');
  }
  return membership;
};

/**
 * Cancel membership
 * @param {ObjectId} membershipId - The membership ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Membership>}
 */
const cancelMembership = async (membershipId, reason = null) => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership not found');
  }

  await membership.cancel(reason);
  return membership;
};

export {
  assignTrialPlan,
  hasUsedTrialPlan,
  getActiveMembership,
  getUserMemberships,
  createMembership,
  updateMembership,
  cancelMembership
};
