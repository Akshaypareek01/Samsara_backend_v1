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
        name: 'Basic Monthly',
        description: 'Basic membership plan for 1 month with essential features',
        basePrice: 499,
        currency: 'INR',
        validityDays: 30,
        features: [
          'Access to basic classes',
          'Community support',
          'Basic tracking features'
        ],
        planType: 'basic',
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
          maxDiscountPercentage: 50,
          maxDiscountAmount: 200
        }
      },
      {
        name: 'Premium Monthly',
        description: 'Premium membership plan for 1 month with advanced features',
        basePrice: 999,
        currency: 'INR',
        validityDays: 30,
        features: [
          'Unlimited classes',
          'Personal trainer access',
          'Nutrition guidance',
          'Advanced tracking',
          'Priority support'
        ],
        planType: 'premium',
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
          maxDiscountPercentage: 30,
          maxDiscountAmount: 500
        }
      },
      {
        name: 'Enterprise Monthly',
        description: 'Enterprise membership plan for 1 month with all features',
        basePrice: 1999,
        currency: 'INR',
        validityDays: 30,
        features: [
          'All premium features',
          'Custom meal plans',
          '1-on-1 coaching sessions',
          'Advanced analytics',
          'Dedicated support',
          'Corporate wellness programs'
        ],
        planType: 'enterprise',
        maxUsers: 5,
        isActive: true,
        taxConfig: {
          gst: {
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 20,
          maxDiscountAmount: 1000
        }
      },
      {
        name: 'Basic Yearly',
        description: 'Basic membership plan for 1 year with essential features',
        basePrice: 4999,
        currency: 'INR',
        validityDays: 365,
        features: [
          'Access to basic classes',
          'Community support',
          'Basic tracking features',
          'Yearly discount'
        ],
        planType: 'basic',
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
          maxDiscountPercentage: 40,
          maxDiscountAmount: 1500
        }
      },
      {
        name: 'Premium Yearly',
        description: 'Premium membership plan for 1 year with advanced features',
        basePrice: 9999,
        currency: 'INR',
        validityDays: 365,
        features: [
          'Unlimited classes',
          'Personal trainer access',
          'Nutrition guidance',
          'Advanced tracking',
          'Priority support',
          'Yearly discount'
        ],
        planType: 'premium',
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
          maxDiscountPercentage: 25,
          maxDiscountAmount: 3000
        }
      },
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
        name: 'New Year Special',
        description: 'Limited time New Year offer - Premium features at basic price',
        basePrice: 499,
        currency: 'INR',
        validityDays: 90,
        features: [
          'All premium features',
          'Personal trainer access',
          'Nutrition guidance',
          'Advanced tracking',
          'Priority support',
          'New Year bonus content'
        ],
        planType: 'limited-time',
        maxUsers: 1,
        isActive: true,
        availableFrom: new Date('2024-01-01'),
        availableUntil: new Date('2024-01-31'), // Available only in January 2024
        taxConfig: {
          gst: {
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 30,
          maxDiscountAmount: 200
        }
      },
      {
        name: 'Summer Fitness Challenge',
        description: '3-month summer fitness program with special features',
        basePrice: 1299,
        currency: 'INR',
        validityDays: 90,
        features: [
          'Summer-specific workout plans',
          'Hydration tracking',
          'Outdoor activity guides',
          'Group challenges',
          'Progress photo tracking',
          'Summer nutrition plans'
        ],
        planType: 'limited-time',
        maxUsers: 1,
        isActive: true,
        availableFrom: new Date('2024-05-01'),
        availableUntil: new Date('2024-07-31'), // Available May-July 2024
        taxConfig: {
          gst: {
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 25,
          maxDiscountAmount: 500
        }
      },
      {
        name: 'Corporate Wellness Program',
        description: 'Special corporate wellness program for companies',
        basePrice: 2999,
        currency: 'INR',
        validityDays: 180,
        features: [
          'Team wellness challenges',
          'Corporate dashboard',
          'Bulk user management',
          'Custom branding',
          'Wellness reports',
          'Employee engagement tools'
        ],
        planType: 'enterprise',
        maxUsers: 50,
        isActive: true,
        availableFrom: new Date('2024-01-01'),
        availableUntil: new Date('2024-12-31'), // Available all year 2024
        taxConfig: {
          gst: {
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 15,
          maxDiscountAmount: 1000
        }
      },
      {
        name: '2025 Year-End Special',
        description: 'Special year-end membership - Purchase by Sep 31, 2025, Valid until Dec 30, 2025',
        basePrice: 1999,
        currency: 'INR',
        validityDays: 0, // Special case - will be calculated based on end date
        features: [
          'All premium features',
          'Year-end bonus content',
          'Special 2025 challenges',
          'Exclusive year-end events',
          'Priority support',
          '2025 achievement badges'
        ],
        planType: 'limited-time',
        maxUsers: 1,
        isActive: true,
        availableFrom: new Date('2024-01-01'),
        availableUntil: new Date('2025-09-30T23:59:59.000Z'), // Can purchase until Sep 31, 2025
        taxConfig: {
          gst: {
            rate: 18,
            type: 'percentage'
          },
          otherTaxes: []
        },
        discountConfig: {
          maxDiscountPercentage: 20,
          maxDiscountAmount: 800
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
        applicablePlans: [createdPlans[1]._id, createdPlans[2]._id], // Premium and Enterprise
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
        applicablePlans: [createdPlans[3]._id, createdPlans[4]._id], // Yearly plans
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
        applicablePlans: [createdPlans[5]._id], // Trial plan
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
