import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as validation from '../../validations/trainer-rating.validation.js';
import * as controller from '../../controllers/trainer-rating.controller.js';

const router = express.Router();

router.get(
  '/pending',
  auth(),
  validate(validation.getPendingRatings),
  controller.getPendingRatings
);

router.post('/', auth(), validate(validation.createTrainerRating), controller.createTrainerRating);

router.get(
  '/trainers/:trainerId/summary',
  validate(validation.getTrainerRatingSummary),
  controller.getTrainerRatingSummary
);

router.get(
  '/trainers/:trainerId/reviews',
  auth(),
  validate(validation.getTrainerReviews),
  controller.getTrainerReviews
);

router.get(
  '/bookings/:bookingId',
  auth(),
  validate(validation.getBookingRating),
  controller.getRatingByBooking
);

router.put(
  '/bookings/:bookingId',
  auth(),
  validate(validation.updateTrainerRating),
  controller.updateTrainerRating
);

export default router;
