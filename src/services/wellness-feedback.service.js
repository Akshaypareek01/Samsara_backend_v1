import WellnessFeedback from '../models/wellness-feedback.model.js';

/**
 * Persist a corporate wellness feedback submission.
 * @param {Object} payload - Validated feedback body
 * @param {Object} meta - Request metadata (ip, userAgent)
 * @returns {Promise<import('mongoose').Document>}
 */
const createWellnessFeedback = async (payload, meta = {}) => {
  const sessionDate = payload.sessionDate ? new Date(payload.sessionDate) : undefined;

  return WellnessFeedback.create({
    ...payload,
    sessionDate,
    submittedFromIp: meta.ip,
    userAgent: meta.userAgent,
  });
};

/**
 * Paginated list of wellness feedback submissions for admin review.
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const queryWellnessFeedback = async (filter, options) => {
  return WellnessFeedback.paginate(filter, options);
};

export { createWellnessFeedback, queryWellnessFeedback };
