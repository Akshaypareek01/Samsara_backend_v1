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
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Create sample membership plans
    const membershipPlans = [
    
      {
        name: 'Trial Plan',
        description: '7-day trial plan to experience the platform',
        basePrice: 99,
        currency: 'INR',
        validityDays: 7,
        features: [
          'Access to basic classes',
          'Limited tracking features',
          'Community support'
        ],
        planType: 'trial',
        maxUsers: 1,
        isActive: true,
        taxConfig: {
          gst: {
            rate: 5,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 100,
          maxDiscountAmount: 99
        }
      },
      {
        name: 'Lifetime Plan',
        description: 'Lifetime access for teachers - Free forever access to all platform features',
        basePrice: 0,
        currency: 'INR',
        validityDays: 36500, // 100 years (effectively lifetime)
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
        planType: 'trial',
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
        description: 'Special year-end membership - Purchase by Sep 31, 2025, Valid until Dec 30, 2025',
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
        availableFrom: new Date('2025-09-01'),
        availableUntil: new Date('2025-09-30T23:59:59.000Z'), // Can purchase until Sep 31, 2025
        taxConfig: {
          gst: {
            rate: 5,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 100,
          maxDiscountAmount: 12000
        },
        metadata: {
          specialValidityEndDate: new Date('2025-12-30T23:59:59.000Z'), // All memberships expire on Dec 30, 2025
          description: 'This plan can be purchased until September 31, 2025. All memberships from this plan will expire on December 30, 2025, regardless of purchase date.'
        }
      }
    ];

    const createdPlans = await MembershipPlan.insertMany(membershipPlans);
    console.log(`Created ${createdPlans.length} membership plans`);

    // Create sample coupon codes with current dates
    const couponCodes = [
      {
        code: 'TRIAL100',
        name: 'Free Trial',
        description: '100% off on Trial Plan - Completely Free',
        discountType: 'percentage',
        discountValue: 100,
        maxDiscountAmount: 99,
        minOrderAmount: 0,
        startDate: today,
        endDate: nextYear,
        usageLimit: 10000,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[0]._id], // Trial Plan
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      },
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
        applicablePlans: [createdPlans[1]._id], // Beta Launch Plan
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
        applicablePlans: [createdPlans[1]._id], // Beta Launch Plan
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
      }
    ];

    const createdCoupons = await CouponCode.insertMany(couponCodes);
    console.log(`Created ${createdCoupons.length} coupon codes`);

    console.log('\n=== Sample Data Created Successfully ===');
    console.log('\nMembership Plans:');
    createdPlans.forEach(plan => {
      const totalPrice = plan.calculateTotalPrice();
      console.log(`- ${plan.name}: ₹${plan.basePrice} base + ₹${(totalPrice - plan.basePrice).toFixed(2)} taxes = ₹${totalPrice} total (${plan.validityDays} days)`);
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
