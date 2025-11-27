/**
 * Comprehensive Period Tracker Test Script
 * Tests entire flow: historical data entry, predictions, PMS, irregularity detection
 * 
 * Usage: node test-period-tracker-complete-flow.js
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Use 127.0.0.1 to force IPv4 (localhost might try IPv6 first)
const BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000/v1';
let AUTH_TOKEN = '';
let USER_ID = '';

// Test user credentials (update these)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

// Helper to format dates
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// Helper to add days
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// API request helper
async function apiRequest(method, endpoint, data = null, token = AUTH_TOKEN) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(data && { data }),
      timeout: 10000,
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    };

    const response = await axios(config);
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.data || { message: `HTTP ${response.status}` },
        status: response.status,
      };
    }
  } catch (error) {
    if (error.response) {
      // Server responded (even with error status like 401, 400, 500) - connection successful
      return {
        success: false,
        error: error.response.data || error.message,
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response (network error)
      const errorCode = error.code;
      if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
        return {
          success: false,
          error: { 
            message: `Connection failed (${errorCode}). Server may not be running on ${BASE_URL.replace('/v1', '')}`,
            code: errorCode,
          },
          status: null,
        };
      }
      return {
        success: false,
        error: { message: error.message || 'Network error', code: errorCode },
        status: null,
      };
    } else {
      // Error in request setup
      return {
        success: false,
        error: error.message || error,
        status: null,
      };
    }
  }
}

// Test 1: Login/Authentication
async function testLogin() {
  logTest('Test 1: Authentication');
  
  // Try password login first
  let result = await apiRequest('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  // If password login fails, try OTP flow
  if (!result.success) {
    logInfo('Password login failed, trying OTP flow...');
    
    // Send OTP
    const otpResult = await apiRequest('POST', '/auth/send-login-otp', {
      email: TEST_EMAIL,
    });
    
    if (otpResult.success) {
      // Verify OTP (using test OTP 1234)
      result = await apiRequest('POST', '/auth/verify-login-otp', {
        email: TEST_EMAIL,
        otp: '1234',
      });
    }
  }

  if (result.success && result.data.tokens?.access?.token) {
    AUTH_TOKEN = result.data.tokens.access.token;
    USER_ID = result.data.user?.id || result.data.user?._id;
    logSuccess('Authentication successful');
    logInfo(`User ID: ${USER_ID}`);
    return true;
  } else {
    logError('Authentication failed');
    logError(JSON.stringify(result.error, null, 2));
    logInfo('Note: Make sure test user exists or use OTP flow with OTP: 1234');
    return false;
  }
}

// Test 2: Import Historical Data (3 months)
async function testImportHistoricalData() {
  logTest('Test 2: Import Historical Cycles');
  
  const today = new Date();
  const cycles = [
    {
      cycleStartDate: formatDate(addDays(today, -90)),
      cycleEndDate: formatDate(addDays(today, -85)),
      periodDurationDays: 5,
      cycleStatus: 'Completed',
      dailyLogs: [
        {
          date: formatDate(addDays(today, -90)),
          flowIntensity: 3,
          crampingIntensity: 'Moderate',
          painLevel: 5,
        },
        {
          date: formatDate(addDays(today, -89)),
          flowIntensity: 4,
          crampingIntensity: 'Strong',
        },
        {
          date: formatDate(addDays(today, -88)),
          flowIntensity: 2,
          crampingIntensity: 'Mild',
        },
      ],
    },
    {
      cycleStartDate: formatDate(addDays(today, -60)),
      cycleEndDate: formatDate(addDays(today, -55)),
      periodDurationDays: 5,
      cycleStatus: 'Completed',
      dailyLogs: [
        {
          date: formatDate(addDays(today, -60)),
          flowIntensity: 2,
          crampingIntensity: 'Mild',
        },
      ],
    },
    {
      cycleStartDate: formatDate(addDays(today, -30)),
      cycleEndDate: formatDate(addDays(today, -25)),
      periodDurationDays: 5,
      cycleStatus: 'Completed',
    },
  ];

  const result = await apiRequest('POST', '/period-tracker/bulk-import', { cycles });
  
  if (result.success) {
    logSuccess(`Imported ${result.data.data.count} historical cycles`);
    return true;
  } else {
    logError('Failed to import historical cycles');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 3: Start Current Period
async function testStartPeriod() {
  logTest('Test 3: Start Current Period');
  
  const today = formatDate(new Date());
  const result = await apiRequest('POST', '/period-tracker/period/start', {
    date: today,
  });

  if (result.success) {
    logSuccess('Period started successfully');
    logInfo(`Cycle Number: ${result.data.cycleNumber}`);
    logInfo(`Cycle Start Date: ${result.data.cycleStartDate}`);
    return result.data;
  } else {
    logError('Failed to start period');
    logError(JSON.stringify(result.error, null, 2));
    return null;
  }
}

// Test 4: Add Daily Logs
async function testAddDailyLogs() {
  logTest('Test 4: Add Daily Logs');
  
  const today = new Date();
  const logs = [
    {
      date: formatDate(today),
      flowIntensity: 3,
      crampingIntensity: 'Moderate',
      painLevel: 5,
      symptoms: ['bloating', 'headache'],
      energyPattern: 'Low',
    },
    {
      date: formatDate(addDays(today, 1)),
      flowIntensity: 4,
      crampingIntensity: 'Strong',
      painLevel: 6,
    },
  ];

  let allSuccess = true;
  for (const logData of logs) {
    // Extract date from logData (it's in the URL, not body)
    const { date, ...logBody } = logData;
    const result = await apiRequest('PUT', `/period-tracker/logs/${date}`, logBody);
    if (result.success) {
      logSuccess(`Log added for ${date}`);
    } else {
      logError(`Failed to add log for ${date}`);
      if (result.error) {
        logError(`Error: ${JSON.stringify(result.error).substring(0, 200)}`);
      }
      allSuccess = false;
    }
  }

  return allSuccess;
}

// Test 5: Get Current Status with Predictions
async function testGetCurrentEnhanced() {
  logTest('Test 5: Get Current Status & Predictions');
  
  const result = await apiRequest('GET', '/period-tracker/current-enhanced');

  if (result.success) {
    const data = result.data.data;
    logSuccess('Current status retrieved');
    
    if (data.predictions) {
      logInfo(`Next Period: ${formatDate(data.predictions.nextPeriod)}`);
      logInfo(`Days Until Next Period: ${data.predictions.daysUntilNextPeriod}`);
      logInfo(`Ovulation Date: ${formatDate(data.predictions.ovulation)}`);
      logInfo(`Fertile Window: ${formatDate(data.predictions.fertileWindow.start)} to ${formatDate(data.predictions.fertileWindow.end)}`);
      logInfo(`Current Phase: ${data.predictions.currentPhase}`);
      logInfo(`Regularity: ${data.regularity}`);
    }
    
    if (data.pmsWindow) {
      logInfo(`PMS Window: ${formatDate(data.pmsWindow.pmsStartDate)} to ${formatDate(data.pmsWindow.pmsEndDate)}`);
    }

    // Validate predictions
    if (data.predictions && data.predictions.nextPeriod) {
      const nextPeriod = new Date(data.predictions.nextPeriod);
      const today = new Date();
      const daysDiff = Math.round((nextPeriod - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff <= 45) {
        logSuccess('Predictions are within valid range');
      } else {
        logError(`Predictions seem invalid: ${daysDiff} days until next period`);
      }
    }

    return true;
  } else {
    logError('Failed to get current status');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 6: Stop Period
async function testStopPeriod() {
  logTest('Test 6: Stop Period');
  
  // Use today's date (or a date after period start) instead of future date
  // Period was started today, so we'll stop it today (realistic scenario)
  const endDate = formatDate(new Date());
  const result = await apiRequest('POST', '/period-tracker/period/stop', {
    date: endDate,
  });

  if (result.success) {
    logSuccess('Period stopped successfully');
    logInfo(`Period Duration: ${result.data.periodDurationDays} days`);
    logInfo(`Cycle Status: ${result.data.cycleStatus}`);
    return true;
  } else {
    logError('Failed to stop period');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 7: Get Analytics
async function testGetAnalytics() {
  logTest('Test 7: Get Analytics');
  
  const result = await apiRequest('GET', '/period-tracker/analytics');

  if (result.success) {
    const analytics = result.data.data.analytics;
    logSuccess('Analytics retrieved');
    logInfo(`Total Cycles: ${analytics.totalCycles}`);
    logInfo(`Average Cycle Length: ${analytics.averageCycleLength} days`);
    logInfo(`Regularity: ${analytics.regularity}`);
    logInfo(`Standard Deviation: ${analytics.standardDeviation}`);
    logInfo(`Is Irregular: ${analytics.isIrregular}`);
    
    if (analytics.topSymptoms && analytics.topSymptoms.length > 0) {
      logInfo(`Top Symptoms: ${analytics.topSymptoms.map(s => s.symptom).join(', ')}`);
    }

    // Validate irregularity detection
    if (analytics.totalCycles >= 3) {
      if (analytics.standardDeviation !== null && analytics.standardDeviation !== undefined) {
        logSuccess('Irregularity detection working');
      } else {
        logError('Irregularity detection not working');
      }
    }

    return true;
  } else {
    logError('Failed to get analytics');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 8: Get Insights
async function testGetInsights() {
  logTest('Test 8: Get Insights');
  
  const result = await apiRequest('GET', '/period-tracker/insights');

  if (result.success) {
    const insights = result.data.data.insights;
    logSuccess('Insights retrieved');
    
    if (insights.predictions) {
      logInfo(`Next Period Prediction: ${formatDate(insights.predictions.nextPeriodDate)}`);
      logInfo(`Days Until: ${insights.predictions.daysUntilNextPeriod}`);
    }
    
    if (insights.patterns) {
      logInfo(`Pattern: ${insights.patterns.regularity}`);
      logInfo(`Trend: ${insights.patterns.trend}`);
    }
    
    if (insights.recommendations && insights.recommendations.length > 0) {
      logInfo('Recommendations:');
      insights.recommendations.forEach(rec => logInfo(`  - ${rec}`));
    }

    return true;
  } else {
    logError('Failed to get insights');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 9: Get Stats
async function testGetStats() {
  logTest('Test 9: Get Statistics');
  
  const result = await apiRequest('GET', '/period-tracker/stats');

  if (result.success) {
    const stats = result.data.data.stats;
    logSuccess('Statistics retrieved');
    logInfo(`Total Cycles: ${stats.totalCycles}`);
    logInfo(`Average Cycle Length: ${stats.averageCycleLength} days`);
    logInfo(`Shortest Cycle: ${stats.shortestCycle} days`);
    logInfo(`Longest Cycle: ${stats.longestCycle} days`);
    return true;
  } else {
    logError('Failed to get stats');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 10: Update Settings (PMS, Pregnancy Mode)
async function testUpdateSettings() {
  logTest('Test 10: Update Settings');
  
  const result = await apiRequest('PUT', '/period-tracker/settings', {
    pmsPredictionEnabled: true,
    pmsDaysBeforePeriod: 5,
    pregnancyModeEnabled: false,
    defaultCycleLengthDays: 28,
    lutealPhaseDays: 14,
  });

  if (result.success) {
    logSuccess('Settings updated');
    logInfo(`PMS Prediction: ${result.data.pmsPredictionEnabled ? 'Enabled' : 'Disabled'}`);
    logInfo(`PMS Days Before: ${result.data.pmsDaysBeforePeriod}`);
    return true;
  } else {
    logError('Failed to update settings');
    logError(JSON.stringify(result.error, null, 2));
    return false;
  }
}

// Test 11: Test Pregnancy Mode
async function testPregnancyMode() {
  logTest('Test 11: Test Pregnancy Mode');
  
  // Enable pregnancy mode
  const enableResult = await apiRequest('PUT', '/period-tracker/settings', {
    pregnancyModeEnabled: true,
    pregnancyStartDate: formatDate(addDays(new Date(), -30)),
    pregnancyWeek: 4,
  });

  if (!enableResult.success) {
    logError('Failed to enable pregnancy mode');
    return false;
  }

  // Get current status (should show pregnancy mode)
  const currentResult = await apiRequest('GET', '/period-tracker/current-enhanced');
  
  if (currentResult.success && currentResult.data.data.pregnancyMode) {
    logSuccess('Pregnancy mode active');
    logInfo(`Pregnancy Week: ${currentResult.data.data.pregnancyWeek}`);
    logInfo(`Pregnancy Start: ${formatDate(currentResult.data.data.pregnancyStartDate)}`);
    
    // Disable pregnancy mode
    await apiRequest('PUT', '/period-tracker/settings', {
      pregnancyModeEnabled: false,
    });
    
    return true;
  } else {
    logError('Pregnancy mode not working correctly');
    return false;
  }
}

// Test 12: Delete and Update Operations
async function testDeleteAndUpdate() {
  logTest('Test 12: Delete & Update Operations');
  
  // Get history to find a cycle
  const historyResult = await apiRequest('GET', '/period-tracker/history?limit=1');
  
  if (!historyResult.success) {
    logError('Failed to get history');
    return false;
  }
  
  const cycles = historyResult.data.data?.cycles || historyResult.data || [];
  if (!Array.isArray(cycles) || cycles.length === 0) {
    logError('No cycles found for delete/update test');
    return false;
  }

  const cycleId = cycles[0].id || cycles[0]._id;
  
  // Test update cycle
  const updateResult = await apiRequest('PUT', `/period-tracker/cycle/${cycleId}`, {
    cycleNotes: 'Updated test note',
  });

  if (updateResult.success) {
    logSuccess('Cycle updated successfully');
  } else {
    logError('Failed to update cycle');
  }

  // Test delete log
  const today = formatDate(new Date());
  const deleteLogResult = await apiRequest('DELETE', `/period-tracker/logs/${today}`);

  if (deleteLogResult.success) {
    logSuccess('Log deleted successfully');
  } else {
    logInfo('No log to delete (this is OK)');
  }

  return updateResult.success;
}

// Test 13: Validate Predictions After Historical Data
async function testPredictionsAccuracy() {
  logTest('Test 13: Validate Prediction Accuracy');
  
  const currentResult = await apiRequest('GET', '/period-tracker/current-enhanced');
  
  if (currentResult.success && currentResult.data.data.predictions) {
    const predictions = currentResult.data.data.predictions;
    
    // Check if predictions are reasonable
    const checks = [
      {
        name: 'Next period date exists',
        pass: !!predictions.nextPeriod,
      },
      {
        name: 'Ovulation date exists',
        pass: !!predictions.ovulation,
      },
      {
        name: 'Fertile window exists',
        pass: !!predictions.fertileWindow && !!predictions.fertileWindow.start,
      },
      {
        name: 'Average cycle length is reasonable (21-45 days)',
        pass: predictions.averageCycleDays >= 21 && predictions.averageCycleDays <= 45,
      },
      {
        name: 'Days until next period is reasonable',
        pass: predictions.daysUntilNextPeriod >= 0 && predictions.daysUntilNextPeriod <= 45,
      },
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.pass) {
        logSuccess(check.name);
      } else {
        logError(check.name);
        allPassed = false;
      }
    });

    return allPassed;
  } else {
    logError('Failed to get predictions');
    return false;
  }
}

// Check if server is running
async function checkServer() {
  try {
    // Try to connect to any endpoint - if we get 401/403, server is running
    const response = await axios.get(`${BASE_URL}/period-tracker/current`, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept any status except server errors
    });
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logError('❌ Server is not running or not accessible!');
      logInfo('Please start the server first:');
      logInfo('  npm run dev');
      logInfo('  or');
      logInfo('  npm start');
      logInfo(`\nExpected server at: ${BASE_URL.replace('/v1', '')}`);
      return false;
    }
    // If we get 401/403, server is running but needs auth (which is expected)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return true;
    }
    // Check if error has response (means server responded)
    if (error.response) {
      return true; // Server is running
    }
    // Other errors - assume server is running
    return true;
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('PERIOD TRACKER COMPREHENSIVE TEST SUITE', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  logInfo(`Base URL: ${BASE_URL}\n`);

  // Quick connectivity test
  logTest('Testing server connectivity...');
  try {
    const testResult = await apiRequest('GET', '/period-tracker/current');
    if (testResult.status === 401 || testResult.status === 403) {
      logSuccess('Server is accessible (authentication required)\n');
    } else if (testResult.success) {
      logSuccess('Server is accessible\n');
    } else {
      logError(`Server error: ${JSON.stringify(testResult.error).substring(0, 100)}\n`);
    }
  } catch (e) {
    logError(`Cannot test connectivity: ${e.message}\n`);
  }

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Run tests in sequence
  const tests = [
    { name: 'Authentication', fn: testLogin },
    { name: 'Import Historical Data', fn: testImportHistoricalData },
    { name: 'Start Period', fn: testStartPeriod },
    { name: 'Add Daily Logs', fn: testAddDailyLogs },
    { name: 'Get Current Enhanced', fn: testGetCurrentEnhanced },
    { name: 'Stop Period', fn: testStopPeriod },
    { name: 'Get Analytics', fn: testGetAnalytics },
    { name: 'Get Insights', fn: testGetInsights },
    { name: 'Get Stats', fn: testGetStats },
    { name: 'Update Settings', fn: testUpdateSettings },
    { name: 'Pregnancy Mode', fn: testPregnancyMode },
    { name: 'Delete & Update', fn: testDeleteAndUpdate },
    { name: 'Predictions Accuracy', fn: testPredictionsAccuracy },
  ];

  for (const test of tests) {
    try {
      log(`\n${'─'.repeat(60)}`, 'yellow');
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      results.tests.push({ name: test.name, passed: false, error: error.message });
      results.failed++;
    }
  }

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTotal Tests: ${tests.length}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log('\nDetailed Results:', 'blue');
  
  results.tests.forEach(test => {
    if (test.passed) {
      logSuccess(`  ✓ ${test.name}`);
    } else {
      logError(`  ✗ ${test.name}${test.error ? `: ${test.error}` : ''}`);
    }
  });

  log('\n' + '='.repeat(60) + '\n', 'cyan');

  return results.failed === 0;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

