import mongoose from 'mongoose';
import CouponCode from './src/models/coupon-code.model.js';
import config from './src/config/config.js';

async function fixCouponPlan() {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Add the new plan to TRIAL50 coupon
    const result = await CouponCode.updateOne(
      { code: 'TRIAL50' },
      { 
        $addToSet: { 
          applicablePlans: '68c2a1cc95abd26ce0cd43e9'
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Added plan 68c2a1cc95abd26ce0cd43e9 to TRIAL50 coupon');
      
      // Verify the update
      const updatedCoupon = await CouponCode.findOne({ code: 'TRIAL50' });
      console.log('Applicable plans:', updatedCoupon.applicablePlans);
      
      // Test the validation
      const testData = {
        code: 'TRIAL50',
        planId: '68c2a1cc95abd26ce0cd43e9',
        userCategory: 'Personal',
        orderAmount: 3540
      };
      
      console.log('Can apply to plan now:', updatedCoupon.canApplyToPlan(testData.planId));
      console.log('Discount amount:', updatedCoupon.calculateDiscount(testData.orderAmount));
    } else {
      console.log('❌ No coupon found to update');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixCouponPlan();
