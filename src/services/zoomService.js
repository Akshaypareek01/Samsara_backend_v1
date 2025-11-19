import axios from 'axios';
import crypto from 'crypto';

/**
 * Centralized Zoom Service with Multiple Account Support
 * Handles load balancing across multiple Zoom accounts
 */

// Multiple Zoom account configurations
const ZOOM_ACCOUNTS = [
  {
    id: 'account_1',
    clientId: process.env.ZOOM_CLIENT_ID_1 || "_nLks8WMQDO1I34y6RQNXA",
    clientSecret: process.env.ZOOM_CLIENT_SECRET_1 || "hw06ETTGZMJ8s4LnphEi9A5SVtQUQNZJ",
    accountId: process.env.ZOOM_ACCOUNT_ID_1 || "C76CruAJSpitbs_UIRb4eQ",
    userId: process.env.ZOOM_USER_ID_1 || "developer@theodin.in",
    sdkKey: process.env.ZOOM_MEETING_SDK_KEY_1 || "TsFvuPFLTeKf7_bNBWggPA",
    sdkSecret: process.env.ZOOM_MEETING_SDK_SECRET_1 || "C7Dm4JuZ2QXoN0bM2OYTw5JxZvjPK1y9",
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 100 // Allow multiple meetings per account
  },
  {
    id: 'account_2',
    clientId: process.env.ZOOM_CLIENT_ID_2,
    clientSecret: process.env.ZOOM_CLIENT_SECRET_2,
    accountId: process.env.ZOOM_ACCOUNT_ID_2,
    userId: process.env.ZOOM_USER_ID_2,
    sdkKey: process.env.ZOOM_MEETING_SDK_KEY_2,
    sdkSecret: process.env.ZOOM_MEETING_SDK_SECRET_2,
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 100 // Allow multiple meetings per account
  },
  // {
  //   id: 'account_3',
  //   clientId: process.env.ZOOM_CLIENT_ID_3,
  //   clientSecret: process.env.ZOOM_CLIENT_SECRET_3,
  //   accountId: process.env.ZOOM_ACCOUNT_ID_3,
  //   userId: process.env.ZOOM_USER_ID_3,
  //   isActive: true,
  //   lastUsed: null,
  //   activeMeetings: 0,
  //   maxConcurrentMeetings: 100 // Allow multiple meetings per account
  // },
  // {
  //   id: 'account_4',
  //   clientId: process.env.ZOOM_CLIENT_ID_4,
  //   clientSecret: process.env.ZOOM_CLIENT_SECRET_4,
  //   accountId: process.env.ZOOM_ACCOUNT_ID_4,
  //   userId: process.env.ZOOM_USER_ID_4,
  //   isActive: true,
  //   lastUsed: null,
  //   activeMeetings: 0,
  //   maxConcurrentMeetings: 1
  // }
].filter(account => account.clientId && account.clientSecret && account.accountId);

// Sanitize and validate credentials
const sanitizeCredential = (value) => {
  if (!value) return null;
  // Remove whitespace and newlines
  return String(value).trim().replace(/\s+/g, '');
};

// Validate account credentials before adding to active accounts
const validateAccount = (account) => {
  // Sanitize credentials (remove whitespace, newlines)
  account.clientId = sanitizeCredential(account.clientId);
  account.clientSecret = sanitizeCredential(account.clientSecret);
  account.accountId = sanitizeCredential(account.accountId);
  account.userId = sanitizeCredential(account.userId);
  
  const hasRequiredFields = account.clientId && account.clientSecret && account.accountId && account.userId;
  if (!hasRequiredFields) {
    console.warn(`Account ${account.id} is missing required credentials and will be skipped`);
    return false;
  }
  
  // Check if credentials are not just empty strings
  const hasValidCredentials = 
    account.clientId !== '' && 
    account.clientSecret !== '' && 
    account.accountId !== '' &&
    account.userId !== '';
  
  if (!hasValidCredentials) {
    console.warn(`Account ${account.id} has empty credentials and will be skipped`);
    return false;
  }
  
  // Check for common credential mix-ups
  if (account.clientId && account.accountId) {
    // Check if Client ID starts with Account ID prefix (common mistake)
    if (account.clientId.toLowerCase().startsWith(account.accountId.substring(0, 3).toLowerCase())) {
      console.error(`\n🚨 CRITICAL ERROR: Account ${account.id} credentials are MIXED UP!`);
      console.error(`   Client ID starts with Account ID prefix: ${account.clientId.substring(0, 10)}...`);
      console.error(`   This usually means your .env file has the wrong values.`);
      console.error(`\n   ✅ CORRECT FORMAT for ${account.id}:`);
      console.error(`   ZOOM_CLIENT_ID_2="VGOjM_OiSsSY1mPGWltO8w"`);
      console.error(`   ZOOM_ACCOUNT_ID_2="gU-rDtLBRWCzudJTSBnM7A"`);
      console.error(`   ZOOM_USER_ID_2="tech.samsarawellness@gmail.com"`);
      console.error(`   ZOOM_CLIENT_SECRET_2="<your_secret_from_dashboard>"`);
      console.error(`\n   ⚠️  Client ID should NOT start with "gU-" (that's Account ID prefix)`);
      console.error(`   ⚠️  Client ID should start with "VGOjM_" (from Zoom dashboard)\n`);
      return false; // Reject account with mixed credentials
    }
  }
  
  return true;
};

