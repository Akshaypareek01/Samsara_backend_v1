import mongoose from 'mongoose';
import config from '../config/config.js';
import { MembershipPlan, CouponCode } from '../models/index.js';

/**
 * Seed membership plans and coupon codes for testing
 */
async function seedMembershipData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    await MembershipPlan.deleteMany({});
    await CouponCode.deleteMany({});
    console.log('Cleared existing data');

    // Get current date for dynamic date calculations
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    /**
     * Basic Access Plan – shared features (from product spec)
     * Categories: Daily Access, Classes & Events, Ayurveda & Assessment,
     * Health Tracking Tools, Condition-Based AI Diet Plans
     */
    const basicAccessPlanFeatures = [
      'One Yoga Class per day',
      'One Meditation Class per day',
      'Weekend Online Wellness Events',
      'Pre-Recorded Guided Meditation',
      'Meditation Music Library',
      'Personal Dosha Analysis',
      'PCOS/PCOD Assessment',
      'Thyroid Assessment',
      'Menopause Assessment',
      'Health Tracker',
      'Body Tracker',
      'Period Tracker',
      'Mood Tracker',
      'PCOS/PCOD Diet & Nutrition Plan',
      'Thyroid Diet & Nutrition Plan',
      'Menopause Diet & Nutrition Plan',
    ];

    /**
     * Premium Access Plan – shared features (from product spec)
     * Same categories as Basic + unlimited daily access + 12 Personal Training/year
     */
    const premiumAccessPlanFeatures = [
      'Unlimited Yoga Classes',
      'Unlimited Meditation Classes',
      '12 Personal Training (per year)',
      'Weekend Online Wellness Events',
      'Pre-Recorded Guided Meditation',
      'Meditation Music Library',
      'Personal Dosha Analysis',
      'PCOS/PCOD Assessment',
      'Thyroid Assessment',
      'Menopause Assessment',
      'Health Tracker',
      'Body Tracker',
      'Period Tracker',
      'Mood Tracker',
      'PCOS/PCOD Diet & Nutrition Plan',
      'Thyroid Diet & Nutrition Plan',
      'Menopause Diet & Nutrition Plan',
    ];

    const taxConfigBasic = {
      gst: { rate: 0, type: 'percentage' },
      otherTaxes: [],
    };

    // Create sample membership plans
    const membershipPlans = [
      // --- Basic Access Plan (4 billing tiers) ---
      {
        name: 'Basic Access – Monthly Plan',
        description: 'Basic Access Plan billed monthly (INR ₹2999 / USD $65). Cancel anytime.',
        basePrice: 2999,
        usdBasePrice: 65,
        currency: 'INR',
        validityDays: 30,
        features: basicAccessPlanFeatures,
        planType: 'basic',
        maxUsers: 1,
        isActive: true,
        isPublic: true,
        appleProductId: 'basic_monthly_plan',
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'monthly',
          cancelAnytime: true,
          accessTier: 'Basic Access',
          revenuecatProductId: 'basic_monthly_plan',
        },
      },
      {
        name: 'Basic Access – Quarterly Plan',
        description: 'Basic Access Plan billed every 3 months (INR ₹7197.6 / USD $156).',
        basePrice: 7197.6,
        usdBasePrice: 156,
        currency: 'INR',
        validityDays: 90,
        features: basicAccessPlanFeatures,
        planType: 'basic',
        maxUsers: 1,
        isActive: true,
        isPublic: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'quarterly',
          accessTier: 'Basic Access',
          effectiveMonthlyInr: 2399.2,
          effectiveMonthlyUsd: 52,
        },
      },
      {
        name: 'Basic Access – Half-Yearly Plan',
        description: 'Basic Access Plan billed every 6 months (INR ₹12595.8 / USD $273).',
        basePrice: 12595.8,
        usdBasePrice: 273,
        currency: 'INR',
        validityDays: 180,
        features: basicAccessPlanFeatures,
        planType: 'basic',
        maxUsers: 1,
        isActive: true,
        isPublic: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'half-yearly',
          accessTier: 'Basic Access',
          effectiveMonthlyInr: 2099.3,
          effectiveMonthlyUsd: 45.5,
        },
      },
      {
        name: 'Basic Access – Yearly Plan',
        description: 'Basic Access Plan billed annually (INR ₹19793.4 / USD $429). Best value.',
        basePrice: 19793.4,
        usdBasePrice: 429,
        currency: 'INR',
        validityDays: 365,
        features: basicAccessPlanFeatures,
        planType: 'basic',
        maxUsers: 1,
        isActive: true,
        isPublic: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'yearly',
          bestValue: true,
          accessTier: 'Basic Access',
          effectiveMonthlyInr: 1649.45,
          effectiveMonthlyUsd: 35.75,
        },
      },
      // --- Premium Access Plan (4 billing tiers) ---
      {
        name: 'Premium Access – Monthly Plan',
        description: 'Premium Access Plan billed monthly. Premium features included.',
        basePrice: 4999,
        currency: 'INR',
        validityDays: 30,
        features: premiumAccessPlanFeatures,
        planType: 'premium',
        maxUsers: 1,
        isActive: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'monthly',
          accessTier: 'Premium Access',
        },
      },
      {
        name: 'Premium Access – Quarterly Plan',
        description: 'Premium Access Plan – Save 10%. Effective ₹4,499/month.',
        basePrice: 13497,
        currency: 'INR',
        validityDays: 90,
        features: premiumAccessPlanFeatures,
        planType: 'premium',
        maxUsers: 1,
        isActive: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'quarterly',
          discountPercentage: 10,
          originalPrice: 14997,
          effectiveMonthlyPrice: 4499,
          savingsOverPeriod: 1500,
          savingsPeriodLabel: '3 months',
          accessTier: 'Premium Access',
        },
      },
      {
        name: 'Premium Access – Half-Yearly Plan',
        description: 'Premium Access Plan – Save 20%. Effective ₹3,999/month.',
        basePrice: 23994,
        currency: 'INR',
        validityDays: 180,
        features: premiumAccessPlanFeatures,
        planType: 'premium',
        maxUsers: 1,
        isActive: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'half-yearly',
          discountPercentage: 20,
          originalPrice: 29994,
          effectiveMonthlyPrice: 3999,
          savingsOverPeriod: 6000,
          savingsPeriodLabel: '6 months',
          accessTier: 'Premium Access',
        },
      },
      {
        name: 'Premium Access – Yearly Plan',
        description: 'Premium Access Plan – Save 35%. Best Value. Effective ₹3,249/month.',
        basePrice: 38988,
        currency: 'INR',
        validityDays: 365,
        features: premiumAccessPlanFeatures,
        planType: 'premium',
        maxUsers: 1,
        isActive: true,
        taxConfig: taxConfigBasic,
        discountConfig: { maxDiscountPercentage: 100, maxDiscountAmount: null },
        metadata: {
          billingCycle: 'yearly',
          discountPercentage: 35,
          originalPrice: 59988,
          effectiveMonthlyPrice: 3249,
          savingsOverPeriod: 21000,
          savingsPeriodLabel: 'per year',
          bestValue: true,
          accessTier: 'Premium Access',
        },
      },
      // --- Internal teacher plan (not listed publicly) ---
      {
        name: 'Lifetime Plan',
        description: 'Internal teacher complimentary access — not available for purchase.',
        basePrice: 0,
        currency: 'INR',
        validityDays: 36500,
        isPublic: false,
        features: [
          'All premium features',
          'Yoga Classes',
          'Group Classes',
          'Dosha Analysis',
          'Meditation Classes',
          'Period Classes',
          'Menopause Tracker',
          'Body Tracker',
          'Thyroid Tracker',
          'Mood Tracker',
          'Teacher Dashboard',
          'Class Management',
          'Student Management',
          'Analytics Dashboard'
        ],
        planType: 'enterprise',
        maxUsers: 1,
        isActive: true,
        taxConfig: {
          gst: {
            rate: 0,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 100,
          maxDiscountAmount: 0
        },
        metadata: {
          isLifetimePlan: true,
          isTeacherPlan: true,
          description: 'Lifetime free access for teachers'
        }
      },
      {
        name: 'Beta Launch Plan',
        description: 'Special year-end membership - Purchase by Feb 1, 2026, Valid until Dec 30, 2025',
        basePrice: 12000,
        currency: 'INR',
        validityDays: 90, // Special case - will be calculated based on end date
        features: [
          'All premium features',
          'Yoga Classes',
          'Group Classes',
          'Dosha Analysis',
          'Meditation Classes',
          'Period Classes',
          'Menopause Tracker',
          'Body Tracker',
          'Thyroid Tracker',
          'Mood Tracler'
        ],
        planType: 'limited-time',
        maxUsers: 1,
        isActive: true,
        availableFrom: new Date('2026-02-01'),
        availableUntil: new Date('2028-01-31T23:59:59.000Z'), // Can purchase until Sep 31, 2025
        taxConfig: {
          gst: {
            rate: 5,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 100,
          maxDiscountAmount: null // Allow unlimited discount for 100% coupons
        },
        metadata: {
          specialValidityEndDate: new Date('2026-06-31T23:59:59.000Z'), // All memberships expire on Dec 30, 2025
          description: 'This plan can be purchased until September 31, 2028. All memberships from this plan will expire on December 30, 2025, regardless of purchase date.'
        }
      }
    ];

    const createdPlans = await MembershipPlan.insertMany(membershipPlans);
    console.log(`Created ${createdPlans.length} membership plans`);

    const betaPlanId = createdPlans.find((p) => p.name === 'Beta Launch Plan')?._id;

    // Create sample coupon codes with current dates
    const couponCodes = [
      {
        code: 'MONTHLY20',
        name: 'Monthly Plan Discount',
        description: '20% off on monthly plan',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 300,
        minOrderAmount: 1000,
        startDate: today,
        endDate: nextYear,
        usageLimit: 5000,
        usageLimitPerUser: 1,
        applicablePlans: betaPlanId ? [betaPlanId] : [],
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'YEARLY30',
        name: 'Yearly Plan Discount',
        description: '30% off on yearly plan',
        discountType: 'percentage',
        discountValue: 30,
        maxDiscountAmount: 3600,
        minOrderAmount: 5000,
        startDate: today,
        endDate: nextYear,
        usageLimit: 2000,
        usageLimitPerUser: 1,
        applicablePlans: betaPlanId ? [betaPlanId] : [],
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'SAVE500',
        name: 'Fixed Discount',
        description: 'Flat ₹500 off on any plan',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 1000,
        startDate: today,
        endDate: nextYear,
        usageLimit: 1000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'WELCOME15',
        name: 'Welcome Discount',
        description: '15% off for new users',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscountAmount: 1000,
        minOrderAmount: 500,
        startDate: today,
        endDate: nextYear,
        usageLimit: 5000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'CORPORATE20',
        name: 'Corporate Discount',
        description: '20% off for corporate users',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 2000,
        minOrderAmount: 2000,
        startDate: today,
        endDate: nextYear,
        usageLimit: null, // Unlimited
        usageLimitPerUser: 10,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'TRIAL50',
        name: 'Trial Discount - All Plans',
        description: '50% off on any plan',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 50,
        startDate: today,
        endDate: nextYear,
        usageLimit: 10000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans including the specific plan ID
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'SAMSARA70',
        name: 'Samsara Special Discount',
        description: '70% off on any plan',
        discountType: 'percentage',
        discountValue: 70,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextYear,
        usageLimit: 5000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'FAMILY90',
        name: 'Family Special Discount',
        description: '100% off on any plan',
        discountType: 'percentage',
        discountValue: 100,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextYear,
        usageLimit: 1000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'BTS90',
        name: 'BTS Special Discount',
        description: '100% off on any plan',
        discountType: 'percentage',
        discountValue: 100,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextYear,
        usageLimit: 1000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        code: 'DIWALI70',
        name: 'Diwali Special Discount',
        description: '70% off on any plan',
        discountType: 'percentage',
        discountValue: 70,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextYear,
        usageLimit: 5000,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
    ];

    const createdCoupons = await CouponCode.insertMany(couponCodes);
    console.log(`Created ${createdCoupons.length} coupon codes`);

    console.log('\n=== Sample Data Created Successfully ===');
    console.log('\nMembership Plans:');
    createdPlans.forEach((plan) => {
      const totalInr = plan.calculateTotalPrice('INR');
      const usdLine =
        typeof plan.usdBasePrice === 'number'
          ? ` | USD $${plan.usdBasePrice} (total $${plan.calculateTotalPrice('USD')})`
          : '';
      console.log(
        `- ${plan.name}: INR ₹${plan.basePrice} → total ₹${totalInr}${usdLine} (${plan.validityDays} d, public=${plan.isPublic !== false})`
      );
    });

    console.log('\nCoupon Codes:');
    createdCoupons.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '₹'} off`);
    });

    console.log('\n=== Seeding Complete ===');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMembershipData();
}

export default seedMembershipData;
