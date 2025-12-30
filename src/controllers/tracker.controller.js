import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as trackerService from '../services/tracker.service.js';
import {
  WeightTracker,
  BmiTracker,
  FatTracker,
  BodyStatus,
  WaterTracker,
  SleepTracker,
  StepTracker,
  TemperatureTracker,
} from '../models/index.js';

/**
 * Get dashboard data (latest entries from all trackers)
 */
const getDashboardData = catchAsync(async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:18',message:'getDashboardData called',data:{userId:req.user?.id,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-4'})}).catch(()=>{});
  // #endregion

  const data = await trackerService.getDashboardData(req.user.id);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:25',message:'getDashboardData response',data:{userId:req.user?.id,hasWaterData:!!data?.water,waterIntake:data?.water?.totalIntake,waterStatus:data?.water?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-4'})}).catch(()=>{});
  // #endregion

  res.send(data);
});

/**
 * Get tracker status for debugging
 */
const getTrackerStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const trackers = await Promise.all([
    WeightTracker.findOne({ userId }),
    BmiTracker.findOne({ userId }),
    FatTracker.findOne({ userId }),
    BodyStatus.findOne({ userId }),
    WaterTracker.findOne({ userId }),
    SleepTracker.findOne({ userId }),
    StepTracker.findOne({ userId }),
    TemperatureTracker.findOne({ userId }),
  ]);

  const status = {
    weightTracker: trackers[0],
    bmiTracker: trackers[1],
    fatTracker: trackers[2],
    bodyStatus: trackers[3],
    waterTracker: trackers[4],
    sleepTracker: trackers[5],
    stepTracker: trackers[6],
    temperatureTracker: trackers[7],
  };

  res.send(status);
});

/**
 * Get weight tracker history
 */
const getWeightHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getWeightHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get weight tracker entry by ID
 */
const getWeightById = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  const entry = await trackerService.getWeightById(req.user.id, entryId);
  res.send(entry);
});

/**
 * Get water tracker history
 */
const getWaterHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getWaterHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get water tracker entry by ID
 */
const getWaterById = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  const entry = await trackerService.getWaterById(req.user.id, entryId);
  res.send(entry);
});

/**
 * Get mood history
 */
const getMoodHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getMoodHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get temperature tracker history
 */
const getTemperatureHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getTemperatureHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get fat tracker history
 */
const getFatHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getFatHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get BMI tracker history
 */
const getBmiHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getBmiHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get body status history
 */
const getBodyStatusHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getBodyStatusHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get body status entry by ID
 */
const getBodyStatusById = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  const entry = await trackerService.getBodyStatusById(req.user.id, entryId);
  res.send(entry);
});

/**
 * Get step tracker history
 */
const getStepHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getStepHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get sleep tracker history
 */
const getSleepHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getSleepHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get sleep tracker entry by ID
 */
const getSleepById = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  const entry = await trackerService.getSleepById(req.user.id, entryId);
  res.send(entry);
});

/**
 * Add weight entry
 */
const addWeightEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addWeightEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add water entry
 */
const addWaterEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addWaterEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add mood entry
 */
const addMoodEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addMoodEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add temperature entry
 */
const addTemperatureEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addTemperatureEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add fat entry
 */
const addFatEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addFatEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add BMI entry
 */
const addBmiEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addBmiEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add body status entry
 */
const addBodyStatusEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addBodyStatusEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add step entry
 */
const addStepEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addStepEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add sleep entry
 */
const addSleepEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addSleepEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Add workout entry
 */
const addWorkoutEntry = catchAsync(async (req, res) => {
  const entry = await trackerService.addWorkoutEntry(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Get workout history
 */
const getWorkoutHistory = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = await trackerService.getWorkoutHistory(req.user.id, days);
  res.send(history);
});

/**
 * Get workout by type
 */
const getWorkoutByType = catchAsync(async (req, res) => {
  const { workoutType } = req.query;
  const days = parseInt(req.query.days) || 30;
  const workouts = await trackerService.getWorkoutByType(req.user.id, workoutType, days);
  res.send(workouts);
});

/**
 * Get workout summary
 */
const getWorkoutSummary = catchAsync(async (req, res) => {
  const { period, days } = req.query;
  const summary = await trackerService.getWorkoutSummary(req.user.id, period, parseInt(days) || 7);
  res.send(summary);
});

/**
 * Update workout entry
 */
const updateWorkoutEntry = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  const entry = await trackerService.updateWorkoutEntry(req.user.id, entryId, req.body);
  res.send(entry);
});

