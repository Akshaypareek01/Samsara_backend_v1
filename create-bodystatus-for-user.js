#!/usr/bin/env node

/**
 * Manually create BodyStatus entry for a user
 */

import mongoose from 'mongoose';
import { User, BodyStatus } from './src/models/index.js';
import dotenv from 'dotenv';
import config from './src/config/config.js';

// Load environment variables
dotenv.config();

const createBodyStatusForUser = async (userId) => {
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

    console.log(`\n🔍 Finding user: ${userId}`);
    
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
    console.log(`   Age: ${user.age || 'Not set'}`);
    console.log(`   Gender: ${user.gender || 'Not set'}`);
    console.log(`   Height: ${user.height || 'Not set'}`);
    console.log(`   Weight: ${user.weight || 'Not set'}`);

    // Check if user already has BodyStatus
    const existingBodyStatus = await BodyStatus.findOne({ userId: userObjectId });
    if (existingBodyStatus) {
      console.log('\n⚠️  User already has a BodyStatus entry!');
      console.log(`   BodyStatus ID: ${existingBodyStatus._id}`);
      console.log('   Skipping creation to avoid duplicates.');
      process.exit(0);
    }

    // Prepare BodyStatus data
    const bodyStatusData = {};
    
    if (user.height && user.height.toString().trim() !== '') {
      const heightValue = parseFloat(user.height);
      if (!isNaN(heightValue) && heightValue > 0) {
        bodyStatusData.height = { value: heightValue, unit: 'cm' };
      }
    }
    
    if (user.weight && user.weight.toString().trim() !== '') {
      const weightValue = parseFloat(user.weight);
      if (!isNaN(weightValue) && weightValue > 0) {
        bodyStatusData.weight = { value: weightValue, unit: 'kg' };
      }
    }
    
    if (user.age && user.age.toString().trim() !== '') {
      const ageValue = parseInt(user.age);
      if (!isNaN(ageValue) && ageValue > 0 && ageValue <= 120) {
        bodyStatusData.age = ageValue;
      }
    }
    
    if (user.gender && user.gender.toString().trim() !== '') {
      // Handle case-insensitive matching
      const genderValue = user.gender.toString().trim();
      const genderLower = genderValue.toLowerCase();
      if (genderLower === 'male') {
        bodyStatusData.gender = 'Male';
      } else if (genderLower === 'female') {
        bodyStatusData.gender = 'Female';
      } else if (genderLower === 'other') {
        bodyStatusData.gender = 'Other';
      } else if (['Male', 'Female', 'Other'].includes(genderValue)) {
        bodyStatusData.gender = genderValue;
      }
    }

    if (Object.keys(bodyStatusData).length === 0) {
      console.log('\n❌ No valid body data found to create BodyStatus entry.');
      console.log('   User needs at least age, gender, height, or weight.');
      process.exit(1);
    }

    console.log('\n📝 Creating BodyStatus entry with data:');
    console.log(JSON.stringify(bodyStatusData, null, 2));

    // Create BodyStatus entry
    const bodyStatus = await BodyStatus.create({ 
      userId: user._id, 
      ...bodyStatusData 
    });

    console.log('\n✅ BodyStatus entry created successfully!');
    console.log(`   BodyStatus ID: ${bodyStatus._id}`);
    console.log(`   Age: ${bodyStatus.age || 'Not set'}`);
    console.log(`   Gender: ${bodyStatus.gender || 'Not set'}`);
    console.log(`   Height: ${bodyStatus.height?.value || 'Not set'} ${bodyStatus.height?.unit || ''}`);
    console.log(`   Weight: ${bodyStatus.weight?.value || 'Not set'} ${bodyStatus.weight?.unit || ''}`);
    console.log(`   BMI: ${bodyStatus.bmi?.value || 'Not calculated'} (${bodyStatus.bmi?.category || 'N/A'})`);

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
  console.error('Usage: node create-bodystatus-for-user.js <userId>');
  process.exit(1);
}

createBodyStatusForUser(userId);

