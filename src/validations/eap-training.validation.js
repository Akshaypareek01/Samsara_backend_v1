import Joi from 'joi';
import { objectId } from './custom.validation.js';

const DURATION_VALUES = [1, 2, 4, 6];

const syllabusEntrySchema = Joi.object().keys({
  durationHours: Joi.number()
    .valid(...DURATION_VALUES)
    .required(),
  points: Joi.array()
    .items(Joi.string().trim().min(1).max(500))
    .min(1)
    .required(),
});

const trainingBodySchema = Joi.object().keys({
  title: Joi.string().trim().min(1).max(200).required(),
  coverImage: Joi.string().uri().required(),
  durationOptions: Joi.array()
    .items(Joi.number().valid(...DURATION_VALUES))
    .min(1)
    .unique()
    .required(),
  syllabus: Joi.array().items(syllabusEntrySchema).min(1).required(),
  status: Joi.boolean().optional(),
});

/**
 * Ensures syllabus covers exactly the selected duration options.
 *
 * @param {object} value - Validated body.
 * @param {import('joi').CustomHelpers} helpers
 */
const validateSyllabusMatchesDurations = (value, helpers) => {
  const durations = [...value.durationOptions].sort((a, b) => a - b);
  const syllabusDurations = value.syllabus.map((s) => s.durationHours).sort((a, b) => a - b);
  const match =
    durations.length === syllabusDurations.length &&
    durations.every((d, i) => d === syllabusDurations[i]);
  if (!match) {
    return helpers.message('syllabus must include exactly one entry per selected duration option');
  }
  return value;
};

const createEapTraining = {
  body: trainingBodySchema.custom(validateSyllabusMatchesDurations),
};

const updateEapTraining = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: trainingBodySchema.min(1).custom(validateSyllabusMatchesDurations),
};

const eapTrainingId = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const listEapTrainings = {
  query: Joi.object().keys({
    trainerId: Joi.string().custom(objectId),
    status: Joi.boolean(),
    search: Joi.string().trim().max(200),
    trainerName: Joi.string().trim().max(200),
    duration: Joi.number().valid(...DURATION_VALUES),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string(),
  }),
};

export { createEapTraining, updateEapTraining, eapTrainingId, listEapTrainings, DURATION_VALUES };
