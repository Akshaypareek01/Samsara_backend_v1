import axios from 'axios';
import dotenv from 'dotenv';
import config from './src/config/config.js';

dotenv.config();

/**
 * Test WhatsApp Bot Setup
 * Tests sending messages and webhook configuration
 */

const testWhatsAppSetup = async () => {
  console.log('🧪 Testing WhatsApp Bot Setup...\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  console.log(`   API Version: ${config.whatsapp.apiVersion || '❌ Missing'}`);
  console.log(`   Phone Number ID: ${config.whatsapp.phoneNumberId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Access Token: ${config.whatsapp.accessToken ? '✅ Set (length: ' + config.whatsapp.accessToken.length + ')' : '❌ Missing'}`);
  console.log(`   Verify Token: ${config.whatsapp.verifyToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OpenAI Key: ${config.openai.apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Assistant ID: ${config.openai.assistantId ? '✅ Set' : '❌ Missing'}\n`);

  // Test 1: Send a text message
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '918290918154'; // Your test number from the curl command
  
  console.log('📤 Test 1: Sending WhatsApp Message...');
  try {
    const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: testPhoneNumber,
      type: 'text',
      text: {
        body: 'Hello! This is a test message from your WhatsApp bot. 🤖',
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('   ✅ Message sent successfully!');
    console.log(`   Message ID: ${response.data.messages[0].id}\n`);
  } catch (error) {
    console.log('   ❌ Failed to send message');
    if (error.response) {
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  // Test 2: Verify webhook endpoint is accessible
  console.log('🔗 Test 2: Webhook Verification...');
  console.log(`   Local Webhook URL: http://localhost:8000/v1/whatsapp/webhook`);
  console.log(`   Production Webhook URL: https://apis-samsarawellness.in/v1/whatsapp/webhook`);
  console.log(`   Verify Token: ${config.whatsapp.verifyToken || '❌ Missing'}`);
  console.log(`   Use this token when configuring webhook in Meta Console\n`);

  // Test 3: Check OpenAI connection
  console.log('🤖 Test 3: OpenAI Connection...');
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    // Try to list assistants
    const assistants = await openai.beta.assistants.list({ limit: 1 });
    console.log('   ✅ OpenAI connection successful!');
    console.log(`   Found assistant: ${config.openai.assistantId}`);
    
    // Verify assistant exists
    try {
      const assistant = await openai.beta.assistants.retrieve(config.openai.assistantId);
      console.log(`   ✅ Assistant "${assistant.name}" found and ready!\n`);
    } catch (err) {
      console.log(`   ⚠️  Assistant ID ${config.openai.assistantId} not found. Please check your ASSISTANTS_ID.\n`);
    }
  } catch (error) {
    console.log('   ❌ OpenAI connection failed');
    console.log(`   Error: ${error.message}\n`);
  }

  console.log('✅ Testing complete!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Configure webhook in Meta Console:');
  console.log(`      URL: https://your-domain.com/v1/whatsapp/webhook`);
  console.log(`      Verify Token: ${config.whatsapp.verifyToken}`);
  console.log('   2. Subscribe to "messages" field');
  console.log('   3. Send a message to your WhatsApp Business number');
  console.log('   4. Check server logs for incoming messages\n');
};

// Run tests
testWhatsAppSetup().catch(console.error);

