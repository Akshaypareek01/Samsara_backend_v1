import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { CouponCode, MembershipPlan } from '../models/index.js';

/**
 * Create a coupon code
 */
const createCouponCode = catchAsync(async (req, res) => {
  const couponData = {
    ...req.body,
    createdBy: req.user.id, // Assuming admin user
  };

  // Validate applicable plans if provided
  if (couponData.applicablePlans && couponData.applicablePlans.length > 0) {
    const validPlans = await MembershipPlan.find({
      _id: { $in: couponData.applicablePlans },
      isActive: true
    });
    
    if (validPlans.length !== couponData.applicablePlans.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Some applicable plans are invalid or inactive');
    }
  }

  const couponCode = await CouponCode.create(couponData);
  res.status(httpStatus.CREATED).send(couponCode);
});

/**
 * Get coupon codes
 */
const getCouponCodes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['code', 'discountType', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Only show active coupons for non-admin users
  if (req.user.role !== 'admin') {
    filter.isActive = true;
  }

  const result = await CouponCode.paginate(filter, options);
  res.send(result);
});

/**
 * Get coupon code
 */
const getCouponCode = catchAsync(async (req, res) => {
  const couponCode = await CouponCode.findById(req.params.couponId);
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }
  
  // Don't show inactive coupons to non-admin users
  if (!couponCode.isActive && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }
  
  res.send(couponCode);
});

/**
 * Get coupon code by code string
 */
const getCouponCodeByCode = catchAsync(async (req, res) => {
  const { code } = req.params;
  const couponCode = await CouponCode.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });
  
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }
  
  res.send(couponCode);
});

/**
 * Update coupon code
 */
const updateCouponCode = catchAsync(async (req, res) => {
  const couponCode = await CouponCode.findById(req.params.couponId);
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }

  // Validate applicable plans if being updated
  if (req.body.applicablePlans && req.body.applicablePlans.length > 0) {
    const validPlans = await MembershipPlan.find({
      _id: { $in: req.body.applicablePlans },
      isActive: true
    });
    
    if (validPlans.length !== req.body.applicablePlans.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Some applicable plans are invalid or inactive');
    }
  }

  Object.assign(couponCode, req.body);
  await couponCode.save();
  res.send(couponCode);
});

/**
 * Delete coupon code
 */
const deleteCouponCode = catchAsync(async (req, res) => {
  const couponCode = await CouponCode.findById(req.params.couponId);
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }

  // Soft delete by setting isActive to false
  couponCode.isActive = false;
  await couponCode.save();
  
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Validate coupon code
 */
const validateCouponCode = catchAsync(async (req, res) => {
  const { code, planId, userCategory, orderAmount } = req.body;
  
  const couponCode = await CouponCode.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });
  
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid coupon code');
  }

  // Check if coupon is valid
  if (!couponCode.isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code is expired or inactive');
  }

  // Check if coupon can be applied to the plan
  if (!couponCode.canApplyToPlan(planId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to this plan');
  }

  // Check if coupon can be applied by user category
  if (!couponCode.canApplyByUserCategory(userCategory)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to your user category');
  }

  // Check minimum order amount
  if (orderAmount < couponCode.minOrderAmount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      `Minimum order amount of ${couponCode.minOrderAmount} required for this coupon`
    );
  }

  // Calculate discount amount
  const discountAmount = couponCode.calculateDiscount(orderAmount);
  
  res.send({
    valid: true,
    couponCode,
    discountAmount,
    finalAmount: orderAmount - discountAmount
  });
});

/**
 * Get active coupon codes
 */
const getActiveCouponCodes = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.sortBy = options.sortBy || 'createdAt:desc';

  const result = await CouponCode.paginate(
    { isActive: true },
    options
  );
  res.send(result);
});

/**
 * Toggle coupon code status
 */
const toggleCouponCodeStatus = catchAsync(async (req, res) => {
  const couponCode = await CouponCode.findById(req.params.couponId);
  if (!couponCode) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon code not found');
  }

  couponCode.isActive = !couponCode.isActive;
  await couponCode.save();
  
  res.send({
    message: `Coupon code ${couponCode.isActive ? 'activated' : 'deactivated'} successfully`,
    couponCode
  });
});

/**
 * Get coupon code statistics
 */
const getCouponCodeStats = catchAsync(async (req, res) => {
  const stats = await CouponCode.aggregate([
    {
      $group: {
        _id: '$discountType',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalUsed: { $sum: '$usedCount' },
        avgDiscountValue: { $avg: '$discountValue' }
      }
    }
  ]);

  const totalCoupons = await CouponCode.countDocuments();
  const activeCoupons = await CouponCode.countDocuments({ isActive: true });
  const expiredCoupons = await CouponCode.countDocuments({
    endDate: { $lt: new Date() }
  });

  res.send({
    totalCoupons,
    activeCoupons,
    inactiveCoupons: totalCoupons - activeCoupons,
    expiredCoupons,
    statsByType: stats
  });
});

/**
 * Get coupon codes applicable to a plan
 */
const getCouponCodesForPlan = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const filter = {
    isActive: true,
    $or: [
      { applicablePlans: { $size: 0 } }, // Coupons applicable to all plans
      { applicablePlans: planId } // Coupons specific to this plan
    ]
  };

  const result = await CouponCode.paginate(filter, options);
  res.send(result);
});

export {
  createCouponCode,
  getCouponCodes,
  getCouponCode,
  getCouponCodeByCode,
  updateCouponCode,
  deleteCouponCode,
  validateCouponCode,
  getActiveCouponCodes,
  toggleCouponCodeStatus,
  getCouponCodeStats,
  getCouponCodesForPlan,
};
