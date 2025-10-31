# Where to Find Meta WhatsApp Credentials - Step by Step

This guide shows you exactly where to find each credential in Meta's interface.

## 📋 Required Credentials

1. `WHATSAPP_PHONE_NUMBER_ID`
2. `WHATSAPP_ACCESS_TOKEN`
3. `WHATSAPP_VERIFY_TOKEN` (you generate this)
4. `WHATSAPP_API_VERSION` (usually `v21.0`)
5. `WHATSAPP_BUSINESS_ACCOUNT_ID` (optional, but good to have)

---

## Step 1: Get WHATSAPP_PHONE_NUMBER_ID

### Method 1: From Meta Developers Dashboard

1. Go to **https://developers.facebook.com/**
2. Select your **App** (or create one)
3. Click on **WhatsApp** in the left menu
4. Go to **API Setup** tab
5. Under "Send and receive messages", you'll see:
   - **Phone number ID** (this is what you need)
   - It's a long number like: `1234567890123456`
6. **Copy this number** → This is your `WHATSAPP_PHONE_NUMBER_ID`

### Method 2: From Business Manager

1. Go to **https://business.facebook.com/**
2. Click on **WhatsApp Manager**
3. Select your phone number
4. Click on the phone number → **API** section
5. Find **Phone Number ID** → Copy it

**Visual Guide:**
```
Meta Developers → Your App → WhatsApp → API Setup
Look for "Phone number ID" (long numeric string)
```

---

## Step 2: Get WHATSAPP_ACCESS_TOKEN

### Option A: Temporary Token (Quick Test)

1. Go to **https://developers.facebook.com/**
2. Select your **App**
3. Click **WhatsApp** → **API Setup**
4. Scroll down to "Temporary access token"
5. Click **Copy** → This expires in 24 hours

### Option B: Permanent Token (Recommended for Production)

1. Go to **https://developers.facebook.com/**
2. Select your **App**
3. Go to **Settings** → **WhatsApp** → **API Setup**
4. Scroll to "System Users" section
5. Click **"Create System User"** (if you don't have one)
6. Click **"Generate New Token"**
7. Select permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
8. Click **Generate Token**
9. **Copy the token** (starts with `EAA...`) → This is your `WHATSAPP_ACCESS_TOKEN`

**⚠️ Important:** Save this token immediately - you can only see it once!

**Visual Guide:**
```
Meta Developers → Your App → Settings → WhatsApp → API Setup
→ System Users → Generate New Token
Copy the token (EAAxxxxxxxxxxxxx)
```

---

## Step 3: Generate WHATSAPP_VERIFY_TOKEN

**You create this yourself** - it's just a random string for webhook verification.

### Generate a Random Token

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Any Random String**
- Just use any random string like: `my_secure_verify_token_2024`
- Make it unique and secure
- Use the **same token** in `.env` and Meta webhook config

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Step 4: WHATSAPP_API_VERSION

**Default value:** `v21.0`

1. Go to **https://developers.facebook.com/docs/whatsapp/cloud-api/overview**
2. Check the latest API version
3. Usually it's `v21.0` or `v22.0`
4. Use the version that matches your app's setup

**Common values:**
- `v21.0` (most common)
- `v22.0` (latest)
- `v20.0` (older)

---

## Step 5: Get WHATSAPP_BUSINESS_ACCOUNT_ID

### Method 1: From Webhook URL

1. When you set up the webhook, Meta sends webhooks to:
   ```
   https://your-domain.com/v1/whatsapp/webhook
   ```
2. The webhook payload contains `id` field in the entry
3. Or check the webhook URL structure

### Method 2: From API Response

1. Make an API call to:
   ```
   GET https://graph.facebook.com/v21.0/{phone-number-id}
   ```
2. Use your Phone Number ID
3. Include access token in headers
4. Response will contain business account info

### Method 3: From Meta Business Manager

1. Go to **https://business.facebook.com/**
2. Click **WhatsApp Manager**
3. Select your account
4. Check the URL - it contains the ID
5. Or check **Settings** → **Account Info**

**Visual Guide:**
```
Business Manager → WhatsApp Manager → Account Settings
The Business Account ID is usually in the URL or settings page
```

**Format:** Usually starts with numbers like: `123456789012345`

---

## 🎯 Complete .env Example

```bash
# OpenAI (You already have these)
OPEN_AI_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASSISTANTS_ID=asst-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp Credentials from Meta
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
WHATSAPP_API_VERSION=v21.0
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

---

## 🔍 Quick Verification Checklist

After adding credentials, verify:

- [ ] `WHATSAPP_PHONE_NUMBER_ID` - Long number (15-20 digits)
- [ ] `WHATSAPP_ACCESS_TOKEN` - Starts with `EAA` (long string)
- [ ] `WHATSAPP_VERIFY_TOKEN` - Random string you generated
- [ ] `WHATSAPP_API_VERSION` - Usually `v21.0`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` - Long number (optional)

---

## 🚨 Common Issues

### "Phone Number ID not found"
- Make sure you've added WhatsApp product to your app
- Check you're looking at the correct phone number
- Verify your app has WhatsApp permissions

### "Access Token invalid"
- Check if temporary token expired (24 hours)
- Generate a permanent token via System Users
- Verify token has correct permissions

### "Webhook verification failed"
- Make sure `WHATSAPP_VERIFY_TOKEN` matches in `.env` and Meta
- Check webhook URL is accessible via HTTPS
- Verify webhook endpoint is responding

---

## 📞 Still Can't Find It?

**For Phone Number ID:**
1. Meta Developers → Your App → WhatsApp → API Setup
2. Look for "Phone number ID" in the from/to fields

**For Access Token:**
1. Meta Developers → Your App → Settings → WhatsApp
2. Go to "System Users" section
3. Generate a new token with WhatsApp permissions

**For Business Account ID:**
1. Check webhook payload logs when message arrives
2. Look for `entry[0].id` in webhook JSON
3. Or use Graph API: `/me?fields=whatsapp_business_accounts`

---

## 🎓 Next Steps After Getting Credentials

1. ✅ Add all credentials to `.env`
2. ✅ Configure webhook in Meta Console
3. ✅ Test with a WhatsApp message
4. ✅ Check server logs for incoming messages

See `WHATSAPP_BOT_SETUP_GUIDE.md` for webhook configuration details.

