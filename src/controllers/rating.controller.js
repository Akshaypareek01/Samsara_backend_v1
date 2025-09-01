import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as ratingService from '../services/rating.service.js';
import * as favoritesService from '../services/favorites.service.js';
import * as scheduleService from '../services/schedule.service.js';

// ==================== CLASS RATINGS ====================

/**
 * Rate a class
 */
const rateClass = catchAsync(async (req, res) => {
  const rating = await ratingService.addClassRating(req.user.id, req.params.classId, req.body);
  res.status(httpStatus.CREATED).send(rating);
});

/**
 * Update class rating
 */
const updateClassRating = catchAsync(async (req, res) => {
  const rating = await ratingService.updateClassRating(req.user.id, req.params.classId, req.body);
  res.send(rating);
});

/**
 * Delete class rating
 */
const deleteClassRating = catchAsync(async (req, res) => {
  await ratingService.deleteClassRating(req.user.id, req.params.classId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get class ratings
 */
const getClassRatings = catchAsync(async (req, res) => {
  const options = {
    minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
    page: req.query.page ? parseInt(req.query.page) : 1,
  };

  const result = await ratingService.getClassRatings(req.params.classId, options);
  res.send(result);
});

/**
 * Get class average rating
 */
const getClassAverageRating = catchAsync(async (req, res) => {
  const result = await ratingService.getClassAverageRating(req.params.classId);
  res.send(result);
});

// ==================== EVENT RATINGS ====================

/**
 * Rate an event
 */
const rateEvent = catchAsync(async (req, res) => {
  const rating = await ratingService.addEventRating(req.user.id, req.params.eventId, req.body);
  res.status(httpStatus.CREATED).send(rating);
});

/**
 * Update event rating
 */
const updateEventRating = catchAsync(async (req, res) => {
  const rating = await ratingService.updateEventRating(req.user.id, req.params.eventId, req.body);
  res.send(rating);
});

/**
 * Delete event rating
 */
const deleteEventRating = catchAsync(async (req, res) => {
  await ratingService.deleteEventRating(req.user.id, req.params.eventId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get event ratings
 */
const getEventRatings = catchAsync(async (req, res) => {
  const options = {
    minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
    page: req.query.page ? parseInt(req.query.page) : 1,
  };

  const result = await ratingService.getEventRatings(req.params.eventId, options);
  res.send(result);
});

/**
 * Get event average rating
 */
const getEventAverageRating = catchAsync(async (req, res) => {
  const result = await ratingService.getEventAverageRating(req.params.eventId);
  res.send(result);
});

// ==================== TEACHER RATINGS ====================

/**
 * Get teacher ratings (from classes and events)
 */
const getTeacherRatings = catchAsync(async (req, res) => {
  const options = {
    minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    limit: req.query.limit ? parseInt(req.query.limit) : 10,
    page: req.query.page ? parseInt(req.query.page) : 1,
  };

  const result = await ratingService.getTeacherRatings(req.params.teacherId, options);
  res.send(result);
});

/**
 * Get teacher average rating
 */
const getTeacherAverageRating = catchAsync(async (req, res) => {
  const result = await ratingService.getTeacherAverageRating(req.params.teacherId);
  res.send(result);
});

// ==================== FAVORITES ====================

/**
 * Add class to favorites
 */
const addClassToFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.addClassToFavorites(req.user.id, req.params.classId);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Remove class from favorites
 */
const removeClassFromFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.removeClassFromFavorites(req.user.id, req.params.classId);
  res.send(result);
});

/**
 * Add event to favorites
 */
const addEventToFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.addEventToFavorites(req.user.id, req.params.eventId);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Remove event from favorites
 */
const removeEventFromFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.removeEventFromFavorites(req.user.id, req.params.eventId);
  res.send(result);
});

/**
 * Add teacher to favorites
 */
const addTeacherToFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.addTeacherToFavorites(req.user.id, req.params.teacherId);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Remove teacher from favorites
 */
const removeTeacherFromFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.removeTeacherFromFavorites(req.user.id, req.params.teacherId);
  res.send(result);
});

