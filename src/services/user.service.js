import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import { User, BodyStatus, Company } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { createInitialTrackers, updateTrackersFromProfile } from './tracker.service.js';
import { assignLifetimePlan, assignFreeTrialMembership } from './membership.service.js';
import {
  resolveCompanyFromRegistration,
  tryAssignCompanyMembership,
} from './company-membership.service.js';
import cacheService from './cache.service.js';
import { purgeUserData } from './userDeletion.service.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';

/** @type {string[]} */
const REFERRAL_IMMUTABLE_FIELDS = ['referralCode', 'referredBy', 'referredAt'];

/**
 * Normalize optional referral code from client input.
 * @param {unknown} value
 * @returns {string|null} uppercase code or null if absent
 */
/**
 * Escape regex metacharacters so user-supplied search terms cannot cause
 * catastrophic backtracking (ReDoS) or alter the intended query.
 * @param {unknown} value
 * @returns {string}
 */
const escapeRegex = (value) => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeIncomingReferralCode = (value) => {
  if (value == null) return null;
  const s = String(value).trim().toUpperCase();
  return s === '' ? null : s;
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (userBody && typeof userBody.email === 'string') {
    userBody.email = userBody.email.trim().toLowerCase();
  }
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const incomingReferralRaw = userBody.referralCode;
  const createPayload = { ...userBody };
  delete createPayload.referralCode;

  const normalizedRef = normalizeIncomingReferralCode(incomingReferralRaw);
  let referredBy;
  let referredAt;
  if (normalizedRef) {
    const referrer = await User.findOne({ referralCode: normalizedRef });
    if (!referrer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid referral code');
    }
    if (referrer.email === createPayload.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot use your own referral code');
    }
    referredBy = referrer._id;
    referredAt = new Date();
  }

  const user = await User.create({
    ...createPayload,
    ...(referredBy && { referredBy, referredAt }),
  });
  
  // Note: No need to cache new user immediately, will be cached on first fetch

  // Create initial BodyStatus entry if age, gender, height, or weight are provided
  // Check both userBody and saved user object to ensure we catch all data

  const hasBodyData = (user.age && user.age.toString().trim() !== '') ||
                      (user.gender && user.gender.toString().trim() !== '') ||
                      (user.height && user.height.toString().trim() !== '') ||
                      (user.weight && user.weight.toString().trim() !== '');
  
  if (hasBodyData) {
    try {
      const bodyStatusData = {};
      
      if (user.height && user.height.toString().trim() !== '') {
        // Convert height string to BodyStatus format (assume cm if not specified)
        const heightValue = parseFloat(user.height);
        if (!isNaN(heightValue) && heightValue > 0) {
          bodyStatusData.height = { value: heightValue, unit: 'cm' };
        }
      }
      
      if (user.weight && user.weight.toString().trim() !== '') {
        // Convert weight string to BodyStatus format (assume kg if not specified)
        const weightValue = parseFloat(user.weight);
        if (!isNaN(weightValue) && weightValue > 0) {
          bodyStatusData.weight = { value: weightValue, unit: 'kg' };
        }
      }
      
      if (user.age && user.age.toString().trim() !== '') {
        // Convert age string to number
        const ageValue = parseInt(user.age);
        if (!isNaN(ageValue) && ageValue > 0 && ageValue <= 120) {
          bodyStatusData.age = ageValue;
        }
      }
      
      if (user.gender && user.gender.toString().trim() !== '') {
        // Map gender to BodyStatus enum values (Male, Female, Other)
        // Handle case-insensitive matching
        const genderValue = user.gender.toString().trim();
        const genderLower = genderValue.toLowerCase();
        if (genderLower === 'male') {
          bodyStatusData.gender = 'Male';
        } else if (genderLower === 'female') {
          bodyStatusData.gender = 'Female';
        } else if (genderLower === 'other') {
          bodyStatusData.gender = 'Other';
        } else if (['Male', 'Female', 'Other'].includes(genderValue)) {
          // Already in correct format
          bodyStatusData.gender = genderValue;
        }
      }
      
      if (Object.keys(bodyStatusData).length > 0) {
        console.log(`[BodyStatus] Creating entry with data:`, JSON.stringify(bodyStatusData, null, 2));
        await BodyStatus.create({ userId: user._id, ...bodyStatusData });
        console.log(`✅ Created initial BodyStatus entry for user: ${user._id}`, bodyStatusData);
      } else {
        console.log(`[BodyStatus] No valid bodyStatusData to create (all fields were invalid or empty)`);
      }
    } catch (error) {
      console.error(`❌ Failed to create initial BodyStatus entry for user ${user._id}:`, error);
      console.error(`Error details:`, error.message);
      console.error(`Error stack:`, error.stack);
      // Don't throw error here to avoid failing user creation if BodyStatus creation fails
    }
  } else {
    console.log(`[BodyStatus] Skipping - user ${user._id} has no body data (age, gender, height, weight)`);
  }

  // Create initial trackers for the new user
  try {
    await createInitialTrackers(user._id);
    console.log(`Created initial trackers for user: ${user._id}`);
  } catch (error) {
    console.error(`Failed to create initial trackers for user ${user._id}:`, error);
    // Don't throw error here to avoid failing user creation if tracker creation fails
  }

  if (user.role === 'teacher') {
    await assignLifetimePlan(user._id, { source: 'teacher_registration' });
    console.log(`Assigned lifetime plan to teacher: ${user._id}`);
  }

  if (user.role === 'user' && user.userCategory === 'Corporate') {
    const company = await resolveCompanyFromRegistration({
      companyId: userBody.companyId || user.companyId,
      corporate_id: userBody.corporate_id || user.corporate_id,
    });

    if (company) {
      user.companyId = company.companyId;
      user.company_name = company._id;
      await user.save();
      await tryAssignCompanyMembership(user);
    }
  }

  if (user.role === 'user') {
    try {
      await assignFreeTrialMembership(user._id, { source: 'registration' });
    } catch (error) {
      console.error(`Failed to assign 7-day trial for user ${user._id}:`, error);
    }
  }

  return user;
};

