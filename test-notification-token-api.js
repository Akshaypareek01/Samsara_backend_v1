/**
 * Test script for notification token update API
 * Run with: node test-notification-token-api.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/v1';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

async function testUpdateNotificationToken() {
  try {
    console.log('Testing notification token update API...');
    
    const response = await axios.patch(
      `${BASE_URL}/users/notification-token`,
      {
        notificationToken: 'test-notification-token-12345'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success! Response:', response.data);
    console.log('Status:', response.status);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

async function testInvalidToken() {
  try {
    console.log('\nTesting with invalid notification token...');
    
    const response = await axios.patch(
      `${BASE_URL}/users/notification-token`,
      {
        notificationToken: '' // Empty token should fail validation
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('✅ Expected validation error:', error.response?.data?.message);
  }
}

async function testWithoutAuth() {
  try {
    console.log('\nTesting without authorization header...');
    
    const response = await axios.patch(
      `${BASE_URL}/users/notification-token`,
      {
        notificationToken: 'test-token'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('✅ Expected auth error:', error.response?.data?.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting notification token API tests...\n');
  
  await testUpdateNotificationToken();
  await testInvalidToken();
  await testWithoutAuth();
  
  console.log('\n✨ Tests completed!');
}

runTests();
