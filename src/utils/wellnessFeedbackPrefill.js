import { getSessionsForBooking, getTrainerIdFromRef } from './bookingSessionUtils.js';

/** Session checkbox values on the public feedback form. */
export const WELLNESS_FEEDBACK_SESSION_OPTIONS = [
    'Yoga',
    'Sound Healing',
    'Psychology',
    "Women's Health",
    'Zumba',
];

/** Maps booking training types to form session checkbox values. */
const TRAINING_TYPE_TO_FORM_LABEL = {
    Yoga: 'Yoga',
    'Desktop Yoga': 'Yoga',
    'Laughter Yoga': 'Yoga',
    'Yoga Nidra': 'Yoga',
    Meditation: 'Yoga',
    'Breath Work': 'Yoga',
    'Sound Healing': 'Sound Healing',
    Psychologist: 'Psychology',
    'Ayurveda Doctor': "Women's Health",
    'Women Health Trainer': "Women's Health",
    Zumba: 'Zumba',
};

/**
 * Maps a training type string to a feedback form session label.
 *
 * @param {string} trainingType - Booking session training type.
 * @returns {string|null}
 */
export function mapTrainingTypeToFormLabel(trainingType) {
    if (!trainingType || typeof trainingType !== 'string') return null;
    const trimmed = trainingType.trim();
    if (WELLNESS_FEEDBACK_SESSION_OPTIONS.includes(trimmed)) return trimmed;
    return TRAINING_TYPE_TO_FORM_LABEL[trimmed] || null;
}

/**
 * Resolves trainer display name from a populated or raw trainer ref.
 *
 * @param {object|string|null} trainerRef
 * @returns {string}
 */
function getTrainerName(trainerRef) {
    if (!trainerRef) return '';
    if (typeof trainerRef === 'object' && trainerRef.name) return trainerRef.name;
    return '';
}

/**
 * Builds public feedback prefill payload from a populated booking document.
 *
 * @param {object} booking - Populated booking with company and session trainers.
 * @returns {object}
 */
export function buildWellnessFeedbackPrefill(booking) {
    const company = booking.company;
    const companyId =
        typeof company === 'object' && company?._id
            ? company._id.toString()
            : company?.toString?.() || '';
    const companyName =
        typeof company === 'object' && company?.companyName
            ? company.companyName
            : typeof company === 'object' && company?.name
              ? company.name
              : '';

    const sessionDate = booking.bookingDate
        ? new Date(booking.bookingDate).toISOString().slice(0, 10)
        : '';

    const sessions = getSessionsForBooking(booking);
    const trainerMap = new Map();
    const prefillLabels = new Set();

    for (const session of sessions) {
        const trainerId = getTrainerIdFromRef(session.trainer);
        if (trainerId && !trainerMap.has(trainerId)) {
            trainerMap.set(trainerId, {
                trainerId,
                name: getTrainerName(session.trainer),
                order: trainerMap.size + 1,
            });
        }

        const types = Array.isArray(session.typeOfTraining) ? session.typeOfTraining : [];
        for (const type of types) {
            const label = mapTrainingTypeToFormLabel(type);
            if (label) prefillLabels.add(label);
        }
    }

    if (trainerMap.size === 0 && booking.trainer) {
        const trainerId = getTrainerIdFromRef(booking.trainer);
        if (trainerId) {
            trainerMap.set(trainerId, {
                trainerId,
                name: getTrainerName(booking.trainer),
                order: 1,
            });
        }
    }

    const legacyTypes = Array.isArray(booking.typeOfTraining) ? booking.typeOfTraining : [];
    for (const type of legacyTypes) {
        const label = mapTrainingTypeToFormLabel(type);
        if (label) prefillLabels.add(label);
    }

    const trainers = Array.from(trainerMap.values());

    return {
        bookingId: booking._id?.toString?.() || booking.id,
        companyId,
        companyName,
        sessionDate,
        sessionAttendedOptions: WELLNESS_FEEDBACK_SESSION_OPTIONS,
        sessionAttendedPrefill: Array.from(prefillLabels),
        trainers,
        trainerMode:
            trainers.length > 1 ? 'both' : trainers.length === 1 ? 'trainer' : 'trainer',
    };
}
