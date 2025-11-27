import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as periodTrackerService from '../services/period/periodTracker.service.js';
import * as birthControlService from '../services/period/birthControl.service.js';

export const getCalendar = catchAsync(async (req, res) => {
  const { month } = req.query; // YYYY-MM optional
  const data = await periodTrackerService.getCalendar(req.user.id, month);
  res.send(data);
});

export const getCurrent = catchAsync(async (req, res) => {
  const data = await periodTrackerService.getCurrent(req.user.id);
  res.send(data);
});

export const startPeriod = catchAsync(async (req, res) => {
  const { date, cycleEndDate, periodDurationDays, cycleStatus, dailyLogs } = req.body;
  const options = { cycleEndDate, periodDurationDays, cycleStatus, dailyLogs };
  const cycle = await periodTrackerService.startPeriod(req.user.id, date, options);
  res.status(httpStatus.CREATED).send(cycle);
});

export const stopPeriod = catchAsync(async (req, res) => {
  const { date } = req.body;
  const cycle = await periodTrackerService.stopPeriod(req.user.id, date);
  res.send(cycle);
});

export const upsertLog = catchAsync(async (req, res) => {
  const { date } = req.params;
  const log = await periodTrackerService.upsertDailyLog(req.user.id, date, req.body);
  res.send(log);
});

export const getHistory = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 6;
  const items = await periodTrackerService.getHistory(req.user.id, limit);
  res.send(items);
});

export const getDay = catchAsync(async (req, res) => {
  const { date } = req.params;
  const item = await periodTrackerService.getDay(req.user.id, date);
  res.send(item);
});

export const getSettings = catchAsync(async (req, res) => {
  const data = await periodTrackerService.getSettings(req.user.id);
  res.send(data);
});

export const updateSettings = catchAsync(async (req, res) => {
  const data = await periodTrackerService.updateSettings(req.user.id, req.body);
  res.send(data);
});

export const getBirthControl = catchAsync(async (req, res) => {
  const data = await birthControlService.getBirthControl(req.user.id);
  res.send(data);
});

export const updateBirthControl = catchAsync(async (req, res) => {
  const data = await birthControlService.updateBirthControl(req.user.id, req.body);
  res.send(data);
});

export const takePill = catchAsync(async (req, res) => {
  const { date } = req.body;
  const data = await birthControlService.markPillTaken(req.user.id, date);
  res.send(data);
});

export const bulkImportHistoricalCycles = catchAsync(async (req, res) => {
  const { cycles } = req.body;
  const results = await periodTrackerService.bulkImportHistoricalCycles(req.user.id, cycles);
  res.status(httpStatus.CREATED).json({
    status: 'success',
    data: {
      cycles: results,
      count: results.length
    },
    message: `Successfully imported ${results.length} historical cycle(s)`
  });
});

export const deleteCycle = catchAsync(async (req, res) => {
  const { cycleId } = req.params;
  await periodTrackerService.deleteCycle(req.user.id, cycleId);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Cycle deleted successfully'
  });
});

export const updateCycle = catchAsync(async (req, res) => {
  const { cycleId } = req.params;
  const cycle = await periodTrackerService.updateCycle(req.user.id, cycleId, req.body);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: { cycle },
    message: 'Cycle updated successfully'
  });
});

export const deleteDailyLog = catchAsync(async (req, res) => {
  const { date } = req.params;
  await periodTrackerService.deleteDailyLog(req.user.id, date);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Log deleted successfully'
  });
});

export const getAnalytics = catchAsync(async (req, res) => {
  const analytics = await periodTrackerService.getAnalytics(req.user.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: { analytics }
  });
});

export const getInsights = catchAsync(async (req, res) => {
  const insights = await periodTrackerService.getInsights(req.user.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: { insights }
  });
});

export const getStats = catchAsync(async (req, res) => {
  const stats = await periodTrackerService.getStats(req.user.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: { stats }
  });
});

export const getCurrentEnhanced = catchAsync(async (req, res) => {
  const data = await periodTrackerService.getCurrentEnhanced(req.user.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    data
  });
});
