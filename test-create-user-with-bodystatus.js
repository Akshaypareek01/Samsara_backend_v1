#!/usr/bin/env node

/**
 * Test creating a user with body data to verify BodyStatus is created
 */

import mongoose from 'mongoose';
import { User, BodyStatus } from './src/models/index.js';
import { createUser, deleteUserById } from './src/services/user.service.js';
import dotenv from 'dotenv';
import config from './src/config/config.js';

// Load environment variables
dotenv.config();

const testCreateUserWithBodyData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = config.mongoose.url;
    await mongoose.connect(mongoUri, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `test-newuser-${timestamp}@example.com`;
    const testName = `TestUser${timestamp.toString().slice(-6)}`;

    console.log('\n📝 Creating test user with body data...');
    console.log('   This will test the BodyStatus creation logic\n');
    
    const userData = {
      email: testEmail,
      name: testName,
      role: 'user',
      userCategory: 'Personal',
      age: '28',
      gender: 'male', // lowercase to test case-insensitive matching
      height: '180',
      weight: '75',
    };

    console.log('Input data:', userData);
    console.log('\n--- Creating user (watch for [BodyStatus] logs) ---\n');

    // Create user
    const user = await createUser(userData);
    
    console.log(`\n✅ User created: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Age: ${user.age}`);
    console.log(`   Gender: ${user.gender}`);
    console.log(`   Height: ${user.height}`);
    console.log(`   Weight: ${user.weight}`);

    // Wait a bit for async operations
    console.log('\n⏳ Waiting 2 seconds for BodyStatus creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if BodyStatus was created
    console.log('\n🔍 Checking for BodyStatus entry...');
    const bodyStatus = await BodyStatus.findOne({ userId: user._id }).sort({ measurementDate: -1 });
    
    if (bodyStatus) {
      console.log('\n✅ BodyStatus entry found!');
      console.log(`   BodyStatus ID: ${bodyStatus._id}`);
      console.log(`   Age: ${bodyStatus.age}`);
      console.log(`   Gender: ${bodyStatus.gender}`);
      console.log(`   Height: ${bodyStatus.height?.value} ${bodyStatus.height?.unit}`);
      console.log(`   Weight: ${bodyStatus.weight?.value} ${bodyStatus.weight?.unit}`);
      console.log(`   BMI: ${bodyStatus.bmi?.value} (${bodyStatus.bmi?.category})`);
      
      // Verify the data matches
      const heightMatch = bodyStatus.height?.value === parseFloat(user.height);
      const weightMatch = bodyStatus.weight?.value === parseFloat(user.weight);
      const ageMatch = bodyStatus.age === parseInt(user.age);
      const genderMatch = bodyStatus.gender === 'Male'; // Should be converted to 'Male'
      
      console.log('\n📊 Data Verification:');
      console.log(`   Height match: ${heightMatch ? '✅' : '❌'} (expected: ${user.height}, got: ${bodyStatus.height?.value})`);
      console.log(`   Weight match: ${weightMatch ? '✅' : '❌'} (expected: ${user.weight}, got: ${bodyStatus.weight?.value})`);
      console.log(`   Age match: ${ageMatch ? '✅' : '❌'} (expected: ${user.age}, got: ${bodyStatus.age})`);
      console.log(`   Gender match: ${genderMatch ? '✅' : '❌'} (expected: Male, got: ${bodyStatus.gender})`);
      
      if (heightMatch && weightMatch && ageMatch && genderMatch) {
        console.log('\n🎉 SUCCESS: All data matches correctly!');
      } else {
        console.log('\n⚠️  WARNING: Some data mismatches detected');
      }
    } else {
      console.log('\n❌ BodyStatus entry NOT found!');
      console.log('   This indicates the BodyStatus creation logic is not working.');
      console.log('   Check the server logs above for [BodyStatus] messages.');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test user...');
    
    // Delete BodyStatus entries first
    const bodyStatusEntries = await BodyStatus.find({ userId: user._id });
    if (bodyStatusEntries.length > 0) {
      await BodyStatus.deleteMany({ userId: user._id });
      console.log(`✅ Deleted ${bodyStatusEntries.length} BodyStatus entry/entries`);
    }
    
    // Delete the user
    await deleteUserById(user._id);
    console.log('✅ Test user deleted');
    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the test
testCreateUserWithBodyData();

