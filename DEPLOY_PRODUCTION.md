# Deploy WhatsApp Bot to Production

## ✅ Local Tests Passed!

All local tests are passing:
- ✅ Server Health
- ✅ Webhook Verification  
- ✅ Message Handling

You're ready to deploy!

## 🚀 Deployment Steps

### Step 1: Commit Your Changes

```bash
# Check what files changed
git status

# Add all WhatsApp bot files
git add .
git commit -m "Add WhatsApp bot integration with OpenAI"
git push origin main
```

### Step 2: Deploy to Production Server

**Option A: If using Git-based deployment**
```bash
# SSH to your production server
ssh your-server

# Navigate to your project directory
cd /path/to/your/project

# Pull latest changes
git pull origin main

# Install dependencies (if any new packages)
npm install
```

**Option B: Manual file transfer**
Upload these files to production:
- `src/routes/v1/whatsapp.route.js`
- `src/controllers/whatsapp.controller.js`
- `src/services/whatsapp.service.js`
- `src/models/whatsapp-conversation.model.js`
- Updated `src/routes/v1/index.js`
- Updated `src/config/config.js`
- Updated `src/models/index.js`

### Step 3: Set Environment Variables on Production

Make sure production `.env` has:

```bash
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=899295196592571
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=mywhatsapptoken123
WHATSAPP_API_VERSION=v22.0

# OpenAI Configuration
OPEN_AI_KEY=your_openai_key
ASSISTANTS_ID=asst_GxnU7A9JzBZPgp9pu6bTdW43
```

### Step 4: Restart Production Server

```bash
# If using PM2
pm2 restart all

# Or restart your service
systemctl restart your-service-name

# Or kill and restart
pkill -f "node.*src/index.js"
npm start
```

### Step 5: Verify Deployment

After deployment, run test again:
```bash
node test-whatsapp-webhook.js
```

Production should now show:
- ✅ Webhook Verification: PASS
- ✅ Message Handling: PASS

## 🔗 Configure Meta Console Webhook

Once production tests pass, configure webhook:

1. Go to: https://developers.facebook.com/
2. Select your App → WhatsApp → Configuration
3. Click "Edit" on Webhook section
4. Set:
   - **Callback URL**: `https://apis-samsarawellness.in/v1/whatsapp/webhook`
   - **Verify Token**: `mywhatsapptoken123`
5. Click "Verify and Save"
6. Subscribe to: `messages`
7. Click "Save"

## ✅ Final Checklist

- [ ] Code committed and pushed
- [ ] Files deployed to production server
- [ ] Environment variables set on production
- [ ] Production server restarted
- [ ] Production tests passing
- [ ] Webhook configured in Meta Console
- [ ] Test message sent from WhatsApp

## 🧪 Test After Deployment

1. Run test script:
   ```bash
   node test-whatsapp-webhook.js
   ```

2. Send a test WhatsApp message to your business number

3. Check production server logs for:
   ```
   ✅ Webhook verified successfully
   Incoming message from...
   Message processed: {...}
   ```

## 🎯 Expected Production Test Results

After deployment:
```
Production:
  ✅ Server Health: PASS
  ✅ Webhook Verification: PASS
  ✅ Message Handling: PASS
```

## 🔧 Troubleshooting

### Production still shows 404

1. Check if files were deployed
2. Verify routes are registered in `src/routes/v1/index.js`
3. Check server logs for errors
4. Restart server after deployment

### Webhook verification fails

1. Verify `WHATSAPP_VERIFY_TOKEN` matches in `.env` and Meta Console
2. Check token has no extra spaces/quotes
3. Ensure webhook URL is correct

### Messages not processing

1. Check MongoDB connection
2. Verify OpenAI credentials
3. Check server logs for errors
4. Verify WhatsApp access token is valid

## 📝 Quick Deployment Commands

```bash
# Full deployment workflow
git add .
git commit -m "Add WhatsApp bot"
git push origin main

# On production server:
git pull origin main
npm install  # if needed
pm2 restart all

# Test
node test-whatsapp-webhook.js
```

You're all set! 🚀

