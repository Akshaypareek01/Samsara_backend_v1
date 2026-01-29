import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
    },
    // Base pricing
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR'],
    },
    // Tax configuration
    taxConfig: {
      gst: {
        rate: {
          type: Number,
          default: 18, // 18% GST by default
          min: [0, 'GST rate cannot be negative'],
          max: [100, 'GST rate cannot exceed 100%']
        },
        type: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'percentage'
        },
        amount: {
          type: Number,
          default: 0
        }
      },
      otherTaxes: [{
        name: {
          type: String,
          required: true
        },
        rate: {
          type: Number,
          default: 0,
          min: [0, 'Tax rate cannot be negative']
        },
        type: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'percentage'
        },
        amount: {
          type: Number,
          default: 0
        }
      }]
    },
    // Discount configuration
    discountConfig: {
      maxDiscountPercentage: {
        type: Number,
        default: 100,
        min: [0, 'Max discount percentage cannot be negative'],
        max: [100, 'Max discount percentage cannot exceed 100%']
      },
      maxDiscountAmount: {
        type: Number,
        default: null // null means no limit
      }
    },
    validityDays: {
      type: Number,
      required: [true, 'Validity days is required'],
      min: [0, 'Validity must be at least 0 day'], // Allow 0 for special plans with fixed end dates
    },
    features: [{
      type: String,
      required: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Plan availability period - when this plan can be purchased
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
      default: null, // null means available indefinitely
    },
    planType: {
      type: String,
      enum: ['basic', 'premium', 'enterprise', 'trial', 'limited-time'],
      default: 'basic',
    },
    maxUsers: {
      type: Number,
      default: 1,
      min: [1, 'Max users must be at least 1'],
    },
    // Razorpay plan ID for recurring payments
    razorpayPlanId: {
      type: String,
      sparse: true,
    },
    // Apple Product ID for in-app purchases
    appleProductId: {
      type: String,
      sparse: true,
    },
    // Plan metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
membershipPlanSchema.index({ name: 1 });
membershipPlanSchema.index({ isActive: 1 });
membershipPlanSchema.index({ planType: 1 });
membershipPlanSchema.index({ availableFrom: 1, availableUntil: 1 });

// Virtual for formatted base price
membershipPlanSchema.virtual('formattedBasePrice').get(function () {
  return `${this.currency} ${this.basePrice}`;
});

// Virtual for total price including taxes
membershipPlanSchema.virtual('totalPrice').get(function () {
  return this.calculateTotalPrice();
});

// Virtual for formatted total price
membershipPlanSchema.virtual('formattedTotalPrice').get(function () {
  return `${this.currency} ${this.calculateTotalPrice()}`;
});

// Method to check if plan is available for purchase
membershipPlanSchema.methods.isAvailable = function () {
  const now = new Date();
  return this.isActive &&
    now >= this.availableFrom &&
    (this.availableUntil === null || now <= this.availableUntil);
};

// Virtual to check if plan is currently purchasable
membershipPlanSchema.virtual('isPurchasable').get(function () {
  return this.isAvailable();
});

// Virtual to check if plan has expired (no longer available for purchase)
membershipPlanSchema.virtual('isExpired').get(function () {
  const now = new Date();
  return this.availableUntil !== null && now > this.availableUntil;
});

// Virtual to check if plan is not yet available
membershipPlanSchema.virtual('isNotYetAvailable').get(function () {
  const now = new Date();
  return now < this.availableFrom;
});

// Method to get the effective end date for a membership created from this plan
membershipPlanSchema.methods.getMembershipEndDate = function (purchaseDate = new Date()) {
  // Check if this plan has a special fixed end date
  if (this.metadata && this.metadata.specialValidityEndDate) {
    return new Date(this.metadata.specialValidityEndDate);
  } else {
    // Calculate end date based on validity days from purchase date
    return new Date(purchaseDate.getTime() + this.validityDays * 24 * 60 * 60 * 1000);
  }
};

// Method to get the actual validity days for a membership created from this plan
membershipPlanSchema.methods.getActualValidityDays = function (purchaseDate = new Date()) {
  const endDate = this.getMembershipEndDate(purchaseDate);
  return Math.ceil((endDate - purchaseDate) / (1000 * 60 * 60 * 24));
};

// Method to calculate total price including all taxes
membershipPlanSchema.methods.calculateTotalPrice = function () {
  let totalPrice = this.basePrice;

  // Add GST
  if (this.taxConfig.gst.rate > 0) {
    if (this.taxConfig.gst.type === 'percentage') {
      totalPrice += (this.basePrice * this.taxConfig.gst.rate) / 100;
    } else {
      totalPrice += this.taxConfig.gst.amount;
    }
  }

  // Add other taxes
  if (this.taxConfig.otherTaxes && this.taxConfig.otherTaxes.length > 0) {
    this.taxConfig.otherTaxes.forEach(tax => {
      if (tax.rate > 0) {
        if (tax.type === 'percentage') {
          totalPrice += (this.basePrice * tax.rate) / 100;
        } else {
          totalPrice += tax.amount;
        }
      }
    });
  }

  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
};

// Method to calculate detailed pricing breakdown
membershipPlanSchema.methods.calculatePricingBreakdown = function (discountAmount = 0, couponCode = null) {
  const basePrice = this.basePrice;

  // Calculate taxes
  let gstAmount = 0;
  if (this.taxConfig.gst.rate > 0) {
    if (this.taxConfig.gst.type === 'percentage') {
      gstAmount = (basePrice * this.taxConfig.gst.rate) / 100;
    } else {
      gstAmount = this.taxConfig.gst.amount;
    }
  }

  let otherTaxesAmount = 0;
  const otherTaxes = [];
  if (this.taxConfig.otherTaxes && this.taxConfig.otherTaxes.length > 0) {
    this.taxConfig.otherTaxes.forEach(tax => {
      if (tax.rate > 0) {
        let taxAmount = 0;
        if (tax.type === 'percentage') {
          taxAmount = (basePrice * tax.rate) / 100;
        } else {
          taxAmount = tax.amount;
        }
        otherTaxesAmount += taxAmount;
        otherTaxes.push({
          name: tax.name,
          rate: tax.rate,
          type: tax.type,
          amount: Math.round(taxAmount * 100) / 100
        });
      }
    });
  }

  const subtotal = basePrice + gstAmount + otherTaxesAmount;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    taxes: {
      gst: {
        rate: this.taxConfig.gst.rate,
        type: this.taxConfig.gst.type,
        amount: Math.round(gstAmount * 100) / 100
      },
      other: otherTaxes
    },
    subtotal: Math.round(subtotal * 100) / 100,
    discount: {
      amount: Math.round(discountAmount * 100) / 100,
      couponCode: couponCode
    },
    total: Math.round(finalAmount * 100) / 100,
    currency: this.currency
  };
};

// Method to calculate discount amount with plan-specific limits
membershipPlanSchema.methods.calculateDiscountAmount = function (couponDiscountAmount, totalOrderAmount = null) {
  let finalDiscountAmount = couponDiscountAmount;

  // Apply plan-specific discount limits
  if (this.discountConfig.maxDiscountAmount !== null) {
    finalDiscountAmount = Math.min(finalDiscountAmount, this.discountConfig.maxDiscountAmount);
  }

  // Apply percentage limit based on total order amount (including taxes) instead of base price
  const orderAmount = totalOrderAmount || this.calculateTotalPrice();
  const maxPercentageDiscount = (orderAmount * this.discountConfig.maxDiscountPercentage) / 100;
  finalDiscountAmount = Math.min(finalDiscountAmount, maxPercentageDiscount);

  return Math.round(finalDiscountAmount * 100) / 100;
};

// Apply plugins
membershipPlanSchema.plugin(toJSON);
membershipPlanSchema.plugin(paginate);

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;
