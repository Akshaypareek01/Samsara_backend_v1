import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MembershipPlan',
    },
    planName: {
      type: String,
      required: true,
    },
    validityDays: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'cancelled', 'pending'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Payment details
    amountPaid: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Coupon used
    couponCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CouponCode',
      default: null,
    },
    couponCodeString: {
      type: String,
      default: null,
    },
    // Razorpay details
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    // Platform and provider details
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'admin', 'other'],
      default: 'web',
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay', 'apple', 'google', 'free', 'manual'],
      default: 'razorpay',
    },
    transactionId: {
      type: String,
      sparse: true,
    },
    appleReceiptData: {
      type: String,
      sparse: true,
    },
    // Auto-renewal settings
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    // Cancellation details
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    // Refund details
    refundAmount: {
      type: Number,
      default: 0,
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
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
membershipSchema.index({ userId: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ startDate: 1, endDate: 1 });
membershipSchema.index({ razorpayPaymentId: 1 });
membershipSchema.index({ transactionId: 1 });
membershipSchema.index({ platform: 1 });

// Virtual to check if membership is active
membershipSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Virtual to check if membership is expired
membershipSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

// Virtual to get days remaining
membershipSchema.virtual('daysRemaining').get(function () {
  if (this.isExpired) return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update status based on dates
membershipSchema.methods.updateStatus = function () {
  const now = new Date();

  if (this.status === 'cancelled') {
    return; // Don't change cancelled memberships
  }

  if (now > this.endDate) {
    this.status = 'expired';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  }

  return this.save();
};

// Method to cancel membership
membershipSchema.methods.cancel = function (reason = null) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to calculate refund amount
membershipSchema.methods.calculateRefund = function () {
  if (this.status !== 'cancelled') return 0;

  const now = new Date();
  const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  const usedDays = Math.ceil((now - this.startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - usedDays);

  return Math.round((this.amountPaid * remainingDays) / totalDays);
};

// Static method to get active memberships for a user
membershipSchema.statics.getActiveMembership = function (userId) {
  return this.findOne({
    userId,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).populate('planId');
};

// Static method to get user's membership history
membershipSchema.statics.getUserMemberships = function (userId, limit = 10) {
  return this.find({ userId })
    .populate('planId')
    .populate('couponCode')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware
membershipSchema.pre('save', function (next) {
  // Auto-calculate end date if not provided
  if (!this.endDate && this.startDate && this.validityDays) {
    this.endDate = new Date(this.startDate.getTime() + this.validityDays * 24 * 60 * 60 * 1000);
  }

  // Update status based on dates (without saving)
  const now = new Date();

  if (this.status !== 'cancelled') {
    if (now > this.endDate) {
      this.status = 'expired';
    } else if (now >= this.startDate && now <= this.endDate) {
      this.status = 'active';
    }
  }

  next();
});

// Apply plugins
membershipSchema.plugin(toJSON);
membershipSchema.plugin(paginate);

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
