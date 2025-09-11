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
            rate: 18,
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
        name: '2025 Year-End Special',
        description: 'Special year-end membership - Purchase by Sep 31, 2025, Valid until Dec 30, 2025',
        basePrice: 3000,
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
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 100,
          maxDiscountAmount: 3000
        },
        metadata: {
          specialValidityEndDate: new Date('2025-12-30T23:59:59.000Z'), // All memberships expire on Dec 30, 2025
          description: 'This plan can be purchased until September 31, 2025. All memberships from this plan will expire on December 30, 2025, regardless of purchase date.'
        }
      }
    ];

    const createdPlans = await MembershipPlan.insertMany(membershipPlans);
    console.log(`Created ${createdPlans.length} membership plans`);

    // Create sample coupon codes
    const couponCodes = [
      {
        code: 'TRIAL100',
        name: 'Free Trial',
        description: '100% off on Trial Plan - Completely Free',
        discountType: 'percentage',
        discountValue: 100,
        maxDiscountAmount: 99,
        minOrderAmount: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimit: 10000,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[0]._id], // Trial Plan
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'YEAREND100',
        name: 'Free Year-End Special',
        description: '100% off on 2025 Year-End Special Plan - Completely Free',
        discountType: 'percentage',
        discountValue: 100,
        maxDiscountAmount: 3000,
        minOrderAmount: 0,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-09-30T23:59:59.000Z'),
        usageLimit: 5000,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[1]._id], // 2025 Year-End Special Plan
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'WELCOME20',
        name: 'Welcome Discount',
        description: '20% off for new users',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 500,
        minOrderAmount: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        usageLimit: 1000,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[1]._id], // Year-End Special Plan
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'SAVE500',
        name: 'Fixed Discount',
        description: 'Flat ₹500 off on any plan',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        usageLimit: 500,
        usageLimitPerUser: 1,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'YEARLY30',
        name: 'Yearly Discount',
        description: '30% off on yearly plans',
        discountType: 'percentage',
        discountValue: 30,
        maxDiscountAmount: 2000,
        minOrderAmount: 4000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        usageLimit: 200,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[1]._id], // Year-End Special Plan
        applicableUserCategories: ['Personal', 'Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'TRIAL50',
        name: 'Trial Discount',
        description: '50% off on trial plan',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        usageLimit: 1000,
        usageLimitPerUser: 1,
        applicablePlans: [createdPlans[0]._id], // Trial plan
        applicableUserCategories: ['Personal'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
      },
      {
        code: 'CORPORATE15',
        name: 'Corporate Discount',
        description: '15% off for corporate users',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscountAmount: 1000,
        minOrderAmount: 2000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        usageLimit: null, // Unlimited
        usageLimitPerUser: 5,
        applicablePlans: [], // Applicable to all plans
        applicableUserCategories: ['Corporate'],
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(), // You'll need to replace with actual admin ID
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