/**
 * Delete workout entry
 */
const deleteWorkoutEntry = catchAsync(async (req, res) => {
  const { entryId } = req.params;
  await trackerService.deleteWorkoutEntry(req.user.id, entryId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Update tracker entry
 */
const updateTrackerEntry = catchAsync(async (req, res) => {
  const { trackerType, entryId } = req.params;
  const entry = await trackerService.updateTrackerEntry(req.user.id, trackerType, entryId, req.body);
  res.send(entry);
});

/**
 * Delete tracker entry
 */
const deleteTrackerEntry = catchAsync(async (req, res) => {
  const { trackerType, entryId } = req.params;
  await trackerService.deleteTrackerEntry(req.user.id, trackerType, entryId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Update water target/goal
 */
const updateWaterTarget = catchAsync(async (req, res) => {
  const entry = await trackerService.updateWaterTarget(req.user.id, req.body);
  res.send(entry);
});

/**
 * Get today's water data
 */
const getTodayWaterData = catchAsync(async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:326',message:'getTodayWaterData called',data:{userId:req.user?.id,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-1'})}).catch(()=>{});
  // #endregion

  const data = await trackerService.getTodayWaterData(req.user.id);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:333',message:'getTodayWaterData response',data:{userId:req.user?.id,hasData:!!data,totalIntake:data?.totalIntake,status:data?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-1'})}).catch(()=>{});
  // #endregion

  res.send(data);
});

/**
 * Get weekly water summary
 */
const getWeeklyWaterSummary = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const summary = await trackerService.getWeeklyWaterSummary(req.user.id, days);
  res.send(summary);
});

/**
 * Delete water intake entry
 */
const deleteWaterIntake = catchAsync(async (req, res) => {
  const { trackerId } = req.params;
  const { amountMl } = req.body;
  const entry = await trackerService.deleteWaterIntake(req.user.id, trackerId, amountMl);
  res.send(entry);
});

/**
 * Get hydration status
 */
const getHydrationStatus = catchAsync(async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:353',message:'getHydrationStatus called',data:{userId:req.user?.id,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-1'})}).catch(()=>{});
  // #endregion

  const status = await trackerService.getHydrationStatus(req.user.id);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/controllers/tracker.controller.js:360',message:'getHydrationStatus response',data:{userId:req.user?.id,currentIntake:status?.currentIntake,percentage:status?.percentage,status:status?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-1'})}).catch(()=>{});
  // #endregion

  res.send(status);
});

/**
 * Create calories target
 */
const createCaloriesTarget = catchAsync(async (req, res) => {
  const entry = await trackerService.createCaloriesTarget(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(entry);
});

/**
 * Update calories target
 */
const updateCaloriesTarget = catchAsync(async (req, res) => {
  const entry = await trackerService.updateCaloriesTarget(req.user.id, req.body);
  res.send(entry);
});

/**
 * Get calories target and progress
 */
const getCaloriesTarget = catchAsync(async (req, res) => {
  const data = await trackerService.getCaloriesTarget(req.user.id);
  res.send(data);
});

export {
  getDashboardData,
  getTrackerStatus,
  getWeightHistory,
  getWeightById,
  getWaterHistory,
  getWaterById,
  getMoodHistory,
  getTemperatureHistory,
  getFatHistory,
  getBmiHistory,
  getBodyStatusHistory,
  getBodyStatusById,
  getStepHistory,
  getSleepHistory,
  getSleepById,
  addWeightEntry,
  addWaterEntry,
  addMoodEntry,
  addTemperatureEntry,
  addFatEntry,
  addBmiEntry,
  addBodyStatusEntry,
  addStepEntry,
  addSleepEntry,
  addWorkoutEntry,
  getWorkoutHistory,
  getWorkoutByType,
  getWorkoutSummary,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  updateTrackerEntry,
  deleteTrackerEntry,
  updateWaterTarget,
  getTodayWaterData,
  getWeeklyWaterSummary,
  deleteWaterIntake,
  getHydrationStatus,
  createCaloriesTarget,
  updateCaloriesTarget,
  getCaloriesTarget,
};
