import logger from '../config/logger.js';
import { Admin } from '../models/index.js';
import { sendEmail } from './email.service.js';
import {
  buildBookingEmailHtml,
  buildBookingEmailText,
  collectCompanyEmails,
  formatBookingStatus,
  getCompanyName,
  getFrontendBaseUrl,
  getTrainerName,
} from '../utils/bookingEmailUtils.js';

const DASHBOARD_PATHS = {
  admin: '/apps/crm/bookings',
  company: '/company/dashboard/bookings',
  trainer: '/trainer/dashboard/bookings',
};

/**
 * Build a dashboard URL for a role.
 *
 * @param {'admin'|'company'|'trainer'} role - Recipient role.
 * @returns {string} Full dashboard URL.
 */
function dashboardUrl(role) {
  return `${getFrontendBaseUrl()}${DASHBOARD_PATHS[role]}`;
}

/**
 * Send one booking email without failing the caller on SMTP errors.
 *
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain-text body.
 * @param {string} html - HTML body.
 * @returns {Promise<void>}
 */
async function sendBookingEmailSafe(to, subject, text, html) {
  if (!to) return;
  try {
    await sendEmail(to, subject, text, html);
  } catch (err) {
    logger.error(`Booking email failed for ${to}: ${err.message}`);
  }
}

/**
 * Send the same booking email to multiple recipients in parallel.
 *
 * @param {string[]} recipients - Email addresses.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain-text body.
 * @param {string} html - HTML body.
 * @returns {Promise<void>}
 */
async function broadcastBookingEmail(recipients, subject, text, html) {
  const unique = [...new Set(recipients.filter(Boolean))];
  if (unique.length === 0) return;
  await Promise.all(unique.map((to) => sendBookingEmailSafe(to, subject, text, html)));
}

/**
 * Load active admin notification emails.
 *
 * @returns {Promise<string[]>} Admin email addresses.
 */
async function getAdminEmails() {
  const admins = await Admin.find({
    status: { $ne: false },
    email: { $exists: true, $nin: [null, ''] },
  })
    .select('email')
    .lean();

  return [...new Set(admins.map((a) => String(a.email).trim().toLowerCase()).filter(Boolean))];
}

/**
 * Dispatch a templated booking notification to selected audiences.
 *
 * @param {Object} params - Notification payload.
 * @param {Object} params.booking - Populated booking document.
 * @param {string} params.subject - Email subject.
 * @param {string} params.greeting - Greeting line.
 * @param {string} params.intro - Intro paragraph.
 * @param {Object} params.audience - Which roles to notify.
 * @param {boolean} [params.audience.admin]
 * @param {boolean} [params.audience.company]
 * @param {boolean} [params.audience.trainer]
 * @returns {Promise<void>}
 */
async function notifyAudience({ booking, subject, greeting, intro, audience }) {
  const recipients = [];

  if (audience.company) {
    recipients.push(...collectCompanyEmails(booking.company));
  }
  if (audience.trainer && booking.trainer?.email) {
    recipients.push(String(booking.trainer.email).trim().toLowerCase());
  }
  if (audience.admin) {
    recipients.push(...(await getAdminEmails()));
  }

  const roleForCta = audience.company
    ? 'company'
    : audience.trainer
      ? 'trainer'
      : 'admin';

  const ctaUrl = dashboardUrl(roleForCta);
  const text = buildBookingEmailText(greeting, intro, booking, ctaUrl);
  const html = buildBookingEmailHtml(greeting, intro, booking, 'View booking', ctaUrl);

  await broadcastBookingEmail(recipients, subject, text, html);
}

/**
 * Fire booking notifications without blocking API responses.
 *
 * @param {Promise<void>} task - Notification task.
 */
export function queueBookingNotification(task) {
  task.catch((err) => {
    logger.error(`Booking notification task failed: ${err.message}`);
  });
}

/**
 * Notify all three roles with role-specific copy and dashboard links.
 *
 * @param {Object} booking - Populated booking document.
 * @param {string} subject - Email subject.
 * @param {Object} introByRole - Intro text per role.
 * @returns {Promise<void>}
 */
async function notifyAllRoles(booking, subject, introByRole) {
  await Promise.all([
    notifyAudience({
      booking,
      subject,
      greeting: 'Hello,',
      intro: introByRole.admin,
      audience: { admin: true, company: false, trainer: false },
    }),
    notifyAudience({
      booking,
      subject,
      greeting: 'Hello,',
      intro: introByRole.company,
      audience: { admin: false, company: true, trainer: false },
    }),
    notifyAudience({
      booking,
      subject,
      greeting: 'Hello,',
      intro: introByRole.trainer,
      audience: { admin: false, company: false, trainer: true },
    }),
  ]);
}

/**
 * Notify admin, company, and trainer when a new booking is created.
 *
 * @param {Object} booking - Populated booking document.
 * @returns {Promise<void>}
 */
export async function notifyBookingCreated(booking) {
  const companyName = getCompanyName(booking.company);
  const trainerName = getTrainerName(booking.trainer);
  const subject = `New booking request — ${companyName} with ${trainerName}`;
  const greeting = 'Hello,';
  const intro = `${companyName} submitted a new training session request. The booking is awaiting trainer approval.`;

  await Promise.all([
    notifyAudience({
      booking,
      subject,
      greeting,
      intro: `${intro} Please review it in the admin dashboard.`,
      audience: { admin: true, company: false, trainer: false },
    }),
    notifyAudience({
      booking,
      subject,
      greeting,
      intro: `${intro} We will notify you when the trainer responds.`,
      audience: { admin: false, company: true, trainer: false },
    }),
    notifyAudience({
      booking,
      subject,
      greeting,
      intro: `${intro} Please accept or review this request in your trainer dashboard.`,
      audience: { admin: false, company: false, trainer: true },
    }),
  ]);
}

