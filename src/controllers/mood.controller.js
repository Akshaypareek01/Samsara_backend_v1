import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createMood,
  queryMoods,
  getMoodById,
  updateMoodById,
  deleteMoodById,
  getMoodAnalytics,
  getMoodKPIs,
  getMoodTrends,
  getMoodByDate,
} from '../services/mood.service.js';

/**
 * Create a mood entry
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const createMoodEntry = catchAsync(async (req, res) => {
  const moodData = {
    ...req.body,
    userId: req.user.id,
  };
  
  const mood = await createMood(moodData);
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Mood entry created successfully',
    data: mood,
  });
});

/**
 * Get mood entries
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodEntries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['mood', 'whatWasItAbout']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Add userId filter to only get current user's moods
  filter.userId = req.user.id;
  
  const result = await queryMoods(filter, options);
  res.send({
    success: true,
    message: 'Mood entries retrieved successfully',
    data: result,
  });
});

/**
 * Get mood entry by id
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodEntry = catchAsync(async (req, res) => {
  const mood = await getMoodById(req.params.moodId);
  if (!mood) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mood entry not found');
  }
  
  // Check if the mood belongs to the current user
  if (mood.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  
  res.send({
    success: true,
    message: 'Mood entry retrieved successfully',
    data: mood,
  });
});

/**
 * Update mood entry by id
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const updateMoodEntry = catchAsync(async (req, res) => {
  const mood = await getMoodById(req.params.moodId);
  if (!mood) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mood entry not found');
  }
  
  // Check if the mood belongs to the current user
  if (mood.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  
  const updatedMood = await updateMoodById(req.params.moodId, req.body);
  res.send({
    success: true,
    message: 'Mood entry updated successfully',
    data: updatedMood,
  });
});

/**
 * Delete mood entry by id
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const deleteMoodEntry = catchAsync(async (req, res) => {
  const mood = await getMoodById(req.params.moodId);
  if (!mood) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mood entry not found');
  }
  
  // Check if the mood belongs to the current user
  if (mood.userId.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }
  
  await deleteMoodById(req.params.moodId);
  res.status(httpStatus.NO_CONTENT).send({
    success: true,
    message: 'Mood entry deleted successfully',
  });
});

/**
 * Get mood analytics
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodAnalyticsData = catchAsync(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  const analytics = await getMoodAnalytics(req.user.id, period, startDate, endDate);
  
  res.send({
    success: true,
    message: 'Mood analytics retrieved successfully',
    data: analytics,
  });
});

/**
 * Get mood KPIs
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodKPIsData = catchAsync(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  const kpis = await getMoodKPIs(req.user.id, period, startDate, endDate);
  
  res.send({
    success: true,
    message: 'Mood KPIs retrieved successfully',
    data: kpis,
  });
});

/**
 * Get mood trends
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodTrendsData = catchAsync(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  const trends = await getMoodTrends(req.user.id, period, startDate, endDate);
  
  res.send({
    success: true,
    message: 'Mood trends retrieved successfully',
    data: trends,
  });
});

/**
 * Get comprehensive mood dashboard data
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodDashboard = catchAsync(async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query;
  
  const [analytics, kpis, trends] = await Promise.all([
    getMoodAnalytics(req.user.id, period, startDate, endDate),
    getMoodKPIs(req.user.id, period, startDate, endDate),
    getMoodTrends(req.user.id, period, startDate, endDate),
  ]);
  
  res.send({
    success: true,
    message: 'Mood dashboard data retrieved successfully',
    data: {
      analytics,
      kpis,
      trends,
      period,
    },
  });
});

/**
 * Get mood summary for quick overview
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodSummary = catchAsync(async (req, res) => {
  const { period = 'weekly' } = req.query;
  
  const analytics = await getMoodAnalytics(req.user.id, period);
  const kpis = await getMoodKPIs(req.user.id, period);
  
  // Get recent mood entries (last 5)
  const recentMoods = await queryMoods(
    { userId: req.user.id },
    { limit: 5, sortBy: 'createdAt:desc' }
  );
  
  res.send({
    success: true,
    message: 'Mood summary retrieved successfully',
    data: {
      period,
      totalEntries: kpis.totalEntries,
      mostFrequentMood: kpis.mostFrequentMood,
      recentMoods: recentMoods.results,
      moodDistribution: analytics.analytics,
    },
  });
});

/**
 * Get mood data for a specific date
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getMoodDataByDate = catchAsync(async (req, res) => {
  const { date } = req.query;
  
  const moodData = await getMoodByDate(req.user.id, date);
  
  res.send({
    success: true,
    message: 'Mood data for specific date retrieved successfully',
    data: moodData,
  });
});

export {
  createMoodEntry,
  getMoodEntries,
  getMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
  getMoodAnalyticsData,
  getMoodKPIsData,
  getMoodTrendsData,
  getMoodDashboard,
  getMoodSummary,
  getMoodDataByDate,
};
