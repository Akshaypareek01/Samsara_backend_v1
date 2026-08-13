const CLOCK = /^([01]?\d|2[0-3]):[0-5]\d$/;

/**
 * Overnight-aware minutes between two HH:mm clock times.
 * @param {string} bedtime
 * @param {string} wakeUpTime
 * @returns {number|null}
 */
export const minutesBetweenHhMm = (bedtime, wakeUpTime) => {
  if (!CLOCK.test(bedtime) || !CLOCK.test(wakeUpTime)) return null;
  const toMins = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
  };
  let diff = toMins(wakeUpTime) - toMins(bedtime);
  if (diff <= 0) diff += 24 * 60;
  return diff;
};

/**
 * Recompute sleepTime / hoursSlept from bedtime + wakeUpTime.
 * Mobile DateTimePicker can send hoursSlept >> 24 from calendar-date subtraction;
 * those values must not be persisted.
 * @param {Object} sleepData
 * @returns {Object}
 */
export const normalizeSleepEntry = (sleepData = {}) => {
  const next = { ...sleepData };
  const mins = minutesBetweenHhMm(next.bedtime, next.wakeUpTime);
  if (mins != null) {
    next.sleepTime = mins;
    next.hoursSlept = parseFloat((mins / 60).toFixed(1));
  } else if (typeof next.hoursSlept === 'number' && next.hoursSlept > 24) {
    next.hoursSlept = 24;
  }
  if (next.notes === '') {
    delete next.notes;
  }
  return next;
};
