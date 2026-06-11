const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse HH:MM into minutes from midnight.
 *
 * @param {string} time - 24-hour time string.
 * @returns {number|null}
 */
export const timeToMinutes = (time) => {
  if (!TIME_REGEX.test(String(time || ''))) {
    return null;
  }
  const [h, m] = String(time).split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
};

/**
 * Format minutes from midnight as HH:MM.
 *
 * @param {number} minutes - Minutes from midnight.
 * @returns {string}
 */
export const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Whether a booking start + duration fits inside a weekly availability window.
 *
 * @param {object} trainer - Trainer document with optional weeklyAvailability.
 * @param {Date|string} bookingDate - Session date.
 * @param {string} startTime - HH:MM start time.
 * @param {number} durationHours - Session length in hours.
 * @returns {boolean} True when no weekly schedule is set or time fits a slot.
 */
export const isWithinWeeklyAvailability = (trainer, bookingDate, startTime, durationHours) => {
  const schedule = normalizeWeeklyAvailability(trainer?.weeklyAvailability);
  if (schedule.length === 0) {
    return true;
  }

  const date = bookingDate instanceof Date ? bookingDate : new Date(bookingDate);
  const dayOfWeek = date.getDay();
  const dayEntry = schedule.find((entry) => entry.dayOfWeek === dayOfWeek);
  if (!dayEntry || !Array.isArray(dayEntry.slots) || dayEntry.slots.length === 0) {
    return false;
  }

  const startMin = timeToMinutes(startTime);
  if (startMin == null) {
    return false;
  }
  const endMin = startMin + Math.round(Number(durationHours) * 60);
  if (endMin > 24 * 60) {
    return false;
  }

  return dayEntry.slots.some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    if (slotStart == null || slotEnd == null || slotEnd <= slotStart) {
      return false;
    }
    return startMin >= slotStart && endMin <= slotEnd;
  });
};

/**
 * Human-readable weekly availability lines for emails/UI.
 *
 * @param {Array<{ dayOfWeek: number, slots: Array<{ startTime: string, endTime: string }> }>} schedule
 * @returns {string[]}
 */
export const formatWeeklyAvailabilityForDisplay = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return [];
  }

  return [...schedule]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((entry) => {
      const day = DAY_LABELS[entry.dayOfWeek] || `Day ${entry.dayOfWeek}`;
      const slots = (entry.slots || [])
        .filter((s) => s.startTime && s.endTime)
        .map((s) => `${s.startTime} – ${s.endTime}`)
        .join(', ');
      return slots ? `${day}: ${slots}` : null;
    })
    .filter(Boolean);
};

export const AVAILABILITY_OUTSIDE_MESSAGE =
  "Please select the time according to the trainer's availability";

/**
 * Default Mon–Fri 09:00–18:00 for trainers opting into standard office hours.
 * Empty array means no weekly restriction (legacy / not configured yet).
 */
export const DEFAULT_WEEKLY_AVAILABILITY = [
  { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 2, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 4, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 5, slots: [{ startTime: '09:00', endTime: '18:00' }] },
];

/**
 * Normalize weeklyAvailability from DB (null, missing, or invalid → safe array).
 *
 * @param {unknown} raw - Stored weeklyAvailability value.
 * @returns {Array<{ dayOfWeek: number, slots: Array<{ startTime: string, endTime: string }> }>}
 */
export const normalizeWeeklyAvailability = (raw) => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry.dayOfWeek === 'number' &&
        entry.dayOfWeek >= 0 &&
        entry.dayOfWeek <= 6 &&
        Array.isArray(entry.slots)
    )
    .map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      slots: entry.slots
        .filter((slot) => slot && slot.startTime && slot.endTime)
        .map((slot) => ({
          startTime: String(slot.startTime).trim(),
          endTime: String(slot.endTime).trim(),
        })),
    }))
    .filter((entry) => entry.slots.length > 0);
};

export { DAY_LABELS, TIME_REGEX };
