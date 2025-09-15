import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { createInitialTrackers, updateTrackersFromProfile } from './tracker.service.js';
import { assignTrialPlan, assignLifetimePlan } from './membership.service.js';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const user = await User.create(userBody);

  // Create initial trackers for the new user
  try {
    await createInitialTrackers(user._id);
    console.log(`Created initial trackers for user: ${user._id}`);
  } catch (error) {
    console.error(`Failed to create initial trackers for user ${user._id}:`, error);
    // Don't throw error here to avoid failing user creation if tracker creation fails
  }

  // Assign appropriate plan based on user role
  if (user.role === 'user') {
    // Assign trial plan to regular users
    try {
      await assignTrialPlan(user._id);
      console.log(`Assigned trial plan to user: ${user._id}`);
    } catch (error) {
      console.error(`Failed to assign trial plan to user ${user._id}:`, error);
      // Don't throw error here to avoid failing user creation if trial plan assignment fails
    }
  } else if (user.role === 'teacher') {
    // Assign lifetime plan to teachers
    try {
      await assignLifetimePlan(user._id);
      console.log(`Assigned lifetime plan to teacher: ${user._id}`);
    } catch (error) {
      console.error(`Failed to assign lifetime plan to teacher ${user._id}:`, error);
      // Don't throw error here to avoid failing user creation if lifetime plan assignment fails
    }
  }

  return user;
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
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();

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
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
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
const getUsersByRole = async (role, options = {}) => {
  const filter = { role };
  const users = await User.paginate(filter, options);
  return users;
};

export { createUser, queryUsers, getUserById, getUserByEmail, updateUserById, deleteUserById, getUsersByRole };
