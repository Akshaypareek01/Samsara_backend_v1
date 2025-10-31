# WhatsApp Credentials - Quick Reference

## 🔑 Where to Find Each Credential

### 1️⃣ WHATSAPP_PHONE_NUMBER_ID

**Location:** Meta Developers → Your App → WhatsApp → API Setup

**What it looks like:**
```
Phone number ID: 1234567890123456
```

**Steps:**
1. https://developers.facebook.com/
2. Select your App
3. WhatsApp (left menu)
4. API Setup tab
5. Copy "Phone number ID"

---

### 2️⃣ WHATSAPP_ACCESS_TOKEN

**Location:** Meta Developers → Your App → Settings → WhatsApp → System Users

**What it looks like:**
```
EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Steps:**
1. https://developers.facebook.com/
2. Your App → Settings
3. WhatsApp → API Setup
4. Scroll to "System Users"
5. Generate New Token
6. Select permissions
7. Copy token (starts with `EAA`)

**⚠️ Important:** Save immediately - only shown once!

---

### 3️⃣ WHATSAPP_VERIFY_TOKEN

**You create this!** Generate a random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**What it looks like:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Use the **same token** in:
- `.env` file
- Meta webhook configuration

---

### 4️⃣ WHATSAPP_API_VERSION

**Default:** `v21.0`

**Location:** https://developers.facebook.com/docs/whatsapp/cloud-api/overview

Just use `v21.0` unless Meta specifies otherwise.

---

### 5️⃣ WHATSAPP_BUSINESS_ACCOUNT_ID

**Location:** Business Manager → WhatsApp Manager → Account Settings

**What it looks like:**
```
123456789012345
```

**Steps:**
1. https://business.facebook.com/
2. WhatsApp Manager
3. Account Settings
4. Find Business Account ID
5. Or check webhook payload `entry[0].id`

---

## 📝 Complete .env Template

```bash
# OpenAI (You have these)
OPEN_AI_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASSISTANTS_ID=asst-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp (Get from Meta)
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
WHATSAPP_API_VERSION=v21.0
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

---

## 🎯 Direct Links

- **Meta Developers:** https://developers.facebook.com/
- **Business Manager:** https://business.facebook.com/
- **WhatsApp API Docs:** https://developers.facebook.com/docs/whatsapp

---

## ✅ Verification

After adding to `.env`, check:

- [ ] All values are filled (no empty spaces)
- [ ] Phone Number ID is numeric (15-20 digits)
- [ ] Access Token starts with `EAA`
- [ ] Verify Token is random string
- [ ] API Version is `v21.0`

---

## 🚀 Quick Start

1. **Get Phone Number ID** → Meta Developers → WhatsApp → API Setup
2. **Get Access Token** → Settings → WhatsApp → System Users → Generate
3. **Generate Verify Token** → Run the Node.js command above
4. **Set API Version** → Use `v21.0`
5. **Get Business Account ID** → Business Manager → WhatsApp Manager

**See `META_CREDENTIALS_GUIDE.md` for detailed step-by-step instructions.**

