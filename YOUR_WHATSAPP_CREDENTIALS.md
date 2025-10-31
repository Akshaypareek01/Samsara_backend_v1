# Your WhatsApp Credentials (Extracted from Meta Template)

Based on your Meta template curl command, here are your credentials:

## ✅ Credentials Identified

From your curl command:
```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/899295196592571/messages \
  -H 'Authorization: Bearer EAATJE0puaB8BP5ghD1Ty0ka2eDZCwNlr7kx4lNftTGIjPek2t8oqeIwLmieeGMCL4UrqlZBj7QZCJ8SHgAsFnOk4djg6I71QTYGAxLIMBxZCDUDTWmZA9kQbOuc33ZCBAb6c7x3kUGOKPUjFQBm3pKMz1SRBHr7ZAtSEqoqlKcreQqyGRZBVSeJpKGAZB5odRD5xhKphgWwS4BrGDo7K9KyihGyk3UONwo25qiJOQ419sE9TeS92m2v3psmVB1DZAhtPtVekx4J5sybz9apKnoab5EhObk'
```

### Extracted Values:

1. **WHATSAPP_API_VERSION**: `v22.0`
2. **WHATSAPP_PHONE_NUMBER_ID**: `899295196592571`
3. **WHATSAPP_ACCESS_TOKEN**: `EAATJE0puaB8BP5ghD1Ty0ka2eDZCwNlr7kx4lNftTGIjPek2t8oqeIwLmieeGMCL4UrqlZBj7QZCJ8SHgAsFnOk4djg6I71QTYGAxLIMBxZCDUDTWmZA9kQbOuc33ZCBAb6c7x3kUGOKPUjFQBm3pKMz1SRBHr7ZAtSEqoqlKcreQqyGRZBVSeJpKGAZB5odRD5xhKphgWwS4BrGDo7K9KyihGyk3UONwo25qiJOQ419sE9TeS92m2v3psmVB1DZAhtPtVekx4J5sybz9apKnoab5EhObk`

## 📝 Your Complete .env Configuration

Add these to your `.env` file:

```bash
# OpenAI (You already have these)
OPEN_AI_KEY=sk-...your-key...
ASSISTANTS_ID=asst-...your-id...

# WhatsApp - From Meta (Extracted from curl command)
WHATSAPP_PHONE_NUMBER_ID=899295196592571
WHATSAPP_ACCESS_TOKEN=EAATJE0puaB8BP5ghD1Ty0ka2eDZCwNlr7kx4lNftTGIjPek2t8oqeIwLmieeGMCL4UrqlZBj7QZCJ8SHgAsFnOk4djg6I71QTYGAxLIMBxZCDUDTWmZA9kQbOuc33ZCBAb6c7x3kUGOKPUjFQBm3pKMz1SRBHr7ZAtSEqoqlKcreQqyGRZBVSeJpKGAZB5odRD5xhKphgWwS4BrGDo7K9KyihGyk3UONwo25qiJOQ419sE9TeS92m2v3psmVB1DZAhtPtVekx4J5sybz9apKnoab5EhObk
WHATSAPP_API_VERSION=v22.0

# WhatsApp - Generate this yourself
WHATSAPP_VERIFY_TOKEN=generate_random_string_here

# WhatsApp - Optional (from Business Manager)
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_if_available
```

## 🔑 Still Need: WHATSAPP_VERIFY_TOKEN

Generate this yourself:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Use this same token in:
- Your `.env` file
- Meta webhook configuration

## 🧪 Test Your Setup

After adding credentials to `.env`, test with:

```bash
node test-whatsapp-bot.js
```

Or test via API:

```bash
# Send a test message
curl -X POST http://localhost:3000/v1/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "918290918154",
    "message": "Test message from API"
  }'
```

## 📱 Phone Number Format

**Important:** WhatsApp API expects phone numbers without `+` sign.

✅ Correct: `918290918154`  
❌ Wrong: `+918290918154`

Your bot will automatically format numbers correctly.

## 🚀 Next Steps

1. ✅ Add credentials to `.env` (you have most of them)
2. ⏳ Generate `WHATSAPP_VERIFY_TOKEN`
3. ⏳ Configure webhook in Meta Console:
   - URL: `https://your-domain.com/v1/whatsapp/webhook`
   - Verify Token: (same as WHATSAPP_VERIFY_TOKEN)
   - Subscribe to: `messages`
4. ⏳ Test by sending a message to your WhatsApp Business number

## 🔍 Difference: Template vs Text Message

Your Meta template sends:
```json
{
  "type": "template",
  "template": { "name": "hello_world", "language": { "code": "en_US" } }
}
```

Your bot sends:
```json
{
  "type": "text",
  "text": { "body": "Your AI-generated message here" }
}
```

Both work! Templates need to be approved by Meta first. Regular text messages work immediately.

## ⚠️ Important Notes

1. **Access Token Expiry**: The token in the curl command might be temporary (expires in 24 hours). Generate a permanent token via System Users for production.

2. **Phone Number Format**: Use format `918290918154` (country code + number, no +)

3. **API Version**: Your app uses `v22.0` - I've updated the default to match.

4. **Webhook Setup**: After adding credentials, configure the webhook in Meta Console using your generated `WHATSAPP_VERIFY_TOKEN`.

## ✅ Status

- ✅ API Version: `v22.0` (updated)
- ✅ Phone Number ID: `899295196592571`
- ✅ Access Token: Found
- ⏳ Verify Token: Generate and add
- ⏳ Webhook: Configure in Meta Console

Everything is ready to go once you add the verify token! 🚀

