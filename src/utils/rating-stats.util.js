/**
 * Shared Mongo aggregation helpers for star ratings (1–5).
 * Avoids $push of every rating into JS, which grows O(n) per request.
 */

/**
 * $group stage: avg, count, and histogram without materializing all scores.
 * @returns {object}
 */
export const ratingStatsGroupStage = () => ({
  $group: {
    _id: null,
    averageRating: { $avg: '$rating' },
    totalRatings: { $sum: 1 },
    d1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
    d2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
    d3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
    d4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
    d5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
  },
});

/**
 * Normalize an aggregate row into the public stats payload.
 * @param {object|null|undefined} row
 * @returns {{ averageRating: number, totalRatings: number, ratingDistribution: Record<string, number> }}
 */
export const formatRatingStats = (row) => {
  if (!row) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  return {
    averageRating: Math.round((row.averageRating || 0) * 10) / 10,
    totalRatings: row.totalRatings || 0,
    ratingDistribution: {
      1: row.d1 || 0,
      2: row.d2 || 0,
      3: row.d3 || 0,
      4: row.d4 || 0,
      5: row.d5 || 0,
    },
  };
};

/**
 * True when Mongo rejected an insert due to a unique index.
 * @param {unknown} error
 * @returns {boolean}
 */
export const isDuplicateKeyError = (error) => error?.code === 11000;
