import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/v1';
const TEST_USER_ID = '68da6e443f59f064bd8ce401';

// We'll need to get a token for this specific user
let authToken = '';

async function loginWithTestUser() {
  try {
    console.log('🔐 Attempting to login with test user...');
    
    // First, let's try to get user info to see if this user exists
    console.log(`📋 Testing user ID: ${TEST_USER_ID}`);
    
    // For testing purposes, we'll use a mock token approach
    // In a real scenario, you'd need the user's email/password
    console.log('⚠️  Note: This test requires a valid JWT token for the user');
    console.log('💡 You can get a token by logging in through the auth API first');
    
    return false; // We'll need to get the token manually
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

async function testGetPreferences() {
  try {
    console.log('\n📋 Testing GET /notification-preferences...');
    const response = await axios.get(`${BASE_URL}/notification-preferences`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get preferences successful');
    console.log('📊 User ID:', response.data.data.userId);
    console.log('📊 Preferences:', JSON.stringify(response.data.data.preferences, null, 2));
    console.log('📊 Global Settings:', {
      emailNotifications: response.data.data.emailNotifications,
      pushNotifications: response.data.data.pushNotifications,
      smsNotifications: response.data.data.smsNotifications
    });
    console.log('📊 Quiet Hours:', response.data.data.quietHours);
    console.log('📊 Frequency:', response.data.data.frequency);
    return response.data.data;
  } catch (error) {
    console.error('❌ Get preferences failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 Authentication required - please provide a valid token');
    }
    return null;
  }
}

async function testUpdatePreferences() {
  try {
    console.log('\n✏️ Testing PUT /notification-preferences...');
    const updateData = {
      preferences: {
        class_update: false,
        upcoming_class: true,
        general: false,
        payment: true
      },
      emailNotifications: false,
      quietHours: {
        enabled: true,
        startTime: '23:00',
        endTime: '07:00'
      },
      frequency: 'daily_digest'
    };
    
    const response = await axios.put(`${BASE_URL}/notification-preferences`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update preferences successful');
    console.log('📊 Updated preferences:', JSON.stringify(response.data.data.preferences, null, 2));
    console.log('📊 Updated quiet hours:', response.data.data.quietHours);
    console.log('📊 Updated frequency:', response.data.data.frequency);
    return response.data.data;
  } catch (error) {
    console.error('❌ Update preferences failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdateSpecificPreference() {
  try {
    console.log('\n🎯 Testing PATCH /notification-preferences/preference/class_update/true...');
    const response = await axios.patch(`${BASE_URL}/notification-preferences/preference/class_update/true`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update specific preference successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Update specific preference failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testToggleGlobalSetting() {
  try {
    console.log('\n🔧 Testing PATCH /notification-preferences/global/pushNotifications/false...');
    const response = await axios.patch(`${BASE_URL}/notification-preferences/global/pushNotifications/false`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Toggle global setting successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Toggle global setting failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testToggleQuietHours() {
  try {
    console.log('\n🔇 Testing PATCH /notification-preferences/quiet-hours/false...');
    const response = await axios.patch(`${BASE_URL}/notification-preferences/quiet-hours/false`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Toggle quiet hours successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Toggle quiet hours failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdateQuietHoursTime() {
  try {
    console.log('\n⏰ Testing PATCH /notification-preferences/quiet-hours/time...');
    const response = await axios.patch(`${BASE_URL}/notification-preferences/quiet-hours/time`, {
      startTime: '22:30',
      endTime: '08:30'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update quiet hours time successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Update quiet hours time failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testResetToDefault() {
  try {
    console.log('\n🔄 Testing POST /notification-preferences/reset...');
    const response = await axios.post(`${BASE_URL}/notification-preferences/reset`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Reset to default successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Reset to default failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testInvalidRequests() {
  console.log('\n🚫 Testing invalid requests...');
  
  try {
    // Test invalid notification type
    console.log('Testing invalid notification type...');
    await axios.patch(`${BASE_URL}/notification-preferences/preference/invalid_type/true`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('❌ Should have failed with invalid type');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid notification type');
    }
  }
  
  try {
    // Test invalid time format
    console.log('Testing invalid time format...');
    await axios.patch(`${BASE_URL}/notification-preferences/quiet-hours/time`, {
      startTime: '25:00', // Invalid time
      endTime: '08:30'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('❌ Should have failed with invalid time format');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid time format');
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Notification Preferences API Tests for User:', TEST_USER_ID);
  console.log('🌐 Server URL:', BASE_URL);
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/notification-preferences`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Server is running and API is accessible');
  } catch (error) {
    console.log('❌ Server is not running or API not accessible');
    console.log('💡 Make sure to start the server with: npm run dev');
    return;
  }
  
  console.log('\n🔑 To run these tests, you need to:');
  console.log('1. Get a JWT token for user:', TEST_USER_ID);
  console.log('2. Update the authToken variable in this script');
  console.log('3. Or login through the auth API first');
  
  console.log('\n📝 You can get a token by:');
  console.log('1. Using the login API with user credentials');
  console.log('2. Or manually setting authToken = "your_jwt_token_here"');
  
  if (!authToken) {
    console.log('\n⚠️  No auth token provided. Please set authToken variable to continue testing.');
    console.log('💡 Example: authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    return;
  }
  
  console.log('\n🧪 Running API tests...');
  
  // Run all tests
  await testGetPreferences();
  await testUpdatePreferences();
  await testUpdateSpecificPreference();
  await testToggleGlobalSetting();
  await testToggleQuietHours();
  await testUpdateQuietHoursTime();
  await testResetToDefault();
  await testInvalidRequests();
  
  console.log('\n🎉 All tests completed!');
}

// Set your JWT token here for testing
authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGRhNmU0NDNmNTlmMDY0YmQ4Y2U0MDEiLCJpYXQiOjE3NTkxNDY5MjcsImV4cCI6MTc2OTUxNDkyNywidHlwZSI6ImFjY2VzcyJ9.xzJ_5EA9dIFWJW4BdvuTCgYURYN2dMEZCwy7n9dloU8";

// Run the tests
runTests().catch(console.error);
