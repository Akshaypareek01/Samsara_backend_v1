import { buildAlertEmailContent, COMPANY_SUPPORT_EMAIL } from './emailTemplates.js';
import { getSessionsForBooking, getTrainerIdFromRef } from './bookingSessionUtils.js';

/**
 * Formatting helpers for booking notification emails.
 */

const STATUS_LABELS = {
  pending_approval: 'Pending trainer approval',
  approved: 'Approved by trainer — pending admin confirmation',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/**
 * Human-readable booking status label.
 *
 * @param {string} status - Booking status enum value.
 * @returns {string} Display label.
 */
export function formatBookingStatus(status) {
  return STATUS_LABELS[status] || String(status || '').replace(/_/g, ' ');
}

/**
 * Resolve company display name from a populated or raw company ref.
 *
 * @param {Object|string|null|undefined} company - Company document or id.
 * @returns {string} Company label.
 */
export function getCompanyName(company) {
  if (!company) return 'Company';
  if (typeof company === 'object') {
    return company.companyName || company.name || 'Company';
  }
  return 'Company';
}

/**
 * Resolve the primary contact person's name for a company, falling back
 * to the secondary contact when the primary is not set.
 *
 * @param {Object|string|null|undefined} company - Company document or id.
 * @returns {string} Contact person label.
 */
export function getCompanyContactName(company) {
  if (!company || typeof company !== 'object') return '';
  return company.contactPerson1?.name || company.contactPerson2?.name || '';
}

/**
 * Resolve trainer display name from a populated or raw trainer ref.
 *
 * @param {Object|string|null|undefined} trainer - Trainer document or id.
 * @returns {string} Trainer label.
 */
export function getTrainerName(trainer) {
  if (!trainer) return 'Trainer';
  if (typeof trainer === 'object' && trainer.name) return trainer.name;
  return 'Trainer';
}

/**
 * Format booking date for email copy.
 *
 * @param {Date|string|null|undefined} value - Booking date.
 * @returns {string} Formatted date.
 */
export function formatBookingDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Compute session end time from start time and duration hours.
 *
 * @param {string} startTime - HH:MM start time.
 * @param {number} durationHours - Duration in hours.
 * @returns {string|null} End time HH:MM or null.
 */
export function computeEndTime(startTime, durationHours) {
  if (!startTime || durationHours == null) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationHours * 60;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = Math.floor(endMinutes % 60);
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

/**
 * Build a short booking reference from Mongo id.
 *
 * @param {Object} booking - Booking document.
 * @returns {string} Short reference code.
 */
export function getBookingReference(booking) {
  const id = booking?._id?.toString?.() || booking?.id || '';
  return id ? id.slice(-8).toUpperCase() : 'BOOKING';
}

/**
 * Collect unique company notification emails.
 *
 * @param {Object|null|undefined} company - Populated company document.
 * @returns {string[]} Unique lowercase emails.
 */
export function collectCompanyEmails(company) {
  if (!company || typeof company !== 'object') return [];
  const emails = [
    company.email,
    company.contactPerson1?.email,
    company.contactPerson2?.email,
  ]
    .filter(Boolean)
    .map((e) => String(e).trim().toLowerCase());

  return [...new Set(emails)];
}

/**
 * Build shared booking detail lines for plain-text emails.
 *
 * @param {Object} booking - Populated booking document.
 * @returns {string[]} Detail lines.
 */
export function buildBookingDetailLines(booking) {
    const sessions = getSessionsForBooking(booking);
    const lines = [
        `Reference: ${getBookingReference(booking)}`,
        `Company: ${getCompanyName(booking.company)}`,
        ...(getCompanyContactName(booking.company)
            ? [`Contact person: ${getCompanyContactName(booking.company)}`]
            : []),
        `Date: ${formatBookingDate(booking.bookingDate)}`,
        `Status: ${formatBookingStatus(booking.status)}`,
    ];

    if (sessions.length > 1) {
        lines.push(`Sessions: ${sessions.length}`);
        sessions.forEach((s, i) => {
            const endTime = computeEndTime(s.startTime, s.duration);
            const timeRange = endTime
                ? `${s.startTime} – ${endTime} (${s.duration} hr)`
                : `${s.startTime} (${s.duration} hr)`;
            const trainerName = getTrainerName(s.trainer);
            const types = (s.typeOfTraining || []).join(', ') || '—';
            const sessionStatus = s.trainerStatus ? ` [${s.trainerStatus}]` : '';
            lines.push(
                `  ${i + 1}. ${trainerName} — ${timeRange} — ${types}${sessionStatus}`
            );
        });
    } else {
        const s = sessions[0] || booking;
        const endTime = computeEndTime(s.startTime, s.duration);
        const timeRange = endTime
            ? `${s.startTime} – ${endTime} (${s.duration} hr)`
            : `${s.startTime} (${s.duration} hr)`;
        lines.push(`Trainer: ${getTrainerName(s.trainer || booking.trainer)}`);
        lines.push(`Time: ${timeRange}`);
        lines.push(`Training: ${(s.typeOfTraining || booking.typeOfTraining || []).join(', ') || '—'}`);
    }

    if (booking.notes) lines.push(`Notes: ${booking.notes}`);
    if (booking.trainerNotes) lines.push(`Trainer notes: ${booking.trainerNotes}`);
    if (booking.adminNotes) lines.push(`Admin notes: ${booking.adminNotes}`);
    if (booking.cancellationReason) lines.push(`Cancellation reason: ${booking.cancellationReason}`);

    return lines;
}

/**
 * Collect unique trainer emails from all sessions in a booking.
 *
 * @param {Object} booking - Populated booking document.
 * @returns {string[]} Unique lowercase emails.
 */
export function collectTrainerEmails(booking) {
    const emails = new Set();
    for (const session of getSessionsForBooking(booking)) {
        const trainer = session.trainer;
        if (trainer && typeof trainer === 'object' && trainer.email) {
            emails.add(String(trainer.email).trim().toLowerCase());
        }
    }
    if (booking.trainer && typeof booking.trainer === 'object' && booking.trainer.email) {
        emails.add(String(booking.trainer.email).trim().toLowerCase());
    }
    return [...emails];
}

/**
 * Build a summary label for trainers in a booking.
 *
 * @param {Object} booking - Populated booking document.
 * @returns {string} Trainer names summary.
 */
export function getBookingTrainersSummary(booking) {
    const sessions = getSessionsForBooking(booking);
    const names = sessions.map((s) => getTrainerName(s.trainer)).filter(Boolean);
    const unique = [...new Set(names)];
    if (unique.length === 0) return getTrainerName(booking.trainer);
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
    return `${unique[0]} and ${unique.length - 1} others`;
}

/**
 * Map booking detail lines to alert email detail rows.
 *
 * @param {string[]} lines - Plain detail lines.
 * @returns {Array<{label: string, value: string}>} Structured detail rows.
 */
function mapBookingDetails(lines) {
  return lines.map((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return { label: 'Detail', value: line };
    }
    return {
      label: line.slice(0, separatorIndex).trim(),
      value: line.slice(separatorIndex + 1).trim(),
    };
  });
}

/**
 * Pick alert tone from booking status for visual accent.
 *
 * @param {string} status - Booking status.
 * @returns {'info'|'success'|'warning'|'danger'} Email tone.
 */
function getBookingAlertTone(status) {
  if (status === 'confirmed' || status === 'completed') return 'success';
  if (status === 'rejected' || status === 'cancelled') return 'danger';
  if (status === 'pending_approval' || status === 'approved') return 'warning';
  return 'info';
}

/**
 * Build branded HTML and text bodies for booking emails.
 *
 * @param {string} greeting - Opening line.
 * @param {string} intro - Intro paragraph.
 * @param {Object} booking - Populated booking document.
 * @param {string} [ctaLabel] - Optional CTA button label.
 * @param {string} [ctaUrl] - Optional CTA URL.
 * @param {boolean} [includeCompanySupport] - Include company support inbox in footer.
 * @returns {{ text: string, html: string }} Email bodies.
 */
export function buildBookingEmailBodies(
  greeting,
  intro,
  booking,
  ctaLabel,
  ctaUrl,
  includeCompanySupport = false
) {
  const message = [greeting, intro].filter(Boolean).join(' ');
  const details = mapBookingDetails(buildBookingDetailLines(booking));
  const title = `Booking update — ${getBookingReference(booking)}`;

  return buildAlertEmailContent({
    title,
    message,
    preheader: intro,
    details,
    ctaLabel,
    ctaUrl,
    tone: getBookingAlertTone(booking.status),
    supportEmail: includeCompanySupport ? COMPANY_SUPPORT_EMAIL : undefined,
  });
}

/**
 * Build simple HTML body for booking emails.
 *
 * @param {string} greeting - Opening line.
 * @param {string} intro - Intro paragraph.
 * @param {Object} booking - Populated booking document.
 * @param {string} [ctaLabel] - Optional CTA button label.
 * @param {string} [ctaUrl] - Optional CTA URL.
 * @param {boolean} [includeCompanySupport] - Include company support inbox in footer.
 * @returns {string} HTML email body.
 */
export function buildBookingEmailHtml(
  greeting,
  intro,
  booking,
  ctaLabel,
  ctaUrl,
  includeCompanySupport = false
) {
  return buildBookingEmailBodies(greeting, intro, booking, ctaLabel, ctaUrl, includeCompanySupport).html;
}

/**
 * Build plain-text email body.
 *
 * @param {string} greeting - Opening line.
 * @param {string} intro - Intro paragraph.
 * @param {Object} booking - Populated booking document.
 * @param {string} [ctaUrl] - Optional dashboard URL.
 * @param {boolean} [includeCompanySupport] - Include company support inbox in footer.
 * @returns {string} Plain-text email body.
 */
export function buildBookingEmailText(greeting, intro, booking, ctaUrl, includeCompanySupport = false) {
  return buildBookingEmailBodies(
    greeting,
    intro,
    booking,
    ctaUrl ? 'View booking' : undefined,
    ctaUrl,
    includeCompanySupport
  ).text;
}

export { getFrontendBaseUrl } from './emailTemplates.js';
