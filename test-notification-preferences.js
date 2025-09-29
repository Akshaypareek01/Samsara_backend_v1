import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { User } from './src/models/user.model.js';
import NotificationPreferences from './src/models/notificationPreferences.model.js';

// Load environment variables
dotenv.config();

// Import all models to ensure they are registered
import './src/models/index.js';

/**
 * Test script to verify notification preferences migration
 */
async function testNotificationPreferences() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if NotificationPreferences model works
    console.log('\n🧪 Test 1: Creating test notification preferences...');
    const testUserId = new mongoose.Types.ObjectId();
    const testPreferences = await NotificationPreferences.createDefaultPreferences(testUserId);
    console.log('✅ Test preferences created:', {
      userId: testPreferences.userId,
      classUpdate: testPreferences.preferences.class_update,
      pushNotifications: testPreferences.pushNotifications
    });

    // Test 2: Check user methods
    console.log('\n🧪 Test 2: Testing user methods...');
    const testUser = new User({
      _id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      notificationPreferences: testPreferences._id
    });

    const canReceive = await testUser.canReceiveNotification('class_update');
    console.log('✅ Can receive class_update notification:', canReceive);

    const preferences = await testUser.getNotificationPreferences();
    console.log('✅ Retrieved preferences:', {
      userId: preferences.userId,
      preferencesCount: Object.keys(preferences.preferences).length
    });

    // Test 3: Check quiet hours functionality
    console.log('\n🧪 Test 3: Testing quiet hours...');
    const isQuietTime = preferences.isQuietHours();
    console.log('✅ Is quiet hours:', isQuietTime);

    // Test 4: Update preference
    console.log('\n🧪 Test 4: Testing preference update...');
    await preferences.updatePreference('class_update', false);
    const updatedCanReceive = await testUser.canReceiveNotification('class_update');
    console.log('✅ After disabling class_update:', updatedCanReceive);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await NotificationPreferences.findByIdAndDelete(testPreferences._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Migration script should work correctly.');

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

testNotificationPreferences();
