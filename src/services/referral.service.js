import { User } from '../models/index.js';
import * as userService from './user.service.js';

/**
 * Return referral code, totals, and a slice of referred users for the current account.
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<{ referralCode: string, totalReferrals: number, referredUsers: { name: string, joinedAt: Date }[] }>}
 */
const getReferralSummary = async (userId) => {
  await userService.ensureReferralCodeForUser(userId);
  const me = await User.findById(userId).select('referralCode').lean();
  const totalReferrals = await User.countDocuments({ referredBy: userId });
  const referredUsers = await User.find({ referredBy: userId })
    .select('name createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return {
    referralCode: me.referralCode,
    totalReferrals,
    referredUsers: referredUsers.map((u) => ({
      name: u.name,
      joinedAt: u.createdAt,
    })),
  };
};

/**
 * Global leaderboard of users by number of successful referrals.
 * @param {number|string|undefined} limit
 * @returns {Promise<{ rank: number, name: string, count: number, referralCode?: string }[]>}
 */
const getReferralLeaderboard = async (limit) => {
  const parsed = parseInt(limit, 10);
  const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;
  const collectionName = User.collection.collectionName;

  const rows = await User.aggregate([
    { $match: { referredBy: { $exists: true, $ne: null } } },
    { $group: { _id: '$referredBy', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: safeLimit },
    {
      $lookup: {
        from: collectionName,
        localField: '_id',
        foreignField: '_id',
        as: 'referrer',
      },
    },
    { $unwind: '$referrer' },
    {
      $project: {
        _id: 0,
        name: '$referrer.name',
        referralCode: '$referrer.referralCode',
        count: 1,
      },
    },
  ]);

  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    count: r.count,
    referralCode: r.referralCode,
  }));
};

export { getReferralSummary, getReferralLeaderboard };
