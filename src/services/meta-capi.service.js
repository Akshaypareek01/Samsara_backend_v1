import crypto from 'crypto';
import axios from 'axios';
import config from '../config/config.js';
import logger from '../config/logger.js';

const ANDROID_PACKAGE = 'com.samsarawellnessyogav3.app';
const IOS_BUNDLE = 'com.samsarawellnessyogav3.app';

/**
 * SHA-256 hex digest. Meta expects hashed external_id.
 * @param {string} value
 * @returns {string}
 */
function sha256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

/**
 * Minimal extinfo required for action_source "app". Device fields we do not
 * have on the server stay empty; version and bundle are enough for the API.
 * @param {'ios' | 'android' | string} platform
 * @returns {string[]}
 */
function buildExtInfo(platform) {
  const version = platform === 'ios' ? 'i2' : 'a2';
  const bundle = platform === 'ios' ? IOS_BUNDLE : ANDROID_PACKAGE;
  return [version, bundle, '', '', '1.0', '', '', '', '', '', '', '', '', '', '', ''];
}

/**
 * Whether Conversions API credentials are configured.
 * @returns {boolean}
 */
export function isMetaCapiConfigured() {
  return Boolean(config.meta?.datasetId && config.meta?.accessToken);
}

/**
 * Send Purchase and Subscribe for a confirmed membership charge.
 * Errors are logged and swallowed so payment activation is never blocked.
 *
 * @param {{
 *   eventId: string,
 *   userId: string,
 *   value?: number,
 *   currency?: string,
 *   contentId?: string,
 *   platform?: string,
 *   eventTime?: Date | number,
 * }} payload
 * @returns {Promise<void>}
 */
export async function sendMembershipPurchaseEvents(payload) {
  if (!payload?.eventId || !payload?.userId) return;
  if (!isMetaCapiConfigured()) {
    logger.info('Meta CAPI skipped: META_DATASET_ID or META_CAPI_ACCESS_TOKEN is not set');
    return;
  }

  const eventTime = payload.eventTime
    ? Math.floor(new Date(payload.eventTime).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const currency = payload.currency || 'INR';
  const value = typeof payload.value === 'number' && Number.isFinite(payload.value) ? payload.value : undefined;
  const platform = payload.platform === 'ios' ? 'ios' : 'android';

  const customData = {
    content_type: 'membership',
    currency,
  };
  if (value != null) customData.value = value;
  if (payload.contentId) customData.content_ids = [String(payload.contentId)];

  const baseEvent = {
    event_time: eventTime,
    event_id: String(payload.eventId),
    action_source: 'app',
    user_data: {
      external_id: [sha256(payload.userId)],
    },
    custom_data: customData,
    app_data: {
      advertiser_tracking_enabled: 0,
      application_tracking_enabled: 1,
      extinfo: buildExtInfo(platform),
    },
  };

  const version = config.meta.graphVersion || 'v21.0';
  const url = `https://graph.facebook.com/${version}/${config.meta.datasetId}/events`;

  try {
    await axios.post(
      url,
      { data: [{ ...baseEvent, event_name: 'Purchase' }, { ...baseEvent, event_name: 'Subscribe' }] },
      {
        params: { access_token: config.meta.accessToken },
        timeout: 8000,
      }
    );
    logger.info(`Meta CAPI purchase sent event_id=${payload.eventId}`);
  } catch (error) {
    const detail = error.response?.data?.error?.message || error.message;
    logger.error(`Meta CAPI purchase failed event_id=${payload.eventId}: ${detail}`);
  }
}
