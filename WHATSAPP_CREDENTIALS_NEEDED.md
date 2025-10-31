# WhatsApp Bot - Meta Credentials Needed

## Summary

I've successfully set up the WhatsApp bot backend with OpenAI integration. Here's what Meta account credentials you need to provide:

## Required Meta Credentials

Add these to your `.env` file:

```bash
# From Meta Business Account
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_VERIFY_TOKEN="your_random_token"  
WHATSAPP_API_VERSION="v21.0"

# From OpenAI
OPEN_AI_KEY="your_openai_api_key"
ASSISTANTS_ID="your_openai_assistant_id"
```

## How to Get These Credentials

### 1. WHATSAPP_PHONE_NUMBER_ID

**Where to find it:**
- Go to https://business.facebook.com/
- Navigate to "WhatsApp Manager"
- Click on your phone number
- The Phone Number ID is shown in the URL or in the page details
- It's a numeric string like: `1234567890123456`

### 2. WHATSAPP_ACCESS_TOKEN

**Where to get it:**
- Go to https://developers.facebook.com/
- Select your app
- Go to WhatsApp > API Setup
- Copy the "Temporary access token" (you'll need to generate a permanent one)

**For Permanent Token:**
1. Go to WhatsApp > API Setup
2. Click "Generate Token" under "System Users"
3. Create a System User if you don't have one
4. Generate permanent token
5. Copy the token

### 3. WHATSAPP_VERIFY_TOKEN

**Generate it yourself:**
Run this command on your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will generate a random token. Use this same token in:
- Your `.env` file
- Meta's webhook configuration

### 4. WHATSAPP_API_VERSION

**Default value:**
Usually `v21.0` (already set in config)

You can find the latest version at: https://developers.facebook.com/docs/whatsapp/cloud-api/overview

### 5. OPEN_AI_KEY

**Where to get it:**
- Go to https://platform.openai.com/api-keys
- Create a new secret key or use existing one
- Copy the API key (starts with `sk-`)

### 6. ASSISTANTS_ID

**Where to get it:**
- Go to https://platform.openai.com/assistants
- Create a new assistant or select existing one
- Copy the Assistant ID (starts with `asst-`)

## Quick Setup Steps

1. **Add credentials to `.env`**:
   ```bash
   OPEN_AI_KEY=sk-your-key-here
   ASSISTANTS_ID=asst-your-id-here
   WHATSAPP_PHONE_NUMBER_ID=1234567890123456
   WHATSAPP_ACCESS_TOKEN=EAA-your-token-here
   WHATSAPP_VERIFY_TOKEN=generate-random-token-here
   WHATSAPP_API_VERSION=v21.0
   ```

2. **Configure webhook in Meta**:
   - Go to developers.facebook.com
   - Select your app
   - WhatsApp > Configuration
   - Set Callback URL: `https://your-domain.com/v1/whatsapp/webhook`
   - Set Verify Token: (same as WHATSAPP_VERIFY_TOKEN in .env)
   - Subscribe to "messages"

3. **Test it**:
   ```bash
   # Send a message to your WhatsApp Business number
   # Check logs for incoming messages
   ```

## What the Bot Does

✅ Receives WhatsApp messages via webhook  
✅ Responds using OpenAI Assistant  
✅ Detects when user needs human support  
✅ Offers escalation to human agent  
✅ Stores conversation history in MongoDB  
✅ Can send messages programmatically  

## Features

- **AI-powered responses** via OpenAI Assistant
- **Automatic human escalation** when user is unsatisfied
- **Conversation history** stored in database
- **Smart keyword detection** for support requests
- **Reference numbers** for escalated conversations

## API Endpoints

- `GET /v1/whatsapp/webhook` - Webhook verification
- `POST /v1/whatsapp/webhook` - Receive messages
- `POST /v1/whatsapp/send` - Send messages
- `GET /v1/whatsapp/conversation/:id` - Get conversation history
- `GET /v1/whatsapp/conversations?phoneNumber=+1234` - List conversations

## Files Created

- `src/models/whatsapp-conversation.model.js` - Database model
- `src/services/whatsapp.service.js` - Business logic
- `src/controllers/whatsapp.controller.js` - Request handlers
- `src/routes/v1/whatsapp.route.js` - API routes

## Dependencies Added

- `openai@^4.20.0` - OpenAI SDK

## Next Steps

1. ✅ All code is ready
2. ⏳ Add Meta credentials to `.env`
3. ⏳ Add OpenAI credentials to `.env`
4. ⏳ Configure webhook in Meta Console
5. ⏳ Test with a WhatsApp message

See `WHATSAPP_BOT_SETUP_GUIDE.md` for detailed instructions.


