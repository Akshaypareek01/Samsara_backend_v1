import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const couponCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Coupon name is required'],
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    // For percentage discounts, max discount amount
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    // Minimum order amount to apply coupon
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Maximum discount amount for percentage coupons
    maxDiscountPercentage: {
      type: Number,
      default: 100,
      max: [100, 'Max discount percentage cannot exceed 100%'],
    },
    // Validity period
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    // Per user usage limit
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    // Applicable plan types
    applicablePlans: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    }],
    // Applicable user categories
    applicableUserCategories: [{
      type: String,
      enum: ['Personal', 'Corporate'],
    }],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
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
couponCodeSchema.index({ code: 1 });
couponCodeSchema.index({ isActive: 1 });
couponCodeSchema.index({ startDate: 1, endDate: 1 });
couponCodeSchema.index({ applicablePlans: 1 });

// Virtual to check if coupon is valid
couponCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate && 
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Virtual to check if coupon is expired
couponCodeSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Method to calculate discount amount
couponCodeSchema.methods.calculateDiscount = function(orderAmount) {
  if (!this.isValid || orderAmount < this.minOrderAmount) {
    return 0;
  }

  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    
    // Apply max discount amount if specified
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discountAmount = this.discountValue;
  }

  // Ensure discount doesn't exceed order amount
  return Math.min(discountAmount, orderAmount);
};

// Method to check if coupon can be applied to a plan
couponCodeSchema.methods.canApplyToPlan = function(planId) {
  if (!this.isValid) return false;
  
  // If no specific plans are specified, coupon applies to all plans
  if (!this.applicablePlans || this.applicablePlans.length === 0) {
    return true;
  }
  
  return this.applicablePlans.some(plan => plan.toString() === planId.toString());
};

// Method to check if coupon can be applied by user category
couponCodeSchema.methods.canApplyByUserCategory = function(userCategory) {
  if (!this.isValid) return false;
  
  // If no specific user categories are specified, coupon applies to all
  if (!this.applicableUserCategories || this.applicableUserCategories.length === 0) {
    return true;
  }
  
  return this.applicableUserCategories.includes(userCategory);
};

// Method to increment usage count
couponCodeSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  return this.save();
};

// Pre-save validation
couponCodeSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  next();
});

// Apply plugins
couponCodeSchema.plugin(toJSON);
couponCodeSchema.plugin(paginate);

const CouponCode = mongoose.model('CouponCode', couponCodeSchema);

export default CouponCode;
