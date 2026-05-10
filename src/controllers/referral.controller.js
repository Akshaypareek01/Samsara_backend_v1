import catchAsync from '../utils/catchAsync.js';
import * as referralService from '../services/referral.service.js';

/**
 * Authenticated user's referral summary (code, counts, recent invites).
 */
const getMyReferrals = catchAsync(async (req, res) => {
  const data = await referralService.getReferralSummary(req.user.id);
  res.send(data);
});

/**
 * Top referrers for the referral program leaderboard.
 */
const getLeaderboard = catchAsync(async (req, res) => {
  const data = await referralService.getReferralLeaderboard(req.query.limit);
  res.send({ leaderboard: data });
});

export { getMyReferrals, getLeaderboard };
