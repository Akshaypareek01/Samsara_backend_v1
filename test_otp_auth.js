/**
 * Test script for OTP-based authentication
 * This script demonstrates the complete OTP authentication flow
 */

const BASE_URL = 'http://localhost:3000/v1';

// Test user data for different types
const testUsers = {
  personal: {
    email: 'personal@example.com',
    name: 'Personal User',
    role: 'user',
    userCategory: 'Personal'
  },
  corporate: {
    email: 'corporate@example.com',
    name: 'Corporate User',
    role: 'user',
    userCategory: 'Corporate',
    corporate_id: 'CORP123456'
  },
  teacher: {
    email: 'teacher@example.com',
    name: 'Teacher User',
    role: 'teacher',
    teacherCategory: 'Yoga Trainer'
  }
};

// Helper function to make API calls
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status);
    console.log('Response:', data);
    console.log('---');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test OTP-based registration flow for Personal User
async function testPersonalUserRegistration() {
  console.log('=== Testing Personal User Registration Flow ===\n');
  
  // Step 1: Send registration OTP
  console.log('1. Sending registration OTP for Personal User...');
  const otpResponse = await makeRequest('/auth/send-registration-otp', 'POST', testUsers.personal);
  
  if (otpResponse.status !== 200) {
    console.log('Failed to send OTP. Stopping test.');
    return null;
  }
  
  // Step 2: Verify registration OTP (you'll need to check email for actual OTP)
  console.log('2. Verifying registration OTP for Personal User...');
  console.log('Note: Check your email for the actual OTP and replace "1234" below');
  
  const verifyResponse = await makeRequest('/auth/verify-registration-otp', 'POST', {
    ...testUsers.personal,
    otp: '1234' // Replace with actual OTP from email
  });
  
  if (verifyResponse.status === 201) {
    console.log('Personal User Registration successful!');
    return verifyResponse.data.tokens.access;
  } else {
    console.log('Personal User Registration failed. Stopping test.');
    return null;
  }
}

// Test OTP-based registration flow for Corporate User
async function testCorporateUserRegistration() {
  console.log('=== Testing Corporate User Registration Flow ===\n');
  
  // Step 1: Send registration OTP
  console.log('1. Sending registration OTP for Corporate User...');
  const otpResponse = await makeRequest('/auth/send-registration-otp', 'POST', testUsers.corporate);
  
  if (otpResponse.status !== 200) {
    console.log('Failed to send OTP. Stopping test.');
    return null;
  }
  
  // Step 2: Verify registration OTP (you'll need to check email for actual OTP)
  console.log('2. Verifying registration OTP for Corporate User...');
  console.log('Note: Check your email for the actual OTP and replace "1234" below');
  
  const verifyResponse = await makeRequest('/auth/verify-registration-otp', 'POST', {
    ...testUsers.corporate,
    otp: '1234' // Replace with actual OTP from email
  });
  
  if (verifyResponse.status === 201) {
    console.log('Corporate User Registration successful!');
    return verifyResponse.data.tokens.access;
  } else {
    console.log('Corporate User Registration failed. Stopping test.');
    return null;
  }
}

// Test OTP-based registration flow for Teacher
async function testTeacherRegistration() {
  console.log('=== Testing Teacher Registration Flow ===\n');
  
  // Step 1: Send registration OTP
  console.log('1. Sending registration OTP for Teacher...');
  const otpResponse = await makeRequest('/auth/send-registration-otp', 'POST', testUsers.teacher);
  
  if (otpResponse.status !== 200) {
    console.log('Failed to send OTP. Stopping test.');
    return null;
  }
  
  // Step 2: Verify registration OTP (you'll need to check email for actual OTP)
  console.log('2. Verifying registration OTP for Teacher...');
  console.log('Note: Check your email for the actual OTP and replace "1234" below');
  
  const verifyResponse = await makeRequest('/auth/verify-registration-otp', 'POST', {
    ...testUsers.teacher,
    otp: '1234' // Replace with actual OTP from email
  });
  
  if (verifyResponse.status === 201) {
    console.log('Teacher Registration successful!');
    return verifyResponse.data.tokens.access;
  } else {
    console.log('Teacher Registration failed. Stopping test.');
    return null;
  }
}

