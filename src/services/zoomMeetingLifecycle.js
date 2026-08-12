import axios from 'axios';
import {
  getAccountById,
  getZoomOAuthToken,
  accountUsageTracker,
} from './zoomService.js';

/**
 * Decrements in-memory active meeting count for an account.
 * @param {string} accountId - Zoom account key (e.g. account_1)
 */
const decrementAccountUsage = (accountId) => {
  const currentUsage = accountUsageTracker.get(accountId) || { activeMeetings: 0 };
  accountUsageTracker.set(accountId, {
    ...currentUsage,
    activeMeetings: Math.max(0, currentUsage.activeMeetings - 1),
    lastUsed: Date.now(),
  });
};

/**
 * Ends a live Zoom meeting via Meeting status API (required for started meetings).
 * @param {string} meetingId - Zoom meeting number/id
 * @param {string} zoomToken - OAuth bearer token
 */
const endLiveMeetingStatus = async (meetingId, zoomToken) => {
  try {
    await axios.put(
      `https://api.zoom.us/v2/meetings/${meetingId}/status`,
      { action: 'end' },
      {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Samsara-Zoom-Integration/1.0',
        },
        timeout: 20000,
      }
    );
    return { ended: true };
  } catch (error) {
    // 400/404 often means meeting is not currently in progress
    const status = error.response?.status;
    if (status === 400 || status === 404) {
      return { ended: false, reason: 'not_in_progress' };
    }
    throw error;
  }
};

/**
 * Deletes a Zoom meeting object after it is no longer live.
 * @param {string} meetingId - Zoom meeting number/id
 * @param {string} zoomToken - OAuth bearer token
 */
const deleteMeetingObject = async (meetingId, zoomToken) => {
  try {
    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Samsara-Zoom-Integration/1.0',
      },
      timeout: 20000,
    });
    return { deleted: true };
  } catch (error) {
    if (error.response?.status === 404) {
      return { deleted: false, reason: 'already_gone' };
    }
    throw error;
  }
};

/**
 * Ends (and then deletes) a Zoom meeting, updating local account usage.
 * Live meetings must use PUT /status action=end; DELETE alone leaves the host stuck.
 * @param {string} meetingId - Zoom meeting ID
 * @param {string} accountId - Account ID used to create the meeting
 * @returns {Promise<Object>} Meeting end result
 */
export const endZoomMeeting = async (meetingId, accountId) => {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  try {
    const zoomToken = await getZoomOAuthToken(account);
    await endLiveMeetingStatus(meetingId, zoomToken);
    await deleteMeetingObject(meetingId, zoomToken);
    decrementAccountUsage(accountId);

    console.log(`Meeting ${meetingId} ended successfully using account ${accountId}`);
    return {
      success: true,
      message: 'Meeting ended successfully',
      accountUsed: accountId,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Meeting ${meetingId} already ended or doesn't exist`);
      decrementAccountUsage(accountId);
      return {
        success: true,
        message: 'Meeting already ended',
        accountUsed: accountId,
      };
    }

    console.error(
      `Failed to end meeting ${meetingId} with account ${accountId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Lists currently live meetings for a Zoom user.
 * @param {Object} account - Validated Zoom account config
 * @param {string} zoomToken - OAuth bearer token
 * @returns {Promise<Array<{id: number|string}>>}
 */
const listLiveMeetings = async (account, zoomToken) => {
  try {
    const response = await axios.get(
      `https://api.zoom.us/v2/users/${encodeURIComponent(account.userId)}/meetings`,
      {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
          'User-Agent': 'Samsara-Zoom-Integration/1.0',
        },
        params: {
          type: 'live',
          page_size: 30,
        },
        timeout: 20000,
      }
    );
    return Array.isArray(response.data?.meetings) ? response.data.meetings : [];
  } catch (error) {
    console.error(
      `Failed to list live meetings for ${account.id}:`,
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Ends other live meetings on the same Zoom host so SDK host-join is not blocked.
 * Zoom shows "You are hosting another meeting" when the host user already has a live session.
 * @param {string} accountId - Zoom account key
 * @param {string|number|null} exceptMeetingId - Meeting to keep alive (the one being joined)
 * @returns {Promise<{ended: Array<string|number>, kept: string|number|null}>}
 */
/**
 * Fetches a Zoom Access Key (ZAK) for host start/join via Meeting SDK.
 * Without ZAK, role=1 joins often fail with "You are hosting another meeting".
 * @param {string} accountId - Zoom account key (e.g. account_2)
 * @param {string|number|null} exceptMeetingId - Meeting to keep (the one being joined)
 * @returns {Promise<{zak: string, hostEmail: string, hostName: string, accountType: number|null, pmi: string|null}>}
 */
export const getZoomZakToken = async (accountId, exceptMeetingId = null) => {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const zoomToken = await getZoomOAuthToken(account);

  const response = await axios.get(
    `https://api.zoom.us/v2/users/${encodeURIComponent(account.userId)}/token`,
    {
      headers: {
        Authorization: `Bearer ${zoomToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Samsara-Zoom-Integration/1.0',
      },
      params: {
        type: 'zak',
        ttl: 7200,
      },
      timeout: 20000,
    }
  );

  const zak = response.data?.token;
  if (!zak) {
    throw new Error(`ZAK token missing in Zoom response for ${accountId}`);
  }

  let hostName = account.userId;
  let accountType = null;
  let pmi = null;
  try {
    const userRes = await axios.get(
      `https://api.zoom.us/v2/users/${encodeURIComponent(account.userId)}`,
      {
        headers: { Authorization: `Bearer ${zoomToken}` },
        timeout: 15000,
      }
    );
    hostName = userRes.data?.display_name || userRes.data?.first_name || account.userId;
    accountType = userRes.data?.type ?? null;
    pmi = userRes.data?.pmi != null ? String(userRes.data.pmi) : null;
    if (accountType === 1) {
      console.warn(
        `⚠️ Zoom user ${account.userId} is Basic (type=1). Concurrent host sessions are restricted — upgrade to Pro for reliable SDK hosting.`
      );
    }
  } catch (userError) {
    console.warn(`Could not load Zoom user profile for ${accountId}:`, userError.message);
  }

  return {
    zak,
    hostEmail: account.userId,
    hostName,
    accountType,
    pmi,
  };
};

export const endOtherLiveMeetingsForAccount = async (accountId, exceptMeetingId = null) => {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const zoomToken = await getZoomOAuthToken(account);
  const liveMeetings = await listLiveMeetings(account, zoomToken);
  const exceptId = exceptMeetingId != null ? String(exceptMeetingId) : null;
  const ended = [];

  for (const meeting of liveMeetings) {
    const meetingId = String(meeting.id);
    if (exceptId && meetingId === exceptId) {
      continue;
    }
    try {
      await endLiveMeetingStatus(meetingId, zoomToken);
      ended.push(meetingId);
      console.log(`Ended conflicting live meeting ${meetingId} on ${accountId}`);
    } catch (error) {
      console.warn(
        `Could not end live meeting ${meetingId} on ${accountId}:`,
        error.response?.data || error.message
      );
    }
  }

  return { ended, kept: exceptId };
};

export default {
  endZoomMeeting,
  endOtherLiveMeetingsForAccount,
  getZoomZakToken,
};
