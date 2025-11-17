import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import Admin from '../models/admin.model.js';

/**
 * Get admin by email
 * @param {string} email
 * @returns {Promise<Admin>}
 */
const getAdminByEmail = async (email) => {
  return Admin.findOne({ email, status: true });
};

/**
 * Get admin by id
 * @param {ObjectId} id
 * @returns {Promise<Admin>}
 */
const getAdminById = async (id) => {
  return Admin.findById(id);
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

export { getAdminByEmail, getAdminById, loginAdminWithEmailAndPassword };

