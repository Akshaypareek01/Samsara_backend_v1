import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import * as companyUserService from '../services/company-user.service.js';

/**
 * @param {import('express').Request} req
 * @param {{ companyId?: unknown }} doc
 */
const assertAdminOrOwnCompanyUser = (req, doc) => {
  if (req.user.role === 'admin') return;
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const uid = req.user.id?.toString ? req.user.id.toString() : String(req.user.id);
  const cid = doc?.companyId?.toString ? doc.companyId.toString() : String(doc.companyId);
  if (cid !== uid) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
};

const createCompanyUser = catchAsync(async (req, res) => {
  if (req.user.role === 'company') {
    req.body.companyId = req.user.id;
  }
  if (
    req.user.role === 'company' &&
    req.body.companyId &&
    String(req.body.companyId) !== String(req.user.id)
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cannot create users for another company');
  }
  const user = await companyUserService.createCompanyUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

/**
 * List with filters: companyId | companyKey, level, status, search, pagination
 */
const getCompanyUsers = catchAsync(async (req, res) => {
  if (req.user.role === 'company') {
    req.query.companyId = req.user.id;
  }
  const filter = pick(req.query, ['companyId', 'companyKey', 'level', 'status', 'search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await companyUserService.queryCompanyUsers(filter, options);
  res.send(result);
});

/**
 * Users belonging to one company (Mongo _id or business companyId string)
 */
const getCompanyUsersByCompany = catchAsync(async (req, res) => {
  if (req.user.role === 'company' && String(req.params.companyId) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const filter = pick(req.query, ['level', 'status', 'search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await companyUserService.getCompanyUsersByCompany(req.params.companyId, filter, options);
  res.send(result);
});

const getCompanyUserById = catchAsync(async (req, res) => {
  const user = await companyUserService.getCompanyUserById(req.params.id);
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Company user not found',
    });
  }
  assertAdminOrOwnCompanyUser(req, user);
  res.send(user);
});

const updateCompanyUserById = catchAsync(async (req, res) => {
  const existing = await companyUserService.getCompanyUserById(req.params.id);
  if (!existing) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Company user not found',
    });
  }
  assertAdminOrOwnCompanyUser(req, existing);
  if (req.user.role === 'company') {
    delete req.body.companyId;
  }
  const user = await companyUserService.updateCompanyUserById(req.params.id, req.body);
  res.send(user);
});

const deleteCompanyUserById = catchAsync(async (req, res) => {
  const existing = await companyUserService.getCompanyUserById(req.params.id);
  if (!existing) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Company user not found',
    });
  }
  assertAdminOrOwnCompanyUser(req, existing);
  await companyUserService.deleteCompanyUserById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export {
  createCompanyUser,
  getCompanyUsers,
  getCompanyUsersByCompany,
  getCompanyUserById,
  updateCompanyUserById,
  deleteCompanyUserById,
};
