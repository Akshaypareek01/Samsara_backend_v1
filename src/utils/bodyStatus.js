import { normalizeGender } from './fatTracker.js';

const OPTIONAL_LENGTH_KEYS = ['chest', 'waist', 'hips', 'arms', 'thighs'];

/**
 * Round to 2 decimal places.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Convert a length measurement to centimetres.
 * @param {{ value?: number, unit?: string }|null|undefined} measurement
 * @returns {number}
 */
export function toCentimetres(measurement) {
  const value = Number(measurement?.value);
  const unit = measurement?.unit;
  if (unit === 'inches' || unit === 'in') return value * 2.54;
  if (unit === 'ft') return value * 30.48;
  return value;
}

/**
 * Convert a weight measurement to kilograms.
 * @param {{ value?: number, unit?: string }|null|undefined} measurement
 * @returns {number}
 */
export function toKilograms(measurement) {
  const value = Number(measurement?.value);
  if (measurement?.unit === 'lbs') return value / 2.20462;
  return value;
}

/**
 * Persist body-status in metric + canonical gender. Drops empty/zero optionals.
 * @param {object} data
 * @returns {object}
 */
export function canonicalizeBodyStatus(data = {}) {
  const out = { ...data };
  const gender = normalizeGender(out.gender);
  if (gender) out.gender = gender;
  else delete out.gender;

  if (out.height?.value != null) {
    out.height = { value: round2(toCentimetres(out.height)), unit: 'cm' };
  }
  if (out.weight?.value != null) {
    out.weight = { value: round2(toKilograms(out.weight)), unit: 'kg' };
  }

  OPTIONAL_LENGTH_KEYS.forEach((key) => {
    const m = out[key];
    if (m?.value == null || Number(m.value) <= 0) {
      delete out[key];
      return;
    }
    out[key] = { value: round2(toCentimetres(m)), unit: 'cm' };
  });

  if (out.bodyFat?.value == null || Number(out.bodyFat.value) <= 0) {
    delete out.bodyFat;
  }

  if (typeof out.notes === 'string') {
    out.notes = out.notes.trim();
    if (!out.notes) delete out.notes;
  }

  return out;
}

/**
 * Shape a lean BodyStatus document like mongoose toJSON (`id`, no `_id`/`__v`/timestamps).
 * @param {object|null|undefined} doc
 * @returns {object|null}
 */
export function serializeBodyStatus(doc) {
  if (!doc) return null;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return {
    ...rest,
    id: _id != null ? String(_id) : rest.id,
  };
}
