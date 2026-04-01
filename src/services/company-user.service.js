import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { CompanyUser, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Resolve a company reference from either Mongo ObjectId string or business `companyId` key.
 * @param {string} value
 * @returns {Promise<import('mongoose').Types.ObjectId|null>}
 */
const resolveCompanyObjectId = async (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const byId = await Company.findById(str);
    if (byId) return byId._id;
    return new mongoose.Types.ObjectId(str);
  }
  const byKey = await Company.findOne({ companyId: str });
  return byKey ? byKey._id : null;
};

/**
 * Build Mongo filter from query params (companyId, companyKey, level, status, search).
 */
const buildFilter = async (query) => {
  const filter = {};

  if (query.companyId) {
    const cid = await resolveCompanyObjectId(query.companyId);
    if (!cid) {
      return { _id: { $exists: false } };
    }
    filter.companyId = cid;
  } else if (query.companyKey) {
    const cid = await resolveCompanyObjectId(query.companyKey);
    if (!cid) {
      return { _id: { $exists: false } };
    }
    filter.companyId = cid;
  }

  if (query.level) {
    filter.level = query.level;
  }

  if (query.status !== undefined && query.status !== '') {
    filter.status = query.status === true || query.status === 'true';
  }

  const search = query.search && String(query.search).trim();
  if (search) {
    filter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }

  return filter;
};

/**
 * Create a company user
 * @param {Object} body
 */
const createCompanyUser = async (body) => {
  const company = await Company.findById(body.companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  try {
    return await CompanyUser.create(body);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists for this company');
    }
    throw err;
  }
};

/**
 * Query company users with pagination, filters, and optional search
 */
const queryCompanyUsers = async (query, options) => {
  const filter = await buildFilter(query);
  return CompanyUser.paginate(filter, options);
};

/**
 * List users for one company (by Mongo id or business companyId string)
 */
const getCompanyUsersByCompany = async (companyRef, query, options) => {
  const cid = await resolveCompanyObjectId(companyRef);
  if (!cid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  const { companyId: _omit, companyKey: _omitKey, ...rest } = query;
  const filter = await buildFilter({ ...rest, companyId: cid.toString() });
  return CompanyUser.paginate(filter, options);
};

/**
 * Get company user by id
 */
const getCompanyUserById = async (id) => {
  return CompanyUser.findById(id);
};

/**
 * Update company user
 */
const updateCompanyUserById = async (id, updateBody) => {
  const user = await CompanyUser.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company user not found');
  }
  if (updateBody.companyId) {
    const company = await Company.findById(updateBody.companyId);
    if (!company) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
    }
  }
  Object.assign(user, updateBody);
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists for this company');
    }
    throw err;
  }
  return user;
};

/**
 * Delete company user
 */
const deleteCompanyUserById = async (id) => {
  const user = await CompanyUser.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company user not found');
  }
  await user.deleteOne();
  return user;
};

export {
  createCompanyUser,
  queryCompanyUsers,
  getCompanyUsersByCompany,
  getCompanyUserById,
  updateCompanyUserById,
  deleteCompanyUserById,
  resolveCompanyObjectId,
};
