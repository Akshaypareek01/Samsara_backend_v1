import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { CompanyUser, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Active employees only: not soft-deleted.
 */
const activeFilter = () => ({
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
});

/**
 * Normalize Mongo id for company (JWT subject).
 *
 * @param {string} companyId
 * @returns {import('mongoose').Types.ObjectId}
 */
const toCompanyOid = (companyId) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid company id');
  }
  return new mongoose.Types.ObjectId(companyId);
};

/**
 * List active company users for the portal (pagination + filters).
 *
 * @param {string} companyMongoId
 * @param {Object} query
 */
export const listPortalEmployees = async (companyMongoId, query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const search = (query.search || '').trim();
  const cid = toCompanyOid(companyMongoId);

  const filter = { companyId: cid, ...activeFilter() };
  const andClauses = [];

  if (search) {
    andClauses.push({
      $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
    });
  }

  const statusFilter = (query.status || '').trim();
  if (statusFilter && statusFilter !== 'All Status') {
    if (statusFilter === 'Excellent') {
      filter.level = 'advanced';
      filter.status = true;
    } else if (statusFilter === 'Good') {
      filter.level = 'intermediate';
      filter.status = true;
    } else if (statusFilter === 'Fair') {
      filter.level = 'beginner';
      filter.status = true;
    } else if (statusFilter === 'At Risk') {
      filter.status = false;
    }
  }

  const departmentFilter = (query.department || '').trim();
  if (departmentFilter && departmentFilter !== 'All Departments') {
    if (departmentFilter === 'Wellness') {
      andClauses.push({
        $or: [
          { department: 'Wellness' },
          { department: { $exists: false } },
          { department: null },
          { department: '' },
        ],
      });
    } else {
      filter.department = departmentFilter;
    }
  }

  if (andClauses.length) {
    filter.$and = andClauses;
  }

  return CompanyUser.paginate(filter, {
    page,
    limit,
    sortBy: 'createdAt:desc',
  });
};

const initials = (name) => {
  if (!name) return '?';
  const p = String(name).split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
};

/**
 * Map paginated CompanyUser docs to employee-score row shape (matches insights mapper).
 */
export const mapPortalEmployeesToRows = (result) => {
  const { page, limit } = result;
  const palette = ['#DBEAFE', '#FEF9C3', '#D1FAE5', '#EDE9FE', '#FFE4E6'];
  const employees = result.results.map((u, i) => {
    const st = !u.status
      ? 'At Risk'
      : u.level === 'advanced'
        ? 'Excellent'
        : u.level === 'intermediate'
          ? 'Good'
          : 'Fair';
    const score = !u.status ? 48 : u.level === 'advanced' ? 90 : u.level === 'intermediate' ? 78 : 65;
    const bg = palette[i % palette.length];
    return {
      id: u.id || u._id?.toString(),
      empCode: `CU${String((page - 1) * limit + i + 1).padStart(4, '0')}`,
      initials: initials(u.fullName),
      avatarBg: bg,
      avatarColor: '#2563EB',
      name: u.fullName,
      department: u.department || 'Wellness',
      status: st,
      lastAssessment: u.updatedAt ? new Date(u.updatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      score,
    };
  });
  return {
    total: result.totalResults,
    employees,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
};

/**
 * Create employee for company (companyId forced server-side).
 *
 * @param {string} companyMongoId
 * @param {Object} body - fullName, email, level, status?, department?
 */
export const createPortalEmployee = async (companyMongoId, body) => {
  const cid = toCompanyOid(companyMongoId);
  const company = await Company.findById(cid);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  try {
    return await CompanyUser.create({
      companyId: cid,
      fullName: body.fullName,
      email: body.email,
      level: body.level,
      status: body.status !== undefined ? body.status : true,
      department: body.department || 'Wellness',
      isActive: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists for this company');
    }
    throw err;
  }
};

/**
 * Load one active employee; 404 if wrong company or inactive.
 */
export const getPortalEmployeeById = async (companyMongoId, userId) => {
  const cid = toCompanyOid(companyMongoId);
  const u = await CompanyUser.findOne({
    _id: userId,
    companyId: cid,
    ...activeFilter(),
  });
  if (!u) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }
  return u;
};

/**
 * Update employee scoped to company.
 */
export const updatePortalEmployee = async (companyMongoId, userId, body) => {
  const u = await getPortalEmployeeById(companyMongoId, userId);
  const update = { ...body };
  delete update.companyId;
  delete update.isActive;
  delete update.deletedAt;
  delete update.deletedBy;
  delete update.deletionReason;
  Object.assign(u, update);
  try {
    await u.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists for this company');
    }
    throw err;
  }
  return u;
};

/**
 * Soft-delete employee (sets isActive false + audit fields).
 *
 * @param {string} companyMongoId
 * @param {string} userId
 * @param {Object} opts
 * @param {string} [opts.deletedBy] - actor label (e.g. company email)
 * @param {string} [opts.reason]
 */
export const softDeletePortalEmployee = async (companyMongoId, userId, opts = {}) => {
  const u = await getPortalEmployeeById(companyMongoId, userId);
  u.isActive = false;
  u.deletedAt = new Date();
  u.deletedBy = (opts.deletedBy || '').toString().slice(0, 200) || 'company';
  u.deletionReason = (opts.reason || '').toString().slice(0, 1000) || '';
  await u.save();
  return u;
};

/**
 * Paginated deletion history (inactive users with deletedAt set).
 */
export const listPortalDeletionHistory = async (companyMongoId, query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const cid = toCompanyOid(companyMongoId);

  const filter = {
    companyId: cid,
    isActive: false,
    deletedAt: { $exists: true, $ne: null },
  };

  const result = await CompanyUser.paginate(filter, {
    page,
    limit,
    sortBy: 'deletedAt:desc',
  });

  const rows = result.results.map((u) => ({
    employeeName: u.fullName,
    email: u.email,
    deletedBy: u.deletedBy || '—',
    deletionDateTime: u.deletedAt ? new Date(u.deletedAt).toLocaleString() : '—',
    reason: u.deletionReason || '—',
  }));

  return {
    total: result.totalResults,
    rows,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
};
