const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';

// Test user data
const testUser = {
  email: 'testprofile@example.com',
  name: 'Test Profile User',
  role: 'user',
  userCategory: 'Personal'
};

let accessToken = null;

async function makeRequest(endpoint, method, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return { 
      status: error.response?.status || 500, 
      data: error.response?.data || error.message 
    };
  }
}

async function testProfileUpdate() {
  console.log('=== Testing Profile Update with Tracker Updates ===\n');
  
  // Step 1: Send registration OTP
  console.log('1. Sending registration OTP...');
  const otpResponse = await makeRequest('/auth/send-registration-otp', 'POST', testUser);
  
  if (otpResponse.status !== 200) {
    console.log('Failed to send OTP. Stopping test.');
    return;
  }
  
  // Step 2: Verify registration OTP (you'll need to check email for actual OTP)
  console.log('2. Verifying registration OTP...');
  console.log('Note: Check your email for the actual OTP and replace "1234" below');
  
  const verifyResponse = await makeRequest('/auth/verify-registration-otp', 'POST', {
    ...testUser,
    otp: '1234' // Replace with actual OTP from email
  });
  
  if (verifyResponse.status !== 201) {
    console.log('Registration failed. Stopping test.');
    return;
  }
  
  accessToken = verifyResponse.data.tokens.access;
  console.log('Registration successful!');
  
  // Step 3: Update profile with tracker-relevant data
  console.log('\n3. Updating profile with tracker-relevant data...');
  const profileUpdateData = {
    height: '175',
    weight: '70',
    age: '25',
    gender: 'Male',
    targetWeight: '65'
  };
  
  const updateResponse = await makeRequest('/users/profile', 'PATCH', profileUpdateData);
  
  if (updateResponse.status === 200) {
    console.log('Profile updated successfully!');
    console.log('Updated user data:', updateResponse.data);
  } else {
    console.log('Profile update failed:', updateResponse.data);
  }
  
  // Step 4: Check tracker data to verify updates
  console.log('\n4. Checking tracker data...');
  const statusResponse = await makeRequest('/trackers/status', 'GET');
  
  if (statusResponse.status === 200) {
    console.log('Tracker status retrieved successfully!');
    console.log('Tracker data:', JSON.stringify(statusResponse.data, null, 2));
  } else {
    console.log('Failed to retrieve tracker status:', statusResponse.data);
  }
}

// Run the test
testProfileUpdate().catch(console.error); 