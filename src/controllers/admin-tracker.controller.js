import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as trackerService from '../services/admin.tracker.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get user's today water data (ADMIN)
 */
const getAdminUserTodayWaterData = catchAsync(async (req, res) => {
  console.log('req.params:', req.params);
  console.log('req.user:', req.user);

  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  console.log('Fetching water data for userId:', userId);
  const data = await trackerService.getTodayWaterData(userId);
  console.log('Water data found:', { totalIntake: data?.totalIntake, status: data?.status, userId: data?.userId });

  res.send(data);
});
/**
 * Get user's water history (ADMIN)
 */
const getAdminUserWaterHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days) || 30;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const history = await trackerService.getWaterHistory(userId, days);
  res.send(history);
});

/**
 * Get user's hydration status (ADMIN)
 */
const getAdminUserHydrationStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const status = await trackerService.getHydrationStatus(userId);
  res.send(status);
});

/**
 * Get user's dashboard data (ADMIN)
 */
const getAdminUserDashboard = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const data = await trackerService.getDashboardData(userId);
  res.send(data);
});

export { getAdminUserTodayWaterData, getAdminUserWaterHistory, getAdminUserHydrationStatus, getAdminUserDashboard };
