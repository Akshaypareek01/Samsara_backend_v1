import mongoose from 'mongoose';
import { Class, User } from '../models/index.js';
import { createUserNotification, resolveUserId } from '../utils/notificationUtils.js';
import { isClassCancelled } from './classCancellation.service.js';

/**
 * Parses HH:MM, HH:MM:SS, or "h:mm AM/PM" to { hours, minutes }.
 * @param {string|null|undefined} timeStr
 * @returns {{ hours: number, minutes: number }|null}
 */
const parseTimeToHM = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const range = trimmed.includes('-') ? trimmed.split('-')[0].trim() : trimmed;
  const amPmMatch = range.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!amPmMatch) return null;
  let hours = parseInt(amPmMatch[1], 10);
  const minutes = parseInt(amPmMatch[2], 10) || 0;
  const amPm = (amPmMatch[4] || '').toUpperCase();
  if (amPm === 'PM' && hours !== 12) hours += 12;
  if (amPm === 'AM' && hours === 12) hours = 0;
  if (Number.isNaN(hours)) return null;
  return { hours, minutes };
};

/**
 * Combines schedule date + startTime into a Date (server local, matching class listings).
 * @param {object} classDoc
 * @returns {Date|null}
 */
export const getClassStartDateTime = (classDoc) => {
  const dateField = classDoc?.schedule || classDoc?.schedules?.[0]?.date;
  if (!dateField) return null;
  const dateObj = new Date(dateField);
  if (Number.isNaN(dateObj.getTime())) return null;
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const timeStr = classDoc?.startTime || classDoc?.schedules?.[0]?.startTime;
  const hm = parseTimeToHM(timeStr);
  if (hm) {
    start.setHours(hm.hours, hm.minutes, 0, 0);
  }
  return start;
};

/**
 * True once the class start time has passed, or a Zoom meeting is already live.
 * @param {object} classDoc
 * @param {Date} [now]
 * @returns {boolean}
 */
export const hasClassStarted = (classDoc, now = new Date()) => {
  if (classDoc?.meeting_number && String(classDoc.meeting_number).trim() !== '') {
    return true;
  }
  const start = getClassStartDateTime(classDoc);
  if (!start) return false;
  return now >= start;
};

/**
 * @param {Error} error
 * @param {number} statusCode
 * @param {string} code
 * @returns {Error}
 */
const withCode = (error, statusCode, code) => {
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * Enforces student-cancel rules: enrolled, class still upcoming, not teacher-cancelled.
 * @param {object} classDoc
 * @param {string} studentId
 */
export const assertCanCancelRegistration = (classDoc, studentId) => {
  if (!classDoc) {
    throw withCode(new Error('Class not found'), 404, 'CLASS_NOT_FOUND');
  }
  if (isClassCancelled(classDoc)) {
    throw withCode(new Error('This class has been cancelled'), 400, 'CLASS_CANCELLED');
  }
  const studentIdStr = String(studentId);
  const enrolled = (classDoc.students || []).some(
    (student) => String(student?._id ?? student) === studentIdStr
  );
  if (!enrolled) {
    throw withCode(new Error('You are not registered for this class'), 400, 'NOT_ENROLLED');
  }
  if (hasClassStarted(classDoc)) {
    throw withCode(
      new Error('Registration can no longer be cancelled after the class has started.'),
      400,
      'CANCEL_DEADLINE'
    );
  }
};

/**
 * Pulls a student off a class roster and notifies the host (and the student if an admin did it).
 * @param {string} classId
 * @param {string} studentId
 * @param {{ cancelledBy: 'self'|'admin' }} options
 * @returns {Promise<object>} Updated class document
 */
export const cancelStudentRegistration = async (classId, studentId, { cancelledBy }) => {
  const classDoc = await Class.findById(classId);
  assertCanCancelRegistration(classDoc, studentId);

  const studentObjectId = mongoose.isValidObjectId(studentId)
    ? new mongoose.Types.ObjectId(studentId)
    : studentId;

  const updatedClass = await Class.findOneAndUpdate(
    { _id: classId, students: studentObjectId, cancelled: { $ne: true } },
    { $pull: { students: studentObjectId } },
    { new: true }
  )
    .populate(
      'teacher',
      'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements'
    )
    .populate('students', 'name email')
    .exec();

  if (!updatedClass) {
    throw withCode(new Error('Could not cancel registration'), 409, 'CANCEL_FAILED');
  }

  const teacherUserId = resolveUserId(updatedClass.teacher);
  let studentName = 'A student';
  try {
    const student = await User.findById(studentId).select('name email');
    studentName = student?.name || studentName;
    if (teacherUserId) {
      await createUserNotification(
        teacherUserId,
        cancelledBy === 'self' ? 'Student cancelled registration' : 'Student removed from class',
        cancelledBy === 'self'
          ? `${studentName} cancelled their registration for "${updatedClass.title}"`
          : `${studentName} has been removed from your class "${updatedClass.title}"`,
        {
          type: 'class_update',
          priority: 'medium',
          metadata: {
            classId: updatedClass._id,
            className: updatedClass.title,
            studentId,
            studentName,
            totalStudents: updatedClass.students.length,
          },
          actionUrl: `/classes/${updatedClass._id}`,
          actionText: 'View Class',
          tags: ['class', 'unenroll', 'teacher'],
          source: 'automated',
        }
      );
    }
    if (cancelledBy !== 'self') {
      await createUserNotification(
        studentId,
        'Removed from Class',
        `You have been removed from the class "${updatedClass.title}"`,
        {
          type: 'class_update',
          priority: 'medium',
          metadata: {
            classId: updatedClass._id,
            className: updatedClass.title,
          },
          actionUrl: '/classes',
          actionText: 'Browse Classes',
          tags: ['class', 'removal', 'student'],
          source: 'automated',
        }
      );
    }
  } catch (notificationError) {
    console.error('Error sending unenroll notifications:', notificationError?.message || notificationError);
  }

  return updatedClass;
};
