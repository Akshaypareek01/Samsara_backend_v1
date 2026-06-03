import config from '../config/config.js';

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
  const endTime = computeEndTime(booking.startTime, booking.duration);
  const timeRange = endTime
    ? `${booking.startTime} – ${endTime} (${booking.duration} hr)`
    : `${booking.startTime} (${booking.duration} hr)`;

  const lines = [
    `Reference: ${getBookingReference(booking)}`,
    `Company: ${getCompanyName(booking.company)}`,
    `Trainer: ${getTrainerName(booking.trainer)}`,
    `Date: ${formatBookingDate(booking.bookingDate)}`,
    `Time: ${timeRange}`,
    `Training: ${(booking.typeOfTraining || []).join(', ') || '—'}`,
    `Status: ${formatBookingStatus(booking.status)}`,
  ];

  if (booking.notes) lines.push(`Notes: ${booking.notes}`);
  if (booking.trainerNotes) lines.push(`Trainer notes: ${booking.trainerNotes}`);
  if (booking.adminNotes) lines.push(`Admin notes: ${booking.adminNotes}`);
  if (booking.cancellationReason) lines.push(`Cancellation reason: ${booking.cancellationReason}`);

  return lines;
}

/**
 * Build simple HTML body for booking emails.
 *
 * @param {string} greeting - Opening line.
 * @param {string} intro - Intro paragraph.
 * @param {Object} booking - Populated booking document.
 * @param {string} [ctaLabel] - Optional CTA button label.
 * @param {string} [ctaUrl] - Optional CTA URL.
 * @returns {string} HTML email body.
 */
export function buildBookingEmailHtml(greeting, intro, booking, ctaLabel, ctaUrl) {
  const details = buildBookingDetailLines(booking)
    .map((line) => `<li>${line.replace(/</g, '&lt;')}</li>`)
    .join('');

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<p style="margin-top:20px;"><a href="${ctaUrl}" style="display:inline-block;padding:10px 16px;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:6px;">${ctaLabel}</a></p>`
      : '';

  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;max-width:560px;">
      <p>${greeting.replace(/</g, '&lt;')}</p>
      <p>${intro.replace(/</g, '&lt;')}</p>
      <ul style="padding-left:18px;">${details}</ul>
      ${ctaBlock}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">This is an automated message from Samsara CRM. Please do not reply to this email.</p>
    </div>
  `.trim();
}

/**
 * Build plain-text email body.
 *
 * @param {string} greeting - Opening line.
 * @param {string} intro - Intro paragraph.
 * @param {Object} booking - Populated booking document.
 * @param {string} [ctaUrl] - Optional dashboard URL.
 * @returns {string} Plain-text email body.
 */
export function buildBookingEmailText(greeting, intro, booking, ctaUrl) {
  const lines = [
    greeting,
    '',
    intro,
    '',
    ...buildBookingDetailLines(booking),
  ];
  if (ctaUrl) {
    lines.push('', `Open dashboard: ${ctaUrl}`);
  }
  lines.push('', '—', 'This is an automated message from Samsara CRM.');
  return lines.join('\n');
}

/**
 * CRM portal base URL for company/trainer/admin dashboard links in booking emails.
 *
 * @returns {string} Base URL without trailing slash.
 */
export function getFrontendBaseUrl() {
  return String(config.frontend.url).replace(/\/$/, '');
}