// Filter and validate accounts
const validAccounts = ZOOM_ACCOUNTS.filter(validateAccount);

// Detailed logging for credential verification
console.log(`Initialized with ${validAccounts.length} valid Zoom account(s):`);
validAccounts.forEach(acc => {
  console.log(`  ${acc.id}:`, {
    userId: acc.userId,
    isActive: acc.isActive,
    clientId: acc.clientId ? `${acc.clientId.substring(0, 8)}...${acc.clientId.substring(acc.clientId.length - 4)}` : 'MISSING',
    clientIdLength: acc.clientId?.length || 0,
    accountId: acc.accountId || 'MISSING',
    accountIdLength: acc.accountId?.length || 0,
    hasClientSecret: !!acc.clientSecret
  });
});

// Check for potential credential mix-ups
validAccounts.forEach(acc => {
  if (acc.clientId && acc.accountId && acc.clientId.startsWith(acc.accountId.substring(0, 3))) {
    console.warn(`⚠️  WARNING: ${acc.id} Client ID might be mixed with Account ID!`);
    console.warn(`   Client ID starts with: ${acc.clientId.substring(0, 8)}`);
    console.warn(`   Account ID starts with: ${acc.accountId.substring(0, 8)}`);
  }
});

// Account usage tracking
let accountUsageTracker = new Map();

/**
 * Get the best available Zoom account based on load balancing
 * Supports multiple meetings per account and round-robin distribution
 * @returns {Object} Selected Zoom account configuration
 */
const getBestAvailableAccount = () => {
  // Only consider validated accounts
  const activeAccounts = validAccounts.filter(account => account.isActive);
  
  if (activeAccounts.length === 0) {
    const inactiveCount = validAccounts.filter(acc => !acc.isActive).length;
    console.error(`No active Zoom accounts available. Total validated accounts: ${validAccounts.length}, Inactive: ${inactiveCount}`);
    throw new Error('No active Zoom accounts available');
  }
  
  console.log(`Selecting from ${activeAccounts.length} active account(s):`, 
    activeAccounts.map(acc => ({ 
      id: acc.id, 
      activeMeetings: accountUsageTracker.get(acc.id)?.activeMeetings || 0,
      maxMeetings: acc.maxConcurrentMeetings
    }))
  );

  // If only one account, use it for all meetings (no capacity check)
  if (activeAccounts.length === 1) {
    const selectedAccount = activeAccounts[0];
    const currentUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0, lastUsed: 0 };
    accountUsageTracker.set(selectedAccount.id, {
      ...currentUsage,
      lastUsed: Date.now()
    });
    console.log(`Single account mode: Using ${selectedAccount.id} (${currentUsage.activeMeetings} active meetings)`);
    return selectedAccount;
  }

  // Multiple accounts: Load balancing logic
  // Filter out accounts that are at capacity
  const availableAccounts = activeAccounts.filter(account => {
    const activeMeetings = accountUsageTracker.get(account.id)?.activeMeetings || 0;
    return activeMeetings < account.maxConcurrentMeetings;
  });

  if (availableAccounts.length === 0) {
    // All accounts at capacity - use the one with least meetings
    const sortedByMeetings = activeAccounts.sort((a, b) => {
      const aMeetings = accountUsageTracker.get(a.id)?.activeMeetings || 0;
      const bMeetings = accountUsageTracker.get(b.id)?.activeMeetings || 0;
      return aMeetings - bMeetings;
    });
    const selectedAccount = sortedByMeetings[0];
    const currentUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0, lastUsed: 0 };
    accountUsageTracker.set(selectedAccount.id, {
      ...currentUsage,
      lastUsed: Date.now()
    });
    console.log(`All accounts busy, using least loaded: ${selectedAccount.id}`);
    return selectedAccount;
  }

  // Round-robin: Sort by active meetings (least loaded first), then by last used
  const sortedAccounts = availableAccounts.sort((a, b) => {
    const aMeetings = accountUsageTracker.get(a.id)?.activeMeetings || 0;
    const bMeetings = accountUsageTracker.get(b.id)?.activeMeetings || 0;
    
    // First sort by active meetings (least loaded first)
    if (aMeetings !== bMeetings) {
      return aMeetings - bMeetings;
    }
    
    // If same number of meetings, sort by last used (least recently used first)
    const aLastUsed = accountUsageTracker.get(a.id)?.lastUsed || 0;
    const bLastUsed = accountUsageTracker.get(b.id)?.lastUsed || 0;
    return aLastUsed - bLastUsed;
  });

  // Select the account with least meetings (round-robin effect)
  const selectedAccount = sortedAccounts[0];
  
  // Update usage tracker
  const currentUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0, lastUsed: 0 };
  accountUsageTracker.set(selectedAccount.id, {
    ...currentUsage,
    lastUsed: Date.now()
  });

  console.log(`Selected ${selectedAccount.id} for load balancing (${currentUsage.activeMeetings} active meetings)`);
  return selectedAccount;
};

