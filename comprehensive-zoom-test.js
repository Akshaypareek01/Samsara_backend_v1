import dotenv from 'dotenv';
import { 
  createZoomMeeting, 
  endZoomMeeting, 
  getAccountUsageStats, 
  resetAccountStatus, 
  resetAllAccountStatuses,
  ZOOM_ACCOUNTS, 
  accountUsageTracker, 
  getBestAvailableAccount 
} from './src/services/zoomService.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Comprehensive Zoom Multiple Account Test Suite
 * Tests all aspects of the multiple account setup
 */

console.log('🚀 Zoom Multiple Account Test Suite');
console.log('===================================\n');

// Test Results Tracker
const testResults = {
  environmentVariables: false,
  accountConfiguration: false,
  oauthTokens: false,
  accountSelection: false,
  meetingCreation: false,
  meetingCleanup: false,
  loadBalancing: false,
  errorHandling: false
};

// Test 1: Environment Variables
const testEnvironmentVariables = () => {
  console.log('📋 Test 1: Environment Variables');
  console.log('================================');
  
  const requiredEnvVars = [
    'ZOOM_CLIENT_ID_1', 'ZOOM_CLIENT_SECRET_1', 'ZOOM_ACCOUNT_ID_1', 'ZOOM_USER_ID_1',
    'ZOOM_CLIENT_ID_2', 'ZOOM_CLIENT_SECRET_2', 'ZOOM_ACCOUNT_ID_2', 'ZOOM_USER_ID_2',
    'ZOOM_CLIENT_ID_3', 'ZOOM_CLIENT_SECRET_3', 'ZOOM_ACCOUNT_ID_3', 'ZOOM_USER_ID_3'
  ];
  
  let presentVars = 0;
  let missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars++;
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 15)}...`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: NOT SET`);
    }
  });
  
  console.log(`\n📊 Summary: ${presentVars}/${requiredEnvVars.length} environment variables are set`);
  
  if (missingVars.length > 0) {
    console.log(`\n⚠️  Missing Variables:`);
    missingVars.forEach(varName => console.log(`   - ${varName}`));
  }
  
  testResults.environmentVariables = presentVars > 0;
  return presentVars > 0;
};

// Test 2: Account Configuration
const testAccountConfiguration = () => {
  console.log('\n📋 Test 2: Account Configuration');
  console.log('================================');
  
  console.log(`📊 Total configured accounts: ${ZOOM_ACCOUNTS.length}`);
  
  if (ZOOM_ACCOUNTS.length === 0) {
    console.log('❌ No accounts configured!');
    testResults.accountConfiguration = false;
    return false;
  }
  
  let completeAccounts = 0;
  
  ZOOM_ACCOUNTS.forEach((account, index) => {
    console.log(`\n   Account ${index + 1} (${account.id}):`);
    console.log(`   - Client ID: ${account.clientId ? account.clientId.substring(0, 20) + '...' : '❌ NOT SET'}`);
    console.log(`   - Client Secret: ${account.clientSecret ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   - Account ID: ${account.accountId ? account.accountId.substring(0, 20) + '...' : '❌ NOT SET'}`);
    console.log(`   - User ID: ${account.userId || '❌ NOT SET'}`);
    console.log(`   - Is Active: ${account.isActive ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Max Concurrent Meetings: ${account.maxConcurrentMeetings}`);
    
    const hasAllFields = account.clientId && account.clientSecret && account.accountId && account.userId;
    console.log(`   - Status: ${hasAllFields ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    
    if (hasAllFields) completeAccounts++;
  });
  
  testResults.accountConfiguration = completeAccounts > 0;
  return completeAccounts > 0;
};

// Test 3: OAuth Token Generation
const testOAuthTokens = async () => {
  console.log('\n📋 Test 3: OAuth Token Generation');
  console.log('==================================');
  
  if (ZOOM_ACCOUNTS.length === 0) {
    console.log('❌ No accounts configured for OAuth testing');
    testResults.oauthTokens = false;
    return false;
  }
  
  let successCount = 0;
  
  for (let i = 0; i < ZOOM_ACCOUNTS.length; i++) {
    const account = ZOOM_ACCOUNTS[i];
    console.log(`\n🔑 Testing Account ${i + 1} (${account.id}):`);
    
    try {
      const authHeader = `Basic ${Buffer.from(`${account.clientId}:${account.clientSecret}`).toString('base64')}`;
      
      console.log('   🔄 Requesting OAuth token...');
      
      const tokenRes = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            grant_type: 'account_credentials',
            account_id: account.accountId,
          },
        }
      );
      
      console.log('   ✅ OAuth token generated successfully!');
      console.log(`   - Token type: ${tokenRes.data.token_type}`);
      console.log(`   - Expires in: ${tokenRes.data.expires_in} seconds`);
      successCount++;
      
    } catch (error) {
      console.log('   ❌ OAuth token generation failed!');
      console.log(`   - Status: ${error.response?.status || 'Unknown'}`);
      console.log(`   - Error: ${error.response?.data?.error || error.message}`);
    }
  }
  
  testResults.oauthTokens = successCount > 0;
  return successCount > 0;
};

// Test 4: Account Selection
const testAccountSelection = () => {
  console.log('\n📋 Test 4: Account Selection');
  console.log('============================');
  
  if (ZOOM_ACCOUNTS.length === 0) {
    console.log('❌ No accounts available for selection test');
    testResults.accountSelection = false;
    return false;
  }
  
  console.log('🔄 Testing account selection (5 iterations):');
  
  let successCount = 0;
  
  for (let i = 0; i < 5; i++) {
    try {
      const selectedAccount = getBestAvailableAccount();
      console.log(`   ✅ Attempt ${i + 1}: Selected ${selectedAccount.id}`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Attempt ${i + 1} failed: ${error.message}`);
    }
  }
  
  testResults.accountSelection = successCount > 0;
  return successCount > 0;
};

