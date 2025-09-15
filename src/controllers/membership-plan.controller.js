import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { MembershipPlan } from '../models/index.js';

/**
 * Create a membership plan
 */
const createMembershipPlan = catchAsync(async (req, res) => {
  const planData = {
    ...req.body,
    createdBy: req.user.id, // Assuming admin user
  };

  const membershipPlan = await MembershipPlan.create(planData);
  res.status(httpStatus.CREATED).send(membershipPlan);
});

/**
 * Get membership plans
 */
const getMembershipPlans = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'planType', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Only show available plans for non-admin users
  if (req.user.role !== 'admin') {
    filter.isActive = true;
    // Add availability filter for non-admin users
    const now = new Date();
    filter.availableFrom = { $lte: now };
    filter.$or = [
      { availableUntil: null },
      { availableUntil: { $gte: now } }
    ];
    
    // Exclude internal plans (Trial Plan and Lifetime Plan) from user-facing APIs
    filter.name = { $nin: ['Trial Plan', 'Lifetime Plan'] };
  }

  const result = await MembershipPlan.paginate(filter, options);
  res.send(result);
});

/**
 * Get membership plan
 */
const getMembershipPlan = catchAsync(async (req, res) => {
  const membershipPlan = await MembershipPlan.findById(req.params.planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }
  
  // Don't show unavailable plans to non-admin users
  if (req.user.role !== 'admin') {
    if (!membershipPlan.isActive || !membershipPlan.isAvailable()) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
    }
    
    // Don't show internal plans (Trial Plan and Lifetime Plan) to non-admin users
    if (membershipPlan.name === 'Trial Plan' || membershipPlan.name === 'Lifetime Plan') {
      throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
    }
  }
  
  res.send(membershipPlan);
});

/**
 * Update membership plan
 */
const updateMembershipPlan = catchAsync(async (req, res) => {
  const membershipPlan = await MembershipPlan.findById(req.params.planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  Object.assign(membershipPlan, req.body);
  await membershipPlan.save();
  res.send(membershipPlan);
});

/**
 * Delete membership plan
 */
const deleteMembershipPlan = catchAsync(async (req, res) => {
  const membershipPlan = await MembershipPlan.findById(req.params.planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  // Soft delete by setting isActive to false
  membershipPlan.isActive = false;
  await membershipPlan.save();
  
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get active membership plans for public
 */
const getActiveMembershipPlans = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.sortBy = options.sortBy || 'price:asc';

  // Only show currently available plans
  const now = new Date();
  const filter = {
    isActive: true,
    availableFrom: { $lte: now },
    $or: [
      { availableUntil: null },
      { availableUntil: { $gte: now } }
    ],
    // Exclude internal plans (Trial Plan and Lifetime Plan) from public APIs
    name: { $nin: ['Trial Plan', 'Lifetime Plan'] }
  };

  const result = await MembershipPlan.paginate(filter, options);
  res.send(result);
});

/**
 * Get membership plan by type
 */
const getMembershipPlansByType = catchAsync(async (req, res) => {
  const { planType } = req.params;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Only show currently available plans of the specified type
  const now = new Date();
  const filter = { 
    planType,
    isActive: true,
    availableFrom: { $lte: now },
    $or: [
      { availableUntil: null },
      { availableUntil: { $gte: now } }
    ],
    // Exclude internal plans (Trial Plan and Lifetime Plan) from user-facing APIs
    name: { $nin: ['Trial Plan', 'Lifetime Plan'] }
  };

  const result = await MembershipPlan.paginate(filter, options);
  res.send(result);
});

/**
 * Toggle membership plan status
 */
const toggleMembershipPlanStatus = catchAsync(async (req, res) => {
  const membershipPlan = await MembershipPlan.findById(req.params.planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  membershipPlan.isActive = !membershipPlan.isActive;
  await membershipPlan.save();
  
  res.send({
    message: `Membership plan ${membershipPlan.isActive ? 'activated' : 'deactivated'} successfully`,
    membershipPlan
  });
});

/**
 * Get membership plan statistics
 */
const getMembershipPlanStats = catchAsync(async (req, res) => {
  const stats = await MembershipPlan.aggregate([
    {
      $group: {
        _id: '$planType',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        avgBasePrice: { $avg: '$basePrice' },
        minBasePrice: { $min: '$basePrice' },
        maxBasePrice: { $max: '$basePrice' }
      }
    }
  ]);

  const totalPlans = await MembershipPlan.countDocuments();
  const activePlans = await MembershipPlan.countDocuments({ isActive: true });

  res.send({
    totalPlans,
    activePlans,
    inactivePlans: totalPlans - activePlans,
    statsByType: stats
  });
});

/**
 * Get pricing breakdown for a plan
 */
const getPlanPricingBreakdown = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const { couponCode } = req.query;

  const membershipPlan = await MembershipPlan.findById(planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  // Don't show unavailable plans to non-admin users
  if (req.user.role !== 'admin') {
    if (!membershipPlan.isActive || !membershipPlan.isAvailable()) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
    }
    
    // Don't show internal plans (Trial Plan and Lifetime Plan) to non-admin users
    if (membershipPlan.name === 'Trial Plan' || membershipPlan.name === 'Lifetime Plan') {
      throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
    }
  }

  let discountAmount = 0;
  let couponCodeDoc = null;

  // Calculate discount if coupon code provided
  if (couponCode) {
    couponCodeDoc = await CouponCode.findOne({ 
      code: couponCode.toUpperCase(),
      isActive: true 
    });

    if (couponCodeDoc && couponCodeDoc.isValid) {
      const totalPrice = membershipPlan.calculateTotalPrice();
      if (couponCodeDoc.canApplyToPlan(planId) && totalPrice >= couponCodeDoc.minOrderAmount) {
        const couponDiscountAmount = couponCodeDoc.calculateDiscount(totalPrice);
        discountAmount = membershipPlan.calculateDiscountAmount(couponDiscountAmount);
      }
    }
  }

  const pricingBreakdown = membershipPlan.calculatePricingBreakdown(discountAmount, couponCode);

  res.send({
    plan: membershipPlan,
    pricing: pricingBreakdown,
    coupon: couponCodeDoc ? {
      code: couponCodeDoc.code,
      name: couponCodeDoc.name,
      discountType: couponCodeDoc.discountType,
      discountValue: couponCodeDoc.discountValue
    } : null
  });
});

export {
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
};
