import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as meditationService from '../services/meditation.service.js';

const createMeditation = catchAsync(async (req, res) => {
  const meditation = await meditationService.createMeditation(req.body);
  res.status(httpStatus.CREATED).send(meditation);
});

const getMeditations = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'level', 'mood', 'category', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.queryMeditations(filter, options);
  res.send(result);
});

const getMeditation = catchAsync(async (req, res) => {
  const meditation = await meditationService.getMeditationById(req.params.meditationId);
  if (!meditation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meditation not found');
  }
  res.send(meditation);
});

const updateMeditation = catchAsync(async (req, res) => {
  const meditation = await meditationService.updateMeditationById(req.params.meditationId, req.body);
  res.send(meditation);
});

const deleteMeditation = catchAsync(async (req, res) => {
  await meditationService.deleteMeditationById(req.params.meditationId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getMeditationsByCategory = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.getMeditationsByCategory(req.params.categoryId, options);
  res.send(result);
});

const getMeditationsByLevel = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.getMeditationsByLevel(req.params.level, options);
  res.send(result);
});

const getMeditationsByMood = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.getMeditationsByMood(req.params.mood, options);
  res.send(result);
});

const searchMeditations = catchAsync(async (req, res) => {
  const { searchTerm } = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.searchMeditations(searchTerm, options);
  res.send(result);
});

const getRecommendedMeditations = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.getRecommendedMeditations(req.params.meditationId, options);
  res.send(result);
});

const getSimilarMeditations = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meditationService.getSimilarMeditations(req.params.meditationId, options);
  res.send(result);
});

export {
  createMeditation,
  getMeditations,
  getMeditation,
  updateMeditation,
  deleteMeditation,
  getMeditationsByCategory,
  getMeditationsByLevel,
  getMeditationsByMood,
  searchMeditations,
  getRecommendedMeditations,
  getSimilarMeditations,
};
