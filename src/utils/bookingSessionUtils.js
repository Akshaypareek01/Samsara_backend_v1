/**
 * Helpers for multi-session bookings (legacy single-session compat).
 */

const ACTIVE_STATUSES = ['pending_approval', 'approved', 'confirmed'];
const TRAINER_SESSION_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * Clone a date and return start/end of that calendar day.
 *
 * @param {Date|string} bookingDate - Booking date.
 * @returns {{ dayStart: Date, dayEnd: Date }}
 */
export function getDayRange(bookingDate) {
    const d = new Date(bookingDate);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    return { dayStart, dayEnd };
}

/**
 * Normalize legacy or multi-session booking into a sessions array.
 *
 * @param {Object} booking - Booking document or plain object.
 * @returns {Array<Object>}
 */
export function getSessionsForBooking(booking) {
    if (!booking) return [];

    if (Array.isArray(booking.sessions) && booking.sessions.length > 0) {
        return booking.sessions.map((s) => ({
            trainer: s.trainer,
            startTime: s.startTime,
            duration: s.duration,
            typeOfTraining: s.typeOfTraining || [],
            eapTraining: s.eapTraining,
            trainerStatus: s.trainerStatus || 'pending',
            trainerNotes: s.trainerNotes,
            approvedAt: s.approvedAt,
        }));
    }

    if (booking.trainer && booking.startTime && booking.duration) {
        return [
            {
                trainer: booking.trainer,
                startTime: booking.startTime,
                duration: booking.duration,
                typeOfTraining: booking.typeOfTraining || [],
                eapTraining: booking.eapTraining,
                trainerStatus:
                    booking.status === 'approved' ||
                    booking.status === 'confirmed' ||
                    booking.status === 'completed'
                        ? 'approved'
                        : booking.status === 'rejected'
                          ? 'rejected'
                          : 'pending',
                trainerNotes: booking.trainerNotes,
                approvedAt: booking.approvedAt,
            },
        ];
    }

    return [];
}

/**
 * Resolve trainer id from a session trainer ref.
 *
 * @param {Object|string} trainerRef - Trainer id or populated doc.
 * @returns {string|null}
 */
export function getTrainerIdFromRef(trainerRef) {
    if (!trainerRef) return null;
    if (typeof trainerRef === 'string') return trainerRef;
    return trainerRef._id?.toString?.() || trainerRef.id?.toString?.() || null;
}

/**
 * Check whether a trainer is assigned to any session in a booking.
 *
 * @param {Object} booking - Booking document.
 * @param {string} trainerId - Trainer id.
 * @returns {boolean}
 */
export function bookingIncludesTrainer(booking, trainerId) {
    const tid = String(trainerId);
    return getSessionsForBooking(booking).some(
        (s) => getTrainerIdFromRef(s.trainer) === tid
    );
}

/**
 * Count approved vs total trainer sessions.
 *
 * @param {Object} booking - Booking document.
 * @returns {{ approved: number, total: number, pending: number, rejected: number }}
 */
export function getTrainerApprovalProgress(booking) {
    const sessions = getSessionsForBooking(booking);
    const total = sessions.length;
    const approved = sessions.filter((s) => s.trainerStatus === 'approved').length;
    const pending = sessions.filter((s) => s.trainerStatus === 'pending').length;
    const rejected = sessions.filter((s) => s.trainerStatus === 'rejected').length;
    return { approved, total, pending, rejected };
}

/**
 * Build Mongo filter for bookings involving a trainer.
 *
 * @param {import('mongoose').Types.ObjectId|string} trainerId - Trainer id.
 * @returns {Object}
 */
export function trainerBookingFilter(trainerId) {
    return {
        $or: [{ trainer: trainerId }, { 'sessions.trainer': trainerId }],
    };
}

/**
 * Convert minutes from HH:mm string.
 *
 * @param {string} time - HH:mm.
 * @returns {number}
 */
export function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Check if two time ranges overlap.
 *
 * @param {string} startA - HH:mm.
 * @param {number} durationA - Hours.
 * @param {string} startB - HH:mm.
 * @param {number} durationB - Hours.
 * @returns {boolean}
 */
export function timesOverlap(startA, durationA, startB, durationB) {
    const aStart = timeToMinutes(startA);
    const aEnd = aStart + durationA * 60;
    const bStart = timeToMinutes(startB);
    const bEnd = bStart + durationB * 60;
    return aStart < bEnd && aEnd > bStart;
}

export { ACTIVE_STATUSES, TRAINER_SESSION_STATUSES };
