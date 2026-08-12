import mongoose from 'mongoose';
import logger from '../config/logger.js';
// Registers every model reachable from the barrel. CommunityPost lives outside
// it (nothing else imports community.model.js), so pull it in explicitly —
// otherwise the purge silently skips that collection depending on import order.
import '../models/index.js';
// These three are not re-exported by the barrel, so import them directly —
// otherwise the purge silently skips their collections depending on which
// controllers happen to have loaded first.
import '../models/community.model.js';
import '../models/teacher-rating.model.js';
import '../models/notification.model.js';

/**
 * Collections holding a deleted user's personal data, keyed by owner field.
 *
 * Deleting only the `Users` document leaves every one of these orphaned —
 * health, cycle and assessment records that outlive the account and are still
 * reachable through any per-user endpoint. Account deletion has to clear them.
 *
 * @type {Array<{ model: string, field: string }>}
 */
const PERSONAL_DATA_COLLECTIONS = [
  // Health & body tracking
  { model: 'BodyStatus', field: 'userId' },
  { model: 'BmiTracker', field: 'userId' },
  { model: 'WeightTracker', field: 'userId' },
  { model: 'FatTracker', field: 'userId' },
  { model: 'WaterTracker', field: 'userId' },
  { model: 'StepTracker', field: 'userId' },
  { model: 'SleepTracker', field: 'userId' },
  { model: 'HeartRateTracker', field: 'userId' },
  { model: 'TemperatureTracker', field: 'userId' },
  { model: 'WorkoutTracker', field: 'userId' },
  { model: 'CaloriesTarget', field: 'userId' },
  { model: 'Mood', field: 'userId' },

  // Women's health — the most sensitive category
  { model: 'PeriodCycle', field: 'userId' },
  { model: 'PeriodSettings', field: 'userId' },
  { model: 'BirthControl', field: 'userId' },
  { model: 'MenopauseAssessment', field: 'userId' },
  { model: 'PcosAssessment', field: 'userId' },
  { model: 'ThyroidAssessment', field: 'userId' },

  // Assessments, reports, plans
  { model: 'Assessment', field: 'userId' },
  { model: 'AssessmentResult', field: 'userId' },
  { model: 'BloodReport', field: 'userId' },
  { model: 'DietGeneration', field: 'userId' },
  { model: 'DailySchedule', field: 'userId' },

  // Engagement & content authored by the user
  { model: 'ClassRating', field: 'userId' },
  { model: 'EventRating', field: 'userId' },
  { model: 'TeacherRating', field: 'userId' },
  { model: 'CommunityPost', field: 'user' },
  { model: 'EventApplication', field: 'userId' },
  { model: 'WhatsAppConversation', field: 'userId' },

  // Notifications & session state
  { model: 'Notification', field: 'userId' },
  { model: 'NotificationPreferences', field: 'userId' },
  { model: 'Token', field: 'user' },
];

/**
 * Rosters the user may appear in. Membership is by array element, not by an
 * owner field, so these are pulled rather than deleted — the class or event
 * itself belongs to other people.
 *
 * @type {Array<{ model: string, field: string }>}
 */
const ROSTER_COLLECTIONS = [
  { model: 'Class', field: 'students' },
  { model: 'Event', field: 'students' },
];

/**
 * Remove every trace of a user's personal data.
 *
 * Deliberately does NOT touch `Transaction` or `Membership`: those are
 * financial records that are normally subject to statutory retention. They are
 * reported back so the caller can anonymise them if full erasure is required.
 *
 * Each step is isolated — one failing collection must not abort the rest and
 * leave the deletion half-applied.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<{ deleted: Record<string, number>, failed: Array<{ model: string, message: string }>, retained: Record<string, number> }>}
 */
export const purgeUserData = async (userId) => {
  const deleted = {};
  const failed = [];
  const retained = {};

  for (const { model, field } of PERSONAL_DATA_COLLECTIONS) {
    try {
      const Model = mongoose.models[model];
      if (!Model) continue; // model not registered in this build
      const res = await Model.deleteMany({ [field]: userId });
      if (res?.deletedCount) deleted[model] = res.deletedCount;
    } catch (error) {
      failed.push({ model, message: error.message });
      logger.error(`purgeUserData: ${model} cleanup failed for ${userId}: ${error.message}`);
    }
  }

  for (const { model, field } of ROSTER_COLLECTIONS) {
    try {
      const Model = mongoose.models[model];
      if (!Model) continue;
      const res = await Model.updateMany({ [field]: userId }, { $pull: { [field]: userId } });
      if (res?.modifiedCount) deleted[`${model}.${field}`] = res.modifiedCount;
    } catch (error) {
      failed.push({ model, message: error.message });
      logger.error(`purgeUserData: ${model} roster cleanup failed for ${userId}: ${error.message}`);
    }
  }

  // Count what is intentionally kept so the audit trail is explicit.
  for (const model of ['Transaction', 'Membership']) {
    try {
      const Model = mongoose.models[model];
      if (!Model) continue;
      const count = await Model.countDocuments({ userId });
      if (count) retained[model] = count;
    } catch {
      /* counting is best-effort */
    }
  }

  logger.info(
    `purgeUserData ${userId}: removed ${Object.values(deleted).reduce((a, b) => a + b, 0)} records across ${
      Object.keys(deleted).length
    } collections; retained ${JSON.stringify(retained)}; failures ${failed.length}`
  );

  return { deleted, failed, retained };
};

export default purgeUserData;