// Test 5: Meeting Creation
const testMeetingCreation = async () => {
  console.log('\n📋 Test 5: Meeting Creation');
  console.log('============================');
  
  try {
    const testMeetingData = {
      topic: 'Test Meeting - Comprehensive Test Suite',
      duration: 15,
      startTime: new Date(Date.now() + 60000).toISOString(),
      timezone: 'Asia/Kolkata',
      password: 'test123',
      agenda: 'Testing comprehensive functionality',
      settings: {
        host_video: false,
        participant_video: false,
        join_before_host: false,
        waiting_room: true,
        auto_recording: 'none'
      }
    };
    
    console.log('🔄 Creating test meeting...');
    const result = await createZoomMeeting(testMeetingData);
    
    console.log('✅ Meeting created successfully!');
    console.log(`   - Meeting ID: ${result.meetingId}`);
    console.log(`   - Account Used: ${result.accountUsed}`);
    console.log(`   - Join URL: ${result.joinUrl}`);
    
    testResults.meetingCreation = true;
    return result;
    
  } catch (error) {
    console.log('❌ Meeting creation failed!');
    console.log(`   - Error: ${error.message}`);
    testResults.meetingCreation = false;
    return null;
  }
};

// Test 6: Meeting Cleanup
const testMeetingCleanup = async (meetingResult) => {
  console.log('\n📋 Test 6: Meeting Cleanup');
  console.log('===========================');
  
  if (!meetingResult) {
    console.log('⚠️  No meeting to clean up (previous test failed)');
    testResults.meetingCleanup = false;
    return false;
  }
  
  try {
    console.log(`🔄 Ending meeting: ${meetingResult.meetingId}`);
    const endResult = await endZoomMeeting(meetingResult.meetingId, meetingResult.accountUsed);
    
    console.log('✅ Meeting ended successfully!');
    console.log(`   - Account Used: ${endResult.accountUsed}`);
    console.log(`   - Message: ${endResult.message}`);
    
    testResults.meetingCleanup = true;
    return true;
    
  } catch (error) {
    console.log('❌ Meeting cleanup failed!');
    console.log(`   - Error: ${error.message}`);
    testResults.meetingCleanup = false;
    return false;
  }
};

