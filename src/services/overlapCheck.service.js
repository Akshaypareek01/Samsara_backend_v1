/**
 * Overlap check service - prevents teachers from creating overlapping classes/events
 * on the same date and time.
 */

import { Class, Event } from '../models/index.js';

/**
 * Parse time string (HH:MM, HH:MM:SS, or "h:mm AM/PM") to minutes since midnight
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const s = timeStr.trim();
  const amPmMatch = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10) || 0;
    const amPm = (amPmMatch[4] || '').toUpperCase();
    if (amPm === 'PM' && hours !== 12) hours += 12;
    if (amPm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const parts = s.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return null;
};

/**
 * Get date as YYYY-MM-DD for comparison (local timezone)
 */
const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Extract time slots from a class (date + start/end minutes)
 * Returns array of { dateKey, startMinutes, endMinutes }
 */
const extractClassSlots = (classData) => {
  const slots = [];
  const duration = classData.duration || 60;

  if (classData.schedules && classData.schedules.length > 0) {
    for (const s of classData.schedules) {
      const date = s.date || classData.schedule;
      if (!date) continue;
      const dateKey = getDateKey(date);
      const startM = parseTimeToMinutes(s.startTime || classData.startTime);
      const endM = parseTimeToMinutes(s.endTime || classData.endTime);
      const startMinutes = startM ?? 0;
      const endMinutes = endM ?? startMinutes + duration;
      if (endMinutes > startMinutes) slots.push({ dateKey, startMinutes, endMinutes });
    }
  }

  if (slots.length === 0 && classData.schedule) {
    const dateKey = getDateKey(classData.schedule);
    const startM = parseTimeToMinutes(classData.startTime);
    const endM = parseTimeToMinutes(classData.endTime);
    const startMinutes = startM ?? 0;
    const endMinutes = endM ?? (startM != null ? startM + duration : duration);
    if (endMinutes > startMinutes) slots.push({ dateKey, startMinutes, endMinutes });
  }

  return slots;
};

/**
 * Extract time slots from an event
 */
const extractEventSlots = (eventData) => {
  const slots = [];
  if (!eventData.startDate) return slots;

  const dateKey = getDateKey(eventData.startDate);
  const startM = parseTimeToMinutes(eventData.startTime);
  const endM = parseTimeToMinutes(eventData.endTime);
  if (startM == null && endM == null) return slots; // No times, can't check
  const startMinutes = startM ?? 0;
  const endMinutes = endM ?? startMinutes + 60;
  if (endMinutes > startMinutes) slots.push({ dateKey, startMinutes, endMinutes });
  return slots;
};

/**
 * Check if two slots overlap (same date, time ranges overlap)
 * Overlap: startA < endB AND endA > startB
 */
const slotsOverlap = (a, b) => {
  if (a.dateKey !== b.dateKey) return false;
  return a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;
};

/**
 * Check for overlapping classes/events for a teacher.
 * @param {string} teacherId - Teacher's ObjectId
 * @param {Array} newSlots - Slots to check: [{ dateKey, startMinutes, endMinutes }]
 * @param {string} [excludeClassId] - Class ID to exclude (for updates)
 * @param {string} [excludeEventId] - Event ID to exclude (for updates)
 * @returns {{ hasOverlap: boolean, message?: string, conflictingItem?: { type, name, date, time } }}
 */
export const checkTeacherOverlap = async (teacherId, newSlots, excludeClassId = null, excludeEventId = null) => {
  if (!teacherId || !newSlots || newSlots.length === 0) return { hasOverlap: false };

  const existingClasses = await Class.find({ teacher: teacherId })
    .select('_id title schedule startTime endTime duration schedules')
    .lean();
  const existingEvents = await Event.find({ teacher: teacherId })
    .select('_id eventName startDate startTime endTime')
    .lean();

  const formatTime = (startM, endM) => {
    const h1 = Math.floor(startM / 60);
    const m1 = startM % 60;
    const h2 = Math.floor(endM / 60);
    const m2 = endM % 60;
    return `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')} - ${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
  };

  for (const newSlot of newSlots) {
    for (const c of existingClasses) {
      if (excludeClassId && c._id.toString() === excludeClassId) continue;
      const cSlots = extractClassSlots(c);
      for (const cs of cSlots) {
        if (slotsOverlap(newSlot, cs)) {
          return {
            hasOverlap: true,
            message: 'This time slot overlaps with an existing class. Please choose a different date or time.',
            conflictingItem: {
              type: 'class',
              name: c.title,
              date: newSlot.dateKey,
              time: formatTime(cs.startMinutes, cs.endMinutes),
            },
          };
        }
      }
    }

    for (const e of existingEvents) {
      if (excludeEventId && e._id.toString() === excludeEventId) continue;
      const eSlots = extractEventSlots(e);
      for (const es of eSlots) {
        if (slotsOverlap(newSlot, es)) {
          return {
            hasOverlap: true,
            message: 'This time slot overlaps with an existing event. Please choose a different date or time.',
            conflictingItem: {
              type: 'event',
              name: e.eventName,
              date: newSlot.dateKey,
              time: formatTime(es.startMinutes, es.endMinutes),
            },
          };
        }
      }
    }
  }

  return { hasOverlap: false };
};

/**
 * Validate class data for overlap before create/update
 */
export const validateClassOverlap = async (classData, excludeClassId = null) => {
  const teacherId = classData.teacher?.toString?.() || classData.teacher;
  if (!teacherId) return { hasOverlap: false };

  const slots = extractClassSlots(classData);
  if (slots.length === 0) return { hasOverlap: false }; // No slots to check

  return checkTeacherOverlap(teacherId, slots, excludeClassId, null);
};

/**
 * Validate event data for overlap before create/update
 */
export const validateEventOverlap = async (eventData, excludeEventId = null) => {
  const teacherId = eventData.teacher?.toString?.() || eventData.teacher;
  if (!teacherId) return { hasOverlap: false };

  const slots = extractEventSlots(eventData);
  if (slots.length === 0) return { hasOverlap: false };

  return checkTeacherOverlap(teacherId, slots, null, excludeEventId);
};
