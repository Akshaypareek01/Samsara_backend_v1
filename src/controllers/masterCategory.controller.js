import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as masterCategoryService from '../services/masterCategory.service.js';

const createMasterCategory = catchAsync(async (req, res) => {
  const category = await masterCategoryService.createMasterCategory(req.body);
  res.status(httpStatus.CREATED).send(category);
});

const getMasterCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await masterCategoryService.queryMasterCategories(filter, options);
  res.send(result);
});

const getMasterCategory = catchAsync(async (req, res) => {
  const category = await masterCategoryService.getMasterCategoryById(req.params.categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Master category not found');
  }
  res.send(category);
});

const updateMasterCategory = catchAsync(async (req, res) => {
  const category = await masterCategoryService.updateMasterCategoryById(req.params.categoryId, req.body);
  res.send(category);
});

const deleteMasterCategory = catchAsync(async (req, res) => {
  await masterCategoryService.deleteMasterCategoryById(req.params.categoryId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getActiveMasterCategories = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await masterCategoryService.getActiveMasterCategories(options);
  res.send(result);
});

const searchMasterCategories = catchAsync(async (req, res) => {
  const { searchTerm } = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await masterCategoryService.searchMasterCategories(searchTerm, options);
  res.send(result);
});

const updateCategoryOrder = catchAsync(async (req, res) => {
  const { orderData } = req.body;
  const result = await masterCategoryService.updateCategoryOrder(orderData);
  res.send(result);
});

export {
  createMasterCategory,
  getMasterCategories,
  getMasterCategory,
  updateMasterCategory,
  deleteMasterCategory,
  getActiveMasterCategories,
  searchMasterCategories,
  updateCategoryOrder,
};