/**
 * Build Mongo filter for admin user list queries.
 *
 * @param {Record<string, unknown>} query - Express query params.
 * @returns {Promise<Object>} Mongo filter object.
 */
const buildUserListFilter = async (query) => {
  const filter = pick(query, ['name', 'role', 'userCategory', 'city']);

  if (query.mobile && String(query.mobile).trim()) {
    filter.mobile = { $regex: escapeRegex(String(query.mobile).trim()), $options: 'i' };
  }
  if (query.companyId && String(query.companyId).trim()) {
    filter.companyId = { $regex: escapeRegex(String(query.companyId).trim()), $options: 'i' };
  }
  if (query.corporate_id && String(query.corporate_id).trim()) {
    filter.corporate_id = { $regex: escapeRegex(String(query.corporate_id).trim()), $options: 'i' };
  }
  if (query.status !== undefined && query.status !== '') {
    filter.status = query.status === 'true' || query.status === true;
  }

  const andClauses = [];

  if (query.search && String(query.search).trim()) {
    const term = escapeRegex(String(query.search).trim().slice(0, 100));
    andClauses.push({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { mobile: { $regex: term, $options: 'i' } },
      ],
    });
  }

  if (query.companyName && String(query.companyName).trim()) {
    const companies = await Company.find({
      companyName: { $regex: escapeRegex(String(query.companyName).trim().slice(0, 100)), $options: 'i' },
    }).select('_id companyId');
    const mongoIds = companies.map((c) => c._id);
    const idStrings = companies.map((c) => c.companyId).filter(Boolean);
    const companyOr = [];
    if (mongoIds.length) {
      companyOr.push({ company_name: { $in: mongoIds } });
    }
    if (idStrings.length) {
      companyOr.push({ companyId: { $in: idStrings } });
    }
    if (companyOr.length === 0) {
      filter._id = { $in: [] };
    } else {
      andClauses.push({ $or: companyOr });
    }
  }

  if (andClauses.length) {
    filter.$and = andClauses;
  }

  return filter;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Ensure the user has a persisted referral code (lazy backfill for legacy accounts).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<void>}
 */
