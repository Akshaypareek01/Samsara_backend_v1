import { getTeacherAverageRating } from './teacher-rating.service.js';

/** Teacher fields the consumer class/event details screens actually render. */
export const TEACHER_DETAILS_SELECT =
  'name email teacherCategory expertise teachingExperience qualification images additional_courses description AboutMe profileImage achievements createdAt';

/** Lighter teacher projection for upcoming event cards. */
export const EVENT_LIST_TEACHER_SELECT =
  'name teacherCategory profileImage images';

/** Teacher fields for upcoming class cards (same shape as events). */
export const CLASS_LIST_TEACHER_SELECT = EVENT_LIST_TEACHER_SELECT;

/**
 * Card-sized teacher object — skips AboutMe / expertise / PII unused on Home.
 * @param {object|null} teacher
 * @returns {object|null}
 */
export function toListTeacher(teacher) {
  if (!teacher) return null;
  return {
    _id: teacher._id,
    name: teacher.name,
    teacherCategory: teacher.teacherCategory,
    profileImage: teacher.profileImage,
    image: teacher.images && teacher.images.length > 0 ? teacher.images[0] : null,
  };
}

/**
 * Coerces a student ref (hex string, lean ObjectId, or populated doc) to an id.
 * @param {unknown} value
 * @returns {string|null}
 */
function asStudentId(value) {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object') return null;
  // ObjectId has `_id === this` — must not recurse.
  if (typeof value.toHexString === 'function') return value.toHexString();
  if (value._id && value._id !== value) return asStudentId(value._id);
  if (value.id && value.id !== value) return asStudentId(value.id);
  const hex = String(value);
  return /^[a-f0-9]{24}$/i.test(hex) ? hex : null;
}

/**
 * Maps student refs (ObjectIds or populated docs) to id strings.
 * @param {unknown[]} students
 * @returns {string[]}
 */
export function toStudentIdList(students) {
  if (!Array.isArray(students)) return [];
  return students.map(asStudentId).filter(Boolean);
}

/**
 * Adds studentCount / enrolled and inlines teacher average rating so clients
 * do not need extra enrollment + rating GETs. Keeps students as ids only.
 * @param {object} doc - class or event toObject()
 * @param {string} [viewerId]
 * @returns {Promise<object>}
 */
export async function enrichDetailsPayload(doc, viewerId) {
  const studentIds = toStudentIdList(doc.students);
  doc.students = studentIds;
  doc.studentCount = studentIds.length;

  if (viewerId) {
    doc.enrolled = studentIds.includes(String(viewerId));
  }

  const teacherRef = doc.teacher;
  const teacherId = teacherRef && (teacherRef._id || teacherRef.id || teacherRef);
  if (!teacherId) {
    doc.teacherAverageRating = 0;
    doc.teacherTotalRatings = 0;
    return doc;
  }

  try {
    const rating = await getTeacherAverageRating(String(teacherId));
    doc.teacherAverageRating = rating.averageRating || 0;
    doc.teacherTotalRatings = rating.totalRatings || 0;
    if (teacherRef && typeof teacherRef === 'object') {
      teacherRef.averageRating = doc.teacherAverageRating;
      teacherRef.totalRatings = doc.teacherTotalRatings;
    }
  } catch (error) {
    console.error('enrichDetailsPayload rating failed:', error);
    doc.teacherAverageRating = 0;
    doc.teacherTotalRatings = 0;
  }

  return doc;
}
