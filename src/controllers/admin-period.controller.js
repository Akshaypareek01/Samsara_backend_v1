import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import * as adminPeriodService from '../services/period/admin-period.service.js';

/**
 * ADMIN: Get user's period overview
 */
const getAdminUserPeriodOverview = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const data = await adminPeriodService.getUserPeriodOverview(userId);
  res.send(data);
});

/**
 * ADMIN: Get user's period cycles history
 */
const getAdminUserPeriodCycles = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const cycles = await adminPeriodService.getUserPeriodCycles(userId);
  res.send(cycles);
});

export {
  getAdminUserPeriodOverview,
  getAdminUserPeriodCycles
};
