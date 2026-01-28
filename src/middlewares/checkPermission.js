import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware to check if the user has permission for a specific module and action
 * @param {string} module - The module name (e.g., 'userManagement.users', 'companyManagement')
 * @param {string} action - The action level ('create', 'read', 'update', 'delete')
 */
const checkPermission = (module, action) => async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    // Super Admin (legacy 'admin' string or isSystemRole admin) has all permissions
    if (req.user.role === 'admin') {
        return next();
    }

    const userRole = req.user.role;

    // If role is a system role named 'admin', grant all permissions
    if (userRole && userRole.name === 'admin') {
        return next();
    }

    if (!userRole || typeof userRole === 'string' || !userRole.permissions) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden: No valid role permissions assigned'));
    }

    // Get permissions for the specific module
    // module could be nested like 'userManagement.users'
    const moduleParts = module.split('.');
    let permissions = userRole.permissions;

    for (const part of moduleParts) {
        if (permissions && permissions[part]) {
            permissions = permissions[part];
        } else {
            permissions = null;
            break;
        }
    }

    if (!permissions) {
        return next(new ApiError(httpStatus.FORBIDDEN, `Forbidden: No permissions found for module ${module}`));
    }

    // Special case for dashboard which only has 'read'
    if (module === 'dashboard' && action === 'read') {
        if (permissions.read) return next();
    }

    if (!permissions[action]) {
        return next(new ApiError(httpStatus.FORBIDDEN, `Forbidden: Insufficient permissions for ${action} on ${module}`));
    }

    next();
};

export default checkPermission;
