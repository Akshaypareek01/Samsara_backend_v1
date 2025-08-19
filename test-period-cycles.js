#!/usr/bin/env node

/**
 * Period Cycles API Test Suite
 * Tests all period cycle endpoints with proper authentication
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:3000/v1';
const TEST_EMAIL = 'test@gmail.com';
const TEST_OTP = '1234';

// Global variables to store test data
let authToken = null;
let userId = null;
let cycleId = null;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Utility function to make HTTP requests
 */
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Test result logger
 */
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED`);
    if (details) console.log(`   Details: ${details}`);
  }
}

/**
 * Test 1: Send Login OTP
 */
async function testSendLoginOTP() {
  console.log('\n🔐 Testing: Send Login OTP');
  
  const response = await makeRequest(`${BASE_URL}/auth/send-login-otp`, {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL })
  });

  const passed = response.ok && response.status === 200;
  logTest('Send Login OTP', passed, 
    passed ? 'OTP sent successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 2: Verify Login OTP and Get Token
 */
async function testVerifyLoginOTP() {
  console.log('\n🔑 Testing: Verify Login OTP');
  
  const response = await makeRequest(`${BASE_URL}/auth/verify-login-otp`, {
    method: 'POST',
    body: JSON.stringify({ 
      email: TEST_EMAIL, 
      otp: TEST_OTP 
    })
  });

  const passed = response.ok && response.status === 200 && response.data.tokens && response.data.tokens.access;
  
  if (passed) {
    authToken = response.data.tokens.access.token;
    userId = response.data.user.id;
    console.log(`✅ Token obtained: ${authToken.substring(0, 20)}...`);
    console.log(`✅ User ID: ${userId}`);
  }
  
  logTest('Verify Login OTP', passed, 
    passed ? 'Token obtained successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 3: Start New Period Cycle
 */
async function testStartNewCycle() {
  console.log('\n🔄 Testing: Start New Period Cycle');
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/start`, {
    method: 'POST'
  });

  const passed = response.status === 201 && response.data.data && response.data.data.cycle;
  
  if (passed) {
    cycleId = response.data.data.cycle.id;
    console.log(`✅ New cycle created: ${cycleId}`);
    console.log(`✅ Cycle number: ${response.data.data.cycle.cycleNumber}`);
    console.log(`✅ Status: ${response.data.data.cycle.cycleStatus}`);
  }
  
  logTest('Start New Cycle', passed, 
    passed ? 'Cycle started successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 4: Get Current Active Cycle
 */
async function testGetCurrentCycle() {
  console.log('\n📊 Testing: Get Current Active Cycle');
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/current`);

  const passed = response.status === 200;
  
  if (passed && response.data.data && response.data.data.cycle) {
    console.log(`✅ Current cycle found: ${response.data.data.cycle.id}`);
    console.log(`✅ Phase: ${response.data.data.cycle.currentPhase}`);
  } else if (passed && (!response.data.data || !response.data.data.cycle)) {
    console.log(`✅ No active cycle (expected for new users)`);
  }
  
  logTest('Get Current Cycle', passed, 
    passed ? 'Current cycle retrieved' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 5: Get Cycle Predictions
 */
async function testGetPredictions() {
  console.log('\n🔮 Testing: Get Cycle Predictions');
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/predictions`);

  const passed = response.status === 200;
  
  if (passed) {
    console.log(`✅ Predictions retrieved`);
    if (response.data.predictions && response.data.predictions.predictedNextPeriodDate) {
      console.log(`✅ Next period: ${new Date(response.data.predictions.predictedNextPeriodDate).toLocaleDateString()}`);
    }
  }
  
  logTest('Get Predictions', passed, 
    passed ? 'Predictions retrieved successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 6: Add Daily Log
 */
async function testAddDailyLog() {
  console.log('\n📝 Testing: Add Daily Log');
  
  if (!cycleId) {
    logTest('Add Daily Log', false, 'No cycle ID available');
    return false;
  }
  
  const logData = {
    date: new Date().toISOString().split('T')[0],
    flowIntensity: 3,
    crampingIntensity: 'Moderate',
    painLevel: 6,
    symptoms: ['bloating', 'fatigue'],
    notes: 'Test log entry'
  };
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/${cycleId}/daily-log`, {
    method: 'POST',
    body: JSON.stringify(logData)
  });

  const passed = response.status === 200 && response.data.data && response.data.data.cycle;
  
  if (passed) {
    console.log(`✅ Daily log added successfully`);
    console.log(`✅ Logs count: ${response.data.data.cycle.dailyLogs.length}`);
  }
  
  logTest('Add Daily Log', passed, 
    passed ? 'Daily log added successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 7: Get Specific Cycle by ID
 */
async function testGetCycleById() {
  console.log('\n🔍 Testing: Get Cycle by ID');
  
  if (!cycleId) {
    logTest('Get Cycle by ID', false, 'No cycle ID available');
    return false;
  }
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/${cycleId}`);

  const passed = response.status === 200 && response.data.data && response.data.data.cycle;
  
  if (passed) {
    console.log(`✅ Cycle retrieved: ${response.data.data.cycle.id}`);
    console.log(`✅ Daily logs: ${response.data.data.cycle.dailyLogs.length}`);
  }
  
  logTest('Get Cycle by ID', passed, 
    passed ? 'Cycle retrieved successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 8: Update Cycle Notes
 */
async function testUpdateCycleNotes() {
  console.log('\n📝 Testing: Update Cycle Notes');
  
  if (!cycleId) {
    logTest('Update Cycle Notes', false, 'No cycle ID available');
    return false;
  }
  
  const notesData = {
    cycleNotes: 'This is a test cycle for API testing purposes. Everything is working well so far.'
  };
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/${cycleId}/notes`, {
    method: 'PUT',
    body: JSON.stringify(notesData)
  });

  const passed = response.status === 200 && response.data.data && response.data.data.cycle;
  
  if (passed) {
    console.log(`✅ Cycle notes updated successfully`);
    console.log(`✅ Notes: ${response.data.data.cycle.cycleNotes}`);
  }
  
  logTest('Update Cycle Notes', passed, 
    passed ? 'Notes updated successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 9: Get Cycle History
 */
async function testGetCycleHistory() {
  console.log('\n📚 Testing: Get Cycle History');
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/history?limit=6`);

  const passed = response.status === 200;
  
  if (passed) {
    const cycles = response.data.data?.cycles || [];
    console.log(`✅ History retrieved: ${cycles.length} cycles`);
    if (cycles.length > 0) {
      console.log(`✅ Latest cycle: ${cycles[0].id}`);
    }
  }
  
  logTest('Get Cycle History', passed, 
    passed ? 'History retrieved successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 10: Get Cycle Analytics
 */
async function testGetAnalytics() {
  console.log('\n📈 Testing: Get Cycle Analytics');
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/analytics`);

  const passed = response.status === 200;
  
  if (passed) {
    console.log(`✅ Analytics retrieved`);
    if (response.data.analytics && response.data.analytics.totalCycles !== undefined) {
      console.log(`✅ Total cycles: ${response.data.analytics.totalCycles}`);
    }
  }
  
  logTest('Get Analytics', passed, 
    passed ? 'Analytics retrieved successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 11: Complete Cycle
 */
async function testCompleteCycle() {
  console.log('\n✅ Testing: Complete Cycle');
  
  if (!cycleId) {
    logTest('Complete Cycle', false, 'No cycle ID available');
    return false;
  }
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/${cycleId}/complete`, {
    method: 'PUT'
  });

  const passed = response.status === 200 && response.data.data && response.data.data.cycle;
  
  if (passed) {
    console.log(`✅ Cycle completed successfully`);
    console.log(`✅ Status: ${response.data.data.cycle.cycleStatus}`);
    console.log(`✅ End date: ${response.data.data.cycle.cycleEndDate}`);
  }
  
  logTest('Complete Cycle', passed, 
    passed ? 'Cycle completed successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Test 12: Delete Cycle (Cleanup)
 */
async function testDeleteCycle() {
  console.log('\n🗑️ Testing: Delete Cycle (Cleanup)');
  
  if (!cycleId) {
    logTest('Delete Cycle', false, 'No cycle ID available');
    return false;
  }
  
  const response = await makeRequest(`${BASE_URL}/period-cycles/${cycleId}`, {
    method: 'DELETE'
  });

  const passed = response.ok && response.status === 200;
  
  if (passed) {
    console.log(`✅ Cycle deleted successfully`);
    cycleId = null; // Reset for cleanup
  }
  
  logTest('Delete Cycle', passed, 
    passed ? 'Cycle deleted successfully' : `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
  );
  
  return passed;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Period Cycles API Test Suite');
  console.log('==========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Test OTP: ${TEST_OTP}`);
  
  try {
    // Authentication tests
    await testSendLoginOTP();
    await testVerifyLoginOTP();
    
    // Only continue if authentication succeeded
    if (!authToken) {
      console.log('\n❌ Authentication failed. Cannot continue with API tests.');
      return;
    }
    
    // Period cycle API tests
    await testStartNewCycle();
    await testGetCurrentCycle();
    await testGetPredictions();
    await testAddDailyLog();
    await testGetCycleById();
    await testUpdateCycleNotes();
    await testGetCycleHistory();
    await testGetAnalytics();
    await testCompleteCycle();
    await testDeleteCycle();
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Period Cycles API is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
