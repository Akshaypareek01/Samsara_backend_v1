import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api/v1';

// Test user credentials (you'll need to replace these with actual test credentials)
const TEST_EMAIL = 'test@gmail.com';
const TEST_PASSWORD = 'password123';

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.tokens.access.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
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
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Get preferences failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdatePreferences() {
  try {
    console.log('\n✏️ Testing PUT /notification-preferences...');
    const response = await axios.put(`${BASE_URL}/notification-preferences`, {
      preferences: {
        class_update: false,
        upcoming_class: true,
        general: false
      },
      emailNotifications: false,
      quietHours: {
        enabled: true,
        startTime: '23:00',
        endTime: '07:00'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update preferences successful');
    console.log('📊 Response:', JSON.stringify(response.data.data, null, 2));
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

async function runTests() {
  console.log('🚀 Starting Notification Preferences API Tests...\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Run all tests
  await testGetPreferences();
  await testUpdatePreferences();
  await testUpdateSpecificPreference();
  await testToggleGlobalSetting();
  await testToggleQuietHours();
  await testUpdateQuietHoursTime();
  await testResetToDefault();
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
