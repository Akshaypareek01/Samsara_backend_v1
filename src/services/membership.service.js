import httpStatus from 'http-status';
import axios from 'axios';
import { Membership, MembershipPlan, User, CouponCode, Transaction } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';

/**
 * Verify Apple Receipt with Apple Servers
 * @param {string} receiptData - Base64 encoded receipt data
 * @returns {Promise<Object>} Apple verification response
 */
const verifyAppleReceipt = async (receiptData) => {
  const payload = {
    'receipt-data': receiptData,
    password: config.apple.sharedSecret,
  };

  try {
    // Try production environment first
    let response = await axios.post('https://buy.itunes.apple.com/verifyReceipt', payload);

    // If sandbox receipt sent to prod (status 21007), retry with sandbox environment
    if (response.data.status === 21007) {
      response = await axios.post('https://sandbox.itunes.apple.com/verifyReceipt', payload);
    }

    if (response.data.status !== 0) {
      console.error('Apple receipt verification failed with status:', response.data.status);
      throw new ApiError(httpStatus.BAD_REQUEST, `Apple receipt verification failed: ${response.data.status}`);
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Apple receipt verification error:', error.message);
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to verify Apple receipt: ${error.message}`);
  }
};

/**
 * Process iOS subscription receipt
 * @param {Object} data - Verification request data
 * @returns {Promise<Membership>} New or updated membership
 */
const processAppleSubscription = async (userId, productId, receiptData) => {
  // 1. Validate Product ID against Plan table
  const plan = await MembershipPlan.findOne({
    appleProductId: productId,
    isActive: true,
  });

  if (!plan) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Apple product ID or plan not active');
  }

  // 2. Verify Receipt with Apple
  const appleResponse = await verifyAppleReceipt(receiptData);

  // 3. Extract Subscription Expiry (CRITICAL)
  // Apple returns multiple transactions, always take the latest expiry
  const transactions = appleResponse.latest_receipt_info || appleResponse.receipt.in_app;
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No transaction information found in Apple receipt');
  }

  const latest = transactions.sort((a, b) => b.expires_date_ms - a.expires_date_ms)[0];
  const expiryDate = new Date(Number(latest.expires_date_ms));
  const startDate = new Date(Number(latest.purchase_date_ms));

  // 4. Create Transaction record
  await Transaction.create({
    userId,
    planId: plan._id,
    planName: plan.name,
    transactionId: latest.transaction_id,
    orderId: latest.original_transaction_id,
    amount: plan.basePrice, // Approximate for reporting
    currency: plan.currency,
    status: 'completed',
    paymentMethod: 'apple',
    platform: 'ios',
    metadata: {
      appleProductId: productId,
      originalTransactionId: latest.original_transaction_id,
      purchaseDate: latest.purchase_date,
      expiryDate: latest.expires_date,
    }
  });

  // 5. Create / Update Membership Record
  const membership = await Membership.findOneAndUpdate(
    { userId, planId: plan._id },
    {
      userId,
      planId: plan._id,
      planName: plan.name,
      validityDays: plan.validityDays,
      platform: 'ios',
      paymentProvider: 'apple',
      transactionId: latest.transaction_id,
      startDate,
      endDate: expiryDate,
      status: 'active',
      appleReceiptData: receiptData,
    },
    { upsert: true, new: true }
  );

  console.info(`Apple subscription verified for user: ${userId}, productId: ${productId}, expiry: ${expiryDate}`);
  return membership;
};

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
 * Assign lifetime plan to a teacher
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<Membership>}
 */
const assignLifetimePlan = async (userId) => {
  try {
    // Check if user already has a lifetime plan
    const existingLifetimeMembership = await Membership.findOne({
      userId,
      planName: 'Lifetime Plan',
      status: { $in: ['active', 'expired', 'cancelled'] }
    });

    if (existingLifetimeMembership) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User already has a lifetime plan');
    }

    // Find the lifetime plan
    const lifetimePlan = await MembershipPlan.findOne({
      name: 'Lifetime Plan',
      isActive: true
    });

    if (!lifetimePlan) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lifetime plan not found');
    }

    // Check if lifetime plan is available for assignment
    if (!lifetimePlan.isAvailable()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Lifetime plan is not currently available');
    }

    // Calculate end date (100 years from now - effectively lifetime)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + lifetimePlan.validityDays * 24 * 60 * 60 * 1000);

    // Create membership record
    const membership = new Membership({
      userId,
      planId: lifetimePlan._id,
      planName: lifetimePlan.name,
      validityDays: lifetimePlan.validityDays,
      status: 'active',
      startDate,
      endDate,
      amountPaid: 0, // Free lifetime access
      originalAmount: lifetimePlan.basePrice,
      discountAmount: lifetimePlan.basePrice, // Full discount for lifetime
      currency: lifetimePlan.currency,
      couponCode: null,
      couponCodeString: 'LIFETIME_FREE',
      autoRenewal: false,
      metadata: {
        isLifetimePlan: true,
        isTeacherPlan: true,
        assignedAt: new Date(),
        source: 'registration'
      }
    });

    await membership.save();

    // Update user to track lifetime plan usage
    await User.findByIdAndUpdate(userId, {
      $set: {
        'metadata.lifetimePlanUsed': true,
        'metadata.lifetimePlanAssignedAt': new Date()
      }
    });

    console.log(`Lifetime plan assigned to teacher: ${userId}`);
    return membership;

  } catch (error) {
    console.error(`Failed to assign lifetime plan to teacher ${userId}:`, error);
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

/**
 * Assign membership with 100% off coupon code
 * @param {ObjectId} userId - The user ID
 * @param {ObjectId} planId - The plan ID
 * @param {string} couponCode - The coupon code
 * @returns {Promise<Membership>}
 */
const assignMembershipWithCoupon = async (userId, planId, couponCode) => {
  try {
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Validate plan exists
    const membershipPlan = await MembershipPlan.findById(planId);
    if (!membershipPlan) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
    }

    if (!membershipPlan.isActive) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Membership plan is not active');
    }

    if (!membershipPlan.isAvailable()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Membership plan is not currently available');
    }

    // Find and validate coupon code
    const couponCodeDoc = await CouponCode.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!couponCodeDoc) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid coupon code');
    }

    // Check if coupon is valid
    if (!couponCodeDoc.isValid) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code is expired or inactive');
    }

    // Check if coupon can be applied to the plan
    if (!couponCodeDoc.canApplyToPlan(planId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to this plan');
    }

    // Check if coupon can be applied by user category
    if (user.userCategory && !couponCodeDoc.canApplyByUserCategory(user.userCategory)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to your user category');
    }

    // Calculate total price
    const totalPrice = membershipPlan.calculateTotalPrice();

    // Check minimum order amount
    if (totalPrice < couponCodeDoc.minOrderAmount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Minimum order amount of ${couponCodeDoc.minOrderAmount} required for this coupon`
      );
    }

    // Calculate discount amount
    const discountAmount = couponCodeDoc.calculateDiscount(totalPrice);
    const finalAmount = totalPrice - discountAmount;

    // Check if coupon provides 100% discount
    const is100PercentOff = finalAmount === 0 ||
      (couponCodeDoc.discountType === 'percentage' && couponCodeDoc.discountValue === 100) ||
      (couponCodeDoc.discountType === 'fixed' && discountAmount >= totalPrice);

    if (!is100PercentOff) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'This coupon does not provide 100% discount. Only 100% off coupons can be used for direct membership assignment.'
      );
    }

    // Check if user already has an active membership
    const existingActiveMembership = await Membership.findOne({
      userId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (existingActiveMembership) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User already has an active membership');
    }

    // Check per-user usage limit (only count active memberships)
    // This allows reusing the coupon if previous membership is cancelled/expired
    const activeCouponUsageCount = await Membership.countDocuments({
      userId,
      couponCode: couponCodeDoc._id,
      status: 'active',
      endDate: { $gte: new Date() }
    });

    if (activeCouponUsageCount >= couponCodeDoc.usageLimitPerUser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `You have reached the maximum usage limit (${couponCodeDoc.usageLimitPerUser}) for this coupon code`
      );
    }

    // Calculate end date
    const startDate = new Date();
    let endDate;

    // Check if plan has special validity end date in metadata
    if (membershipPlan.metadata?.specialValidityEndDate) {
      endDate = new Date(membershipPlan.metadata.specialValidityEndDate);
    } else {
      endDate = new Date(startDate.getTime() + membershipPlan.validityDays * 24 * 60 * 60 * 1000);
    }

    // Create membership record
    const membership = new Membership({
      userId,
      planId: membershipPlan._id,
      planName: membershipPlan.name,
      validityDays: membershipPlan.validityDays,
      status: 'active',
      startDate,
      endDate,
      amountPaid: 0, // Free due to 100% discount
      originalAmount: totalPrice,
      discountAmount: totalPrice, // Full discount
      currency: membershipPlan.currency,
      couponCode: couponCodeDoc._id,
      couponCodeString: couponCodeDoc.code,
      autoRenewal: false,
      metadata: {
        assignedAt: new Date(),
        source: 'coupon_code',
        couponCode: couponCodeDoc.code,
        is100PercentOff: true
      }
    });

    await membership.save();

    // Increment coupon usage count
    await couponCodeDoc.incrementUsage();

    console.log(`Membership assigned to user ${userId} with 100% off coupon ${couponCodeDoc.code}`);
    return membership;

  } catch (error) {
    console.error(`Failed to assign membership with coupon to user ${userId}:`, error);
    throw error;
  }
};

export {
  assignTrialPlan,
  assignLifetimePlan,
  hasUsedTrialPlan,
  getActiveMembership,
  getUserMemberships,
  createMembership,
  updateMembership,
  cancelMembership,
  assignMembershipWithCoupon,
  verifyAppleReceipt,
  processAppleSubscription,
};