// Test OTP-based login flow
async function testLoginFlow() {
  console.log('\n=== Testing OTP-based Login Flow ===\n');
  
  // Step 1: Send login OTP
  console.log('1. Sending login OTP...');
  const otpResponse = await makeRequest('/auth/send-login-otp', 'POST', {
    email: testUsers.personal.email
  });
  
  if (otpResponse.status !== 200) {
    console.log('Failed to send login OTP. Stopping test.');
    return null;
  }
  
  // Step 2: Verify login OTP
  console.log('2. Verifying login OTP...');
  console.log('Note: Check your email for the actual OTP and replace "1234" below');
  
  const verifyResponse = await makeRequest('/auth/verify-login-otp', 'POST', {
    email: testUsers.personal.email,
    otp: '1234' // Replace with actual OTP from email
  });
  
  if (verifyResponse.status === 200) {
    console.log('Login successful!');
    return verifyResponse.data.tokens.access;
  } else {
    console.log('Login failed. Stopping test.');
    return null;
  }
}

// Test profile update
async function testProfileUpdate(accessToken) {
  console.log('\n=== Testing Profile Update ===\n');
  
  if (!accessToken) {
    console.log('No access token available. Skipping profile update test.');
    return;
  }
  
  // Get current profile
  console.log('1. Getting current profile...');
  await makeRequest('/users/profile', 'GET', null, accessToken);
  
  // Update profile
  console.log('2. Updating profile...');
  const profileData = {
    gender: 'Male',
    dob: '1990-01-01',
    age: '33',
    Address: '123 Test Street',
    city: 'Test City',
    pincode: '12345',
    country: 'Test Country',
    height: '180cm',
    weight: '75kg',
    targetWeight: '70kg',
    bodyshape: 'Athletic',
    weeklyyogaplan: '3 times per week',
    practicetime: 'Morning',
    focusarea: ['Flexibility', 'Strength'],
    goal: ['Weight Loss', 'Stress Relief'],
    health_issues: ['Back Pain'],
    howyouknowus: 'Social Media',
    PriorExperience: 'Beginner',
    description: 'Fitness enthusiast',
    achievements: ['Completed 30-day challenge']
  };
  
  const updateResponse = await makeRequest('/users/profile', 'PATCH', profileData, accessToken);
  
  if (updateResponse.status === 200) {
    console.log('Profile updated successfully!');
  } else {
    console.log('Profile update failed.');
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n=== Testing Validation Errors ===\n');
  
  // Test missing userCategory for user
  console.log('1. Testing missing userCategory for user...');
  await makeRequest('/auth/send-registration-otp', 'POST', {
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
    // Missing userCategory
  });
  
  // Test missing corporate_id for corporate user
  console.log('2. Testing missing corporate_id for corporate user...');
  await makeRequest('/auth/send-registration-otp', 'POST', {
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    userCategory: 'Corporate'
    // Missing corporate_id
  });
  
  // Test missing teacherCategory for teacher
  console.log('3. Testing missing teacherCategory for teacher...');
  await makeRequest('/auth/send-registration-otp', 'POST', {
    email: 'test@example.com',
    name: 'Test Teacher',
    role: 'teacher'
    // Missing teacherCategory
  });
}

// Test traditional password-based auth
async function testPasswordAuth() {
  console.log('\n=== Testing Traditional Password-based Auth ===\n');
  
  // Note: This requires a user to be created with a password first
  console.log('Note: Traditional password-based auth requires a user with password');
  console.log('This test is skipped as we\'re focusing on OTP-based auth');
}

// Main test function
async function runTests() {
  console.log('Starting OTP Authentication Tests...\n');
  
  // Test different registration flows
  const personalToken = await testPersonalUserRegistration();
  const corporateToken = await testCorporateUserRegistration();
  const teacherToken = await testTeacherRegistration();
  
  // Test login flow
  const loginToken = await testLoginFlow();
  
  // Test profile update with any available token
  const token = personalToken || corporateToken || teacherToken || loginToken;
  await testProfileUpdate(token);
  
  // Test validation errors
  await testValidationErrors();
  
  // Test traditional auth
  await testPasswordAuth();
  
  console.log('\n=== Test Summary ===');
  console.log('Personal User Registration:', personalToken ? 'PASSED' : 'FAILED');
  console.log('Corporate User Registration:', corporateToken ? 'PASSED' : 'FAILED');
  console.log('Teacher Registration:', teacherToken ? 'PASSED' : 'FAILED');
  console.log('Login Flow:', loginToken ? 'PASSED' : 'FAILED');
  console.log('Profile Update:', token ? 'TESTED' : 'SKIPPED');
  console.log('\nTests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests().catch(console.error);
} else {
  // Browser environment
  runTests().catch(console.error);
}

// Export for use in other files
export { runTests, testPersonalUserRegistration, testCorporateUserRegistration, testTeacherRegistration, testLoginFlow, testProfileUpdate }; 