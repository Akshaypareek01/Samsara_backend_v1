import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { MembershipPlan, CouponCode, Membership, Transaction, User } from '../models/index.js';
import razorpayService from '../services/razorpay.service.js';
import config from '../config/config.js';

/**
 * @param {number} n
 * @returns {number}
 */
const roundMoney2 = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Plan must have a real USD list tier (not INR base misread as USD).
 *
 * @param {import('mongoose').Document & { usdBasePrice?: number }} plan
 */
function assertPlanHasUsdCatalogPrice(plan) {
  if (
    typeof plan.usdBasePrice !== 'number' ||
    Number.isNaN(plan.usdBasePrice) ||
    plan.usdBasePrice <= 0
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This plan does not have a USD list price configured for FX settlement.'
    );
  }
}

/**
 * Razorpay-facing INR breakdown when charging `USD catalogue total × FX`.
 *
 * @param {*} plan - MembershipPlan doc
 * @param {number} fx
 * @param {number} discountAmount
 * @param {string|null} couponCode
 * @param {number} finalAmountInr
 */
function pricingBreakdownUsdCatalogToInr(plan, fx, discountAmount, couponCode, finalAmountInr) {
  const usdZero = plan.calculatePricingBreakdown(0, null, 'USD');
  const scale = (x) => roundMoney2(Number(x) * fx);
  return {
    basePrice: scale(usdZero.basePrice),
    taxes: {
      gst: {
        rate: usdZero.taxes.gst.rate,
        type: usdZero.taxes.gst.type,
        amount: scale(usdZero.taxes.gst.amount),
      },
      other: (usdZero.taxes.other || []).map((t) => ({
        ...t,
        amount: scale(t.amount),
      })),
    },
    subtotal: scale(usdZero.subtotal),
    discount: { amount: discountAmount, couponCode: couponCode || null },
    total: roundMoney2(finalAmountInr),
    currency: 'INR',
  };
}

/**
 * Create payment order
 */
