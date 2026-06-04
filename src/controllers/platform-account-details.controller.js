import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import isAdminUser from '../utils/isAdminUser.js';
import {
  getPlatformAccountDetails,
  upsertPlatformAccountDetails,
} from '../services/platform-account-details.service.js';

/**
 * GET platform bank details and documents (company + admin).
 */
const getAccountDetails = catchAsync(async (req, res) => {
  if (req.user.role === 'company' || isAdminUser(req.user)) {
    const details = await getPlatformAccountDetails();
    return res.send(details);
  }
  throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
});

/**
 * PUT platform bank details and documents (admin only).
 */
const updateAccountDetails = catchAsync(async (req, res) => {
  if (!isAdminUser(req.user)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can update account details');
  }
  const details = await upsertPlatformAccountDetails(req.body, req.user.id);
  res.send(details);
});

export { getAccountDetails, updateAccountDetails };
