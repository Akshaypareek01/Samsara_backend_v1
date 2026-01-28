import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  loginAdminWithEmailAndPassword,
  createAdmin,
  queryAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById
} from '../services/admin.service.js';
import { generateAdminAuthTokens } from '../services/token.service.js';
import pick from '../utils/pick.js';

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const admin = await loginAdminWithEmailAndPassword(email, password);
  // Role is already populated in the service
  const tokens = await generateAdminAuthTokens(admin);
  res.send({ admin, tokens });
});

const getProfile = async (req, res) => {
  // auth.js always attaches authenticated entity to req.user
  return res.status(200).json(req.user);
};

const createTeamMember = catchAsync(async (req, res) => {
  const adminData = { ...req.body };

  // Set username to email if not provided (required by model)
  if (!adminData.username && adminData.email) {
    adminData.username = adminData.email;
  }

  // Map roleId to role if provided (alias for frontend)
  if (adminData.roleId && !adminData.role) {
    adminData.role = adminData.roleId;
  }

  const admin = await createAdmin(adminData);
  await admin.populate('role');
  res.status(httpStatus.CREATED).send(admin);
});

const getTeamMembers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryAdmins(filter, options);
  res.send(result);
});

const getTeamMember = catchAsync(async (req, res) => {
  const admin = await getAdminById(req.params.adminId);
  if (!admin) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Admin not found' });
  }
  res.send(admin);
});

const updateTeamMember = catchAsync(async (req, res) => {
  const updateData = { ...req.body };

  // Map roleId to role if provided
  if (updateData.roleId && !updateData.role) {
    updateData.role = updateData.roleId;
  }

  const admin = await updateAdminById(req.params.adminId, updateData);
  await admin.populate('role');
  res.send(admin);
});

const deleteTeamMember = catchAsync(async (req, res) => {
  await deleteAdminById(req.params.adminId);
  res.status(httpStatus.NO_CONTENT).send();
});

export {
  login,
  getProfile,
  createTeamMember,
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember
};
