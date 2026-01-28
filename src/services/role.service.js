import httpStatus from 'http-status';
import Role from '../models/role.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create a role
 * @param {Object} roleBody
 * @returns {Promise<Role>}
 */
const createRole = async (roleBody) => {
    if (await Role.findOne({ name: roleBody.name })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role already exists');
    }
    return Role.create(roleBody);
};

/**
 * Query for roles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryRoles = async (filter, options) => {
    const roles = await Role.paginate(filter, options);
    return roles;
};

/**
 * Get role by id
 * @param {ObjectId} id
 * @returns {Promise<Role>}
 */
const getRoleById = async (id) => {
    return Role.findById(id);
};

/**
 * Update role by id
 * @param {ObjectId} roleId
 * @param {Object} updateBody
 * @returns {Promise<Role>}
 */
const updateRoleById = async (roleId, updateBody) => {
    const role = await getRoleById(roleId);
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
    if (updateBody.name && (await Role.findOne({ name: updateBody.name, _id: { $ne: roleId } }))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role name already taken');
    }
    Object.assign(role, updateBody);
    await role.save();
    return role;
};

/**
 * Delete role by id
 * @param {ObjectId} roleId
 * @returns {Promise<Role>}
 */
const deleteRoleById = async (roleId) => {
    const role = await getRoleById(roleId);
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
    }
    if (role.isSystemRole) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete system roles');
    }
    await role.remove();
    return role;
};

export default {
    createRole,
    queryRoles,
    getRoleById,
    updateRoleById,
    deleteRoleById,
};
