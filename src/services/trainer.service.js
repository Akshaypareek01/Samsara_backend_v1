import httpStatus from 'http-status';
import { Trainer } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

/**
 * Create a trainer
 * @param {Object} trainerBody
 * @returns {Promise<Trainer>}
 */
const createTrainer = async (trainerBody) => {
  const body = { ...trainerBody };
  if (body.category !== undefined) {
    body.category = normalizeTrainerCategories(body.category);
  }
  return Trainer.create(body);
};

/**
 * Mongo filter for trainers visible to companies (active + accepting new bookings).
 * Treats missing flags as available (legacy records).
 *
 * @returns {Object}
 */
const bookableTrainerMongoFilter = () => ({
  status: { $ne: false },
  acceptingBookings: { $ne: false },
});

/**
 * Whether a trainer can receive new company bookings.
 *
 * @param {Object|null|undefined} trainer - Trainer document or lean object.
 * @returns {boolean}
 */
const isTrainerBookable = (trainer) => {
  if (!trainer) return false;
  if (trainer.status === false) return false;
  if (trainer.acceptingBookings === false) return false;
  return true;
};

/**
 * Builds a Mongoose filter from API query params.
 *
 * @param {Object} filter - Raw query fields from the client.
 * @param {Object} [options]
 * @param {boolean} [options.companyBookableOnly] - Force active + accepting bookings (company portal).
 * @returns {Object}
 */
const buildTrainerQueryFilter = (filter = {}, options = {}) => {
  const { companyBookableOnly = false } = options;
  const mongo = companyBookableOnly ? bookableTrainerMongoFilter() : {};

  if (!companyBookableOnly) {
    if (filter.status !== undefined) {
      mongo.status = filter.status === true || filter.status === 'true';
    }
    if (filter.acceptingBookings !== undefined) {
      mongo.acceptingBookings = filter.acceptingBookings === true || filter.acceptingBookings === 'true';
    }
  }

  if (filter.name) {
    const term = String(filter.name).trim();
    if (term) {
      const regex = { $regex: term, $options: 'i' };
      mongo.$or = [
        { name: regex },
        { title: regex },
        { specialistIn: regex },
        { typeOfTraining: regex },
      ];
    }
  }
  if (filter.category) {
    mongo.category = filter.category;
  } else if (filter.excludeCategory) {
    mongo.category = { $nin: [filter.excludeCategory] };
  }
  if (filter.specialistIn) {
    mongo.specialistIn = filter.specialistIn;
  }
  if (filter.typeOfTraining) {
    mongo.typeOfTraining = filter.typeOfTraining;
  }
  if (filter.city) {
    mongo.cities = String(filter.city).trim();
  }

  return mongo;
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
 * Normalize trainer payout account details for persistence.
 *
 * @param {object} incoming - Partial account details from the client.
 * @param {object} [current] - Existing stored account details.
 * @returns {object}
 */
const normalizeAccountDetails = (incoming = {}, current = {}) => ({
  upiId: (incoming.upiId ?? current.upiId ?? '').trim(),
  bankName: (incoming.bankName ?? current.bankName ?? '').trim(),
  accountNumber: (incoming.accountNumber ?? current.accountNumber ?? '').trim(),
  ifscCode: (incoming.ifscCode ?? current.ifscCode ?? '').trim().toUpperCase(),
  accountHolderName: (incoming.accountHolderName ?? current.accountHolderName ?? '').trim(),
  panNumber: (incoming.panNumber ?? current.panNumber ?? '').trim().toUpperCase(),
  panDocument: {
    key: (incoming.panDocument?.key ?? current.panDocument?.key ?? '').trim(),
    path: (incoming.panDocument?.path ?? current.panDocument?.path ?? '').trim(),
  },
  gstNumber: (incoming.gstNumber ?? current.gstNumber ?? '').trim().toUpperCase(),
  gstDocument: {
    key: (incoming.gstDocument?.key ?? current.gstDocument?.key ?? '').trim(),
    path: (incoming.gstDocument?.path ?? current.gstDocument?.path ?? '').trim(),
  },
});

/**
 * Get trainer by id
 * @param {ObjectId} id
 * @param {Object} [options]
 * @param {boolean} [options.includeAccountDetails] - Include payout account details (select: false field).
 * @returns {Promise<Trainer>}
 */
const getTrainerById = async (id, options = {}) => {
  const { includeAccountDetails = false } = options;
  let query = Trainer.findById(id);
  if (includeAccountDetails) {
    query = query.select('+accountDetails');
  }
  return query;
};

/**
 * Get trainer by email
 * @param {string} email
 * @returns {Promise<Trainer>}
 */
const getTrainerByEmail = async (email) => {
  return Trainer.findOne({ email });
};

/**
 * Get trainer by mobile
 * @param {string} mobile
 * @returns {Promise<Trainer>}
 */
const getTrainerByMobile = async (mobile) => {
  return Trainer.findOne({ mobile }).select('+password');
};

/**
 * Update trainer by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Trainer>}
 */
const updateTrainerById = async (id, updateBody) => {
  const includeAccountDetails = updateBody.accountDetails !== undefined;
  const trainer = await getTrainerById(id, { includeAccountDetails });
  if (!trainer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }

  if (includeAccountDetails) {
    updateBody.accountDetails = normalizeAccountDetails(
      updateBody.accountDetails,
      trainer.accountDetails
    );
  }

  if (updateBody.category !== undefined) {
    updateBody.category = normalizeTrainerCategories(updateBody.category);
  }

  // Partial $set updates only validate changed paths, so legacy specialistIn /
  // typeOfTraining values on existing documents do not block toggles like acceptingBookings.
  let updateQuery = Trainer.findByIdAndUpdate(
    id,
    { $set: updateBody },
    { new: true, runValidators: true }
  );
  if (includeAccountDetails) {
    updateQuery = updateQuery.select('+accountDetails');
  }
  const updated = await updateQuery;

  if (!updated) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trainer not found');
  }

  return updated;
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
  const MAX_TRAINER_GALLERY_IMAGES = 6;
  if (trainer.images.length >= MAX_TRAINER_GALLERY_IMAGES) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You can upload at most ${MAX_TRAINER_GALLERY_IMAGES} gallery photos`
    );
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
  bookableTrainerMongoFilter,
  isTrainerBookable,
  buildTrainerQueryFilter,
  queryTrainers,
  getTrainerById,
  getTrainerByEmail,
  getTrainerByMobile,
  updateTrainerById,
  deleteTrainerById,
  addTrainerImage,
  removeTrainerImage,
  updateTrainerProfilePhoto,
};










