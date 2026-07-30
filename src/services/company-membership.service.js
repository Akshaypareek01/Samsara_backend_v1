import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { Company } from '../models/index.js';
import Membership from '../models/membership.model.js';
import MembershipPlan from '../models/membership-plan.model.js';
import ApiError from '../utils/ApiError.js';
import { grantAdminMembershipToUser } from './membership.service.js';

/**
 * Normalize a company code for lookup (uppercase, trimmed).
 * @param {unknown} value
 * @returns {string|null}
 */
const normalizeCompanyCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  return code || null;
};

/**
 * Resolve a company from registration payloads using companyId or corporate_id.
 * @param {{ companyId?: string, corporate_id?: string }} params
 * @returns {Promise<import('../models/company.model.js').default|null>}
 */
const resolveCompanyFromRegistration = async ({ companyId, corporate_id }) => {
  const fromCompanyId = normalizeCompanyCode(companyId);
  if (fromCompanyId) {
    const company = await Company.findOne({ companyId: fromCompanyId });
    if (company) return company;
  }

  const fromCorporateId = normalizeCompanyCode(corporate_id);
  if (fromCorporateId) {
    const company = await Company.findOne({ companyId: fromCorporateId });
    if (company) return company;
  }

  return null;
};

/**
 * Count memberships granted via the corporate auto-assign program for a company code.
 * @param {string} companyCode
 * @returns {Promise<number>}
 */
const countCompanyProgramMemberships = async (companyCode) => {
  return Membership.countDocuments({
    'metadata.companyProgramCompanyId': companyCode,
    'metadata.source': 'company_auto_assign',
  });
};

/**
 * Validate app membership settings before persisting a company.
 * @param {{ appMembershipEnabled?: boolean, appMembershipPlanId?: import('mongoose').Types.ObjectId|null }} body
 * @returns {Promise<void>}
 */
const validateAppMembershipSettings = async (body) => {
  if (!body.appMembershipEnabled) return;

  if (!body.appMembershipPlanId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A membership plan is required when app membership is enabled');
  }

  const plan = await MembershipPlan.findById(body.appMembershipPlanId);
  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Membership plan not found');
  }

  if (plan.name === 'Trial Plan') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Trial Plan cannot be used for corporate app membership');
  }

  if (!plan.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected membership plan is not active');
  }
};

/**
 * Attach membership slot stats to company list rows.
 * @param {Array<Record<string, unknown>>} companies
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
const enrichCompaniesWithMembershipStats = async (companies) => {
  if (!companies.length) return companies;

  const codes = companies.map((c) => c.companyId).filter(Boolean);
  const usedAgg = await Membership.aggregate([
    {
      $match: {
        'metadata.source': 'company_auto_assign',
        'metadata.companyProgramCompanyId': { $in: codes },
      },
    },
    {
      $group: {
        _id: '$metadata.companyProgramCompanyId',
        count: { $sum: 1 },
      },
    },
  ]);

  const usedByCode = new Map(usedAgg.map((row) => [row._id, row.count]));
  const planIds = companies
    .map((c) => c.appMembershipPlanId)
    .filter(Boolean)
    .map((id) => id.toString());
  const uniquePlanIds = [...new Set(planIds)];

  const plans = uniquePlanIds.length
    ? await MembershipPlan.find({ _id: { $in: uniquePlanIds } }).select('name')
    : [];
  const planNameById = new Map(plans.map((p) => [p._id.toString(), p.name]));

  return companies.map((company) => {
    const plain = typeof company.toJSON === 'function' ? company.toJSON() : { ...company };
    const cap = Number(plain.numberOfEmployees) || 0;
    const used = usedByCode.get(plain.companyId) || 0;
    const planId = plain.appMembershipPlanId?.toString?.() || plain.appMembershipPlanId;

    return {
      ...plain,
      membershipSlotsUsed: used,
      membershipSlotsRemaining: Math.max(0, cap - used),
      appMembershipPlanName: planId ? planNameById.get(planId) || null : null,
    };
  });
};

/**
 * Attempt to auto-assign corporate app membership within company seat cap.
 * @param {import('../models/user.model.js').User} user
 * @returns {Promise<import('../models/membership.model.js').default|null>}
 */
const tryAssignCompanyMembership = async (user) => {
  if (user.role !== 'user' || user.userCategory !== 'Corporate' || !user.companyId) {
    return null;
  }

  const company = await Company.findOne({ companyId: normalizeCompanyCode(user.companyId) });
  if (!company?.appMembershipEnabled || !company.appMembershipPlanId) {
    return null;
  }

  const plan = await MembershipPlan.findById(company.appMembershipPlanId);
  if (!plan) {
    console.warn(`Corporate auto-membership skipped: plan missing for company ${company.companyId}`);
    return null;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cap = Number(company.numberOfEmployees) || 0;
    if (cap <= 0) {
      await session.abortTransaction();
      return null;
    }

    const used = await Membership.countDocuments({
      'metadata.companyProgramCompanyId': company.companyId,
      'metadata.source': 'company_auto_assign',
    }).session(session);

    if (used >= cap) {
      await session.abortTransaction();
      console.info(`Corporate auto-membership cap reached for company ${company.companyId} (${used}/${cap})`);
      return null;
    }

    const existingActive = await Membership.findOne({
      userId: user._id,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).session(session);

    if (existingActive) {
      await session.abortTransaction();
      return null;
    }

    const membership = await grantAdminMembershipToUser(
      user._id,
      plan,
      'company_auto_assign',
      {
        companyProgramCompanyId: company.companyId,
        companyMongoId: company._id,
      },
      session
    );

    await session.commitTransaction();
    console.info(`Corporate auto-membership assigned: user=${user._id}, company=${company.companyId}, plan=${plan.name}`);
    return membership;
  } catch (error) {
    await session.abortTransaction();
    console.error(`Corporate auto-membership failed for user ${user._id}:`, error);
    return null;
  } finally {
    session.endSession();
  }
};

export {
  normalizeCompanyCode,
  resolveCompanyFromRegistration,
  countCompanyProgramMemberships,
  validateAppMembershipSettings,
  enrichCompaniesWithMembershipStats,
  tryAssignCompanyMembership,
};
