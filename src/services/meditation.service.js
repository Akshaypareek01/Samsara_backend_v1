import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import { Meditation } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create a meditation
 * @param {Object} meditationBody
 * @returns {Promise<Meditation>}
 */
const createMeditation = async (meditationBody) => {
  const meditation = await Meditation.create(meditationBody);
  return meditation;
};

/**
 * Query for meditations
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMeditations = async (filter, options) => {
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Get meditation by id
 * @param {ObjectId} id
 * @returns {Promise<Meditation>}
 */
const getMeditationById = async (id) => {
  return Meditation.findById(id).populate('category', 'name description');
};

/**
 * Update meditation by id
 * @param {ObjectId} meditationId
 * @param {Object} updateBody
 * @returns {Promise<Meditation>}
 */
const updateMeditationById = async (meditationId, updateBody) => {
  const meditation = await getMeditationById(meditationId);
  if (!meditation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meditation not found');
  }
  Object.assign(meditation, updateBody);
  await meditation.save();
  return meditation;
};

/**
 * Delete meditation by id
 * @param {ObjectId} meditationId
 * @returns {Promise<Meditation>}
 */
const deleteMeditationById = async (meditationId) => {
  const meditation = await getMeditationById(meditationId);
  if (!meditation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meditation not found');
  }
  await meditation.remove();
  return meditation;
};

/**
 * Get meditations by category
 * @param {ObjectId} categoryId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getMeditationsByCategory = async (categoryId, options) => {
  const filter = { category: categoryId, isActive: true };
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Get meditations by level
 * @param {string} level
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getMeditationsByLevel = async (level, options) => {
  const filter = { level, isActive: true };
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Get meditations by mood
 * @param {string} mood
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getMeditationsByMood = async (mood, options) => {
  const filter = { mood, isActive: true };
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Search meditations by title or description
 * @param {string} searchTerm
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const searchMeditations = async (searchTerm, options) => {
  const filter = {
    isActive: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
    ],
  };
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Get recommended meditations
 * @param {ObjectId} meditationId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getRecommendedMeditations = async (meditationId, options) => {
  const meditation = await getMeditationById(meditationId);
  if (!meditation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meditation not found');
  }

  const filter = {
    _id: { $in: meditation.recommended },
    isActive: true,
  };
  const meditations = await Meditation.paginate(filter, options);
  return meditations;
};

/**
 * Get similar meditations based on tags and benefits
 * @param {ObjectId} meditationId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getSimilarMeditations = async (meditationId, options) => {
  const meditation = await getMeditationById(meditationId);
  if (!meditation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meditation not found');
  }

  // Build similarity query based on tags and benefits
  const similarityQuery = {
    _id: { $ne: meditationId }, // Exclude the current meditation
    isActive: true,
    $or: [],
  };

  // Add tag-based similarity
  if (meditation.tags && meditation.tags.length > 0) {
    similarityQuery.$or.push({
      tags: { $in: meditation.tags },
    });
  }

  // Add benefits-based similarity using text search
  if (meditation.benefits) {
    similarityQuery.$or.push({
      benefits: { $regex: meditation.benefits.split(' ').slice(0, 3).join('|'), $options: 'i' },
    });
  }

  // If no tags or benefits, fall back to category-based similarity
  if (similarityQuery.$or.length === 0) {
    similarityQuery.$or.push({
      category: meditation.category,
    });
  }

  // Add level-based similarity as a bonus factor
  if (meditation.level && meditation.level !== 'All Levels') {
    similarityQuery.$or.push({
      level: meditation.level,
    });
  }

  const meditations = await Meditation.paginate(similarityQuery, {
    ...options,
    sortBy: 'createdAt:desc', // Default sort by newest first
  });

  return meditations;
};

export {
  createMeditation,
  queryMeditations,
  getMeditationById,
  updateMeditationById,
  deleteMeditationById,
  getMeditationsByCategory,
  getMeditationsByLevel,
  getMeditationsByMood,
  searchMeditations,
  getRecommendedMeditations,
  getSimilarMeditations,
};
