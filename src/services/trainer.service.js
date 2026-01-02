import httpStatus from 'http-status';
import { Trainer } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';

/**
 * Create a trainer
 * @param {Object} trainerBody
 * @returns {Promise<Trainer>}
 */
const createTrainer = async (trainerBody) => {
  return Trainer.create(trainerBody);
};

/**
 * Query for trainers
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTrainers = async (filter, options) => {
  const trainers = await Trainer.paginate(filter, options);
  return trainers;
};

/**
 * Get trainer by id
 * @param {ObjectId} id
 * @returns {Promise<Trainer>}
 */
const getTrainerById = async (id) => {
  return Trainer.findById(id);
};

/**
 * Update trainer by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Trainer>}
 */
const updateTrainerById = async (id, updateBody) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  Object.assign(trainer, updateBody);
  await trainer.save();
  return trainer;
};

/**
 * Delete trainer by id
 * @param {ObjectId} id
 * @returns {Promise<Trainer>}
 */
const deleteTrainerById = async (id) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  await trainer.deleteOne();
  return trainer;
};

/**
 * Add image to trainer's images array
 * @param {ObjectId} id
 * @param {Object} imageData - { key, path }
 * @returns {Promise<Trainer>}
 */
const addTrainerImage = async (id, imageData) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  trainer.images.push(imageData);
  await trainer.save();
  return trainer;
};

/**
 * Remove image from trainer's images array
 * @param {ObjectId} id
 * @param {number} imageIndex
 * @returns {Promise<Trainer>}
 */
const removeTrainerImage = async (id, imageIndex) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  if (imageIndex < 0 || imageIndex >= trainer.images.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid image index');
  }
  trainer.images.splice(imageIndex, 1);
  await trainer.save();
  return trainer;
};

/**
 * Update trainer profile photo
 * @param {ObjectId} id
 * @param {Object} profilePhotoData - { key, path }
 * @returns {Promise<Trainer>}
 */
const updateTrainerProfilePhoto = async (id, profilePhotoData) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }
  trainer.profilePhoto = profilePhotoData;
  await trainer.save();
  return trainer;
};

export default {
  createTrainer,
  queryTrainers,
  getTrainerById,
  updateTrainerById,
  deleteTrainerById,
  addTrainerImage,
  removeTrainerImage,
  updateTrainerProfilePhoto,
};








