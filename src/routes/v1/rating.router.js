import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as ratingValidation from '../../validations/rating.validation.js';
import * as ratingController from '../../controllers/rating.controller.js';

const router = express.Router();

// ==================== CLASS RATINGS ====================

router
    .route('/classes/:classId')
    .post(auth(), validate(ratingValidation.addClassRating), ratingController.rateClass)
    .put(auth(), validate(ratingValidation.updateClassRating), ratingController.updateClassRating)
    .delete(auth(), validate(ratingValidation.deleteClassRating), ratingController.deleteClassRating);

router
    .route('/classes/:classId/ratings')
    .get(validate(ratingValidation.getClassRatings), ratingController.getClassRatings);

router
    .route('/classes/:classId/average')
    .get(validate(ratingValidation.getClassAverageRating), ratingController.getClassAverageRating);

// ==================== EVENT RATINGS ====================

router
    .route('/events/:eventId')
    .post(auth(), validate(ratingValidation.addEventRating), ratingController.rateEvent)
    .put(auth(), validate(ratingValidation.updateEventRating), ratingController.updateEventRating)
    .delete(auth(), validate(ratingValidation.deleteEventRating), ratingController.deleteEventRating);

router
    .route('/events/:eventId/ratings')
    .get(validate(ratingValidation.getEventRatings), ratingController.getEventRatings);

router
    .route('/events/:eventId/average')
    .get(validate(ratingValidation.getEventAverageRating), ratingController.getEventAverageRating);

// ==================== TEACHER RATINGS ====================

router
    .route('/teachers/:teacherId/ratings')
    .get(validate(ratingValidation.getTeacherRatings), ratingController.getTeacherRatings);

router
    .route('/teachers/:teacherId/average')
    .get(validate(ratingValidation.getTeacherAverageRating), ratingController.getTeacherAverageRating);

// ==================== FAVORITES ====================

router
    .route('/favorites/classes/:classId')
    .post(auth(), validate(ratingValidation.addClassToFavorites), ratingController.addClassToFavorites)
    .delete(auth(), validate(ratingValidation.removeClassFromFavorites), ratingController.removeClassFromFavorites);

router
    .route('/favorites/events/:eventId')
    .post(auth(), validate(ratingValidation.addEventToFavorites), ratingController.addEventToFavorites)
    .delete(auth(), validate(ratingValidation.removeEventFromFavorites), ratingController.removeEventFromFavorites);

router
    .route('/favorites/teachers/:teacherId')
    .post(auth(), validate(ratingValidation.addTeacherToFavorites), ratingController.addTeacherToFavorites)
    .delete(auth(), validate(ratingValidation.removeTeacherFromFavorites), ratingController.removeTeacherFromFavorites);

router
    .route('/favorites/check/:type/:itemId')
    .get(auth(), validate(ratingValidation.checkFavoriteStatus), ratingController.checkFavoriteStatus);

router
    .route('/favorites')
    .get(auth(), ratingController.getAllFavorites);

router
    .route('/favorites/classes')
    .get(auth(), ratingController.getFavoriteClasses);

router
    .route('/favorites/events')
    .get(auth(), ratingController.getFavoriteEvents);

router
    .route('/favorites/teachers')
    .get(auth(), ratingController.getFavoriteTeachers);

// ==================== SCHEDULE ====================

router
    .route('/schedule/period/:period')
    .get(auth(), validate(ratingValidation.getScheduleByPeriod), ratingController.getScheduleByPeriod);

router
    .route('/schedule/date-range/:userId')
    .get(auth(), validate(ratingValidation.getScheduleByDateRange), ratingController.getScheduleByDateRange);

router
    .route('/schedule/upcoming')
    .get(auth(), validate(ratingValidation.getUpcomingActivities), ratingController.getUpcomingActivities);

export default router; 