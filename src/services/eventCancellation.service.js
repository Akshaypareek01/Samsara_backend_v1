import { Event, User } from '../models/index.js';
import { endZoomMeeting } from './zoomService.js';
import { sendEventCancellationNotification } from '../utils/userNotificationHelpers.js';
import { resolveUserId } from '../utils/notificationUtils.js';

/** Mongo filter for events that are still listed, bookable, or startable. */
export const ACTIVE_EVENT_FILTER = { cancelled: { $ne: true } };

/**
 * @param {object|null|undefined} eventDoc
 * @returns {boolean}
 */
export const isEventCancelled = (eventDoc) => Boolean(eventDoc?.cancelled);

/**
 * Formats the event calendar date in IST for notification copy.
 * @param {Date|string|null|undefined} startDate
 * @returns {string}
 */
const formatEventDate = (startDate) => {
  if (!startDate) return '';
  const date = new Date(startDate);
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
 * Formats start time as 12-hour IST when the stored value is 24-hour.
 * @param {object} eventDoc
 * @returns {string}
 */
const formatEventTime = (eventDoc) => {
  const raw = eventDoc?.startTime || '';
  if (raw && /AM|PM/i.test(raw)) return raw.trim();
  if (!raw) return '';
  const parts = String(raw).split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(hours)) return '';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

/**
 * Ends a live Zoom meeting for an event. Failures are logged and do not block cancel.
 * @param {object} eventDoc
 * @returns {Promise<boolean>}
 */
const endEventZoom = async (eventDoc) => {
  if (!eventDoc.meeting_number) return false;
  try {
    await endZoomMeeting(eventDoc.meeting_number, eventDoc.zoomAccountUsed || 'account_1');
    return true;
  } catch (zoomError) {
    console.error(
      'Error ending Zoom meeting before event cancel:',
      zoomError?.message || zoomError
    );
    return false;
  }
};

/**
 * Notifies each registered student. One failure does not stop the rest.
 * @param {object} eventDoc
 * @param {string} instructorName
 * @returns {Promise<number>}
 */
const notifyRegisteredStudents = async (eventDoc, instructorName) => {
  const studentIds = [...new Set((eventDoc.students || []).map(resolveUserId).filter(Boolean))];
  const dateLabel = formatEventDate(eventDoc.startDate);
  const timeLabel = formatEventTime(eventDoc);
  let notified = 0;

  for (const studentId of studentIds) {
    try {
      await sendEventCancellationNotification(studentId, {
        id: eventDoc._id,
        title: eventDoc.eventName,
        startDate: eventDoc.startDate,
        dateLabel,
        timeLabel,
        instructor: instructorName,
        startTime: eventDoc.startTime,
      });
      notified += 1;
    } catch (notifyError) {
      console.error(
        `Failed to notify student ${studentId} of event cancel:`,
        notifyError?.message || notifyError
      );
    }
  }

  return notified;
};

/**
 * Soft-cancels an event and keeps the document so history details still load.
 * @param {string} eventId
 * @returns {Promise<{ eventDoc: object, notified: number, zoomEnded: boolean }>}
 */
export const cancelEventById = async (eventId) => {
  const eventDoc = await Event.findById(eventId);
  if (!eventDoc) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }
  if (eventDoc.cancelled) {
    const error = new Error('Event is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  const zoomEnded = await endEventZoom(eventDoc);

  eventDoc.cancelled = true;
  eventDoc.cancelledAt = new Date();
  eventDoc.status = false;
  eventDoc.meeting_number = '';
  eventDoc.password = '';
  await eventDoc.save();

  let instructorName = '';
  try {
    const teacher = await User.findById(eventDoc.teacher).select('name').lean();
    instructorName = teacher?.name || '';
  } catch (teacherError) {
    console.error('Failed to load teacher for event cancellation notice:', teacherError?.message || teacherError);
  }

  const notified = await notifyRegisteredStudents(eventDoc, instructorName);
  return { eventDoc, notified, zoomEnded };
};
