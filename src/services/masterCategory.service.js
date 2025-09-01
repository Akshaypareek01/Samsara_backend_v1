import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import { MasterCategory } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create a master category
 * @param {Object} categoryBody
 * @returns {Promise<MasterCategory>}
 */
const createMasterCategory = async (categoryBody) => {
  const category = await MasterCategory.create(categoryBody);
  return category;
};

/**
 * Query for master categories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMasterCategories = async (filter, options) => {
  const categories = await MasterCategory.paginate(filter, options);
  return categories;
};

/**
 * Get master category by id
 * @param {ObjectId} id
 * @returns {Promise<MasterCategory>}
 */
const getMasterCategoryById = async (id) => {
  return MasterCategory.findById(id);
};

/**
 * Get master category by name
 * @param {string} name
 * @returns {Promise<MasterCategory>}
 */
const getMasterCategoryByName = async (name) => {
  return MasterCategory.findOne({ name });
};

/**
 * Update master category by id
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<MasterCategory>}
 */
const updateMasterCategoryById = async (categoryId, updateBody) => {
  const category = await getMasterCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Master category not found');
  }
  Object.assign(category, updateBody);
  await category.save();
  return category;
};

/**
 * Delete master category by id
 * @param {ObjectId} categoryId
 * @returns {Promise<MasterCategory>}
 */
const deleteMasterCategoryById = async (categoryId) => {
  const category = await getMasterCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Master category not found');
  }
  await category.remove();
  return category;
};

/**
 * Get all active master categories
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getActiveMasterCategories = async (options) => {
  const filter = { isActive: true };
  const categories = await MasterCategory.paginate(filter, options);
  return categories;
};

/**
 * Search master categories by name or description
 * @param {string} searchTerm
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const searchMasterCategories = async (searchTerm, options) => {
  const filter = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
    ],
  };
  const categories = await MasterCategory.paginate(filter, options);
  return categories;
};

/**
 * Update category order
 * @param {Array} orderData - Array of {id, order} objects
 * @returns {Promise<Array>}
 */
const updateCategoryOrder = async (orderData) => {
  const updatePromises = orderData.map(({ id, order }) => MasterCategory.findByIdAndUpdate(id, { order }, { new: true }));
  const updatedCategories = await Promise.all(updatePromises);
  return updatedCategories;
};

export {
  createMasterCategory,
  queryMasterCategories,
  getMasterCategoryById,
  getMasterCategoryByName,
  updateMasterCategoryById,
  deleteMasterCategoryById,
  getActiveMasterCategories,
  searchMasterCategories,
  updateCategoryOrder,
};