/**
 * Get OAuth token for a specific Zoom account
 * @param {Object} account - Zoom account configuration
 * @returns {Promise<string>} OAuth access token
 */
const getZoomOAuthToken = async (account) => {
  try {
    console.log(`Attempting OAuth authentication for account ${account.id}...`);
    console.log(`Account ${account.id} details:`, {
      clientId: account.clientId ? `${account.clientId.substring(0, 8)}...${account.clientId.substring(account.clientId.length - 4)} (length: ${account.clientId.length})` : 'MISSING',
      clientSecret: account.clientSecret ? `***SET*** (length: ${account.clientSecret.length})` : 'MISSING',
      accountId: account.accountId ? `${account.accountId} (length: ${account.accountId.length})` : 'MISSING',
      userId: account.userId || 'MISSING'
    });
    
    // Validate Client ID format (should not start with Account ID prefix)
    if (account.clientId && account.accountId && account.clientId.startsWith(account.accountId.substring(0, 3))) {
      console.error(`🚨 CREDENTIAL ERROR: ${account.id} Client ID appears to have Account ID prefix!`);
      console.error(`   Expected Client ID format: VGOjM_... (from Zoom dashboard)`);
      console.error(`   Current Client ID starts: ${account.clientId.substring(0, 10)}...`);
      console.error(`   Account ID starts: ${account.accountId.substring(0, 10)}...`);
      console.error(`   ⚠️  Check your .env file - ZOOM_CLIENT_ID_2 should be: VGOjM_OiSsSY1mPGWltO8w`);
      console.error(`   ⚠️  And ZOOM_ACCOUNT_ID_2 should be: gU-rDtLBRWCzudJTSBnM7A`);
    }
    
    const authHeader = `Basic ${Buffer.from(`${account.clientId}:${account.clientSecret}`).toString('base64')}`;
    
    const tokenRes = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
          grant_type: 'account_credentials',
          account_id: account.accountId,
        },
      }
    );

    console.log(`✅ Successfully authenticated account ${account.id}`);
    return tokenRes.data.access_token;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error(`❌ Failed to get OAuth token for account ${account.id}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: errorDetails,
      accountId: account.id,
      userId: account.userId,
      clientIdPrefix: account.clientId ? account.clientId.substring(0, 8) : 'MISSING'
    });
    
    // Check if it's specifically an invalid_client error
    if (errorDetails?.error === 'invalid_client' || error.response?.status === 401) {
      console.error(`🔴 Account ${account.id} has INVALID credentials. This account will be marked inactive.`);
    }
    
    throw new Error(`Failed to authenticate with Zoom account ${account.id}: ${errorDetails?.error || errorDetails}`);
  }
};

/**
 * Create a Zoom meeting using the best available account
 * @param {Object} meetingData - Meeting configuration
 * @returns {Promise<Object>} Meeting creation result
 */
export const createZoomMeeting = async (meetingData) => {
  let selectedAccount = null;
  let attempts = 0;
  const maxAttempts = validAccounts.length;
  const triedAccounts = [];

  console.log(`\n🚀 Starting meeting creation. Available validated accounts: ${validAccounts.length}`);

  while (attempts < maxAttempts) {
    try {
      // Get the best available account (this now filters out busy accounts)
      selectedAccount = getBestAvailableAccount();
      
      // Safety check
      if (!selectedAccount || !selectedAccount.id) {
        console.error(`❌ getBestAvailableAccount returned invalid account:`, selectedAccount);
        throw new Error('Failed to get a valid account for meeting creation');
      }
      
      if (triedAccounts.includes(selectedAccount.id)) {
        console.warn(`⚠️  Account ${selectedAccount.id} was already tried, skipping to next account`);
        selectedAccount.isActive = false; // Temporarily disable to try next account
        attempts++;
        continue;
      }
      
      triedAccounts.push(selectedAccount.id);
      console.log(`\n📋 Attempt ${attempts + 1}/${maxAttempts}: Trying account ${selectedAccount.id}`);
      
      // Get OAuth token
      const zoomToken = await getZoomOAuthToken(selectedAccount);

      // Build meeting request
      const requestBody = {
        topic: meetingData.topic || "Meeting",
        type: 2,
        start_time: meetingData.startTime || new Date().toISOString(),
        duration: meetingData.duration || 60,
        timezone: meetingData.timezone || 'Asia/Kolkata',
        password: meetingData.password || "",
        agenda: meetingData.agenda || "",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          approval_type: 1,
          audio: 'both',
          auto_recording: 'local',
          waiting_room: false,
          ...meetingData.settings
        },
      };

      // Create the meeting
      const response = await axios.post(
        `https://api.zoom.us/v2/users/${selectedAccount.userId}/meetings`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomToken}`,
          },
        }
      );

      // Update usage tracker - increment active meetings
      const updatedUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0 };
      accountUsageTracker.set(selectedAccount.id, {
        ...updatedUsage,
        activeMeetings: updatedUsage.activeMeetings + 1,
        lastUsed: Date.now()
      });

      console.log(`Meeting created successfully using account ${selectedAccount.id}:`, {
        meetingId: response.data.id,
        accountId: selectedAccount.id,
        activeMeetings: updatedUsage.activeMeetings + 1
      });

      return {
        success: true,
        meetingId: response.data.id,
        password: response.data.password,
        joinUrl: response.data.join_url,
        accountUsed: selectedAccount.id,
        meetingData: response.data
      };

    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      console.error(`\n❌ Failed to create meeting with account ${selectedAccount?.id}:`, {
        status: error.response?.status,
        error: errorDetails,
        message: error.message
      });
      
      // If this is an authentication error, mark account as inactive temporarily
      if (error.response?.status === 401 || error.response?.status === 403 || errorDetails?.error === 'invalid_client') {
        console.warn(`🔴 Account ${selectedAccount?.id} authentication failed (${error.response?.status || 'invalid_client'}), marking as inactive`);
        if (selectedAccount) {
          selectedAccount.isActive = false;
        }
      }
      
      attempts++;
      
      // If we've tried all accounts, provide detailed error summary
      if (attempts >= maxAttempts) {
        const activeCount = validAccounts.filter(acc => acc.isActive).length;
        console.error(`\n💥 All ${maxAttempts} account(s) exhausted. Active accounts remaining: ${activeCount}`);
        console.error(`Tried accounts: ${triedAccounts.join(', ')}`);
        throw new Error(`Failed to create meeting after trying ${maxAttempts} account(s): ${error.message}`);
      }
      
      console.log(`\n🔄 Retrying with next available account... (${attempts}/${maxAttempts} attempts used)`);
    }
  }
};

