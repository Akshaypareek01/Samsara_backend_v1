# WhatsApp Bot - Quick Start

## ✅ What's Been Set Up

Your WhatsApp bot backend is ready! Here's everything that was implemented:

### 📦 Files Created

1. **Model** (`src/models/whatsapp-conversation.model.js`)
   - Stores conversation history
   - Tracks conversation states (active, escalated, etc.)
   - Links to user accounts (optional)

2. **Service** (`src/services/whatsapp.service.js`)
   - Handles AI responses via OpenAI
   - Detects when user needs human support
   - Manages conversation escalation
   - Sends WhatsApp messages

3. **Controller** (`src/controllers/whatsapp.controller.js`)
   - Webhook verification
   - Message processing
   - Conversation management

4. **Routes** (`src/routes/v1/whatsapp.route.js`)
   - Webhook endpoints
   - Send message endpoint
   - Conversation history endpoints

### 🔧 Configuration Updated

- Added to `src/config/config.js`: WhatsApp and OpenAI settings
- Added to `package.json`: OpenAI dependency
- Added to `src/routes/v1/index.js`: WhatsApp routes
- Updated `src/models/index.js`: WhatsAppConversation model

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Credentials to .env

```bash
# OpenAI (You mentioned these exist)
OPEN_AI_KEY=sk-...
ASSISTANTS_ID=asst-...

# Meta WhatsApp (You need to provide these)
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_VERIFY_TOKEN=generate_random_token_here
WHATSAPP_API_VERSION=v21.0
```

### Step 2: Get Meta Credentials

**You need from Meta:**
1. Go to https://developers.facebook.com/
2. Find your app > WhatsApp > API Setup
3. Copy Phone Number ID and Access Token
4. Generate a random Verify Token (can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### Step 3: Configure Webhook

1. In Meta Console, set webhook URL:
   - URL: `https://your-domain.com/v1/whatsapp/webhook`
   - Verify Token: same as WHATSAPP_VERIFY_TOKEN
   - Subscribe to "messages"

## 📱 How It Works

1. User sends WhatsApp message
2. Meta sends webhook to your server
3. Your server gets AI response from OpenAI
4. Bot responds to user via WhatsApp
5. If user needs help → offers human support
6. Conversation stored in MongoDB

## 🎯 Escalation Flow

When user is unsatisfied:

1. Bot detects: "need human", "not satisfied", etc.
2. Bot asks: "Would you like to speak with a human agent?"
3. User replies: "yes"
4. Bot confirms: "Support will contact you shortly. Reference: #123456"

## 🔑 What You Need from Me

**Provide these Meta credentials:**

1. **Phone Number ID** - From Meta Business Manager
2. **Access Token** - From Meta Developers Console (preferably permanent)
3. **Verify Token** - Any random string (or I can generate one)

**You already have:**
- OpenAI Key ✅
- Assistant ID ✅

## 📚 Documentation

- Full guide: `WHATSAPP_BOT_SETUP_GUIDE.md`
- Credentials needed: `WHATSAPP_CREDENTIALS_NEEDED.md`

## 🧪 Test It

After adding credentials:

```bash
# Send a WhatsApp message to your business number
# Check server logs for: "Incoming message from..."
# Bot should respond via AI
```

## 💡 Features

✅ AI responds to all messages  
✅ Auto-detects when user needs human support  
✅ Offers escalation option  
✅ Stores full conversation history  
✅ Reference numbers for escalated chats  

## 🔐 Security

- Webhook verification implemented
- HTTPS required (Meta requirement)
- Tokens stored in .env (not committed)
- Rate limiting ready (can add to routes)

## 📊 Database

New collection: `whatsappconversations`
- Stores messages
- Tracks conversation state
- Links to users (optional)
- Timestamps everything

## ⚙️ Customization

You can customize:
- Escalation keywords in `whatsapp.service.js` (line 120-140)
- AI prompts in OpenAI Assistant settings
- Messages in `whatsapp.service.js`

## 🎉 That's It!

Add the Meta credentials to `.env` and configure the webhook in Meta. The bot is ready to go!

See detailed setup in: `WHATSAPP_BOT_SETUP_GUIDE.md`


