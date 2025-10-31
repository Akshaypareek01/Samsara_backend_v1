import axios from 'axios';
import dotenv from 'dotenv';
import config from './src/config/config.js';

dotenv.config();

/**
 * Test WhatsApp Webhook Setup
 * Tests webhook verification and message handling on both local and production
 */

const TEST_CONFIG = {
  local: {
    baseUrl: 'http://localhost:8000',
    name: 'Local Server',
  },
  production: {
    baseUrl: 'https://apis-samsarawellness.in',
    name: 'Production Server',
  },
};

/**
 * Test webhook verification (GET request)
 */
const testWebhookVerification = async (baseUrl, serverName) => {
  console.log(`\n🔐 Testing Webhook Verification on ${serverName}...`);
  console.log(`   URL: ${baseUrl}/v1/whatsapp/webhook`);

  try {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': config.whatsapp.verifyToken || 'test_token',
      'hub.challenge': 'test_challenge_12345',
    });

    const response = await axios.get(`${baseUrl}/v1/whatsapp/webhook?${params.toString()}`, {
      timeout: 5000,
      validateStatus: (status) => status < 500, // Don't throw on 403
    });

    if (response.status === 200 && response.data === 'test_challenge_12345') {
      console.log('   ✅ Webhook verification PASSED!');
      console.log(`   Response: ${response.data}`);
      return true;
    } else if (response.status === 403) {
      console.log('   ⚠️  Webhook verification FAILED (403 Forbidden)');
      console.log(`   Reason: Verify token mismatch or endpoint not configured`);
      console.log(`   Expected Verify Token: ${config.whatsapp.verifyToken || 'NOT SET'}`);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   ❌ Cannot connect to server');
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure server is running at ${baseUrl}`);
      return false;
    } else if (error.response) {
      console.log(`   ⚠️  Response Error: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      return false;
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  }
};

/**
 * Test webhook message handling (POST request)
 */
const testWebhookMessageHandling = async (baseUrl, serverName) => {
  console.log(`\n📨 Testing Webhook Message Handling on ${serverName}...`);
  console.log(`   URL: ${baseUrl}/v1/whatsapp/webhook`);

  const testPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'TEST_ENTRY_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: config.whatsapp.phoneNumberId || 'TEST_PHONE_ID',
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User',
                  },
                  wa_id: '918290918154',
                },
              ],
              messages: [
                {
                  from: '918290918154',
                  id: 'wamid.TEST_MESSAGE_ID',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Test message from webhook test script',
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(`${baseUrl}/v1/whatsapp/webhook`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds for OpenAI API calls
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });

    if (response.status === 200) {
      console.log('   ✅ Webhook message handling PASSED!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   ❌ Cannot connect to server');
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure server is running at ${baseUrl}`);
      return false;
    } else if (error.response) {
      console.log(`   ⚠️  Response Error: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      return false;
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  }
};

/**
 * Test server health
 */
const testServerHealth = async (baseUrl, serverName) => {
  console.log(`\n🏥 Testing Server Health on ${serverName}...`);
  console.log(`   URL: ${baseUrl}`);

  try {
    const response = await axios.get(baseUrl, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });

    console.log(`   ✅ Server is accessible (Status: ${response.status})`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   ❌ Server is not accessible');
      console.log(`   Error: ${error.message}`);
      return false;
    } else {
      console.log(`   ⚠️  Server responded but may have issues`);
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }
};

/**
 * Check environment configuration
 */
