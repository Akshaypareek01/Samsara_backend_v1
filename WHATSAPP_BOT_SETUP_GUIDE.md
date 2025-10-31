# WhatsApp Bot Setup Guide

This guide will help you set up the WhatsApp Business API integration with OpenAI Assistant.

## Prerequisites

1. A Meta Business account
2. WhatsApp Business API access
3. OpenAI API key and Assistant ID
4. A server with HTTPS (for webhooks)

## Step 1: Meta Business Account Setup

### 1.1 Create Meta Business Account

1. Go to [Meta Business](https://business.facebook.com/)
2. Create a business account or use existing one
3. Complete the business verification process

### 1.2 Get WhatsApp Business API Credentials

You'll need the following information from Meta:

- **Phone Number ID**: The unique identifier for your WhatsApp Business phone number
- **Access Token**: A permanent access token for your WhatsApp Business API
- **Verify Token**: A custom token you'll use for webhook verification

**How to get these credentials:**

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add "WhatsApp" product to your app
4. Under WhatsApp > API Setup, you'll find:
   - Phone Number ID (from-to field)
   - Access Token (temporary or permanent)
   - For permanent token: Generate by going to "System Users" section

## Step 2: Configure OpenAI Assistant

### 2.1 Get OpenAI Credentials

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to "Assistants" section
3. Create a new assistant or use existing one
4. Note down the Assistant ID

You should have:
- **OpenAI API Key**: Your API key from OpenAI
- **Assistant ID**: The ID of your OpenAI Assistant

## Step 3: Environment Variables Setup

Add these variables to your `.env` file:

```bash
# OpenAI Configuration
OPEN_AI_KEY=sk-...your-openai-api-key...
ASSISTANTS_ID=asst-...your-assistant-id...

# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_API_VERSION=v21.0
```

### Generate Verify Token

The verify token can be any random string. Use this command to generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Webhook Configuration

### 4.1 Deploy Your Backend

Deploy your backend with HTTPS. Example using ngrok for testing:

```bash
ngrok http 3000
```

Note the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 4.2 Configure Webhook in Meta

1. Go to [Meta Developers Dashboard](https://developers.facebook.com/)
2. Select your app
3. Go to WhatsApp > Configuration
4. Click "Edit" on Webhook section
5. Set Callback URL: `https://your-domain.com/v1/whatsapp/webhook`
6. Set Verify Token: (use the same token from your .env file)
7. Subscribe to `messages` field

## Step 5: Install Dependencies

```bash
npm install
```

Or if using yarn:

```bash
yarn install
```

## Step 6: Test the Setup

### 6.1 Verify Webhook

Your webhook verification endpoint:
```
GET /v1/whatsapp/webhook
```

It should respond to Meta's verification challenge.

### 6.2 Send a Test Message

1. Send a WhatsApp message to your business number
2. Check your server logs for incoming messages
3. The bot should respond with AI-generated content

## Step 7: How the Bot Works

### User Interaction Flow

1. **User sends message** → Webhook receives it
2. **Check for human support** → Bot detects if user needs human agent
3. **AI Response** → If no escalation, sends OpenAI-generated response
4. **Escalation flow** → If user needs help, offers to connect with human
5. **Confirmation** → User confirms or denies human support need

### Conversation States

- `active`: Normal conversation with AI
- `waiting_for_agent`: User requested human support
- `escalated`: Confirmed escalation to human agent
- `closed`: Conversation ended

### Escalation Triggers

The bot automatically offers human support when:
- User message contains keywords like "need human", "need agent", "not satisfied"
- AI response is too short or unhelpful
- User directly asks for a person

### Message to User

When escalation is triggered:
1. Bot asks: "Would you like to speak with a human agent? (Reply 'yes' to confirm)"
2. If user replies "yes", bot confirms with reference number
3. Conversation state set to `escalated`

## Step 8: API Endpoints

### Webhook (for Meta)
- **GET** `/v1/whatsapp/webhook` - Webhook verification
- **POST** `/v1/whatsapp/webhook` - Receive messages from WhatsApp

### Management (for your use)
- **POST** `/v1/whatsapp/send` - Send a message programmatically
  ```json
  {
    "phoneNumber": "+1234567890",
    "message": "Your message here"
  }
  ```

- **GET** `/v1/whatsapp/conversation/:conversationId` - Get conversation history

- **GET** `/v1/whatsapp/conversations?phoneNumber=+1234567890` - Get all conversations for a phone number

## Step 9: Database

The system creates a `whatsappConversations` collection in your MongoDB with:

- Conversation ID
- WhatsApp ID
- User ID (if linked to user account)
- Phone number
- Message history
- Conversation state
- Timestamps

## Troubleshooting

### Webhook not receiving messages
1. Check if webhook is verified in Meta Console
2. Verify callback URL is correct
3. Check server logs for webhook verification

### Messages not sending
1. Verify access token is valid
2. Check phone number ID is correct
3. Ensure phone number is approved by Meta

### AI not responding
1. Verify OpenAI API key is valid
2. Check Assistant ID is correct
3. Review server logs for OpenAI errors

### Escalation not working
1. Check conversation state in database
2. Review keywords in `whatsappService.js`
3. Verify message flow in logs

## Security Considerations

1. **Never commit your `.env` file** - It's already in .gitignore
2. **Use HTTPS** - Required by Meta for webhooks
3. **Rotate tokens regularly** - Update access tokens periodically
4. **Monitor usage** - Watch OpenAI API usage and costs
5. **Rate limiting** - Consider implementing rate limits

## Monitoring

Monitor your system:
- Check MongoDB for conversation logs
- Monitor OpenAI API usage at platform.openai.com
- Review WhatsApp Business API metrics in Meta Console
- Check server logs for errors

## Support

For issues:
1. Check logs in `src/services/whatsapp.service.js`
2. Review webhook logs in Meta Console
3. Test OpenAI assistant directly
4. Verify environment variables

## Next Steps

1. Test with your WhatsApp number
2. Customize the AI assistant prompts in OpenAI
3. Set up proper error handling and notifications
4. Implement user linking (optional)
5. Add analytics and reporting


