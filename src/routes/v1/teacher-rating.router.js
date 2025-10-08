import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as teacherRatingValidation from '../../validations/teacher-rating.validation.js';
import * as teacherRatingController from '../../controllers/teacher-rating.controller.js';

const router = express.Router();

// ==================== TEACHER RATINGS ====================

// Rate a teacher (POST /teachers/:teacherId)
router
  .route('/teachers/:teacherId')
  .post(auth(), validate(teacherRatingValidation.addTeacherRating), teacherRatingController.rateTeacher)
  .put(auth(), validate(teacherRatingValidation.updateTeacherRating), teacherRatingController.updateTeacherRating)
  .delete(auth(), validate(teacherRatingValidation.deleteTeacherRating), teacherRatingController.deleteTeacherRating);

// Get teacher ratings by teacher ID
router
  .route('/teachers/:teacherId/ratings')
  .get(validate(teacherRatingValidation.getTeacherRatingsByTeacherId), teacherRatingController.getTeacherRatingsByTeacherId);

// Get teacher average rating
router
  .route('/teachers/:teacherId/average')
  .get(validate(teacherRatingValidation.getTeacherAverageRating), teacherRatingController.getTeacherAverageRating);

// Get teacher ratings by user ID
router
  .route('/users/:userId/teacher-ratings')
  .get(validate(teacherRatingValidation.getTeacherRatingsByUserId), teacherRatingController.getTeacherRatingsByUserId);

// Get specific rating by user and teacher
router
  .route('/users/:userId/teachers/:teacherId/rating')
  .get(validate(teacherRatingValidation.getTeacherRatingByUserAndTeacher), teacherRatingController.getTeacherRatingByUserAndTeacher);

export default router;

