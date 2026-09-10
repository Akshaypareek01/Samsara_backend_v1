const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Pad before UTC midnight so IST local-midnight docs (`T18:30:00.000Z`) still match. */
const LEGACY_LOCAL_MIDNIGHT_PAD_MS = 14 * 60 * 60 * 1000;

/**
 * Local calendar YYYY-MM-DD (same rules as the mobile `toDateKey`).
 * @param {Date|string|number} [now]
 * @returns {string}
 */
export function todayDateKey(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) {
    return todayDateKey(new Date());
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * UTC [start, end) plus a padded lookupStart for one YYYY-MM-DD key.
 * @param {string} key
 * @returns {{ start: Date, end: Date, lookupStart: Date }}
 */
function utcRangeFromKey(key) {
  const m = String(key).trim().match(DATE_ONLY);
  if (!m) {
    return utcRangeFromKey(todayDateKey());
  }
  const y = Number(m[1]);
  const month = Number(m[2]) - 1;
  const d = Number(m[3]);
  const start = new Date(Date.UTC(y, month, d));
  const end = new Date(Date.UTC(y, month, d + 1));
  return {
    start,
    end,
    lookupStart: new Date(start.getTime() - LEGACY_LOCAL_MIDNIGHT_PAD_MS),
  };
}

/**
 * Resolve a YYYY-MM-DD string or Date to that calendar day's [start, end) in UTC.
 * `new Date("YYYY-MM-DD")` is UTC midnight; `setHours(0,0,0,0)` on an IST
 * server then rolls it back to the previous UTC date — Sep 2 became Sep 1.
 * @param {string|Date} [date]
 * @returns {{ start: Date, end: Date, lookupStart: Date }}
 */
export function dayRange(date) {
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (DATE_ONLY.test(trimmed)) {
      return utcRangeFromKey(trimmed);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return utcRangeFromKey(todayDateKey(parsed));
    }
    return utcRangeFromKey(todayDateKey());
  }
  if (date) {
    return utcRangeFromKey(todayDateKey(date));
  }
  return utcRangeFromKey(todayDateKey());
}

/**
 * Today's UTC day range using the server's local calendar date.
 * @param {Date} [now]
 * @returns {{ start: Date, end: Date, lookupStart: Date }}
 */
export function todayRange(now) {
  return dayRange(todayDateKey(now));
}

/**
 * Shift a YYYY-MM-DD key by whole local calendar days.
 * @param {string} key
 * @param {number} deltaDays
 * @returns {string}
 */
export function shiftDateKey(key, deltaDays) {
  const m = String(key).trim().match(DATE_ONLY);
  const src = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date();
  src.setDate(src.getDate() + Number(deltaDays || 0));
  return todayDateKey(src);
}

/**
 * Inclusive last-N local calendar days with padded lookup for IST midnight docs.
 * @param {number} [days]
 * @param {Date} [now]
 * @returns {{ startKey: string, endKey: string, start: Date, end: Date, lookupStart: Date }}
 */
export function lastNDaysRange(days = 7, now = new Date()) {
  const n = Math.max(1, Number(days) || 7);
  const endKey = todayDateKey(now);
  const startKey = shiftDateKey(endKey, -(n - 1));
  const { lookupStart, start } = utcRangeFromKey(startKey);
  const { end } = utcRangeFromKey(endKey);
  return { startKey, endKey, start, end, lookupStart };
}

/**
 * Calendar key for a stored tracker date (UTC midnight or IST local midnight).
 * @param {Date|string|number} [value]
 * @returns {string}
 */
export function dateKeyFromStored(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (DATE_ONLY.test(trimmed)) return trimmed;
    const midnight = trimmed.match(/^(\d{4}-\d{2}-\d{2})T00:00:00/);
    if (midnight) return midnight[1];
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString();
    const midnight = iso.match(/^(\d{4}-\d{2}-\d{2})T00:00:00/);
    if (midnight) return midnight[1];
    return todayDateKey(value);
  }
  return todayDateKey();
}
