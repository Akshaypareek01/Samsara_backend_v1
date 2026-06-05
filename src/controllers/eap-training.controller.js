import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import eapTrainingService from '../services/eap-training.service.js';

/**
 * GET /eap-trainings/mine — trainer's own trainings.
 */
const listMine = catchAsync(async (req, res) => {
  if (req.user.role !== 'trainer') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Trainers only');
  }
  const trainings = await eapTrainingService.listMine(req.user.id);
  res.send({ results: trainings });
});

/**
 * POST /eap-trainings — create training (EAP trainer only).
 */
const createEapTraining = catchAsync(async (req, res) => {
  if (req.user.role !== 'trainer') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Trainers only');
  }
  const training = await eapTrainingService.createEapTraining(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(training);
});

/**
 * GET /eap-trainings — company list (optional trainerId filter).
 */
const listEapTrainings = catchAsync(async (req, res) => {
  if (req.user.role !== 'company' && req.user.role !== 'trainer' && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (req.user.role === 'company') {
    const query = pick(req.query, ['trainerId', 'search', 'trainerName', 'duration']);
    const result = await eapTrainingService.queryCompanyEapTrainings(query, options);
    res.send(result);
    return;
  }

  const filter = pick(req.query, ['trainerId', 'status', 'search', 'duration']);
  if (filter.trainerId) {
    filter.trainer = filter.trainerId;
    delete filter.trainerId;
  }
  if (filter.search && String(filter.search).trim()) {
    filter.title = { $regex: String(filter.search).trim(), $options: 'i' };
    delete filter.search;
  }
  const result = await eapTrainingService.queryEapTrainings(filter, options);
  res.send(result);
});

/**
 * GET /eap-trainings/:id
 */
const getEapTraining = catchAsync(async (req, res) => {
  const forCompany = req.user.role === 'company';
  const training = await eapTrainingService.getEapTrainingById(req.params.id, { forCompany });
  res.send(training);
});

/**
 * PATCH /eap-trainings/:id — owner trainer only.
 */
const updateEapTraining = catchAsync(async (req, res) => {
  if (req.user.role !== 'trainer') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Trainers only');
  }
  const training = await eapTrainingService.updateEapTrainingById(
    req.params.id,
    req.user.id,
    req.body
  );
  res.send(training);
});

/**
 * DELETE /eap-trainings/:id — owner trainer only.
 */
const deleteEapTraining = catchAsync(async (req, res) => {
  if (req.user.role !== 'trainer') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Trainers only');
  }
  await eapTrainingService.deleteEapTrainingById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export {
  listMine,
  createEapTraining,
  listEapTrainings,
  getEapTraining,
  updateEapTraining,
  deleteEapTraining,
};