const createPaymentOrder = catchAsync(async (req, res) => {
  const { planId, couponCode, platform, settlementPricing = 'inr_catalog' } = req.body;
  const userId = req.user.id;
  const fx = config.fx.usdToInr;

  // Safety Check: Block Razorpay for iOS
  if (platform === 'ios') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Razorpay not allowed for iOS. Use Apple verify-receipt API.');
  }

  if (settlementPricing === 'usd_catalog_fx' && platform !== 'android') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'USD-list → INR settlement is only supported for Android checkout.'
    );
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get membership plan
  const membershipPlan = await MembershipPlan.findById(planId);
  if (!membershipPlan || !membershipPlan.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found or inactive');
  }

  if (membershipPlan.isPublic === false || ['Trial Plan', 'Lifetime Plan'].includes(membershipPlan.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This plan cannot be purchased directly');
  }

  // Check if plan is currently available for purchase
  if (!membershipPlan.isAvailable()) {
    if (membershipPlan.isExpired) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This plan is no longer available for purchase');
    } else if (membershipPlan.isNotYetAvailable) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This plan is not yet available for purchase');
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This plan is currently not available for purchase');
    }
  }

  let discountAmount = 0;
  let couponCodeDoc = null;
  const settlementCurrency = 'INR';

  if (couponCode && settlementPricing === 'usd_catalog_fx') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Coupons apply to India catalogue (INR) pricing only. Remove the coupon to pay the USD-listed amount converted to INR.'
    );
  }

  /** Pre-discount list total settled in INR (India catalogue or USD catalogue × FX). */
  let listTotalInr;
  if (settlementPricing === 'usd_catalog_fx') {
    assertPlanHasUsdCatalogPrice(membershipPlan);
    const usdListTotal = membershipPlan.calculateTotalPrice('USD');
    listTotalInr = roundMoney2(usdListTotal * fx);
  } else {
    listTotalInr = membershipPlan.calculateTotalPrice('INR');
  }

  let finalAmount = listTotalInr;

  // Apply coupon code if provided
  if (couponCode) {
    couponCodeDoc = await CouponCode.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!couponCodeDoc) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid coupon code');
    }

    if (!couponCodeDoc.isValid) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code is expired or inactive');
    }

    if (!couponCodeDoc.canApplyToPlan(planId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to this plan');
    }

    if (!couponCodeDoc.canApplyByUserCategory(user.userCategory)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code cannot be applied to your user category');
    }

    if (finalAmount < couponCodeDoc.minOrderAmount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Minimum order amount of ${couponCodeDoc.minOrderAmount} required for this coupon`
      );
    }

    const couponDiscountAmount = couponCodeDoc.calculateDiscount(finalAmount);
    discountAmount = membershipPlan.calculateDiscountAmount(couponDiscountAmount, finalAmount, 'INR');
    finalAmount = finalAmount - discountAmount;
  }

  // Handle zero amount orders (100% discount) - Create membership directly
  if (finalAmount === 0) {
    // Create transaction record for zero amount
    const transaction = await Transaction.create({
      userId: userId,
      planId: planId,
      planName: membershipPlan.name,
      transactionId: razorpayService.generateReceiptId('TXN'),
      orderId: razorpayService.generateReceiptId('FREE'),
      amount: finalAmount,
      originalAmount: listTotalInr,
      discountAmount: discountAmount,
      currency: settlementCurrency,
      razorpayOrderId: null,
      couponCode: couponCodeDoc?._id || null,
      couponCodeString: couponCode || null,
      status: 'completed',
      metadata: {
        userEmail: user.email,
        userName: user.name,
        planType: membershipPlan.planType,
        isFreeOrder: true,
        paymentMethod: 'free_coupon'
      }
    });

    // Calculate membership dates
    const startDate = new Date();
    const endDate = membershipPlan.getMembershipEndDate(startDate);
    const actualValidityDays = membershipPlan.getActualValidityDays(startDate);

    // Create membership directly
    const membership = await Membership.create({
      userId: userId,
      planId: membershipPlan._id,
      planName: membershipPlan.name,
      validityDays: actualValidityDays,
      startDate: startDate,
      endDate: endDate,
      amountPaid: transaction.amount,
      originalAmount: transaction.originalAmount,
      discountAmount: transaction.discountAmount,
      currency: transaction.currency,
      couponCode: transaction.couponCode,
      couponCodeString: transaction.couponCodeString,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
      status: 'active',
      platform: platform || 'web',
      paymentProvider: 'free',
      metadata: {
        transactionId: transaction._id,
        paymentMethod: 'free_coupon',
        isFreeOrder: true,
        paymentDetails: {
          status: 'free',
          method: 'coupon_discount'
        }
      }
    });

    // Update transaction with membership ID
    transaction.membershipId = membership._id;
    await transaction.save();

    // Increment coupon usage if applicable
    if (transaction.couponCode) {
      const couponCode = await CouponCode.findById(transaction.couponCode);
      if (couponCode) {
        await couponCode.incrementUsage();
      }
    }

    // Calculate detailed pricing breakdown
    const pricingBreakdown = membershipPlan.calculatePricingBreakdown(
      discountAmount,
      couponCode,
      'INR'
    );

    res.status(httpStatus.CREATED).send({
      success: true,
      message: 'Free membership created successfully with 100% discount',
      membership: membership,
      transaction: transaction,
      plan: membershipPlan,
      pricing: pricingBreakdown,
      discount: {
        couponCode: couponCode || null,
        discountAmount: discountAmount,
        originalAmount: listTotalInr,
        finalAmount: finalAmount
      },
      isFreeOrder: true
    });
    return;
  }

  // Create Razorpay order for paid orders
  const orderData = {
    amount: razorpayService.convertToPaise(finalAmount),
    currency: settlementCurrency,
    receipt: razorpayService.generateReceiptId(),
    notes: {
      userId: userId,
      planId: planId,
      planName: membershipPlan.name,
      originalAmount: listTotalInr,
      discountAmount: discountAmount,
      couponCode: couponCode || null,
      settlementPricing,
      ...(settlementPricing === 'usd_catalog_fx'
        ? {
            fxUsdToInr: fx,
            usdListTotalPreFx: membershipPlan.calculateTotalPrice('USD'),
          }
        : {}),
    },
  };

  const razorpayOrder = await razorpayService.createOrder(orderData);

  // Create transaction record
  const transaction = await Transaction.create({
    userId: userId,
    planId: planId,
    planName: membershipPlan.name,
    transactionId: razorpayService.generateReceiptId('TXN'),
    orderId: orderData.receipt,
    amount: finalAmount,
    originalAmount: listTotalInr,
    discountAmount: discountAmount,
    currency: settlementCurrency,
    razorpayOrderId: razorpayOrder.id,
    couponCode: couponCodeDoc?._id || null,
    couponCodeString: couponCode || null,
    status: 'pending',
    platform: platform || 'web',
    paymentMethod: 'razorpay',
    metadata: {
      userEmail: user.email,
      userName: user.name,
      planType: membershipPlan.planType,
      settlementPricing,
      ...(settlementPricing === 'usd_catalog_fx'
        ? {
            fxUsdToInr: fx,
            usdListTotalPreFx: membershipPlan.calculateTotalPrice('USD'),
          }
        : {}),
    },
  });

  const pricingBreakdown =
    settlementPricing === 'usd_catalog_fx'
      ? pricingBreakdownUsdCatalogToInr(membershipPlan, fx, discountAmount, couponCode, finalAmount)
      : membershipPlan.calculatePricingBreakdown(discountAmount, couponCode, 'INR');

  res.status(httpStatus.CREATED).send({
    order: razorpayOrder,
    transaction: transaction,
    plan: membershipPlan,
    pricing: pricingBreakdown,
    discount: {
      couponCode: couponCode || null,
      discountAmount: discountAmount,
      originalAmount: listTotalInr,
      finalAmount: finalAmount
    }
  });
});

/**
 * Verify payment and create membership
 */
const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, platform } = req.body;
  const userId = req.user.id;

  // Safety Check: Block Razorpay for iOS
  if (platform === 'ios') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Razorpay not allowed for iOS. Use Apple verify-receipt API.');
  }

  // Get transaction
  const transaction = await Transaction.getByRazorpayOrderId(razorpay_order_id);
  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  if (transaction.userId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized access to transaction');
  }

  if (transaction.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction already processed');
  }

  // Verify payment signature
  const isValidSignature = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValidSignature) {
    await transaction.markFailed({
      code: 'INVALID_SIGNATURE',
      description: 'Payment signature verification failed',
      source: 'razorpay',
      step: 'verification'
    });

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment signature');
  }

  // Get payment details from Razorpay
  const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);

  if (paymentDetails.status !== 'captured') {
    await transaction.markFailed({
      code: 'PAYMENT_NOT_CAPTURED',
      description: 'Payment was not captured',
      source: 'razorpay',
      step: 'capture'
    });

    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment was not captured');
  }

  // Mark transaction as completed
  await transaction.markCompleted(razorpay_payment_id, razorpay_signature);

  // Get membership plan
  const membershipPlan = await MembershipPlan.findById(transaction.planId);
  if (!membershipPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  // Calculate membership dates
  const startDate = new Date();
  const endDate = membershipPlan.getMembershipEndDate(startDate);
  const actualValidityDays = membershipPlan.getActualValidityDays(startDate);

  // Create membership
  const membership = await Membership.create({
    userId: userId,
    planId: membershipPlan._id,
    planName: membershipPlan.name,
    validityDays: actualValidityDays,
    startDate: startDate,
    endDate: endDate,
    amountPaid: transaction.amount,
    originalAmount: transaction.originalAmount,
    discountAmount: transaction.discountAmount,
    currency: transaction.currency,
    couponCode: transaction.couponCode,
    couponCodeString: transaction.couponCodeString,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: 'active',
    platform: platform || transaction.platform || 'web',
    paymentProvider: 'razorpay',
    metadata: {
      transactionId: transaction._id,
      paymentMethod: paymentDetails.method,
      paymentDetails: paymentDetails
    }
  });

  // Update transaction with membership ID
  transaction.membershipId = membership._id;
  await transaction.save();

  // Increment coupon usage if applicable
  if (transaction.couponCode) {
    const couponCode = await CouponCode.findById(transaction.couponCode);
    if (couponCode) {
      await couponCode.incrementUsage();
    }
  }

  res.send({
    success: true,
    message: 'Payment verified and membership created successfully',
    membership: membership,
    transaction: transaction
  });
});

/**
 * Get user transactions
 */
const getUserTransactions = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filter = { userId };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Set default sort if not provided
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }

  // Set populate options for related data
  options.populate = 'planId,couponCode';

  const result = await Transaction.paginate(filter, options);
  res.send(result);
});

/**
 * Get all transactions (Admin only)
 * Supports filtering by userId, status, and date range
 */
const getAllTransactions = catchAsync(async (req, res) => {
  const filter = {};
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Filter by userId if provided
  if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by date range if provided
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Set default sort if not provided
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }

  // Set populate options for related data
  options.populate = 'planId,couponCode,userId';

  const result = await Transaction.paginate(filter, options);
  res.send(result);
});

/**
 * Get transaction details
 */
const getTransaction = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  const transaction = await Transaction.findById(transactionId)
    .populate('planId')
    .populate('couponCode');

  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  if (transaction.userId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized access to transaction');
  }

  res.send(transaction);
});

/**
 * Get user memberships
 */
const getUserMemberships = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await Membership.getUserMemberships(userId, options.limit || 10);
  res.send(result);
});

/**
 * Get active membership
 */
const getActiveMembership = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const membership = await Membership.getActiveMembership(userId);

  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active membership found');
  }

  res.send(membership);
});

/**
 * Cancel membership
 */
const cancelMembership = catchAsync(async (req, res) => {
  const { membershipId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership not found');
  }

  if (membership.userId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized access to membership');
  }

  if (membership.status === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Membership is already cancelled');
  }

  if (membership.status === 'expired') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel expired membership');
  }

  await membership.cancel(reason);

  res.send({
    message: 'Membership cancelled successfully',
    membership: membership
  });
});

/**
 * Request refund
 */
const requestRefund = catchAsync(async (req, res) => {
  const { membershipId } = req.params;
  const userId = req.user.id;

  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership not found');
  }

  if (membership.userId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized access to membership');
  }

  if (membership.status !== 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Membership must be cancelled before requesting refund');
  }

  if (membership.refundStatus !== 'none') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refund already requested or processed');
  }

  // Calculate refund amount
  const refundAmount = membership.calculateRefund();

  if (refundAmount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No refund amount available');
  }

  // Update membership refund status
  membership.refundAmount = refundAmount;
  membership.refundStatus = 'requested';
  await membership.save();

  // Update transaction refund status
  const transaction = await Transaction.findOne({ membershipId: membership._id });
  if (transaction) {
    transaction.refundStatus = 'requested';
    await transaction.save();
  }

  res.send({
    message: 'Refund requested successfully',
    refundAmount: refundAmount,
    membership: membership
  });
});

/**
 * Process refund (Admin only)
 */
const processRefund = catchAsync(async (req, res) => {
  const { membershipId } = req.params;
  const { refundId } = req.body;

  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership not found');
  }

  if (membership.refundStatus !== 'requested') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refund not requested for this membership');
  }

  // Process refund with Razorpay
  const refundData = {
    paymentId: membership.razorpayPaymentId,
    amount: razorpayService.convertToPaise(membership.refundAmount),
    notes: {
      membershipId: membership._id,
      userId: membership.userId,
      reason: membership.cancellationReason || 'User requested refund'
    }
  };

  const razorpayRefund = await razorpayService.createRefund(refundData);

  // Update membership
  await membership.processRefund(razorpayRefund.id, membership.refundAmount);

  // Update transaction
  const transaction = await Transaction.findOne({ membershipId: membership._id });
  if (transaction) {
    await transaction.processRefund(razorpayRefund.id, membership.refundAmount);
  }

  res.send({
    message: 'Refund processed successfully',
    refund: razorpayRefund,
    membership: membership
  });
});

export {
  createPaymentOrder,
  verifyPayment,
  getUserTransactions,
  getAllTransactions,
  getTransaction,
  getUserMemberships,
  getActiveMembership,
  cancelMembership,
  requestRefund,
  processRefund,
};
