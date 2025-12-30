import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as trainerValidation from '../../validations/trainer.validation.js';
import * as trainerController from '../../controllers/trainer.controller.js';

const router = express.Router();

// Create a new trainer
router.post(
  '/',
  auth(),
  validate(trainerValidation.createTrainer),
  trainerController.createTrainer
);

// Get all trainers with pagination and filtering
router.get(
  '/',
  auth(),
  validate(trainerValidation.getTrainers),
  trainerController.getAllTrainers
);

// Get a trainer by ID
router.get(
  '/:id',
  auth(),
  validate(trainerValidation.getTrainer),
  trainerController.getTrainerById
);

// Update a trainer by ID
router.patch(
  '/:id',
  auth(),
  validate(trainerValidation.updateTrainer),
  trainerController.updateTrainerById
);

// Delete a trainer by ID
router.delete(
  '/:id',
  auth(),
  validate(trainerValidation.deleteTrainer),
  trainerController.deleteTrainerById
);

// Add image to trainer's images array
router.post(
  '/:id/images',
  auth(),
  validate(trainerValidation.addTrainerImage),
  trainerController.addTrainerImage
);

// Remove image from trainer's images array
router.delete(
  '/:id/images/:imageIndex',
  auth(),
  validate(trainerValidation.removeTrainerImage),
  trainerController.removeTrainerImage
);

// Update trainer profile photo
router.patch(
  '/:id/profile-photo',
  auth(),
  validate(trainerValidation.updateTrainerProfilePhoto),
  trainerController.updateTrainerProfilePhoto
);

export default router;