/**
 * End a Zoom meeting and update account usage
 * @param {string} meetingId - Zoom meeting ID
 * @param {string} accountId - Account ID used to create the meeting
 * @returns {Promise<Object>} Meeting end result
 */
export const endZoomMeeting = async (meetingId, accountId) => {
  try {
    const account = validAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Get fresh OAuth token
    const zoomToken = await getZoomOAuthToken(account);

    // Delete the meeting
    const result = await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${zoomToken}`,
        'User-Agent': 'Zoom-api-Jwt-Request',
        'content-type': 'application/json'
      }
    });

    // Update usage tracker
    const currentUsage = accountUsageTracker.get(accountId) || { activeMeetings: 0 };
    accountUsageTracker.set(accountId, {
      ...currentUsage,
      activeMeetings: Math.max(0, currentUsage.activeMeetings - 1),
      lastUsed: Date.now()
    });

    console.log(`Meeting ${meetingId} ended successfully using account ${accountId}`);

    return {
      success: true,
      message: 'Meeting ended successfully',
      accountUsed: accountId
    };

  } catch (error) {
    // Handle 404 error gracefully (meeting already ended)
    if (error.response?.status === 404) {
      console.log(`Meeting ${meetingId} already ended or doesn't exist`);
      
      // Still update usage tracker
      const errorUsage = accountUsageTracker.get(accountId) || { activeMeetings: 0 };
      accountUsageTracker.set(accountId, {
        ...errorUsage,
        activeMeetings: Math.max(0, errorUsage.activeMeetings - 1),
        lastUsed: Date.now()
      });

      return {
        success: true,
        message: 'Meeting already ended',
        accountUsed: accountId
      };
    }

    console.error(`Failed to end meeting ${meetingId} with account ${accountId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get account usage statistics
 * @returns {Object} Account usage statistics
 */
export const getAccountUsageStats = () => {
  const stats = {};
  
  validAccounts.forEach(account => {
    const usage = accountUsageTracker.get(account.id) || { activeMeetings: 0, lastUsed: 0 };
    stats[account.id] = {
      ...account,
      ...usage,
      isActive: account.isActive,
      lastUsedFormatted: usage.lastUsed ? new Date(usage.lastUsed).toISOString() : 'Never'
    };
  });

  return stats;
};

/**
 * Reset account status (useful for recovery)
 * @param {string} accountId - Account ID to reset
 */
export const resetAccountStatus = (accountId) => {
  const account = validAccounts.find(acc => acc.id === accountId);
  if (account) {
    account.isActive = true;
    console.log(`Account ${accountId} status reset to active`);
  } else {
    console.warn(`Account ${accountId} not found in valid accounts`);
  }
};

/**
 * Reset all account statuses
 */
export const resetAllAccountStatuses = () => {
  validAccounts.forEach(account => {
    account.isActive = true;
  });
  console.log(`All ${validAccounts.length} account statuses reset to active`);
};

/**
 * Get account by ID
 * @param {string} accountId - Account ID (e.g., 'account_1', 'account_2')
 * @returns {Object|null} Account configuration or null if not found
 */
export const getAccountById = (accountId) => {
  return validAccounts.find(account => account.id === accountId) || null;
};

/**
 * Generate SDK signature for joining Zoom meetings
 * This signature must match the SDK key/secret of the account that created the meeting
 * @param {string} meetingNumber - Zoom meeting number
 * @param {number} role - User role (0 = participant, 1 = host)
 * @param {string} accountId - Account ID that created the meeting (e.g., 'account_1', 'account_2')
 * @returns {Object} SDK signature and key
 */
export const generateSDKSignature = (meetingNumber, role, accountId) => {
  try {
    const account = getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (!account.sdkKey || !account.sdkSecret) {
      throw new Error(`Account ${accountId} is missing SDK key or secret. Please configure ZOOM_MEETING_SDK_KEY_${accountId.split('_')[1]} and ZOOM_MEETING_SDK_SECRET_${accountId.split('_')[1]} in .env`);
    }

    // Generate JWT token for SDK signature (Zoom SDK format)
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours expiry

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Zoom SDK signature payload includes meeting number and role
    const payload = {
      iss: account.sdkKey,
      exp: exp,
      iat: iat,
      aud: 'zoom',
      appKey: account.sdkKey,
      tokenExp: exp,
      mn: meetingNumber.toString(), // Meeting number
      role: role // 0 = participant, 1 = host
    };

    // Create JWT signature using base64url encoding
    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const encodedPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', account.sdkSecret)
      .update(signatureInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const sdkSignature = `${signatureInput}.${signature}`;

    console.log(`Generated SDK signature for account ${accountId}, meeting ${meetingNumber}, role ${role}`);

    return {
      signature: sdkSignature,
      sdkKey: account.sdkKey,
      accountId: account.id
    };
  } catch (error) {
    console.error(`Error generating SDK signature for account ${accountId}:`, error.message);
    throw error;
  }
};

export default {
  createZoomMeeting,
  endZoomMeeting,
  getAccountUsageStats,
  resetAccountStatus,
  resetAllAccountStatuses,
  getAccountById,
  generateSDKSignature
};

// Export for testing purposes
export { ZOOM_ACCOUNTS, validAccounts, accountUsageTracker, getBestAvailableAccount };

