import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      default: null,
    },
    // Transaction details
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Razorpay details
    razorpayOrderId: {
      type: String,
      required: false, // Not required for free orders
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    // Transaction status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    // Payment method
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'card', 'netbanking', 'wallet', 'upi', 'apple', 'google', 'free_coupon'],
      default: 'razorpay',
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'admin', 'other'],
      default: 'web',
    },
    // Coupon details
    couponCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponCode',
      default: null,
    },
    couponCodeString: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    // Plan details
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    // Transaction metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Error details for failed transactions
    errorDetails: {
      code: String,
      description: String,
      source: String,
      step: String,
    },
    // Refund details
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundId: {
      type: String,
      sparse: true,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processed', 'failed'],
      default: 'none',
    },
    refundDate: {
      type: Date,
      default: null,
    },
    // Timestamps
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
transactionSchema.index({ userId: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ razorpayPaymentId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ platform: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual to check if transaction is successful
transactionSchema.virtual('isSuccessful').get(function () {
  return this.status === 'completed';
});

// Virtual to check if transaction is pending
transactionSchema.virtual('isPending').get(function () {
  return this.status === 'pending';
});

// Virtual to check if transaction failed
transactionSchema.virtual('isFailed').get(function () {
  return this.status === 'failed';
});

// Method to mark transaction as completed
transactionSchema.methods.markCompleted = function (paymentId, signature) {
  this.status = 'completed';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.paidAt = new Date();
  return this.save();
};

// Method to mark transaction as failed
transactionSchema.methods.markFailed = function (errorDetails) {
  this.status = 'failed';
  this.errorDetails = errorDetails;
  this.failedAt = new Date();
  return this.save();
};

// Method to mark transaction as cancelled
transactionSchema.methods.markCancelled = function () {
  this.status = 'cancelled';
  return this.save();
};

// Method to process refund
transactionSchema.methods.processRefund = function (refundId, refundAmount) {
  this.refundId = refundId;
  this.refundAmount = refundAmount;
  this.refundStatus = 'processed';
  this.refundDate = new Date();
  this.status = 'refunded';
  return this.save();
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function (userId, limit = 20) {
  return this.find({ userId })
    .populate('planId')
    .populate('couponCode')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get transaction by Razorpay order ID
transactionSchema.statics.getByRazorpayOrderId = function (orderId) {
  return this.findOne({ razorpayOrderId: orderId });
};

// Static method to get transaction by Razorpay payment ID
transactionSchema.statics.getByRazorpayPaymentId = function (paymentId) {
  return this.findOne({ razorpayPaymentId: paymentId });
};

// Static method to get successful transactions for a user
transactionSchema.statics.getSuccessfulTransactions = function (userId) {
  return this.find({
    userId,
    status: 'completed'
  }).populate('planId').sort({ createdAt: -1 });
};

// Static method to get failed transactions
transactionSchema.statics.getFailedTransactions = function (userId) {
  return this.find({
    userId,
    status: 'failed'
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to generate transaction ID if not provided
transactionSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Apply plugins
transactionSchema.plugin(toJSON);
transactionSchema.plugin(paginate);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