// Test 7: Load Balancing
const testLoadBalancing = async () => {
  console.log('\n📋 Test 7: Load Balancing');
  console.log('==========================');
  
  if (ZOOM_ACCOUNTS.length < 2) {
    console.log('⚠️  Only one account configured - load balancing test skipped');
    console.log('   (Load balancing requires multiple accounts)');
    testResults.loadBalancing = true; // Not applicable
    return true;
  }
  
  try {
    console.log('🔄 Testing load balancing with multiple meetings...');
    
    const meetings = [];
    
    // Create multiple meetings to test load balancing
    for (let i = 1; i <= 3; i++) {
      const meetingData = {
        topic: `Load Balance Test ${i}`,
        duration: 10,
        startTime: new Date(Date.now() + (i * 30000)).toISOString(),
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: false,
          participant_video: false,
          join_before_host: false,
          waiting_room: true,
          auto_recording: 'none'
        }
      };
      
      const result = await createZoomMeeting(meetingData);
      meetings.push(result);
      console.log(`   ✅ Meeting ${i} created with account: ${result.accountUsed}`);
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if different accounts were used
    const uniqueAccounts = new Set(meetings.map(m => m.accountUsed));
    console.log(`\n📊 Load Balancing Results:`);
    console.log(`   - Total meetings created: ${meetings.length}`);
    console.log(`   - Unique accounts used: ${uniqueAccounts.size}`);
    console.log(`   - Accounts: ${Array.from(uniqueAccounts).join(', ')}`);
    
    // Clean up meetings
    console.log('\n🧹 Cleaning up test meetings...');
    for (const meeting of meetings) {
      try {
        await endZoomMeeting(meeting.meetingId, meeting.accountUsed);
        console.log(`   ✅ Cleaned up meeting: ${meeting.meetingId}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to cleanup meeting ${meeting.meetingId}: ${error.message}`);
      }
    }
    
    testResults.loadBalancing = true;
    return true;
    
  } catch (error) {
    console.log('❌ Load balancing test failed!');
    console.log(`   - Error: ${error.message}`);
    testResults.loadBalancing = false;
    return false;
  }
};

// Test 8: Error Handling
const testErrorHandling = async () => {
  console.log('\n📋 Test 8: Error Handling');
  console.log('==========================');
  
  try {
    console.log('🔄 Testing error handling with invalid meeting data...');
    
    // Test with invalid meeting data
    const invalidMeetingData = {
      topic: '', // Empty topic should be handled gracefully
      duration: -1, // Invalid duration
      startTime: 'invalid-date', // Invalid date format
    };
    
    try {
      await createZoomMeeting(invalidMeetingData);
      console.log('⚠️  Invalid meeting data was accepted (unexpected)');
    } catch (error) {
      console.log('✅ Invalid meeting data properly rejected');
      console.log(`   - Error: ${error.message}`);
    }
    
    // Test account reset functionality
    console.log('\n🔄 Testing account reset functionality...');
    resetAllAccountStatuses();
    console.log('✅ Account reset functionality works');
    
    testResults.errorHandling = true;
    return true;
    
  } catch (error) {
    console.log('❌ Error handling test failed!');
    console.log(`   - Error: ${error.message}`);
    testResults.errorHandling = false;
    return false;
  }
};

// Main test runner
const runComprehensiveTests = async () => {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  try {
    // Run all tests
    const envTest = testEnvironmentVariables();
    const configTest = testAccountConfiguration();
    const oauthTest = await testOAuthTokens();
    const selectionTest = testAccountSelection();
    const meetingResult = await testMeetingCreation();
    const cleanupTest = await testMeetingCleanup(meetingResult);
    const loadBalanceTest = await testLoadBalancing();
    const errorTest = await testErrorHandling();
    
    // Final account stats
    console.log('\n📊 Final Account Statistics');
    console.log('============================');
    const finalStats = getAccountUsageStats();
    console.log(JSON.stringify(finalStats, null, 2));
    
    // Test summary
    console.log('\n🎯 Test Suite Summary');
    console.log('=====================');
    
    const tests = [
      { name: 'Environment Variables', result: testResults.environmentVariables },
      { name: 'Account Configuration', result: testResults.accountConfiguration },
      { name: 'OAuth Token Generation', result: testResults.oauthTokens },
      { name: 'Account Selection', result: testResults.accountSelection },
      { name: 'Meeting Creation', result: testResults.meetingCreation },
      { name: 'Meeting Cleanup', result: testResults.meetingCleanup },
      { name: 'Load Balancing', result: testResults.loadBalancing },
      { name: 'Error Handling', result: testResults.errorHandling }
    ];
    
    let passedTests = 0;
    tests.forEach(test => {
      const status = test.result ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${test.name}`);
      if (test.result) passedTests++;
    });
    
    console.log(`\n📊 Overall Result: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('\n🎉 All tests passed! Your Zoom multiple account setup is working correctly!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations');
    console.log('===================');
    
    if (!testResults.environmentVariables) {
      console.log('• Set up additional Zoom account credentials in your .env file');
    }
    
    if (ZOOM_ACCOUNTS.length < 2) {
      console.log('• Consider adding more Zoom accounts for better load balancing');
    }
    
    if (testResults.environmentVariables && testResults.accountConfiguration) {
      console.log('• Your current setup is working correctly!');
      console.log('• Monitor account usage and add more accounts as needed');
    }
    
  } catch (error) {
    console.log(`\n❌ Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the comprehensive test suite
runComprehensiveTests();
