import { Class, User } from '../models/index.js';
import { endZoomMeeting } from './zoomService.js';
import { sendClassCancellationNotification } from '../utils/userNotificationHelpers.js';
import { resolveUserId } from '../utils/notificationUtils.js';

/** Mongo filter for classes that are still bookable / startable. */
export const ACTIVE_CLASS_FILTER = { cancelled: { $ne: true } };

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
