import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import isAdminUser from '../utils/isAdminUser.js';

/**
 * Reject requests where the route's user id does not belong to the caller.
 * Admins (CRM) pass through. Must be used AFTER auth().
 *
 * @param {string} [param='userId'] - Route param holding the target user id.
 * @returns {import('express').RequestHandler}
 */
export const selfOrAdmin =
  (param = 'userId') =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    if (isAdminUser(req.user)) {
      return next();
    }

    const target = String(req.params?.[param] ?? '');
    const callerId = String(req.user.id ?? req.user._id ?? '');

    if (!target || !callerId || target !== callerId) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }

    return next();
  };

export default selfOrAdmin;
