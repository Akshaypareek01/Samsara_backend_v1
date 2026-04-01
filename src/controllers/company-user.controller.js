import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import * as companyUserService from '../services/company-user.service.js';

const createCompanyUser = catchAsync(async (req, res) => {
  const user = await companyUserService.createCompanyUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

/**
 * List with filters: companyId | companyKey, level, status, search, pagination
 */
const getCompanyUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['companyId', 'companyKey', 'level', 'status', 'search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await companyUserService.queryCompanyUsers(filter, options);
  res.send(result);
});

/**
 * Users belonging to one company (Mongo _id or business companyId string)
 */
const getCompanyUsersByCompany = catchAsync(async (req, res) => {
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
  res.send(user);
});

const updateCompanyUserById = catchAsync(async (req, res) => {
  const user = await companyUserService.updateCompanyUserById(req.params.id, req.body);
  res.send(user);
});

const deleteCompanyUserById = catchAsync(async (req, res) => {
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
