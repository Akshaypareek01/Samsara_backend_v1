# WhatsApp Webhook Testing Guide

## Quick Test

Run the webhook test script:

```bash
npm run test:whatsapp-webhook
```

Or directly:

```bash
node test-whatsapp-webhook.js
```

## What It Tests

The test script checks:

1. ✅ **Server Health** - Is the server accessible?
2. ✅ **Webhook Verification** - Does the GET endpoint work correctly?
3. ✅ **Message Handling** - Does the POST endpoint process messages correctly?

## Testing Both Environments

The script automatically tests:

- **Local**: `http://localhost:8000/v1/whatsapp/webhook`
- **Production**: `https://apis-samsarawellness.in/v1/whatsapp/webhook`

## Before Running Tests

### 1. Set Environment Variables

Make sure your `.env` has:

```bash
WHATSAPP_PHONE_NUMBER_ID=899295196592571
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_API_VERSION=v22.0
OPEN_AI_KEY=your_openai_key
ASSISTANTS_ID=your_assistant_id
```

### 2. Start Local Server (for local testing)

```bash
npm run dev
```

The server should be running on `http://localhost:8000`

### 3. Ensure Production Server is Running

Your production server should be accessible at `https://apis-samsarawellness.in`

## Test Results

### ✅ All Tests Pass

If all tests pass, you'll see:

```
✅ Webhook is working correctly!
🚀 You can configure this in Meta Console
```

### ❌ Tests Fail

Common issues and solutions:

#### Server Not Accessible
- **Local**: Make sure `npm run dev` is running
- **Production**: Check if server is deployed and running
- Check firewall/network settings

#### Webhook Verification Fails
- Check `WHATSAPP_VERIFY_TOKEN` is set in `.env`
- Verify token matches the one in Meta Console
- Check webhook endpoint is correctly configured

#### Message Handling Fails
- Check MongoDB connection
- Verify OpenAI credentials
- Check server logs for errors

## Manual Testing

### Test 1: Webhook Verification (GET)

```bash
curl "http://localhost:8000/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

**Expected Response:** `test123` (Status: 200)

### Test 2: Webhook Message (POST)

```bash
curl -X POST http://localhost:3000/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "TEST_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "phone_number_id": "899295196592571"
          },
          "messages": [{
            "from": "918290918154",
            "id": "wamid.TEST",
            "timestamp": "1234567890",
            "type": "text",
            "text": {
              "body": "Test message"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Expected Response:** `{"status":"success",...}` (Status: 200)

### Test 3: Production Webhook

Same as above, but use:
```bash
curl "https://apis-samsarawellness.in/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

## Meta Console Configuration

After tests pass, configure in Meta Console:

1. Go to https://developers.facebook.com/
2. Select your App → WhatsApp → Configuration
3. Set **Webhook URL**: `https://apis-samsarawellness.in/v1/whatsapp/webhook`
4. Set **Verify Token**: (same as WHATSAPP_VERIFY_TOKEN in .env)
5. Subscribe to: `messages`
6. Click **Verify and Save**

## Production Webhook URL

Your production webhook URL:
```
https://apis-samsarawellness.in/v1/whatsapp/webhook
```

**Important:**
- Must use HTTPS (Meta requirement)
- Must be publicly accessible
- Must respond to verification challenge
- Must return 200 status for valid requests

## Troubleshooting

### Local Tests Pass, Production Fails

1. Check SSL certificate is valid
2. Verify DNS is pointing correctly
3. Check server is actually running
4. Check firewall allows HTTPS traffic
5. Verify reverse proxy (if used) is configured correctly

### Both Tests Fail

1. Check `.env` file has all required variables
2. Verify server is running (`npm run dev` for local)
3. Check server logs for errors
4. Verify MongoDB connection
5. Check OpenAI API credentials

### Webhook Verification Always Fails

1. Double-check `WHATSAPP_VERIFY_TOKEN` in `.env`
2. Make sure token matches Meta Console exactly
3. Check for extra spaces or newlines in token
4. Verify webhook endpoint code is deployed

## Expected Output

```
🧪 WhatsApp Webhook Test Suite
==================================================

🌐 Your Production Domain: https://apis-samsarawellness.in
🏠 Your Local Domain: http://localhost:8000 (Port 8000)

🔍 Checking Environment Configuration...
[Table showing all environment variables]

🏠 TESTING LOCAL SERVER
==================================================

🏥 Testing Server Health on Local Server...
   ✅ Server is accessible (Status: 200)

🔐 Testing Webhook Verification on Local Server...
   ✅ Webhook verification PASSED!
   Response: test_challenge_12345

📨 Testing Webhook Message Handling on Local Server...
   ✅ Webhook message handling PASSED!
   Status: 200
   Response: {
     "status": "success",
     "messageId": "wamid.TEST_MESSAGE_ID",
     ...
   }

🌐 TESTING PRODUCTION SERVER
==================================================

🏥 Testing Server Health on Production Server...
   ✅ Server is accessible (Status: 200)

🔐 Testing Webhook Verification on Production Server...
   ✅ Webhook verification PASSED!
   Response: test_challenge_12345

📨 Testing Webhook Message Handling on Production Server...
   ✅ Webhook message handling PASSED!

📊 TEST SUMMARY
==================================================
[Table showing test results]

✅ Webhook is working correctly!
🚀 You can configure this in Meta Console
```

## Next Steps

After all tests pass:

1. ✅ Configure webhook in Meta Console
2. ✅ Send a test message from WhatsApp
3. ✅ Check server logs for incoming messages
4. ✅ Verify bot responds correctly

See `WHATSAPP_BOT_SETUP_GUIDE.md` for complete setup instructions.

