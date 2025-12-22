import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@samsarawellness.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@1234';

async function getAdminToken() {
  try {
    console.log(`🔐 Logging in as admin: ${ADMIN_EMAIL}`);
    
    const loginResponse = await fetch(`${BASE_URL}/v1/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Admin login failed:', errorData);
      return null;
    }

    const loginData = await loginResponse.json();
    const token = loginData.tokens?.access?.token || loginData.access?.token;
    
    if (!token) {
      console.log('❌ Token not found in response');
      return null;
    }
    
    console.log('✅ Admin login successful');
    return token;
  } catch (error) {
    console.error('💥 Error getting admin token:', error.message);
    return null;
  }
}

async function testTransactionsEndpoint() {
  try {
    console.log('🚀 Testing Payment Transactions API');
    console.log('=====================================\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // Get admin auth token
    console.log('🔐 Getting admin authentication token...');
    const token = await getAdminToken();
    
    if (!token) {
      console.log('❌ Failed to get admin authentication token');
      return;
    }
    
    console.log('✅ Admin token obtained\n');

    // Test 1: Basic request with page and limit
    console.log('📋 Test 1: GET /v1/payments/transactions?page=1&limit=10');
    const url1 = `${BASE_URL}/v1/payments/transactions?page=1&limit=10`;
    
    const response1 = await fetch(url1, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data1 = await response1.json();
    
    console.log(`Status: ${response1.status} ${response1.statusText}`);
    
    if (response1.ok) {
      console.log('✅ Request successful!');
      console.log('\n📊 Response Structure:');
      console.log(`- Page: ${data1.page}`);
      console.log(`- Limit: ${data1.limit}`);
      console.log(`- Total Pages: ${data1.totalPages}`);
      console.log(`- Total Results: ${data1.totalResults}`);
      console.log(`- Results Count: ${data1.results?.length || 0}`);
      
      if (data1.results && data1.results.length > 0) {
        console.log('\n📝 Sample Transaction:');
        const sample = data1.results[0];
        console.log(`- Transaction ID: ${sample.transactionId}`);
        console.log(`- Status: ${sample.status}`);
        console.log(`- Amount: ${sample.amount} ${sample.currency}`);
        console.log(`- Plan: ${sample.planName}`);
        console.log(`- Has Plan Data: ${sample.planId ? 'Yes' : 'No'}`);
        console.log(`- Has Coupon Data: ${sample.couponCode ? 'Yes' : 'No'}`);
      } else {
        console.log('\nℹ️  No transactions found for this user');
      }
    } else {
      console.log('❌ Request failed!');
      console.log('Error:', JSON.stringify(data1, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Different page
    console.log('📋 Test 2: GET /v1/payments/transactions?page=2&limit=5');
    const url2 = `${BASE_URL}/v1/payments/transactions?page=2&limit=5`;
    
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data2 = await response2.json();
    
    console.log(`Status: ${response2.status} ${response2.statusText}`);
    
    if (response2.ok) {
      console.log('✅ Request successful!');
      console.log(`- Page: ${data2.page}`);
      console.log(`- Limit: ${data2.limit}`);
      console.log(`- Total Pages: ${data2.totalPages}`);
      console.log(`- Results Count: ${data2.results?.length || 0}`);
    } else {
      console.log('❌ Request failed!');
      console.log('Error:', JSON.stringify(data2, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Without query params (should use defaults)
    console.log('📋 Test 3: GET /v1/payments/transactions (no params)');
    const url3 = `${BASE_URL}/v1/payments/transactions`;
    
    const response3 = await fetch(url3, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data3 = await response3.json();
    
    console.log(`Status: ${response3.status} ${response3.statusText}`);
    
    if (response3.ok) {
      console.log('✅ Request successful!');
      console.log(`- Page: ${data3.page} (default: 1)`);
      console.log(`- Limit: ${data3.limit} (default: 10)`);
      console.log(`- Total Pages: ${data3.totalPages}`);
      console.log(`- Results Count: ${data3.results?.length || 0}`);
    } else {
      console.log('❌ Request failed!');
      console.log('Error:', JSON.stringify(data3, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Admin endpoint - Get all transactions
    console.log('📋 Test 4: GET /v1/payments/transactions/all (Admin - All Transactions)');
    const url4 = `${BASE_URL}/v1/payments/transactions/all?page=1&limit=10`;
    
    const response4 = await fetch(url4, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data4 = await response4.json();
    
    console.log(`Status: ${response4.status} ${response4.statusText}`);
    
    if (response4.ok) {
      console.log('✅ Request successful!');
      console.log('\n📊 Response Structure:');
      console.log(`- Page: ${data4.page}`);
      console.log(`- Limit: ${data4.limit}`);
      console.log(`- Total Pages: ${data4.totalPages}`);
      console.log(`- Total Results: ${data4.totalResults}`);
      console.log(`- Results Count: ${data4.results?.length || 0}`);
      
      if (data4.results && data4.results.length > 0) {
        console.log('\n📝 Sample Transaction:');
        const sample = data4.results[0];
        console.log(`- Transaction ID: ${sample.transactionId}`);
        console.log(`- Status: ${sample.status}`);
        console.log(`- Amount: ${sample.amount} ${sample.currency}`);
        console.log(`- Plan: ${sample.planName}`);
        console.log(`- User: ${sample.userId?.email || sample.userId?._id || 'N/A'}`);
        console.log(`- Has Plan Data: ${sample.planId ? 'Yes' : 'No'}`);
        console.log(`- Has User Data: ${sample.userId ? 'Yes' : 'No'}`);
      } else {
        console.log('\nℹ️  No transactions found');
      }
    } else {
      console.log('❌ Request failed!');
      console.log('Error:', JSON.stringify(data4, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Admin endpoint with filters
    console.log('📋 Test 5: GET /v1/payments/transactions/all?status=completed&limit=5');
    const url5 = `${BASE_URL}/v1/payments/transactions/all?status=completed&limit=5`;
    
    const response5 = await fetch(url5, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data5 = await response5.json();
    
    console.log(`Status: ${response5.status} ${response5.statusText}`);
    
    if (response5.ok) {
      console.log('✅ Request successful!');
      console.log(`- Page: ${data5.page}`);
      console.log(`- Limit: ${data5.limit}`);
      console.log(`- Total Results: ${data5.totalResults}`);
      console.log(`- Results Count: ${data5.results?.length || 0}`);
    } else {
      console.log('❌ Request failed!');
      console.log('Error:', JSON.stringify(data5, null, 2));
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary');
    console.log('================');
    const tests = [
      { name: 'Test 1: User transactions - page=1&limit=10', passed: response1.ok },
      { name: 'Test 2: User transactions - page=2&limit=5', passed: response2.ok },
      { name: 'Test 3: User transactions - no params', passed: response3.ok },
      { name: 'Test 4: Admin - All transactions', passed: response4.ok },
      { name: 'Test 5: Admin - Filtered transactions', passed: response5.ok }
    ];
    
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\nTotal: ${tests.length} | Passed: ${passed} ✅ | Failed: ${failed} ❌`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! The transactions API is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Test Error:', error.message);
    console.error(error.stack);
  }
}

// Check if server is running
async function checkServer() {
  try {
    // Try to hit a simple endpoint to check if server is running
    const response = await fetch(`${BASE_URL}/v1/docs`, { method: 'GET' });
    return true; // If we get any response, server is running
  } catch (error) {
    // Try alternative check
    try {
      const response = await fetch(`${BASE_URL}/v1/admin/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      return true; // Server responded (even if login failed)
    } catch (e) {
      return false;
    }
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(`⚠️  Could not connect to server at ${BASE_URL}`);
    console.log('Please make sure the server is running with: npm run dev');
    console.log('\nProceeding with tests anyway...\n');
  } else {
    console.log('✅ Server is running\n');
  }
  
  await testTransactionsEndpoint();
  process.exit(0);
}

runTests();

