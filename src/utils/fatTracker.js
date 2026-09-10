/**
 * Body-fat helpers: ACE health bands, profile snapshot, history merge.
 */

const RANGE_META = {
  Athletes: {
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    icon: 'fitness-outline',
    male: '6–13%',
    female: '14–20%',
  },
  Fitness: {
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    icon: 'heart-outline',
    male: '14–17%',
    female: '21–24%',
  },
  Acceptable: {
    color: '#f59e0b',
    backgroundColor: '#fffbeb',
    icon: 'happy-outline',
    male: '18–24%',
    female: '25–31%',
  },
  'Above Range': {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    icon: 'warning-outline',
    male: '25%+',
    female: '32%+',
  },
};

const RANGE_ORDER = ['Athletes', 'Fitness', 'Acceptable', 'Above Range'];

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function bodyFatValue(value) {
  const nested = value && typeof value === 'object' && 'value' in value ? value.value : value;
  const n = Number(nested);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

/**
 * @param {unknown} gender
 * @returns {'Male'|'Female'|'Other'|null}
 */
export function normalizeGender(gender) {
  if (gender == null || gender === '') return null;
  const raw = String(gender).trim();
  const lower = raw.toLowerCase();
  if (lower === 'male') return 'Male';
  if (lower === 'female') return 'Female';
  if (lower === 'other') return 'Other';
  if (raw === 'Male' || raw === 'Female' || raw === 'Other') return raw;
  return null;
}

/**
 * ACE body-fat band for the stored enum.
 * @param {number} percent
 * @param {unknown} gender
 * @returns {'Athletes'|'Fitness'|'Acceptable'|'Above Range'}
 */
export function healthRangeCategory(percent, gender) {
  const n = Number(percent) || 0;
  const female = normalizeGender(gender) === 'Female';
  if (female) {
    if (n < 21) return 'Athletes';
    if (n < 25) return 'Fitness';
    if (n < 32) return 'Acceptable';
    return 'Above Range';
  }
  if (n < 14) return 'Athletes';
  if (n < 18) return 'Fitness';
  if (n < 25) return 'Acceptable';
  return 'Above Range';
}

/**
 * Gender-aware legend for the fat tracker UI.
 * @param {unknown} gender
 * @returns {Array<{ label: string, range: string, color: string, backgroundColor: string, icon: string }>}
 */
export function healthRanges(gender) {
  const female = normalizeGender(gender) === 'Female';
  return RANGE_ORDER.map((label) => {
    const meta = RANGE_META[label];
    return {
      label,
      range: female ? meta.female : meta.male,
      color: meta.color,
      backgroundColor: meta.backgroundColor,
      icon: meta.icon,
    };
  });
}

/**
 * @param {unknown} height
 * @returns {{ value: number, unit: 'cm' }|null}
 */
export function heightInCm(height) {
  const value = Number(height?.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = height?.unit === 'ft' ? 'ft' : 'cm';
  const cm = unit === 'ft' ? value * 30.48 : value;
  return { value: Math.round(cm * 10) / 10, unit: 'cm' };
}

/**
 * @param {unknown} weight
 * @returns {{ value: number, unit: 'kg' }|null}
 */
export function weightInKg(weight) {
  const value = Number(weight?.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = weight?.unit === 'lbs' ? 'lbs' : 'kg';
  const kg = unit === 'lbs' ? value * 0.453592 : value;
  return { value: Math.round(kg * 10) / 10, unit: 'kg' };
}

/**
 * Profile fields used to save / display a fat measurement.
 * @param {object} [bodyStatus]
 * @param {object} [user]
 * @param {object} [fat]
 * @returns {{ age: number|null, gender: string|null, height: object|null, weight: object|null, hasProfile: boolean }}
 */
export function fatProfileFrom(bodyStatus, user, fat) {
  const ageRaw = bodyStatus?.age ?? fat?.age ?? user?.age;
  const age = Number.parseInt(ageRaw, 10);
  const gender =
    normalizeGender(bodyStatus?.gender) ||
    normalizeGender(fat?.gender) ||
    normalizeGender(user?.gender);
  const height =
    heightInCm(bodyStatus?.height) ||
    heightInCm(fat?.height) ||
    heightInCm(user?.height != null ? { value: Number(user.height), unit: 'cm' } : null);
  const weight =
    weightInKg(bodyStatus?.weight) ||
    weightInKg(fat?.weight) ||
    weightInKg(user?.weight != null ? { value: Number(user.weight), unit: 'kg' } : null);
  const hasProfile = Boolean(
    (Number.isFinite(age) && age > 0) || gender || height || weight
  );
  const isComplete = Boolean(
    Number.isFinite(age) && age > 0 && gender && height && weight
  );
  return {
    age: Number.isFinite(age) && age > 0 ? age : null,
    gender,
    height,
    weight,
    hasProfile,
    isComplete,
  };
}

/**
 * Plain measurement row for the app (newest-first callers sort themselves).
 * @param {object} doc
 * @param {'fat'|'bodyStatus'} source
 * @returns {object|null}
 */
export function toFatMeasurement(doc, source) {
  const percent = bodyFatValue(doc?.bodyFat);
  if (percent == null) return null;
  const date = doc.measurementDate || doc.createdAt || doc.date;
  return {
    id: String(doc.id || doc._id || ''),
    source,
    measurementDate: date,
    bodyFat: { value: percent, unit: '%' },
    goal: Number.isFinite(Number(doc.goal)) && Number(doc.goal) > 0 ? Number(doc.goal) : null,
    age: doc.age || null,
    gender: normalizeGender(doc.gender),
    height: heightInCm(doc.height),
    weight: weightInKg(doc.weight),
    bmi: doc.bmi || null,
    healthRangeCategory: doc.healthRangeCategory || healthRangeCategory(percent, doc.gender),
    change: Number.isFinite(Number(doc.change)) ? Number(doc.change) : null,
  };
}

/**
 * One row per local day; fat tracker wins over body-status for the same day.
 * @param {Array<object>} fatDocs
 * @param {Array<object>} bodyStatusDocs
 * @param {(value: Date|string) => string} dateKeyFromStored
 * @returns {object[]} newest first
 */
export function mergeFatHistory(fatDocs, bodyStatusDocs, dateKeyFromStored) {
  const byDay = new Map();
  for (const doc of bodyStatusDocs || []) {
    const row = toFatMeasurement(doc, 'bodyStatus');
    if (!row) continue;
    byDay.set(dateKeyFromStored(row.measurementDate), row);
  }
  for (const doc of fatDocs || []) {
    const row = toFatMeasurement(doc, 'fat');
    if (!row) continue;
    byDay.set(dateKeyFromStored(row.measurementDate), row);
  }
  const rows = Array.from(byDay.values()).sort(
    (a, b) => new Date(b.measurementDate) - new Date(a.measurementDate)
  );
  for (let i = 0; i < rows.length; i += 1) {
    const prev = rows[i + 1];
    if (!prev) {
      rows[i].change = null;
      continue;
    }
    rows[i].change = Math.round((rows[i].bodyFat.value - prev.bodyFat.value) * 10) / 10;
  }
  return rows;
}
