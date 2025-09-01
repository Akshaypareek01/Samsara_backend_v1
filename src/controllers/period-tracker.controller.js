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
  const { date } = req.body;
  const cycle = await periodTrackerService.startPeriod(req.user.id, date);
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