const checkEnvironment = () => {
  console.log('🔍 Checking Environment Configuration...\n');

  const checks = {
    'WhatsApp Phone Number ID': config.whatsapp.phoneNumberId,
    'WhatsApp Access Token': config.whatsapp.accessToken ? '✅ Set' : '❌ Missing',
    'WhatsApp Verify Token': config.whatsapp.verifyToken || '❌ Missing',
    'WhatsApp API Version': config.whatsapp.apiVersion || '❌ Missing',
    'OpenAI API Key': config.openai.apiKey ? '✅ Set' : '❌ Missing',
    'OpenAI Assistant ID': config.openai.assistantId || '❌ Missing',
  };

  console.table(checks);

  const missing = Object.entries(checks)
    .filter(([key, value]) => !value || value === '❌ Missing')
    .map(([key]) => key);

  if (missing.length > 0) {
    console.log('⚠️  Missing configuration:');
    missing.forEach((key) => console.log(`   - ${key}`));
    console.log('\n💡 Add missing variables to your .env file\n');
  } else {
    console.log('✅ All environment variables are set!\n');
  }

  return missing.length === 0;
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('🧪 WhatsApp Webhook Test Suite');
  console.log('='.repeat(50));
  console.log(`\n🌐 Your Production Domain: ${TEST_CONFIG.production.baseUrl}`);
  console.log(`🏠 Your Local Domain: ${TEST_CONFIG.local.baseUrl} (Port 8000)\n`);

  // Check environment
  const envOk = checkEnvironment();

  if (!envOk) {
    console.log('⚠️  Some environment variables are missing. Tests may fail.\n');
  }

  const results = {
    local: {
      health: false,
      verification: false,
      messageHandling: false,
    },
    production: {
      health: false,
      verification: false,
      messageHandling: false,
    },
  };

  // Test Local Server
  console.log('\n' + '='.repeat(50));
  console.log('🏠 TESTING LOCAL SERVER');
  console.log('='.repeat(50));

  results.local.health = await testServerHealth(
    TEST_CONFIG.local.baseUrl,
    TEST_CONFIG.local.name
  );

  if (results.local.health) {
    results.local.verification = await testWebhookVerification(
      TEST_CONFIG.local.baseUrl,
      TEST_CONFIG.local.name
    );
    results.local.messageHandling = await testWebhookMessageHandling(
      TEST_CONFIG.local.baseUrl,
      TEST_CONFIG.local.name
    );
  } else {
    console.log('\n   ⏭️  Skipping webhook tests - server not accessible');
  }

  // Test Production Server
  console.log('\n' + '='.repeat(50));
  console.log('🌐 TESTING PRODUCTION SERVER');
  console.log('='.repeat(50));

  results.production.health = await testServerHealth(
    TEST_CONFIG.production.baseUrl,
    TEST_CONFIG.production.name
  );

  if (results.production.health) {
    results.production.verification = await testWebhookVerification(
      TEST_CONFIG.production.baseUrl,
      TEST_CONFIG.production.name
    );
    results.production.messageHandling = await testWebhookMessageHandling(
      TEST_CONFIG.production.baseUrl,
      TEST_CONFIG.production.name
    );
  } else {
    console.log('\n   ⏭️  Skipping webhook tests - server not accessible');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const summary = {
    Local: {
      'Server Health': results.local.health ? '✅ PASS' : '❌ FAIL',
      'Webhook Verification': results.local.verification ? '✅ PASS' : '❌ FAIL',
      'Message Handling': results.local.messageHandling ? '✅ PASS' : '❌ FAIL',
    },
    Production: {
      'Server Health': results.production.health ? '✅ PASS' : '❌ FAIL',
      'Webhook Verification': results.production.verification ? '✅ PASS' : '❌ FAIL',
      'Message Handling': results.production.messageHandling ? '✅ PASS' : '❌ FAIL',
    },
  };

  console.table(summary);

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!results.local.health) {
    console.log('   - Start your local server: npm run dev');
  }
  
  if (!results.production.health) {
    console.log('   - Check if production server is running');
    console.log('   - Verify DNS is pointing to your server');
    console.log('   - Check SSL certificate is valid');
  }

  if (!results.local.verification && !results.production.verification) {
    console.log('   - Verify WHATSAPP_VERIFY_TOKEN is set correctly in .env');
    console.log('   - Use the same token in Meta Console webhook configuration');
  }

  if (!results.local.messageHandling && !results.production.messageHandling) {
    console.log('   - Check server logs for errors');
    console.log('   - Verify MongoDB connection');
    console.log('   - Check OpenAI API credentials');
  }

  console.log('\n📝 Webhook URL for Meta Console:');
  console.log(`   ${TEST_CONFIG.production.baseUrl}/v1/whatsapp/webhook`);
  console.log(`   Verify Token: ${config.whatsapp.verifyToken || 'NOT SET'}`);
  console.log('');

  // Final status
  const allTestsPassed = 
    (results.local.verification && results.local.messageHandling) ||
    (results.production.verification && results.production.messageHandling);

  if (allTestsPassed) {
    console.log('✅ Webhook is working correctly!');
    console.log('🚀 You can configure this in Meta Console\n');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.\n');
  }
};

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});

