import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  createMood,
  getMoods,
  getMood,
  updateMood,
  deleteMood,
  getMoodAnalytics,
  getMoodKPIs,
} from '../../validations/mood.validation.js';
import {
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
} from '../../controllers/mood.controller.js';

const router = express.Router();

// All routes require authentication
router.use(auth());

// Mood CRUD operations
router
  .route('/')
  .post(validate(createMood), createMoodEntry)
  .get(validate(getMoods), getMoodEntries);

// Mood analytics and KPIs
router
  .route('/analytics')
  .get(validate(getMoodAnalytics), getMoodAnalyticsData);

router
  .route('/kpis')
  .get(validate(getMoodKPIs), getMoodKPIsData);

router
  .route('/trends')
  .get(validate(getMoodAnalytics), getMoodTrendsData);

router
  .route('/dashboard')
  .get(validate(getMoodAnalytics), getMoodDashboard);

router
  .route('/summary')
  .get(validate(getMoodAnalytics), getMoodSummary);

// Individual mood operations
router
  .route('/:moodId')
  .get(validate(getMood), getMoodEntry)
  .patch(validate(updateMood), updateMoodEntry)
  .delete(validate(deleteMood), deleteMoodEntry);

export default router;
