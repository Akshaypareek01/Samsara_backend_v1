/** Maximum education entries allowed per trainer profile. */
export const MAX_TRAINER_EDUCATION_ENTRIES = 5;

/** Maximum certification entries allowed per trainer profile. */
export const MAX_TRAINER_CERTIFICATION_ENTRIES = 5;

const EDUCATION_FIELDS = ['qualification', 'university', 'yearOfCompletion'];
const CERTIFICATION_FIELDS = ['name', 'institute', 'year'];

/**
 * Whether a plain object has any non-empty tracked fields.
 *
 * @param {Record<string, unknown> | null | undefined} entry - Object to inspect.
 * @param {string[]} fields - Field names to check.
 * @returns {boolean} True when at least one field is populated.
 */
function hasAnyField(entry, fields) {
  if (!entry || typeof entry !== 'object') return false;
  return fields.some((field) => {
    const value = entry[field];
    return value != null && value !== '';
  });
}

/**
 * Normalize education data from legacy single object or array shape.
 *
 * @param {unknown} value - Raw education value from DB or API payload.
 * @returns {Array<Record<string, unknown>>} Normalized education entries.
 */
export function normalizeEducationList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'object') {
    return hasAnyField(value, EDUCATION_FIELDS) ? [value] : [];
  }
  return [];
}

/**
 * Normalize certification data from legacy single object or array shape.
 *
 * @param {unknown} value - Raw certification value from DB or API payload.
 * @returns {Array<Record<string, unknown>>} Normalized certification entries.
 */
export function normalizeCertificationList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'object') {
    return hasAnyField(value, CERTIFICATION_FIELDS) ? [value] : [];
  }
  return [];
}

/**
 * Strip empty education rows before persisting.
 *
 * @param {Array<Record<string, unknown>>} entries - Education entries.
 * @returns {Array<Record<string, unknown>>} Only filled entries (max 5).
 */
export function filterFilledEducationEntries(entries) {
  return normalizeEducationList(entries)
    .filter((entry) => hasAnyField(entry, EDUCATION_FIELDS))
    .slice(0, MAX_TRAINER_EDUCATION_ENTRIES);
}

/**
 * Strip empty certification rows before persisting.
 *
 * @param {Array<Record<string, unknown>>} entries - Certification entries.
 * @returns {Array<Record<string, unknown>>} Only filled entries (max 5).
 */
export function filterFilledCertificationEntries(entries) {
  return normalizeCertificationList(entries)
    .filter((entry) => hasAnyField(entry, CERTIFICATION_FIELDS))
    .slice(0, MAX_TRAINER_CERTIFICATION_ENTRIES);
}

/**
 * Joi custom normalizer: accept legacy object or array, return array (max 5).
 *
 * @param {unknown} value - Incoming Joi value.
 * @param {string[]} fields - Tracked field names for legacy object detection.
 * @param {number} max - Maximum allowed entries.
 * @returns {Array<Record<string, unknown>>} Normalized array.
 */
export function normalizeQualificationListForValidation(value, fields, max) {
  const normalized = Array.isArray(value)
    ? value.filter(Boolean)
    : hasAnyField(value, fields)
      ? [value]
      : [];

  return normalized.slice(0, max);
}
