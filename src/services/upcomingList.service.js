import { Class, Event } from '../models/index.js';
import { ACTIVE_CLASS_FILTER } from './classCancellation.service.js';
import cacheService from './cache.service.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';
import {
  CLASS_LIST_TEACHER_SELECT,
  EVENT_LIST_TEACHER_SELECT,
  toListTeacher,
  toStudentIdList,
} from './classEventDetails.service.js';

const CLASS_LIST_SELECT =
  'title teacher schedule startTime endTime level image classType classCategory duration maxCapacity schedules meeting_number password cancelled students';

const EVENT_LIST_SELECT =
  'eventName type image eventmode startDate startTime endTime teacher students meeting_number password location level details availableseats';

const HOME_LIST_LIMIT = 40;

/**
 * Maps a class/event lean doc to a Home-card payload (ids only for students).
 * @param {object} doc
 * @returns {object}
 */
function toListItem(doc) {
  const studentIds = toStudentIdList(doc.students);
  return {
    ...doc,
    teacher: toListTeacher(doc.teacher),
    students: studentIds,
    studentCount: studentIds.length,
  };
}

/**
 * Loads upcoming classes from Mongo (no Redis).
 * @param {(docs: object[], currentDate: Date) => object[]} filterUpcomingClasses
 * @returns {Promise<{success: boolean, data: object[]}>}
 */
async function loadUpcomingClasses(filterUpcomingClasses) {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const allClasses = await Class.find({
    ...ACTIVE_CLASS_FILTER,
    $or: [{ schedule: { $gte: currentDate } }, { 'schedules.0': { $exists: true } }],
  })
    .select(CLASS_LIST_SELECT)
    .populate('teacher', CLASS_LIST_TEACHER_SELECT)
    .lean()
    .exec();

  const upcoming = filterUpcomingClasses(allClasses, currentDate);
  const mapped = upcoming.map(toListItem);
  mapped.sort((a, b) => new Date(a.schedule || 0) - new Date(b.schedule || 0));
  return { success: true, data: mapped.slice(0, HOME_LIST_LIMIT) };
}

/**
 * Loads upcoming events from Mongo (no Redis).
 * @returns {Promise<object[]>}
 */
async function loadUpcomingEvents() {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const events = await Event.find({ startDate: { $gte: currentDate } })
    .select(EVENT_LIST_SELECT)
    .populate('teacher', EVENT_LIST_TEACHER_SELECT)
    .sort({ startDate: 1 })
    .limit(HOME_LIST_LIMIT)
    .lean()
    .exec();

  return events.map(toListItem);
}

/**
 * Upcoming group classes for Home — no student populate, lean, Redis 60s.
 * @param {(docs: object[], currentDate: Date) => object[]} filterUpcomingClasses
 * @param {{ skipCache?: boolean }} [options] Pull-to-refresh should skip Redis.
 * @returns {Promise<{success: boolean, data: object[]}>}
 */
export async function getUpcomingClassesPayload(filterUpcomingClasses, options = {}) {
  const dayKey = new Date().toISOString().slice(0, 13);
  const key = CacheKeys.classList({ upcoming: true, hour: dayKey });
  if (options.skipCache) {
    const data = await loadUpcomingClasses(filterUpcomingClasses);
    await cacheService.set(key, data, CacheTTL.SHORT);
    return data;
  }
  return cacheService.getOrSet(key, () => loadUpcomingClasses(filterUpcomingClasses), CacheTTL.SHORT);
}

/**
 * Upcoming events for Home — lean, no student populate, Redis 60s.
 * @param {{ skipCache?: boolean }} [options]
 * @returns {Promise<object[]>}
 */
export async function getUpcomingEventsPayload(options = {}) {
  const dayKey = new Date().toISOString().slice(0, 10);
  const key = CacheKeys.eventList({ upcoming: true, day: dayKey });
  if (options.skipCache) {
    const data = await loadUpcomingEvents();
    await cacheService.set(key, data, CacheTTL.SHORT);
    return data;
  }
  return cacheService.getOrSet(key, loadUpcomingEvents, CacheTTL.SHORT);
}