const ensureReferralCodeForUser = async (userId) => {
  const fresh = await User.findById(userId);
  if (!fresh || fresh.referralCode) return;
  await fresh.save();
  await cacheService.del(CacheKeys.user(userId));
  await cacheService.del(CacheKeys.userProfile(userId));
  await cacheService.del(CacheKeys.userSettings(userId));
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const cacheKey = CacheKeys.user(id);
  
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await User.findById(id);
    },
    CacheTTL.USER_PROFILE
  );
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  return User.findOne({ email: normalized });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const previousRole = user.role;
  REFERRAL_IMMUTABLE_FIELDS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updateBody, key)) {
      delete updateBody[key];
    }
  });
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();

  if (user.role === 'teacher' && previousRole !== 'teacher') {
    await assignLifetimePlan(user._id, { source: 'role_updated_to_teacher' });
    console.log(`Assigned lifetime plan after role change to teacher: ${user._id}`);
  }

  // Invalidate user caches
  await cacheService.del(CacheKeys.user(userId));
  await cacheService.del(CacheKeys.userProfile(userId));
  await cacheService.del(CacheKeys.userSettings(userId));

  // Update tracker fields if relevant profile data was updated
  try {
    await updateTrackersFromProfile(userId, updateBody);
  } catch (error) {
    console.error(`Failed to update trackers for user ${userId}:`, error);
    // Don't throw error here to avoid failing user update if tracker update fails
  }

  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  // Must bypass the cache: getUserById returns a plain JSON object on a cache
  // hit, which has no .remove() and no _id — deletion then 500s at random.
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Clear the user's health, cycle, assessment and engagement records before
  // the account row goes. Without this they are orphaned but still readable
  // through any per-user endpoint, and the account is not actually deleted in
  // the sense the app stores require.
  const purge = await purgeUserData(userId);

  await user.remove();

  await cacheService.del(CacheKeys.user(userId));
  await cacheService.del(CacheKeys.userProfile(userId));
  await cacheService.del(CacheKeys.userSettings(userId));

  if (purge.failed.length) {
    console.warn(`deleteUserById(${userId}): ${purge.failed.length} collection(s) failed to purge`, purge.failed);
  }

  return user;
};

/**
 * Delete multiple users by id (admin bulk action).
 *
 * @param {import('mongoose').Types.ObjectId[]|string[]} userIds
 * @returns {Promise<{ deleted: number, failed: Array<{ userId: string, message: string }> }>}
 */
const bulkDeleteUsersById = async (userIds) => {
  const result = { deleted: 0, failed: [] };
  for (const userId of userIds) {
    try {
      await deleteUserById(userId);
      result.deleted += 1;
    } catch (err) {
      result.failed.push({
        userId: String(userId),
        message: err.message || 'Delete failed',
      });
    }
  }
  return result;
};

/**
 * Get users by role
 * @param {string} role - User role (user, teacher)
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
/** Personal fields never needed by a public teacher listing. */
const TEACHER_LIST_EXCLUDED_FIELDS = [
  'password',
  'mobile',
  'emergencyMobile',
  'dob',
  'age',
  'Address',
  'pincode',
  'country',
  'corporate_id',
  'companyId',
  'notificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'metadata',
  'referralCode',
  'referredBy',
]
  .map((f) => `-${f}`)
  .join(' ');

const getUsersByRole = async (role, options = {}) => {
  const filter = { role };
  // Exclusion rather than an allow-list: consumers keep every field they use
  // today, they just stop receiving personal data (see H-08 for the same fix
  // on the public class/event endpoints).
  const users = await User.paginate(filter, { ...options, select: TEACHER_LIST_EXCLUDED_FIELDS });
  return users;
};

export {
  createUser,
  buildUserListFilter,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  bulkDeleteUsersById,
  getUsersByRole,
  ensureReferralCodeForUser,
  normalizeIncomingReferralCode,
};
