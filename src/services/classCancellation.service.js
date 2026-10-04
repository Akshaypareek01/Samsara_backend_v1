import { Class, User } from '../models/index.js';
import { endZoomMeeting } from './zoomService.js';
import { sendClassCancellationNotification } from '../utils/userNotificationHelpers.js';
import { resolveUserId } from '../utils/notificationUtils.js';

/** Mongo filter for classes that are still bookable / startable. */
export const ACTIVE_CLASS_FILTER = { cancelled: { $ne: true }, removedByTeacher: { $ne: true } };

/**
 * @param {object|null|undefined} classDoc
 * @returns {boolean}
 */
export const isClassCancelled = (classDoc) => Boolean(classDoc?.cancelled);

/**
 * Formats the class calendar date in IST for notification copy.
 * @param {Date|string|null|undefined} schedule
 * @returns {string}
 */
const formatClassDate = (schedule) => {
  if (!schedule) return '';
  const date = new Date(schedule);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * Formats start time as 12-hour IST (or returns an already-labelled time string).
 * @param {object} classDoc
 * @returns {string}
 */
const formatClassTime = (classDoc) => {
  const raw = classDoc?.startTime || classDoc?.schedules?.[0]?.startTime || '';
  if (raw && /AM|PM/i.test(raw)) return raw.trim();
  if (raw) {
    const parts = String(raw).split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10) || 0;
    if (!Number.isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 === 0 ? 12 : hours % 12;
      return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
  }
  if (!classDoc?.schedule) return '';
  const date = new Date(classDoc.schedule);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * Clock string ("17:14" or "5:14 PM") to minutes since midnight.
 * @param {string|null|undefined} timeStr
 * @returns {number|null}
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10) || 0;
  const amPm = (match[3] || '').toUpperCase();
  if (amPm === 'PM' && hours !== 12) hours += 12;
  if (amPm === 'AM' && hours === 12) hours = 0;
  if (Number.isNaN(hours)) return null;
  return hours * 60 + minutes;
};

/**
 * IST calendar date (YYYY-MM-DD) for a stored schedule instant.
 * @param {Date} date
 * @returns {string}
 */
const istDateKey = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

/**
 * True when the trainer already ended the session, or the scheduled end (IST) has passed.
 * Deleting a completed class must not mark it cancelled or notify students.
 * @param {object|null|undefined} classDoc
 * @returns {boolean}
 */
export const isClassCompleted = (classDoc) => {
  if (!classDoc) return false;
  if (classDoc.completedAt) return true;

  const dateValue = classDoc.schedules?.[0]?.date || classDoc.schedule;
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  let start = classDoc.schedules?.[0]?.startTime || classDoc.startTime;
  let end = classDoc.schedules?.[0]?.endTime || classDoc.endTime;
  if (start && String(start).includes('-') && !end) {
    const [startPart, endPart] = String(start).split('-').map((part) => part.trim());
    start = startPart;
    end = endPart;
  }

  let endMinutes = parseTimeToMinutes(end);
  const startMinutes = parseTimeToMinutes(start);
  const duration = Number(classDoc.duration);
  if (endMinutes == null && startMinutes != null && Number.isFinite(duration) && duration > 0) {
    endMinutes = startMinutes + duration;
  }
  if (endMinutes == null) return false;

  const [year, month, day] = istDateKey(date).split('-').map(Number);
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  const endUtcMs = Date.UTC(year, month - 1, day, endHour, endMin) - (5 * 60 + 30) * 60 * 1000;
  return Date.now() >= endUtcMs;
};

/**
 * Hides a finished class from the trainer without marking it cancelled or notifying students.
 * @param {import('mongoose').Document} classDoc
 * @returns {Promise<{ classDoc: object, notified: number, zoomEnded: boolean, cancelled: boolean }>}
 */
export const removeCompletedClass = async (classDoc) => {
  let zoomEnded = false;
  if (classDoc.meeting_number) {
    try {
      await endZoomMeeting(classDoc.meeting_number, classDoc.zoomAccountUsed || 'account_1');
      zoomEnded = true;
    } catch (zoomError) {
      console.error(
        'Error ending Zoom meeting before removing completed class:',
        zoomError?.message || zoomError
      );
    }
  }

  classDoc.removedByTeacher = true;
  classDoc.status = false;
  classDoc.meeting_number = '';
  classDoc.zoomJoinUrl = undefined;
  classDoc.zoomStartUrl = undefined;
  if (!classDoc.completedAt) classDoc.completedAt = new Date();
  await classDoc.save();

  return { classDoc, notified: 0, zoomEnded, cancelled: false };
};

/**
 * Soft-cancels a class, ends any live Zoom meeting, and notifies enrolled students.
 * @param {string} classId
 * @returns {Promise<{ classDoc: object, notified: number, zoomEnded: boolean }>}
 */
export const cancelClassById = async (classId) => {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }
  if (classDoc.cancelled) {
    const error = new Error('Class is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  let zoomEnded = false;
  if (classDoc.meeting_number) {
    try {
      await endZoomMeeting(classDoc.meeting_number, classDoc.zoomAccountUsed || 'account_1');
      zoomEnded = true;
    } catch (zoomError) {
      console.error(
        'Error ending Zoom meeting before class cancel:',
        zoomError?.message || zoomError
      );
    }
  }

  classDoc.cancelled = true;
  classDoc.cancelledAt = new Date();
  classDoc.status = false;
  classDoc.meeting_number = '';
  classDoc.zoomJoinUrl = undefined;
  classDoc.zoomStartUrl = undefined;
  await classDoc.save();

  const studentIds = [...new Set((classDoc.students || []).map(resolveUserId).filter(Boolean))];
  const dateLabel = formatClassDate(classDoc.schedule);
  const timeLabel = formatClassTime(classDoc);
  let instructorName = '';
  try {
    const teacher = await User.findById(classDoc.teacher).select('name').lean();
    instructorName = teacher?.name || '';
  } catch (teacherError) {
    console.error('Failed to load teacher for cancellation notice:', teacherError?.message || teacherError);
  }

  let notified = 0;
  for (const studentId of studentIds) {
    try {
      await sendClassCancellationNotification(studentId, {
        id: classDoc._id,
        title: classDoc.title,
        schedule: classDoc.schedule,
        dateLabel,
        timeLabel,
        instructor: instructorName,
        startTime: classDoc.startTime,
      });
      notified += 1;
    } catch (notifyError) {
      console.error(
        `Failed to notify student ${studentId} of class cancel:`,
        notifyError?.message || notifyError
      );
    }
  }

  return { classDoc, notified, zoomEnded };
};
