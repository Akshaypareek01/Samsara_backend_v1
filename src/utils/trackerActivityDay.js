import httpStatus from 'http-status';
import ApiError from './ApiError.js';

export const DEVICE_STEPS_LOCKED_MESSAGE =
  "Today's steps are already from your phone. Manual log is only when the device has no data.";

/**
 * @param {unknown} source
 * @returns {boolean}
 */
export function isDeviceSource(source) {
  return source === 'healthkit' || source === 'healthconnect';
}

/**
 * Non-negative integer from a step/calorie field (0 if missing).
 * @param {unknown} value
 * @returns {number}
 */
export function activityCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Device already owns this day (synced steps > 0).
 * @param {{ source?: string, steps?: unknown }|null|undefined} entry
 * @returns {boolean}
 */
export function isDeviceLockedEntry(entry) {
  if (!entry) return false;
  const steps = activityCount(entry.steps?.value ?? entry.steps);
  return isDeviceSource(entry.source) && steps > 0;
}

/**
 * Block a second manual log when the phone already wrote steps for that day.
 * @param {{ source?: string, steps?: unknown }|null|undefined} existing
 * @returns {void}
 */
export function assertManualAllowed(existing) {
  if (isDeviceLockedEntry(existing)) {
    throw new ApiError(httpStatus.CONFLICT, DEVICE_STEPS_LOCKED_MESSAGE);
  }
}

/**
 * Incoming steps number from POST `{ steps: { value } }` or a stored integer.
 * @param {object} data
 * @returns {number|null}
 */
function incomingStepsValue(data) {
  if (data?.steps && typeof data.steps === 'object' && data.steps.value != null) {
    return Number(data.steps.value);
  }
  if (typeof data?.steps === 'number') return data.steps;
  return null;
}

/**
 * Incoming active calories from POST `{ activeCalories: { value } }` or `calories`.
 * @param {object} data
 * @returns {number|null}
 */
function incomingCaloriesValue(data) {
  if (data?.activeCalories && data.activeCalories.value != null) {
    return Number(data.activeCalories.value);
  }
  if (data?.calories != null) return Number(data.calories);
  return null;
}

/**
 * Same-day activity $set: device replaces when steps > 0; device 0 keeps existing.
 * @param {{ source?: string, steps?: unknown, calories?: unknown }|null} existing
 * @param {object} data
 * @param {{ userId: unknown, start: Date }} ids
 * @returns {object}
 */
export function buildActivitySet(existing, data, ids) {
  const incomingSource = data.source || 'manual';
  const incomingSteps = incomingStepsValue(data);
  const incomingCalories = incomingCaloriesValue(data);
  const fromDevice = isDeviceSource(incomingSource);

  if (!fromDevice) {
    assertManualAllowed(existing);
    if (activityCount(incomingSteps) <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Steps must be greater than 0');
    }
  }

  const set = {
    userId: ids.userId,
    measurementDate: ids.start,
    isActive: true,
  };

  if (fromDevice) {
    if (activityCount(incomingSteps) > 0) {
      set.steps = Math.round(incomingSteps);
      set.source = incomingSource;
      if (
        incomingCalories != null &&
        Number.isFinite(incomingCalories) &&
        incomingCalories > 0 &&
        incomingCalories <= 8000
      ) {
        set.calories = Math.round(incomingCalories);
      }
      if (data.distance) set.distance = data.distance;
      if (data.activeTime != null) set.activeTime = data.activeTime;
    } else if (
      incomingCalories != null &&
      activityCount(incomingCalories) > 0 &&
      incomingCalories <= 8000
    ) {
      set.calories = Math.round(incomingCalories);
    }
  } else {
    set.steps = Math.round(incomingSteps);
    set.source = 'manual';
    if (incomingCalories != null && Number.isFinite(incomingCalories)) {
      set.calories = Math.max(0, Math.round(incomingCalories));
    }
    if (data.distance) set.distance = data.distance;
    if (data.activeTime != null) set.activeTime = data.activeTime;
  }

  if (
    fromDevice &&
    activityCount(existing?.calories) > 8000 &&
    set.calories == null
  ) {
    set.calories = 0;
  }

  if (data.notes) set.notes = data.notes;
  return set;
}

export const MAX_ACTIVITY_KCAL = 8000;
/** Device + logged workouts can both be real; cap the combined daily ring. */
export const MAX_DAILY_KCAL = MAX_ACTIVITY_KCAL * 2;

/**
 * Health Connect / HealthKit active kcal for one day (1..8000).
 * @param {unknown} raw
 * @returns {number}
 */
export function clampDeviceKcal(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > MAX_ACTIVITY_KCAL) return 0;
  return Math.round(n);
}

/**
 * Daily burn = watch/phone active kcal + today's logged workouts.
 * Manual logs cover sessions the device never saw (e.g. dancing without a watch).
 * Each source is clamped to MAX_ACTIVITY_KCAL before summing.
 * @param {unknown} deviceKcal
 * @param {unknown} workoutKcal
 * @returns {number}
 */
export function canonicalDailyCalories(deviceKcal, workoutKcal) {
  const total = clampDeviceKcal(deviceKcal) + clampDeviceKcal(workoutKcal);
  return Math.min(total, MAX_DAILY_KCAL);
}

/**
 * One dashboard activity row: highest step count, max sane kcal across same-day docs.
 * @param {Array<{ steps?: unknown, calories?: unknown, toJSON?: Function }>} docs
 * @returns {object|null}
 */
export function pickBestActivityDoc(docs) {
  if (!docs?.length) return null;
  const ranked = [...docs].sort(
    (a, b) => activityCount(b?.steps) - activityCount(a?.steps),
  );
  const best = ranked[0];
  const saneKcal = ranked.reduce((max, doc) => {
    const n = activityCount(doc?.calories);
    if (n <= 0 || n > MAX_ACTIVITY_KCAL) return max;
    return Math.max(max, n);
  }, 0);
  const current = activityCount(best?.calories);
  if (current === saneKcal && current <= MAX_ACTIVITY_KCAL) return best;
  const json = typeof best.toJSON === 'function' ? best.toJSON() : { ...best };
  json.calories = saneKcal;
  return json;
}
