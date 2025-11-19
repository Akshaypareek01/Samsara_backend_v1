# Zoom Meeting SDK Credentials Guide

## What Are SDK Keys/Secrets?

Zoom Meeting SDK credentials are **different** from OAuth credentials:
- **OAuth credentials** (Client ID/Secret) - Used to create meetings via API
- **SDK credentials** (SDK Key/Secret) - Used to generate signatures for joining meetings via Web SDK

## Required Environment Variables

Add these to your `.env` file for each Zoom account:

### Account 1 (Already configured with defaults)
```env
ZOOM_MEETING_SDK_KEY_1=TsFvuPFLTeKf7_bNBWggPA
ZOOM_MEETING_SDK_SECRET_1=C7Dm4JuZ2QXoN0bM2OYTw5JxZvjPK1y9
```

### Account 2 (REQUIRED - Add these)
```env
ZOOM_MEETING_SDK_KEY_2=your_account_2_sdk_key_here
ZOOM_MEETING_SDK_SECRET_2=your_account_2_sdk_secret_here
```

## How to Get SDK Key and Secret

### Step 1: Go to Zoom Marketplace
1. Visit: https://marketplace.zoom.us/
2. Sign in with your Zoom account (the one for account_2: tech.samsarawellness@gmail.com)

### Step 2: Create or Find Meeting SDK App
1. Click "Develop" → "Build App"
2. **Look for "Meeting SDK" option** - It's a separate app type, NOT one of the OAuth options
3. If you don't see "Meeting SDK" option:
   - Check "My Apps" to see if you already have a Meeting SDK app
   - The Meeting SDK app type might be under a different section
   - Try: https://marketplace.zoom.us/develop/create
4. **Alternative**: If you can't find Meeting SDK option:
   - You might need to use the same SDK key/secret from account_1 temporarily
   - Or check if account_2 has access to create Meeting SDK apps (some accounts need special permissions)

### Step 3: Get SDK Credentials
1. In your Meeting SDK app, go to "App Credentials"
2. You'll see:
   - **SDK Key** - Copy this (looks like: `TsFvuPFLTeKf7_bNBWggPA`)
   - **SDK Secret** - Copy this (long string)

### Step 4: Add to .env
Add these two lines to your `.env` file:
```env
ZOOM_MEETING_SDK_KEY_2=your_sdk_key_from_step_3
ZOOM_MEETING_SDK_SECRET_2=your_sdk_secret_from_step_3
```

## Important Notes

1. **Each Zoom account needs its own Meeting SDK app** - You can't reuse the same SDK key/secret across accounts
2. **SDK Key/Secret ≠ OAuth Client ID/Secret** - They're completely different
3. **Account 1 already has defaults** - Account 2 needs to be configured
4. **Restart your server** after adding to .env

## Quick Check

After adding to .env, restart your server and check the logs. You should see:
```
Initialized with 2 valid Zoom account(s):
  account_1: { ... hasClientSecret: true }
  account_2: { ... hasClientSecret: true }
```

If account_2 shows `hasClientSecret: false`, the SDK credentials are missing or incorrect.

