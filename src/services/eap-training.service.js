import httpStatus from 'http-status';
import { EapTraining, Trainer } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import trainerService from './trainer.service.js';

const EAP_TRAINER_CATEGORY = 'EAP Trainer';

/** Featured row size on the company EAP landing page. */
const FEATURED_LANDING_LIMIT = 6;

const TRAINER_DETAIL_FIELDS =
  'name title bio specialistIn city experience profilePhoto status acceptingBookings category';

/**
 * Base filter for trainers visible in the company EAP catalog.
 */
const getEligibleCompanyEapTrainerQuery = (trainerName) => {
  const query = {
    category: EAP_TRAINER_CATEGORY,
    status: true,
    acceptingBookings: true,
  };
  if (trainerName && String(trainerName).trim()) {
    query.name = { $regex: String(trainerName).trim(), $options: 'i' };
  }
  return query;
};

/**
 * Resolve trainer ids eligible for the company EAP training catalog.
 *
 * @param {string} [trainerName]
 */
const getEligibleCompanyEapTrainerIds = async (trainerName) => {
  const trainers = await Trainer.find(getEligibleCompanyEapTrainerQuery(trainerName)).select('_id');
  return trainers.map((t) => t._id);
};

/**
 * Build Mongo filter for company-facing EAP training browse.
 *
 * @param {object} query - Validated list query params.
 */
const buildCompanyEapTrainingFilter = async (query) => {
  const eligibleTrainerIds = await getEligibleCompanyEapTrainerIds(query.trainerName);
  if (eligibleTrainerIds.length === 0) {
    return null;
  }

  const mongo = {
    status: true,
    trainer: { $in: eligibleTrainerIds },
  };

  if (query.trainerId) {
    const trainerIdStr = String(query.trainerId);
    const allowed = eligibleTrainerIds.some((id) => id.toString() === trainerIdStr);
    if (!allowed) {
      return null;
    }
    mongo.trainer = query.trainerId;
  }

  if (query.search && String(query.search).trim()) {
    mongo.title = { $regex: String(query.search).trim(), $options: 'i' };
  }

  if (query.duration !== undefined && query.duration !== null && query.duration !== '') {
    mongo.durationOptions = query.duration;
  }

  return mongo;
};

/**
 * Whether a populated training is bookable for company users.
 *
 * @param {object} training
 */
const assertTrainingBookableForCompany = (training) => {
  if (!training || training.status === false) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EAP training not found');
  }
  const trainer = training.trainer;
  if (!trainer || typeof trainer !== 'object') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Trainer information unavailable');
  }
  if (trainer.category !== EAP_TRAINER_CATEGORY) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EAP training not found');
  }
  if (trainer.status === false || trainer.acceptingBookings === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This trainer is not accepting new bookings at the moment.');
  }
};

/**
 * @param {import('mongoose').Document|null} trainer
 */
const assertEapTrainer = (trainer) => {
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  if (trainer.category !== EAP_TRAINER_CATEGORY) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only EAP Trainers can manage EAP trainings');
  }
};

/**
 * Normalize syllabus points (trim, drop empty).
 *
 * @param {Array<{ durationHours: number, points: string[] }>} syllabus
 */
const normalizeSyllabus = (syllabus) =>
  syllabus.map((entry) => ({
    durationHours: entry.durationHours,
    points: entry.points.map((p) => String(p).trim()).filter(Boolean),
  }));

/**
 * @param {import('mongoose').Types.ObjectId|string} trainerId
 * @returns {Promise<object>}
 */
const getTrainerOrThrow = async (trainerId) => {
  const trainer = await Trainer.findById(trainerId);
  assertEapTrainer(trainer);
  return trainer;
};

/**
 * List trainings owned by the authenticated EAP trainer.
 *
 * @param {string} trainerId
 * @returns {Promise<object[]>}
 */
const listMine = async (trainerId) => {
  await getTrainerOrThrow(trainerId);
  return EapTraining.find({ trainer: trainerId }).sort({ createdAt: -1 });
};

/**
 * Create an EAP training for the authenticated trainer.
 *
 * @param {string} trainerId
 * @param {object} body
 */
const createEapTraining = async (trainerId, body) => {
  await getTrainerOrThrow(trainerId);
  return EapTraining.create({
    trainer: trainerId,
    title: body.title.trim(),
    coverImage: body.coverImage,
    durationOptions: body.durationOptions,
    syllabus: normalizeSyllabus(body.syllabus),
    status: body.status !== false,
  });
};

/**
 * @param {string} id
 * @returns {Promise<object>}
 */
const getEapTrainingById = async (id, { forCompany = false } = {}) => {
  const training = await EapTraining.findById(id).populate('trainer', TRAINER_DETAIL_FIELDS);
  if (!training) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EAP training not found');
  }
  if (forCompany) {
    assertTrainingBookableForCompany(training);
  }
  return training;
};

