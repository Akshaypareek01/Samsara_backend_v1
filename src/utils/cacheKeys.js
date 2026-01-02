/**
 * Cache key generators for consistent key naming
 */

export const CacheKeys = {
  // User cache keys
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:profile:${userId}`,
  userMembership: (userId) => `user:membership:${userId}`,
  userSettings: (userId) => `user:settings:${userId}`,

  // Period cycle cache keys
  periodCycle: (userId, cycleId) => `period:cycle:${userId}:${cycleId}`,
  currentPeriodCycle: (userId) => `period:current:${userId}`,
  periodHistory: (userId, page = 1) => `period:history:${userId}:${page}`,
  periodAnalytics: (userId) => `period:analytics:${userId}`,

  // Class cache keys
  class: (classId) => `class:${classId}`,
  classList: (filters = {}) => {
    const filterStr = JSON.stringify(filters);
    return `class:list:${filterStr}`;
  },
  userClasses: (userId) => `class:user:${userId}`,

  // Trainer cache keys
  trainer: (trainerId) => `trainer:${trainerId}`,
  trainerList: (filters = {}) => {
    const filterStr = JSON.stringify(filters);
    return `trainer:list:${filterStr}`;
  },

  // Membership cache keys
  membershipPlan: (planId) => `membership:plan:${planId}`,
  membershipPlans: () => `membership:plans:all`,
  activeMembership: (userId) => `membership:active:${userId}`,

  // Diet cache keys
  dietGeneration: (userId) => `diet:generation:${userId}`,
  dietLatest: (userId) => `diet:latest:${userId}`,

  // Assessment cache keys
  assessment: (userId, type) => `assessment:${type}:${userId}`,
  assessmentLatest: (userId, type) => `assessment:${type}:latest:${userId}`,

  // Mood cache keys
  moodToday: (userId) => `mood:today:${userId}`,
  moodHistory: (userId, date) => `mood:history:${userId}:${date}`,

  // Notification cache keys
  notifications: (userId) => `notification:${userId}`,
  unreadCount: (userId) => `notification:unread:${userId}`,

  // General cache keys
  query: (endpoint, params = {}) => {
    const paramStr = JSON.stringify(params);
    return `query:${endpoint}:${paramStr}`;
  },
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours

  // Specific TTLs
  USER_PROFILE: 1800, // 30 minutes
  PERIOD_CYCLE: 300, // 5 minutes
  CLASS_LIST: 300, // 5 minutes
  TRAINER_LIST: 600, // 10 minutes
  MEMBERSHIP_PLANS: 3600, // 1 hour
  DIET_GENERATION: 1800, // 30 minutes
  ASSESSMENT: 1800, // 30 minutes
  MOOD: 300, // 5 minutes
  NOTIFICATIONS: 60, // 1 minute
};







