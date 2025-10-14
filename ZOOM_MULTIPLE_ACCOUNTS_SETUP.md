# Zoom Multiple Account Configuration Guide

## Environment Variables Setup

Add the following environment variables to your `.env` file to configure multiple Zoom accounts:

### Primary Account (Account 1) - Required
```env
# Primary Zoom Account
ZOOM_CLIENT_ID_1="_nLks8WMQDO1I34y6RQNXA"
ZOOM_CLIENT_SECRET_1="hw06ETTGZMJ8s4LnphEi9A5SVtQUQNZJ"
ZOOM_ACCOUNT_ID_1="C76CruAJSpitbs_UIRb4eQ"
ZOOM_USER_ID_1="developer@theodin.in"
```

### Secondary Account (Account 2) - Optional
```env
# Secondary Zoom Account
ZOOM_CLIENT_ID_2="your_second_client_id"
ZOOM_CLIENT_SECRET_2="your_second_client_secret"
ZOOM_ACCOUNT_ID_2="your_second_account_id"
ZOOM_USER_ID_2="your_second_user_email"
```

### Tertiary Account (Account 3) - Optional
```env
# Tertiary Zoom Account
ZOOM_CLIENT_ID_3="your_third_client_id"
ZOOM_CLIENT_SECRET_3="your_third_client_secret"
ZOOM_ACCOUNT_ID_3="your_third_account_id"
ZOOM_USER_ID_3="your_third_user_email"
```

## How to Get Zoom Account Credentials

### 1. Create Zoom App
1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account
3. Click "Develop" → "Build App"
4. Choose "Server-to-Server OAuth" app type
5. Fill in the required information

### 2. Get Credentials
After creating the app, you'll get:
- **Client ID**: Found in the "App Credentials" section
- **Client Secret**: Found in the "App Credentials" section  
- **Account ID**: Found in the "App Credentials" section
- **User ID**: Your Zoom account email address

### 3. Configure App Settings
In your Zoom app settings:
- Enable "Meeting" scope
- Set redirect URI (if needed)
- Configure webhook endpoints (if needed)

## Account Configuration Notes

- **Account 1** is required and will be used as fallback
- **Account 2** and **Account 3** are optional
- Only accounts with valid credentials will be used
- The system automatically load balances between available accounts
- Each account can handle up to 10 concurrent meetings by default

## Monitoring and Management

The system provides several endpoints for monitoring account usage:

### Get Account Usage Statistics
```http
GET /api/v1/zoom/account-stats
```

### Reset Account Status (if account becomes inactive)
```http
POST /api/v1/zoom/reset-account/:accountId
```

### Reset All Account Statuses
```http
POST /api/v1/zoom/reset-all-accounts
```

## Load Balancing Logic

The system uses intelligent load balancing:

1. **Primary Selection**: Accounts with fewer active meetings
2. **Secondary Selection**: Least recently used account
3. **Capacity Check**: Accounts at capacity are temporarily disabled
4. **Fallback**: If all accounts fail, the system tries all accounts before failing

## Error Handling

- **Authentication Errors**: Account is marked as inactive temporarily
- **Capacity Errors**: Account is marked as inactive until meetings end
- **Network Errors**: System retries with next available account
- **All Accounts Failed**: Returns error after trying all accounts

## Database Schema Updates

The system now tracks which account was used for each meeting:

### Classes Collection
```javascript
{
  // ... existing fields
  zoomAccountUsed: "account_1", // New field to track account used
}
```

### Events Collection
```javascript
{
  // ... existing fields
  zoomAccountUsed: "account_1", // New field to track account used
}
```

### Custom Sessions Collection
```javascript
{
  // ... existing fields
  zoomAccountUsed: "account_1", // New field to track account used
}
```

## Testing Multiple Accounts

1. **Start Multiple Meetings**: Create meetings simultaneously to test load balancing
2. **Monitor Logs**: Check console logs for account selection
3. **Check Statistics**: Use the account stats endpoint to monitor usage
4. **Test Failover**: Temporarily disable an account to test failover

## Troubleshooting

### Common Issues

1. **"No active Zoom accounts available"**
   - Check if environment variables are set correctly
   - Verify account credentials are valid
   - Ensure accounts are not all marked as inactive

2. **"Account authentication failed"**
   - Verify Client ID, Client Secret, and Account ID
   - Check if the Zoom app is properly configured
   - Ensure the app has necessary permissions

3. **"Account is at capacity"**
   - Wait for existing meetings to end
   - Increase maxConcurrentMeetings limit
   - Add more accounts to handle load

### Debug Commands

```bash
# Check account status
curl -X GET http://localhost:3000/api/v1/zoom/account-stats

# Reset specific account
curl -X POST http://localhost:3000/api/v1/zoom/reset-account/account_1

# Reset all accounts
curl -X POST http://localhost:3000/api/v1/zoom/reset-all-accounts
```

## Performance Benefits

- **Increased Capacity**: Multiple accounts = more concurrent meetings
- **Better Reliability**: If one account fails, others continue working
- **Load Distribution**: Meetings are distributed across accounts
- **Automatic Failover**: System automatically switches to available accounts
- **Usage Tracking**: Monitor which accounts are being used most

## Security Considerations

- Store credentials securely in environment variables
- Never commit credentials to version control
- Regularly rotate credentials
- Monitor account usage for unusual patterns
- Set up alerts for account failures
