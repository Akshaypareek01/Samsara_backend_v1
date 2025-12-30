import httpStatus from 'http-status';
import { Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';
import { sendLoginOTP, verifyLoginOTP } from './otp.service.js';

/**
 * Generate unique company ID
 * @returns {string}
 */
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

/**
 * Create a company
 * @param {Object} companyBody
 * @returns {Promise<Company>}
 */
const createCompany = async (companyBody) => {
  // Generate unique companyId
  let companyId;
  let isUnique = false;

  while (!isUnique) {
    companyId = generateUniqueId();
    const existingCompany = await Company.findOne({ companyId });
    if (!existingCompany) isUnique = true;
  }

  return Company.create({ ...companyBody, companyId });
};

/**
 * Query for companies
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCompanies = async (filter, options) => {
  const companies = await Company.paginate(filter, options);
  return companies;
};

/**
 * Get company by id
 * @param {ObjectId} id
 * @returns {Promise<Company>}
 */
const getCompanyById = async (id) => {
  return Company.findById(id);
};

/**
 * Get company by companyId
 * @param {string} companyId
 * @returns {Promise<Company>}
 */
const getCompanyByCompanyId = async (companyId) => {
  return Company.findOne({ companyId });
};

/**
 * Check if company exists by companyId
 * @param {string} companyId
 * @returns {Promise<boolean>}
 */
const checkCompanyExists = async (companyId) => {
  const company = await Company.exists({ companyId });
  return !!company;
};

/**
 * Update company by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Company>}
 */
const updateCompanyById = async (id, updateBody) => {
  const company = await getCompanyById(id);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  Object.assign(company, updateBody);
  await company.save();
  return company;
};

/**
 * Delete company by id
 * @param {ObjectId} id
 * @returns {Promise<Company>}
 */
const deleteCompanyById = async (id) => {
  const company = await getCompanyById(id);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  await company.deleteOne();
  return company;
};

/**
 * Get company by email
 * @param {string} email
 * @returns {Promise<Company>}
 */
const getCompanyByEmail = async (email) => {
  return Company.findOne({ email });
};

/**
 * Send OTP for company login
 * @param {string} email
 * @returns {Promise<Object>}
 */
const sendLoginOTPForCompany = async (email) => {
  const company = await getCompanyByEmail(email);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found with this email. Please contact support.');
  }

  if (!company.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Company account is inactive. Please contact support.');
  }

  await sendLoginOTP(email);
  return { message: 'OTP sent successfully to your email' };
};

/**
 * Login company with OTP
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Company>}
 */
const loginCompanyWithOTP = async (email, otp) => {
  const company = await getCompanyByEmail(email);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found with this email. Please contact support.');
  }

  if (!company.status) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Company account is inactive. Please contact support.');
  }

  const isValidOTP = await verifyLoginOTP(email, otp);
  if (!isValidOTP) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
  }

  return company;
};

export default {
  createCompany,
  queryCompanies,
  getCompanyById,
  getCompanyByCompanyId,
  checkCompanyExists,
  updateCompanyById,
  deleteCompanyById,
  getCompanyByEmail,
  sendLoginOTPForCompany,
  loginCompanyWithOTP,
};

