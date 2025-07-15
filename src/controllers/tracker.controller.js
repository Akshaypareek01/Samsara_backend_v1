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
  TemperatureTracker 
} from '../models/index.js';

/**
 * Get dashboard data (latest entries from all trackers)
 */
const getDashboardData = catchAsync(async (req, res) => {
  const data = await trackerService.getDashboardData(req.user.id);
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
    TemperatureTracker.findOne({ userId })
  ]);
  
  const status = {
    weightTracker: trackers[0],
    bmiTracker: trackers[1],
    fatTracker: trackers[2],
    bodyStatus: trackers[3],
    waterTracker: trackers[4],
    sleepTracker: trackers[5],
    stepTracker: trackers[6],
    temperatureTracker: trackers[7]
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
  const data = await trackerService.getTodayWaterData(req.user.id);
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
  updateTrackerEntry,
  deleteTrackerEntry,
  updateWaterTarget,
  getTodayWaterData,
  getWeeklyWaterSummary,
  deleteWaterIntake
};
