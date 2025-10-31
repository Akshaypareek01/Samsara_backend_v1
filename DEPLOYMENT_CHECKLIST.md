# WhatsApp Bot Deployment Checklist

## ✅ Test Results Analysis

Based on your test results:

### Local Server (Port 8000)
- ✅ Server Health: **PASS** - Server is accessible
- ❌ Webhook Verification: **FAIL** (403) - Token comparison issue
- ✅ Message Handling: **PASS** - Messages are processed correctly

### Production Server
- ✅ Server Health: **PASS** - Server is accessible
- ❌ Webhook Verification: **FAIL** (404) - Route not deployed
- ❌ Message Handling: **FAIL** (404) - Route not deployed

## 🔧 Fixes Applied

### 1. Webhook Verification Logic
- Added `.trim()` to handle whitespace issues
- Added better logging for debugging
- Fixed token comparison

### 2. Next Steps for Production

## 📋 Deployment Steps

### 1. Verify Code is Updated Locally
```bash
# Check that WhatsApp routes are in your codebase
grep -r "whatsapp" src/routes/v1/index.js
```

### 2. Deploy to Production

**Option A: Using Git**
```bash
# Commit your changes
git add .
git commit -m "Add WhatsApp bot integration"
git push origin main

# Deploy to your production server
# (Follow your deployment process)
```

**Option B: Manual Deployment**
1. Copy these files to production:
   - `src/routes/v1/whatsapp.route.js`
   - `src/controllers/whatsapp.controller.js`
   - `src/services/whatsapp.service.js`
   - `src/models/whatsapp-conversation.model.js`
   - Updated `src/routes/v1/index.js`
   - Updated `src/config/config.js`
   - Updated `src/models/index.js`

2. Install dependencies on production:
```bash
npm install
# or
yarn install
```

3. Restart your server:
```bash
# If using PM2
pm2 restart all

# Or restart your service
```

### 3. Verify Production Deployment

After deploying, test again:
```bash
node test-whatsapp-webhook.js
```

Production should now show:
- ✅ Webhook Verification: **PASS**
- ✅ Message Handling: **PASS**

## 🐛 Debugging Webhook Verification

If verification still fails locally, check:

1. **Verify token in .env:**
```bash
# Check for whitespace or quotes
echo "WHATSAPP_VERIFY_TOKEN='mywhatsapptoken123'"
```

2. **Test manually:**
```bash
curl "http://localhost:8000/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=mywhatsapptoken123&hub.challenge=test123"
```

Should return: `test123`

3. **Check server logs:**
Look for:
```
Webhook verification request: { mode: 'subscribe', ... }
✅ Webhook verified successfully
```

## ✅ Final Checklist

Before configuring webhook in Meta Console:

- [ ] Code deployed to production
- [ ] Production test shows ✅ for verification
- [ ] Production test shows ✅ for message handling
- [ ] `.env` file has `WHATSAPP_VERIFY_TOKEN` set
- [ ] Server restarted with new code
- [ ] MongoDB connection working
- [ ] OpenAI credentials verified

## 🔗 Meta Console Configuration

Once production tests pass:

1. Go to https://developers.facebook.com/
2. Select your App → WhatsApp → Configuration
3. Click "Edit" on Webhook
4. Set:
   - **Callback URL**: `https://apis-samsarawellness.in/v1/whatsapp/webhook`
   - **Verify Token**: `mywhatsapptoken123` (same as your `.env`)
5. Click "Verify and Save"
6. Subscribe to: `messages`
7. Test with a WhatsApp message

## 🧪 Test After Deployment

Run test script again:
```bash
node test-whatsapp-webhook.js
```

Expected result:
```
Production:
  ✅ Server Health: PASS
  ✅ Webhook Verification: PASS  
  ✅ Message Handling: PASS
```

## 📞 If Issues Persist

1. **Check server logs** for errors
2. **Verify route registration** - check `src/routes/v1/index.js` includes WhatsApp route
3. **Check environment variables** on production match local `.env`
4. **Restart server** after environment variable changes
5. **Check MongoDB** connection in production

## 🎯 Quick Fix Commands

```bash
# Check if routes are registered
grep -n "whatsapp" src/routes/v1/index.js

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env.WHATSAPP_VERIFY_TOKEN)"

# Test webhook directly
curl "https://apis-samsarawellness.in/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=mywhatsapptoken123&hub.challenge=test123"
```

After deploying and restarting, run the test script again!