/**
 * Notify relevant parties when booking status changes.
 *
 * @param {Object} booking - Populated booking document after update.
 * @param {string} previousStatus - Status before the change.
 * @param {Object} [meta] - Extra context for the email copy.
 * @param {string} [meta.cancelledBy] - company | trainer | admin
 * @returns {Promise<void>}
 */
export async function notifyBookingStatusChanged(booking, previousStatus, meta = {}) {
  const companyName = getCompanyName(booking.company);
  const trainerName = getTrainerName(booking.trainer);
  const statusLabel = formatBookingStatus(booking.status);

  if (booking.status === 'approved' && previousStatus === 'pending_approval') {
    await notifyAudience({
      booking,
      subject: `Trainer accepted booking — ${companyName} / ${trainerName}`,
      greeting: 'Hello,',
      intro: `${trainerName} accepted the session request from ${companyName}. Admin payment confirmation is required before the session is fully confirmed.`,
      audience: { admin: true, company: true, trainer: false },
    });
    return;
  }

  if (booking.status === 'confirmed' && previousStatus === 'approved') {
    await Promise.all([
      notifyAudience({
        booking,
        subject: `Booking confirmed — ${companyName} / ${trainerName}`,
        greeting: 'Hello,',
        intro:
          'Your training session has been confirmed by admin. Payment details have been recorded and the session is now active.',
        audience: { admin: false, company: true, trainer: true },
      }),
      notifyAudience({
        booking,
        subject: `Booking confirmed — ${companyName} / ${trainerName}`,
        greeting: 'Hello,',
        intro: `Booking ${statusLabel.toLowerCase()} for ${companyName} and ${trainerName}.`,
        audience: { admin: true, company: false, trainer: false },
      }),
    ]);
    return;
  }

  if (booking.status === 'completed' && previousStatus === 'confirmed') {
    await notifyAllRoles(booking, `Session completed — ${companyName} / ${trainerName}`, {
      admin: `The training session between ${companyName} and ${trainerName} has been marked as completed.`,
      company: `Your training session with ${trainerName} has been marked as completed.`,
      trainer: `Your session with ${companyName} has been marked as completed.`,
    });
    return;
  }

  if (booking.status === 'rejected') {
    const reasonNote = booking.adminNotes ? ' See admin notes below for details.' : '';
    await notifyAllRoles(booking, `Booking rejected — ${companyName} / ${trainerName}`, {
      admin: `The booking request between ${companyName} and ${trainerName} was rejected.${reasonNote}`,
      company: `Your booking request with ${trainerName} was rejected.${reasonNote}`,
      trainer: `The booking request from ${companyName} was rejected.${reasonNote}`,
    });
    return;
  }

  if (booking.status === 'cancelled') {
    const cancelledBy = meta.cancelledBy || 'a user';
    const actorLabel =
      cancelledBy === 'company'
        ? companyName
        : cancelledBy === 'trainer'
          ? trainerName
          : 'Admin';
    const reasonNote = booking.cancellationReason ? ' Reason included below.' : '';

    await notifyAllRoles(booking, `Booking cancelled — ${companyName} / ${trainerName}`, {
      admin: `The booking between ${companyName} and ${trainerName} was cancelled by ${actorLabel}.${reasonNote}`,
      company: `Your booking with ${trainerName} was cancelled by ${actorLabel}.${reasonNote}`,
      trainer: `Your booking with ${companyName} was cancelled by ${actorLabel}.${reasonNote}`,
    });
  }
}

/**
 * Notify company and trainer when booking details are updated.
 *
 * @param {Object} booking - Populated booking document after update.
 * @param {string[]} changedFields - Human-readable changed field labels.
 * @returns {Promise<void>}
 */
export async function notifyBookingUpdated(booking, changedFields) {
  if (!changedFields.length) return;

  const companyName = getCompanyName(booking.company);
  const trainerName = getTrainerName(booking.trainer);
  const changes = changedFields.join(', ');

  await notifyAllRoles(booking, `Booking updated — ${companyName} / ${trainerName}`, {
    admin: `Booking details were updated (${changes}). Please review the latest schedule.`,
    company: `Your booking with ${trainerName} was updated (${changes}). Please review the new schedule.`,
    trainer: `Your booking with ${companyName} was updated (${changes}). Please review the new schedule.`,
  });
}

/**
 * Detect meaningful booking field changes for update notifications.
 *
 * @param {Object} before - Snapshot before update.
 * @param {Object} after - Booking document after update.
 * @returns {string[]} Changed field labels.
 */
export function getBookingChangedFieldLabels(before, after) {
  const changes = [];

  const beforeDate = before.bookingDate ? new Date(before.bookingDate).toISOString().slice(0, 10) : '';
  const afterDate = after.bookingDate ? new Date(after.bookingDate).toISOString().slice(0, 10) : '';
  if (beforeDate !== afterDate) changes.push('date');

  if (before.startTime !== after.startTime) changes.push('start time');
  if (before.duration !== after.duration) changes.push('duration');

  const beforeTrainer =
    before.trainer && typeof before.trainer === 'object'
      ? before.trainer._id?.toString?.()
      : before.trainer?.toString?.();
  const afterTrainer =
    after.trainer && typeof after.trainer === 'object'
      ? after.trainer._id?.toString?.()
      : after.trainer?.toString?.();
  if (beforeTrainer !== afterTrainer) changes.push('trainer');

  const beforeTypes = JSON.stringify(before.typeOfTraining || []);
  const afterTypes = JSON.stringify(after.typeOfTraining || []);
  if (beforeTypes !== afterTypes) changes.push('training type');

  if ((before.notes || '') !== (after.notes || '')) changes.push('notes');

  return changes;
}
