import axios from 'axios';
import { User } from '../models/index.js';
import NotificationPreferences from '../models/notificationPreferences.model.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_RE = /^ExponentPushToken\[.+\]$/;

/**
 * True when the token is an Expo push token the Expo API will accept.
 * @param {string|null|undefined} token
 * @returns {boolean}
 */
export const isExpoPushToken = (token) =>
  typeof token === 'string' && EXPO_TOKEN_RE.test(token.trim());

/**
 * Sends one Expo push to a user if they have a token and have not disabled push.
 * Failures are logged and never thrown — in-app notifications must still land.
 * @param {import('mongoose').Types.ObjectId|string|null|undefined} userId
 * @param {{ title: string, body: string, data?: Object }} payload
 * @returns {Promise<void>}
 */
export const sendExpoPushToUser = async (userId, payload) => {
  if (!userId || !payload?.title || !payload?.body) return;

  try {
    const user = await User.findById(userId).select('notificationToken').lean();
    const token = user?.notificationToken?.trim();
    if (!isExpoPushToken(token)) return;

    const prefs = await NotificationPreferences.findOne({ userId });
    if (prefs) {
      if (!prefs.canReceiveNotification(payload.data?.type || 'cancellation')) return;
      if (prefs.isQuietHours()) return;
    }

    await axios.post(
      EXPO_PUSH_URL,
      {
        to: token,
        title: payload.title,
        body: payload.body,
        sound: 'default',
        data: Object.fromEntries(
          Object.entries(payload.data || {}).flatMap(([key, value]) => {
            if (value == null) return [];
            return [[key, typeof value === 'string' ? value : String(value)]];
          })
        ),
      },
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );
  } catch (error) {
    console.error('Expo push failed:', error?.response?.data || error.message || error);
  }
};
