import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import pick from '../utils/pick.js';
import * as trainerService from '../services/trainer.service.js';

/**
 * Create a new trainer
 */
const createTrainer = catchAsync(async (req, res) => {
  const trainer = await trainerService.createTrainer(req.body);
  res.status(httpStatus.CREATED).send(trainer);
});

/**
 * Get all trainers with pagination and filtering
 */
const getAllTrainers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'specialistIn', 'typeOfTraining', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await trainerService.queryTrainers(filter, options);
  res.send(result);
});

/**
 * Get a trainer by ID
 */
const getTrainerById = catchAsync(async (req, res) => {
  const trainer = await trainerService.getTrainerById(req.params.id);
  if (!trainer) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Trainer not found',
    });
  }
  res.send(trainer);
});

/**
 * Update a trainer by ID
 */
const updateTrainerById = catchAsync(async (req, res) => {
  const trainer = await trainerService.updateTrainerById(req.params.id, req.body);
  res.send(trainer);
});

/**
 * Delete a trainer by ID
 */
const deleteTrainerById = catchAsync(async (req, res) => {
  await trainerService.deleteTrainerById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Add image to trainer's images array
 */
const addTrainerImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'fail',
      message: 'Image key and path are required',
    });
  }

  const trainer = await trainerService.addTrainerImage(id, { key, path });
  res.status(httpStatus.CREATED).json({
    status: 'success',
    message: 'Image added successfully',
    data: trainer,
  });
});

/**
 * Remove image from trainer's images array
 */
const removeTrainerImage = catchAsync(async (req, res) => {
  const { id, imageIndex } = req.params;
  const index = parseInt(imageIndex, 10);

  if (isNaN(index)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'fail',
      message: 'Invalid image index',
    });
  }

  const trainer = await trainerService.removeTrainerImage(id, index);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Image removed successfully',
    data: trainer,
  });
});

/**
 * Update trainer profile photo
 */
const updateTrainerProfilePhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { key, path } = req.body;

  if (!key || !path) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'fail',
      message: 'Profile photo key and path are required',
    });
  }

  const trainer = await trainerService.updateTrainerProfilePhoto(id, { key, path });
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Profile photo updated successfully',
    data: trainer,
  });
});

export {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainerById,
  deleteTrainerById,
  addTrainerImage,
  removeTrainerImage,
  updateTrainerProfilePhoto,
};