/**
 * Get user's favorite classes
 */
const getFavoriteClasses = catchAsync(async (req, res) => {
  const result = await favoritesService.getFavoriteClasses(req.user.id);
  res.send(result);
});

/**
 * Get user's favorite events
 */
const getFavoriteEvents = catchAsync(async (req, res) => {
  const result = await favoritesService.getFavoriteEvents(req.user.id);
  res.send(result);
});

/**
 * Get user's favorite teachers
 */
const getFavoriteTeachers = catchAsync(async (req, res) => {
  const result = await favoritesService.getFavoriteTeachers(req.user.id);
  res.send(result);
});

/**
 * Get all user favorites
 */
const getAllFavorites = catchAsync(async (req, res) => {
  const result = await favoritesService.getAllFavorites(req.user.id);
  res.send(result);
});

/**
 * Check if item is in favorites
 */
const checkFavoriteStatus = catchAsync(async (req, res) => {
  const { type, itemId } = req.params;
  const result = await favoritesService.checkFavoriteStatus(req.user.id, itemId, type);
  res.send({ isFavorite: result });
});

// ==================== SCHEDULE FILTERING ====================

/**
 * Get schedule by period
 */
const getScheduleByPeriod = catchAsync(async (req, res) => {
  const { period = 'week' } = req.params;
  const result = await scheduleService.getScheduleByPeriod(req.user.id, period);
  res.send(result);
});

/**
 * Get schedule by date range
 */
const getScheduleByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId } = req.params;

  if (!startDate || !endDate) {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'startDate and endDate are required' });
    return;
  }

  const [classes, events, sessions] = await Promise.all([
    scheduleService.getClassesByDateRange({ startDate, endDate, userId }),
    scheduleService.getEventsByDateRange({ startDate, endDate, userId }),
    scheduleService.getCustomSessionsByDateRange({ startDate, endDate, userId }),
  ]);

  const allActivities = [
    ...classes.map((c) => ({ ...c.toObject(), type: 'class' })),
    ...events.map((e) => ({ ...e.toObject(), type: 'event' })),
    ...sessions.map((s) => ({ ...s.toObject(), type: 'session' })),
  ];

  allActivities.sort((a, b) => {
    const dateA = a.type === 'session' ? new Date(a.date) : new Date(a.schedule || a.startDate);
    const dateB = b.type === 'session' ? new Date(b.date) : new Date(b.schedule || b.startDate);
    return dateA - dateB;
  });

  res.send({
    startDate,
    endDate,
    activities: allActivities,
    summary: {
      totalClasses: classes.length,
      totalEvents: events.length,
      totalSessions: sessions.length,
      totalActivities: allActivities.length,
    },
  });
});

/**
 * Get upcoming activities
 */
const getUpcomingActivities = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const result = await scheduleService.getUserUpcomingActivities(req.user.id, limit);
  res.send(result);
});

export {
  // Class ratings
  rateClass,
  updateClassRating,
  deleteClassRating,
  getClassRatings,
  getClassAverageRating,
  // Event ratings
  rateEvent,
  updateEventRating,
  deleteEventRating,
  getEventRatings,
  getEventAverageRating,
  // Teacher ratings
  getTeacherRatings,
  getTeacherAverageRating,
  // Favorites
  addClassToFavorites,
  removeClassFromFavorites,
  addEventToFavorites,
  removeEventFromFavorites,
  addTeacherToFavorites,
  removeTeacherFromFavorites,
  getFavoriteClasses,
  getFavoriteEvents,
  getFavoriteTeachers,
  getAllFavorites,
  checkFavoriteStatus,
  // Schedule
  getScheduleByPeriod,
  getScheduleByDateRange,
  getUpcomingActivities,
};
