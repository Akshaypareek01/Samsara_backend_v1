import axios from 'axios';

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
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 10
  },
  {
    id: 'account_2',
    clientId: process.env.ZOOM_CLIENT_ID_2,
    clientSecret: process.env.ZOOM_CLIENT_SECRET_2,
    accountId: process.env.ZOOM_ACCOUNT_ID_2,
    userId: process.env.ZOOM_USER_ID_2,
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 10
  },
  {
    id: 'account_3',
    clientId: process.env.ZOOM_CLIENT_ID_3,
    clientSecret: process.env.ZOOM_CLIENT_SECRET_3,
    accountId: process.env.ZOOM_ACCOUNT_ID_3,
    userId: process.env.ZOOM_USER_ID_3,
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 10
  },
  {
    id: 'account_4',
    clientId: process.env.ZOOM_CLIENT_ID_4,
    clientSecret: process.env.ZOOM_CLIENT_SECRET_4,
    accountId: process.env.ZOOM_ACCOUNT_ID_4,
    userId: process.env.ZOOM_USER_ID_4,
    isActive: true,
    lastUsed: null,
    activeMeetings: 0,
    maxConcurrentMeetings: 10
  }
].filter(account => account.clientId && account.clientSecret && account.accountId);

// Account usage tracking
let accountUsageTracker = new Map();

/**
 * Get the best available Zoom account based on load balancing
 * @returns {Object} Selected Zoom account configuration
 */
const getBestAvailableAccount = () => {
  const activeAccounts = ZOOM_ACCOUNTS.filter(account => account.isActive);
  
  if (activeAccounts.length === 0) {
    throw new Error('No active Zoom accounts available');
  }

  // Sort accounts by least active meetings and least recently used
  const sortedAccounts = activeAccounts.sort((a, b) => {
    const aActiveMeetings = accountUsageTracker.get(a.id)?.activeMeetings || 0;
    const bActiveMeetings = accountUsageTracker.get(b.id)?.activeMeetings || 0;
    
    if (aActiveMeetings !== bActiveMeetings) {
      return aActiveMeetings - bActiveMeetings;
    }
    
    const aLastUsed = accountUsageTracker.get(a.id)?.lastUsed || 0;
    const bLastUsed = accountUsageTracker.get(b.id)?.lastUsed || 0;
    
    return aLastUsed - bLastUsed;
  });

  const selectedAccount = sortedAccounts[0];
  
  // Update usage tracker
  const currentUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0, lastUsed: 0 };
  accountUsageTracker.set(selectedAccount.id, {
    ...currentUsage,
    lastUsed: Date.now()
  });

  return selectedAccount;
};

/**
 * Get OAuth token for a specific Zoom account
 * @param {Object} account - Zoom account configuration
 * @returns {Promise<string>} OAuth access token
 */
const getZoomOAuthToken = async (account) => {
  try {
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

    return tokenRes.data.access_token;
  } catch (error) {
    console.error(`Failed to get OAuth token for account ${account.id}:`, error.response?.data || error.message);
    throw new Error(`Failed to authenticate with Zoom account ${account.id}`);
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
  const maxAttempts = ZOOM_ACCOUNTS.length;

  while (attempts < maxAttempts) {
    try {
      // Get the best available account
      selectedAccount = getBestAvailableAccount();
      
      // Check if account has capacity for more meetings
      const currentUsage = accountUsageTracker.get(selectedAccount.id) || { activeMeetings: 0 };
      if (currentUsage.activeMeetings >= selectedAccount.maxConcurrentMeetings) {
        console.warn(`Account ${selectedAccount.id} is at capacity (${currentUsage.activeMeetings}/${selectedAccount.maxConcurrentMeetings})`);
        selectedAccount.isActive = false; // Temporarily disable this account
        attempts++;
        continue;
      }

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

      // Update usage tracker
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
      console.error(`Failed to create meeting with account ${selectedAccount?.id}:`, error.response?.data || error.message);
      
      // If this is an authentication error, mark account as inactive temporarily
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn(`Account ${selectedAccount?.id} authentication failed, marking as inactive`);
        if (selectedAccount) {
          selectedAccount.isActive = false;
        }
      }
      
      attempts++;
      
      // If we've tried all accounts, throw the error
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to create meeting after trying ${maxAttempts} accounts: ${error.message}`);
      }
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
    const account = ZOOM_ACCOUNTS.find(acc => acc.id === accountId);
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
  
  ZOOM_ACCOUNTS.forEach(account => {
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
  const account = ZOOM_ACCOUNTS.find(acc => acc.id === accountId);
  if (account) {
    account.isActive = true;
    console.log(`Account ${accountId} status reset to active`);
  }
};

/**
 * Reset all account statuses
 */
export const resetAllAccountStatuses = () => {
  ZOOM_ACCOUNTS.forEach(account => {
    account.isActive = true;
  });
  console.log('All account statuses reset to active');
};

export default {
  createZoomMeeting,
  endZoomMeeting,
  getAccountUsageStats,
  resetAccountStatus,
  resetAllAccountStatuses
};

// Export for testing purposes
export { ZOOM_ACCOUNTS, accountUsageTracker, getBestAvailableAccount };
