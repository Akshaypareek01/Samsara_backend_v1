import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import roleService from '../services/role.service.js';
import pick from '../utils/pick.js';

const createRole = catchAsync(async (req, res) => {
    const role = await roleService.createRole(req.body);
    res.status(httpStatus.CREATED).send(role);
});

const getRoles = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await roleService.queryRoles(filter, options);
    res.send(result);
});

const getRole = catchAsync(async (req, res) => {
    const role = await roleService.getRoleById(req.params.roleId);
    if (!role) {
        res.status(httpStatus.NOT_FOUND).send({ message: 'Role not found' });
    }
    res.send(role);
});

const updateRole = catchAsync(async (req, res) => {
    const role = await roleService.updateRoleById(req.params.roleId, req.body);
    res.send(role);
});

const deleteRole = catchAsync(async (req, res) => {
    await roleService.deleteRoleById(req.params.roleId);
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};
