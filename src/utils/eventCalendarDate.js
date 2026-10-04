const KOLKATA_TZ = 'Asia/Kolkata';

/**
 * Asia/Kolkata calendar day (YYYY-MM-DD) for an instant.
 * @param {Date|string|number} value
 * @returns {string|null}
 */
export function kolkataDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KOLKATA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Calendar day from a date-only string or an instant.
 * YYYY-MM-DD and MM/DD/YYYY are taken literally so server TZ cannot shift the day.
 * @param {unknown} value
 * @returns {string|null}
 */
export function calendarDateKey(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const isoDay = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDay) return `${isoDay[1]}-${isoDay[2]}-${isoDay[3]}`;
    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
      return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
    }
  }
  return kolkataDateKey(value);
}

/**
 * Noon UTC of the intended calendar day.
 * Stays on that day in both UTC and Asia/Kolkata (unlike local or UTC midnight).
 * @param {unknown} value
 * @returns {Date|undefined}
 */
export function eventStartInstant(value) {
  const key = calendarDateKey(value);
  if (!key) return undefined;
  return new Date(`${key}T12:00:00.000Z`);
}

/**
 * Start of the Kolkata calendar day for upcoming queries.
 * @param {Date} [now]
 * @returns {Date}
 */
export function kolkataDayStart(now = new Date()) {
  const key = kolkataDateKey(now);
  return new Date(`${key}T00:00:00.000+05:30`);
}
