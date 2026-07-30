import httpStatus from 'http-status';
import MarketingFolder from '../models/marketing-folder.model.js';
import MarketingContact from '../models/marketing-contact.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * @param {Object} body
 * @returns {Promise<MarketingFolder>}
 */
const createFolder = async (body) => {
  const existing = await MarketingFolder.findOne({ name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') } });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'A folder with this name already exists');
  return MarketingFolder.create(body);
};

/**
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryFolders = async (filter, options) => {
  const result = await MarketingFolder.paginate(filter, options);
  const enriched = await Promise.all(
    result.results.map(async (folder) => {
      const plain = folder.toJSON ? folder.toJSON() : folder;
      const contactCount = await MarketingContact.countDocuments({ folderId: folder._id, status: 'active' });
      return { ...plain, contactCount };
    })
  );
  return { ...result, results: enriched };
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<MarketingFolder|null>}
 */
const getFolderById = async (id) => {
  return MarketingFolder.findById(id);
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @param {Object} updateBody
 * @returns {Promise<MarketingFolder>}
 */
const updateFolderById = async (id, updateBody) => {
  const folder = await getFolderById(id);
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  Object.assign(folder, updateBody);
  await folder.save();
  return folder;
};

/**
 * @param {import('mongoose').Types.ObjectId|string} id
 * @returns {Promise<void>}
 */
const deleteFolderById = async (id) => {
  const folder = await getFolderById(id);
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  await MarketingContact.updateMany({ folderId: id }, { $set: { folderId: null } });
  await folder.deleteOne();
};

export { createFolder, queryFolders, getFolderById, updateFolderById, deleteFolderById };