/**
 * @param {string} id
 * @param {string} trainerId
 * @param {object} body
 */
const updateEapTrainingById = async (id, trainerId, body) => {
  const training = await EapTraining.findById(id);
  if (!training) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EAP training not found');
  }
  if (training.trainer.toString() !== trainerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only edit your own trainings');
  }

  if (body.title !== undefined) training.title = body.title.trim();
  if (body.coverImage !== undefined) training.coverImage = body.coverImage;
  if (body.durationOptions !== undefined) training.durationOptions = body.durationOptions;
  if (body.syllabus !== undefined) training.syllabus = normalizeSyllabus(body.syllabus);
  if (body.status !== undefined) training.status = body.status;

  await training.save();
  return training;
};

/**
 * @param {string} id
 * @param {string} trainerId
 */
const deleteEapTrainingById = async (id, trainerId) => {
  const training = await EapTraining.findById(id);
  if (!training) {
    throw new ApiError(httpStatus.NOT_FOUND, 'EAP training not found');
  }
  if (training.trainer.toString() !== trainerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own trainings');
  }
  await training.deleteOne();
};

/**
 * Paginate EAP trainings and populate trainer with catalog fields.
 *
 * @param {object} mongoFilter
 * @param {object} options
 */
const paginateEapTrainings = async (mongoFilter, options) => {
  const result = await EapTraining.paginate(mongoFilter, {
    ...options,
    populate: 'trainer',
    sortBy: options.sortBy || 'createdAt:desc',
  });
  if (result.results?.length) {
    await EapTraining.populate(result.results, {
      path: 'trainer',
      select: TRAINER_DETAIL_FIELDS,
    });
  }
  return result;
};

/**
 * Query trainings for company portal browse (eligible trainers only).
 *
 * @param {object} query - List query params.
 * @param {object} options - Pagination options.
 */
const queryCompanyEapTrainings = async (query, options) => {
  const mongoFilter = await buildCompanyEapTrainingFilter(query);
  if (!mongoFilter) {
    return {
      results: [],
      page: options.page || 1,
      limit: options.limit || 10,
      totalPages: 0,
      totalResults: 0,
    };
  }
  return paginateEapTrainings(mongoFilter, options);
};

/**
 * Query trainings for company portal.
 *
 * @param {object} filter
 * @param {object} options
 */
const queryEapTrainings = async (filter, options) => {
  const mongoFilter = { ...filter };
  if (mongoFilter.status === undefined) {
    mongoFilter.status = true;
  }
  return paginateEapTrainings(mongoFilter, options);
};

/**
 * Validate EAP training for booking creation.
 *
 * @param {string} eapTrainingId
 * @param {string} trainerId
 * @param {number} durationHours
 */
/**
 * Featured EAP trainers and trainings for the company landing (newest first).
 *
 * @param {number} [limit]
 */
const getCompanyEapLanding = async (limit = FEATURED_LANDING_LIMIT) => {
  const trainerFilter = trainerService.buildTrainerQueryFilter(
    { category: EAP_TRAINER_CATEGORY },
    { companyBookableOnly: true }
  );

  const [trainersPage, trainingsPage] = await Promise.all([
    trainerService.queryTrainers(trainerFilter, {
      page: 1,
      limit,
      sortBy: 'createdAt:desc',
    }),
    queryCompanyEapTrainings({}, { page: 1, limit, sortBy: 'createdAt:desc' }),
  ]);

  return {
    trainers: trainersPage.results ?? [],
    trainings: trainingsPage.results ?? [],
  };
};

const validateEapTrainingForBooking = async (eapTrainingId, trainerId, durationHours) => {
  const training = await getEapTrainingById(eapTrainingId);
  if (training.trainer._id?.toString() !== trainerId.toString() && training.trainer.toString?.() !== trainerId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'EAP training does not belong to the selected trainer');
  }
  if (training.status === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This EAP training is not available');
  }
  if (!training.durationOptions.includes(durationHours)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Duration ${durationHours}h is not offered for this training`);
  }
  return training;
};

export {
  listMine,
  createEapTraining,
  getEapTrainingById,
  updateEapTrainingById,
  deleteEapTrainingById,
  queryEapTrainings,
  queryCompanyEapTrainings,
  getCompanyEapLanding,
  validateEapTrainingForBooking,
  EAP_TRAINER_CATEGORY,
  FEATURED_LANDING_LIMIT,
};

export default {
  listMine,
  createEapTraining,
  getEapTrainingById,
  updateEapTrainingById,
  deleteEapTrainingById,
  queryEapTrainings,
  queryCompanyEapTrainings,
  getCompanyEapLanding,
  validateEapTrainingForBooking,
  EAP_TRAINER_CATEGORY,
  FEATURED_LANDING_LIMIT,
};
