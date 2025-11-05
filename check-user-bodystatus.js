#!/usr/bin/env node

/**
 * Check BodyStatus for a specific user
 */

import mongoose from 'mongoose';
import { User, BodyStatus } from './src/models/index.js';
import dotenv from 'dotenv';
import config from './src/config/config.js';

// Load environment variables
dotenv.config();

const checkUserBodyStatus = async (userId) => {
  try {
    // Connect to MongoDB
    const mongoUri = config.mongoose.url;
    await mongoose.connect(mongoUri, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Check if userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid user ID format');
      process.exit(1);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log(`\n🔍 Checking user: ${userId}`);
    
    // Find the user
    const user = await User.findById(userObjectId);
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('\n📋 User Information:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Age: ${user.age || 'Not set'}`);
    console.log(`   Gender: ${user.gender || 'Not set'}`);
    console.log(`   Height: ${user.height || 'Not set'}`);
    console.log(`   Weight: ${user.weight || 'Not set'}`);

    // Check if user has body data
    const hasBodyData = (user.age && user.age.toString().trim() !== '') ||
                        (user.gender && user.gender.toString().trim() !== '') ||
                        (user.height && user.height.toString().trim() !== '') ||
                        (user.weight && user.weight.toString().trim() !== '');

    console.log(`\n📊 Body Data Status:`);
    console.log(`   Has body data in user model: ${hasBodyData ? '✅ Yes' : '❌ No'}`);

    // Check for BodyStatus entries
    console.log(`\n🔍 Checking for BodyStatus entries...`);
    const bodyStatusEntries = await BodyStatus.find({ userId: userObjectId }).sort({ measurementDate: -1 });
    
    if (bodyStatusEntries.length === 0) {
      console.log('❌ No BodyStatus entries found for this user!');
      
      if (hasBodyData) {
        console.log('\n⚠️  ISSUE DETECTED:');
        console.log('   User has body data but no BodyStatus entry was created.');
        console.log('   This suggests the BodyStatus creation logic did not run or failed.');
        console.log('\n💡 Possible reasons:');
        console.log('   1. User was created before the BodyStatus creation logic was added');
        console.log('   2. BodyStatus creation failed silently during user creation');
        console.log('   3. The body data was added after user creation (should use updateTrackersFromProfile)');
      } else {
        console.log('\nℹ️  User does not have body data, so no BodyStatus entry was expected.');
      }
    } else {
      console.log(`✅ Found ${bodyStatusEntries.length} BodyStatus entry/entries:`);
      
      bodyStatusEntries.forEach((entry, index) => {
        console.log(`\n   Entry #${index + 1}:`);
        console.log(`   ID: ${entry._id}`);
        console.log(`   Created: ${entry.createdAt}`);
        console.log(`   Measurement Date: ${entry.measurementDate}`);
        console.log(`   Age: ${entry.age || 'Not set'}`);
        console.log(`   Gender: ${entry.gender || 'Not set'}`);
        console.log(`   Height: ${entry.height?.value || 'Not set'} ${entry.height?.unit || ''}`);
        console.log(`   Weight: ${entry.weight?.value || 'Not set'} ${entry.weight?.unit || ''}`);
        console.log(`   BMI: ${entry.bmi?.value || 'Not set'} (${entry.bmi?.category || 'Not calculated'})`);
        console.log(`   Is Active: ${entry.isActive}`);
      });

      // Compare with user data
      if (hasBodyData && bodyStatusEntries.length > 0) {
        const latest = bodyStatusEntries[0];
        console.log(`\n📊 Data Comparison:`);
        console.log(`   Age match: ${user.age ? (parseInt(user.age) === latest.age) : 'N/A'}`);
        console.log(`   Gender match: ${user.gender ? (user.gender === latest.gender) : 'N/A'}`);
        console.log(`   Height match: ${user.height ? (parseFloat(user.height) === latest.height?.value) : 'N/A'}`);
        console.log(`   Weight match: ${user.weight ? (parseFloat(user.weight) === latest.weight?.value) : 'N/A'}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID as an argument');
  console.error('Usage: node check-user-bodystatus.js <userId>');
  process.exit(1);
}

checkUserBodyStatus(userId);

