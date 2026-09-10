import Joi from 'joi';

const GENDERS = ['Male', 'Female', 'Other'];

/**
 * Convert a {value, unit} length to centimetres for range checks.
 * @param {{ value: number, unit?: string }} obj
 * @returns {number}
 */
function toCm(obj) {
  if (obj.unit === 'inches' || obj.unit === 'in') return obj.value * 2.54;
  if (obj.unit === 'ft') return obj.value * 30.48;
  return obj.value;
}

/**
 * Convert a {value, unit} weight to kilograms for range checks.
 * @param {{ value: number, unit?: string }} obj
 * @returns {number}
 */
function toKg(obj) {
  if (obj.unit === 'lbs') return obj.value / 2.20462;
  return obj.value;
}

/**
 * Accept male/female/other in any case; persist canonical enum.
 */
export const genderField = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const match = GENDERS.find((g) => g.toLowerCase() === String(value).toLowerCase());
    if (!match) {
      return helpers.message('gender must be Male, Female, or Other');
    }
    return match;
  });

/**
 * Length measurement with min/max in centimetres, any accepted unit.
 * @param {number} minCm
 * @param {number} maxCm
 * @param {string[]} [units]
 * @returns {import('joi').ObjectSchema}
 */
export function lengthMeasurement(minCm, maxCm, units = ['cm', 'inches']) {
  return Joi.object({
    value: Joi.number().greater(0).required(),
    unit: Joi.string()
      .valid(...units)
      .default('cm'),
  }).custom((obj, helpers) => {
    const cm = toCm(obj);
    if (cm < minCm || cm > maxCm) {
      return helpers.message(`must be between ${minCm} and ${maxCm} cm`);
    }
    return obj;
  });
}

/**
 * Weight 20–400 kg, accepting kg or lbs.
 */
export const weightMeasurement = Joi.object({
  value: Joi.number().greater(0).required(),
  unit: Joi.string().valid('kg', 'lbs').default('kg'),
}).custom((obj, helpers) => {
  const kg = toKg(obj);
  if (kg < 20 || kg > 400) {
    return helpers.message('must be between 20 and 400 kg');
  }
  return obj;
});

/**
 * POST /trackers/body-status body. Height/weight required; girths optional.
 */
export const createBodyStatusBody = Joi.object().keys({
  age: Joi.number().integer().min(1).max(120),
  gender: genderField,
  height: lengthMeasurement(50, 250, ['cm', 'ft', 'inches']).required(),
  weight: weightMeasurement.required(),
  chest: lengthMeasurement(30, 200),
  waist: lengthMeasurement(30, 200),
  hips: lengthMeasurement(40, 200),
  arms: lengthMeasurement(10, 80),
  thighs: lengthMeasurement(20, 120),
  bodyFat: Joi.object({
    value: Joi.number().greater(0).max(100).required(),
    unit: Joi.string().valid('%').default('%'),
  }),
  notes: Joi.string().trim().max(500).allow(''),
});
