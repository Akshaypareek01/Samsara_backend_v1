#!/usr/bin/env node

/**
 * BodyStatus Creation Test
 * Tests that BodyStatus entries are automatically created when users register with body data
 */

import mongoose from 'mongoose';
import { User, BodyStatus } from './src/models/index.js';
import { createUser, deleteUserById } from './src/services/user.service.js';
import dotenv from 'dotenv';
import config from './src/config/config.js';

// Load environment variables
dotenv.config();

const testBodyStatusForRole = async (role, roleData) => {
  const timestamp = Date.now();
  const testEmail = `test-bodystatus-${role}-${timestamp}@example.com`;
  // Name must be <= 20 characters (user model validation)
  const testName = `${role}Test${timestamp.toString().slice(-6)}`;

  console.log(`\n📝 Creating test ${role} with body data...`);
  const userData = {
    email: testEmail,
    name: testName,
    role: role,
    ...roleData,
    age: '30',
    gender: 'Male',
    height: '175',
    weight: '75',
  };

  // Create user
  const user = await createUser(userData);
  console.log(`✅ ${role} created: ${user._id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Age: ${user.age}`);
  console.log(`   Gender: ${user.gender}`);
  console.log(`   Height: ${user.height}`);
  console.log(`   Weight: ${user.weight}`);

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if BodyStatus was created
  console.log(`\n🔍 Checking for BodyStatus entry for ${role}...`);
  const bodyStatus = await BodyStatus.findOne({ userId: user._id }).sort({ measurementDate: -1 });
  
  if (bodyStatus) {
    console.log(`✅ BodyStatus entry found for ${role}!`);
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
    const genderMatch = bodyStatus.gender === user.gender;
    
    if (heightMatch && weightMatch && ageMatch && genderMatch) {
      console.log(`\n✅ All data matches correctly for ${role}!`);
    } else {
      console.log(`\n⚠️  Data mismatch detected for ${role}:`);
      console.log(`   Height match: ${heightMatch}`);
      console.log(`   Weight match: ${weightMatch}`);
      console.log(`   Age match: ${ageMatch}`);
      console.log(`   Gender match: ${genderMatch}`);
    }
  } else {
    console.log(`❌ BodyStatus entry NOT found for ${role}!`);
    console.log('   This indicates the BodyStatus creation logic is not working.');
  }

  // Clean up - delete the test user and related data
  console.log(`\n🧹 Cleaning up test ${role} and related data...`);
  
  // Delete BodyStatus entries first
  const bodyStatusEntries = await BodyStatus.find({ userId: user._id });
  if (bodyStatusEntries.length > 0) {
    await BodyStatus.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${bodyStatusEntries.length} BodyStatus entry/entries`);
  }
  
  // Delete the user
  await deleteUserById(user._id);
  console.log(`✅ Test ${role} deleted`);

  return { success: !!bodyStatus, user };
};

const testBodyStatusCreation = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = config.mongoose.url;
    await mongoose.connect(mongoUri, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    const results = {
      user: null,
      teacher: null,
    };

    // Test for user role
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Testing BodyStatus creation for USER role');
    console.log('='.repeat(60));
    results.user = await testBodyStatusForRole('user', {
      userCategory: 'Personal',
    });

    // Test for teacher role
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Testing BodyStatus creation for TEACHER role');
    console.log('='.repeat(60));
    results.teacher = await testBodyStatusForRole('teacher', {
      teacherCategory: 'Yoga Trainer',
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`User role test: ${results.user.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Teacher role test: ${results.teacher.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (results.user.success && results.teacher.success) {
      console.log('\n✅ All tests passed successfully!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the logs above.');
    }

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
testBodyStatusCreation();

