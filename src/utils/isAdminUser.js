/**
 * Whether the authenticated actor is a CRM admin (Admin model / admin JWT).
 * Populated RBAC roles are objects, not the string `'admin'`.
 *
 * @param {object|null|undefined} user - `req.user` from passport.
 * @returns {boolean}
 */
const isAdminUser = (user) => {
    if (!user) return false;
    if (user.role === 'company' || user.role === 'trainer') return false;
    if (user.role === 'admin') return true;
    if (typeof user.username === 'string' && user.email) return true;
    if (user.role && typeof user.role === 'object') {
        const name = String(user.role.name || '').toLowerCase();
        if (name === 'admin' || name === 'super admin') return true;
        return Boolean(user.role.permissions || user.role._id);
    }
    return false;
};

export default isAdminUser;
