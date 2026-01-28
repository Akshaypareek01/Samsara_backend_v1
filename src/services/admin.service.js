import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import Admin from '../models/admin.model.js';

/**
 * Get admin by email
 * @param {string} email
 * @returns {Promise<Admin>}
 */
const getAdminByEmail = async (email) => {
  return Admin.findOne({ email, status: true }).populate('role');
};

/**
 * Get admin by id
 * @param {ObjectId} id
 * @returns {Promise<Admin>}
 */
const getAdminById = async (id) => {
  return Admin.findById(id).populate('role');
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Admin>}
 */
const loginAdminWithEmailAndPassword = async (email, password) => {
  const admin = await getAdminByEmail(email);
  if (!admin || !(await admin.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return admin;
};

/**
 * Create an admin
 * @param {Object} adminBody
 * @returns {Promise<Admin>}
 */
const createAdmin = async (adminBody) => {
  if (await Admin.findOne({ email: adminBody.email })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await Admin.findOne({ username: adminBody.username })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  return Admin.create(adminBody);
};

/**
 * Query for admins
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAdmins = async (filter, options) => {
  const admins = await Admin.paginate(filter, options);
  return admins;
};

/**
 * Update admin by id
 * @param {ObjectId} adminId
 * @param {Object} updateBody
 * @returns {Promise<Admin>}
 */
const updateAdminById = async (adminId, updateBody) => {
  const admin = await getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  if (updateBody.email && (await Admin.findOne({ email: updateBody.email, _id: { $ne: adminId } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.username && (await Admin.findOne({ username: updateBody.username, _id: { $ne: adminId } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  Object.assign(admin, updateBody);
  await admin.save();
  return admin;
};

/**
 * Delete admin by id
 * @param {ObjectId} adminId
 * @returns {Promise<Admin>}
 */
const deleteAdminById = async (adminId) => {
  const admin = await getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  await admin.remove();
  return admin;
};

export {
  getAdminByEmail,
  getAdminById,
  loginAdminWithEmailAndPassword,
  createAdmin,
  queryAdmins,
  updateAdminById,
  deleteAdminById,
};

