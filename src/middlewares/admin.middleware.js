import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import isAdminUser from '../utils/isAdminUser.js';

/**
 * Middleware to verify if the authenticated user is an admin
 * Must be used AFTER auth() middleware.
 *
 * Uses isAdminUser() because admins with a populated RBAC role carry a Role
 * document on `req.user.role`, not the string 'admin'.
 */
const adminOnly = () => async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    if (!isAdminUser(req.user)) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'Admin access required'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default adminOnly;
