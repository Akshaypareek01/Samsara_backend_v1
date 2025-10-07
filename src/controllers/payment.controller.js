import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { MembershipPlan, CouponCode, Membership, Transaction, User } from '../models/index.js';
import razorpayService from '../services/razorpay.service.js';

/**
 * Create payment order
 */
const createPaymentOrder = catchAsync(async (req, res) => {
  const { planId, couponCode } = req.body;
  const userId = req.user.id;

  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get membership plan
  const membershipPlan = await MembershipPlan.findById(planId);
  if (!membershipPlan || !membershipPlan.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found or inactive');
  }

  // Prevent users from purchasing internal plans (Trial Plan and Lifetime Plan)
  if (membershipPlan.name === 'Trial Plan' || membershipPlan.name === 'Lifetime Plan') {
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
  let finalAmount = membershipPlan.calculateTotalPrice();

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
    discountAmount = membershipPlan.calculateDiscountAmount(couponDiscountAmount, finalAmount);
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
      originalAmount: membershipPlan.calculateTotalPrice(),
      discountAmount: discountAmount,
      currency: membershipPlan.currency,
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
    const pricingBreakdown = membershipPlan.calculatePricingBreakdown(discountAmount, couponCode);

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
        originalAmount: membershipPlan.calculateTotalPrice(),
        finalAmount: finalAmount
      },
      isFreeOrder: true
    });
    return;
  }

  // Create Razorpay order for paid orders
  const orderData = {
    amount: razorpayService.convertToPaise(finalAmount),
    currency: membershipPlan.currency,
    receipt: razorpayService.generateReceiptId(),
    notes: {
      userId: userId,
      planId: planId,
      planName: membershipPlan.name,
      originalAmount: membershipPlan.calculateTotalPrice(),
      discountAmount: discountAmount,
      couponCode: couponCode || null,
    }
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
    originalAmount: membershipPlan.calculateTotalPrice(),
    discountAmount: discountAmount,
    currency: membershipPlan.currency,
    razorpayOrderId: razorpayOrder.id,
    couponCode: couponCodeDoc?._id || null,
    couponCodeString: couponCode || null,
    status: 'pending',
    metadata: {
      userEmail: user.email,
      userName: user.name,
      planType: membershipPlan.planType,
    }
  });

  // Calculate detailed pricing breakdown
  const pricingBreakdown = membershipPlan.calculatePricingBreakdown(discountAmount, couponCode);

  res.status(httpStatus.CREATED).send({
    order: razorpayOrder,
    transaction: transaction,
    plan: membershipPlan,
    pricing: pricingBreakdown,
    discount: {
      couponCode: couponCode || null,
      discountAmount: discountAmount,
      originalAmount: membershipPlan.calculateTotalPrice(),
      finalAmount: finalAmount
    }
  });
});

/**
 * Verify payment and create membership
 */
const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

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
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const result = await Transaction.getUserTransactions(userId, options.limit || 20);
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
  getTransaction,
  getUserMemberships,
  getActiveMembership,
  cancelMembership,
  requestRefund,
  processRefund,
};
