import config from '../config/config.js';

/** Samsara Wellness brand tokens for HTML emails. */
const BRAND = {
  name: 'Samsara Wellness',
  legalName: 'Samsaraa WellTek Pvt Ltd',
  primary: '#845EDF',
  primaryDark: '#6B47C7',
  primaryLight: '#F3EEFF',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  background: '#F8FAFC',
  white: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
};

const PORTAL_PATHS = {
  company: '/company/login',
  trainer: '/trainer/login',
  user: '/authentication/sign-in/signin-cover',
};

const OTP_EXPIRY_MINUTES = 10;

/**
 * Escape HTML special characters for safe email rendering.
 *
 * @param {string} value - Raw string.
 * @returns {string} Escaped string.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * CRM portal base URL without trailing slash.
 *
 * @returns {string} Frontend base URL.
 */
export function getFrontendBaseUrl() {
  return String(config.frontend.url).replace(/\/$/, '');
}

/**
 * Absolute logo URL for email clients.
 *
 * @returns {string} Logo image URL.
 */
export function getLogoUrl() {
  return `${getFrontendBaseUrl()}/assets/images/logo.jpeg`;
}

/**
 * Resolve portal login URL for OTP and alert emails.
 *
 * @param {'company'|'trainer'|'user'|string} [portal] - Recipient portal.
 * @returns {string} Login page URL.
 */
export function getPortalLoginUrl(portal) {
  const path = PORTAL_PATHS[portal] || PORTAL_PATHS.company;
  return `${getFrontendBaseUrl()}${path}`;
}

/**
 * Build a branded HTML email wrapper with header, body, and footer.
 *
 * @param {Object} options - Layout options.
 * @param {string} options.preheader - Inbox preview text.
 * @param {string} options.title - Main heading in the email body.
 * @param {string} options.contentHtml - Inner HTML content.
 * @param {string} [options.ctaLabel] - Primary button label.
 * @param {string} [options.ctaUrl] - Primary button URL.
 * @param {string} [options.footerNote] - Extra footer copy.
 * @returns {string} Full HTML document.
 */
export function buildEmailLayout({ preheader, title, contentHtml, ctaLabel, ctaUrl, footerNote }) {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const logoUrl = getLogoUrl();
  const portalUrl = getFrontendBaseUrl();

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td style="padding:28px 32px 8px 32px;text-align:center;">
            <a href="${escapeHtml(ctaUrl)}"
               style="display:inline-block;padding:14px 28px;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.2px;box-shadow:0 8px 20px rgba(132,94,223,0.28);">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>
      `
      : '';

  const footerExtra = footerNote
    ? `<p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(footerNote)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="padding:28px 32px 20px 32px;background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);text-align:center;">
              <img src="${logoUrl}" alt="${BRAND.name}" width="72" height="72" style="display:block;margin:0 auto 14px auto;border-radius:12px;border:2px solid rgba(255,255,255,0.35);" />
              <p style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.white};letter-spacing:0.2px;">${BRAND.name}</p>
              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.9);">Corporate wellness, simplified</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.35;font-weight:700;color:${BRAND.text};">${safeTitle}</h1>
              ${contentHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:24px 32px 28px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.background};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
                This is an automated message from ${BRAND.name}. Please do not reply to this email.
              </p>
              ${footerExtra}
              <p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
                &copy; ${new Date().getFullYear()} ${BRAND.legalName}. All rights reserved.<br />
                <a href="${portalUrl}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${portalUrl.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build OTP email subject and bodies for login or registration.
 *
 * @param {Object} params - OTP email payload.
 * @param {string} params.otp - One-time password.
 * @param {'login'|'registration'} params.type - OTP flow type.
 * @param {'company'|'trainer'|'user'} [params.portal] - Target portal for CTA copy.
 * @returns {{ subject: string, text: string, html: string }} Email content.
 */
export function buildOtpEmailContent({ otp, type, portal = 'company' }) {
  const portalLabel =
    portal === 'trainer' ? 'Trainer Portal' : portal === 'user' ? 'Samsara CRM' : 'Company Portal';
  const loginUrl = getPortalLoginUrl(portal);
  const isRegistration = type === 'registration';

  const subject = isRegistration
    ? `${BRAND.name} — Verify your email`
    : `${BRAND.name} — Your ${portalLabel} login code`;

  const actionLabel = isRegistration ? 'complete your registration' : `sign in to the ${portalLabel}`;
  const title = isRegistration ? 'Verify your email address' : 'Your secure login code';

  const text = [
    `Hello,`,
    '',
    `Use the one-time password below to ${actionLabel}:`,
    '',
    `OTP: ${otp}`,
    '',
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    `If you did not request this, you can safely ignore this email.`,
    '',
    `Open portal: ${loginUrl}`,
    '',
    `— ${BRAND.name}`,
  ].join('\n');

  const contentHtml = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${BRAND.text};">
      Use the one-time password below to <strong>${escapeHtml(actionLabel)}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
      <tr>
        <td align="center" style="padding:20px;background:${BRAND.primaryLight};border:1px dashed ${BRAND.primary};border-radius:12px;">
          <p style="margin:0 0 6px 0;font-size:12px;line-height:1.4;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1px;font-weight:700;">One-time password</p>
          <p style="margin:0;font-size:36px;line-height:1.2;font-weight:800;letter-spacing:10px;color:${BRAND.primaryDark};font-family:'Courier New',Courier,monospace;">${escapeHtml(otp)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
      This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
      If you did not request this code, you can safely ignore this email. Your account remains secure.
    </p>
  `;

  const html = buildEmailLayout({
    preheader: `Your ${BRAND.name} OTP is ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    title,
    contentHtml,
    ctaLabel: isRegistration ? 'Complete registration' : `Open ${portalLabel}`,
    ctaUrl: loginUrl,
  });

  return { subject, text, html };
}

/**
 * Build a generic alert / notification email.
 *
 * @param {Object} params - Alert email payload.
 * @param {string} params.title - Email heading.
 * @param {string} params.message - Main message paragraph.
 * @param {string} [params.preheader] - Inbox preview line.
 * @param {Array<{label: string, value: string}>} [params.details] - Key-value detail rows.
 * @param {string} [params.ctaLabel] - Button label.
 * @param {string} [params.ctaUrl] - Button URL.
 * @param {'info'|'success'|'warning'|'danger'} [params.tone] - Visual accent.
 * @returns {{ subject: string, text: string, html: string }} Email content.
 */
export function buildAlertEmailContent({
  title,
  message,
  preheader,
  details = [],
  ctaLabel,
  ctaUrl,
  tone = 'info',
}) {
  const toneColors = {
    info: BRAND.primary,
    success: BRAND.success,
    warning: BRAND.warning,
    danger: BRAND.danger,
  };
  const accent = toneColors[tone] || BRAND.primary;
  const subject = `${BRAND.name} — ${title}`;

  const detailLines = details.map((row) => `${row.label}: ${row.value}`);
  const text = [
    title,
    '',
    message,
    '',
    ...detailLines,
    '',
    ctaUrl ? `Open dashboard: ${ctaUrl}` : null,
    '',
    `— ${BRAND.name}`,
  ]
    .filter(Boolean)
    .join('\n');

  const detailsHtml =
    details.length > 0
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0 0;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          ${details
            .map(
              (row, index) => `
            <tr>
              <td style="padding:12px 16px;background:${index % 2 === 0 ? BRAND.background : BRAND.white};font-size:13px;color:${BRAND.muted};width:38%;vertical-align:top;border-bottom:1px solid ${BRAND.border};">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:12px 16px;background:${index % 2 === 0 ? BRAND.background : BRAND.white};font-size:14px;color:${BRAND.text};font-weight:600;vertical-align:top;border-bottom:1px solid ${BRAND.border};">
                ${escapeHtml(row.value)}
              </td>
            </tr>
          `
            )
            .join('')}
        </table>
      `
      : '';

  const contentHtml = `
    <p style="margin:0 0 4px 0;padding-left:12px;border-left:4px solid ${accent};font-size:15px;line-height:1.6;color:${BRAND.text};">
      ${escapeHtml(message)}
    </p>
    ${detailsHtml}
  `;

  const html = buildEmailLayout({
    preheader: preheader || message,
    title,
    contentHtml,
    ctaLabel,
    ctaUrl,
  });

  return { subject, text, html };
}

/**
 * Build password reset or email verification action emails.
 *
 * @param {Object} params - Action email payload.
 * @param {'reset-password'|'verify-email'} params.action - Email action type.
 * @param {string} params.token - Security token.
 * @returns {{ subject: string, text: string, html: string }} Email content.
 */
export function buildActionEmailContent({ action, token }) {
  const baseUrl = getFrontendBaseUrl();
  const isReset = action === 'reset-password';

  const actionUrl = isReset
    ? `${baseUrl}/authentication/reset-password/reset-cover?token=${encodeURIComponent(token)}`
    : `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

  const title = isReset ? 'Reset your password' : 'Verify your email address';
  const subject = `${BRAND.name} — ${title}`;
  const message = isReset
    ? 'We received a request to reset your password. Click the button below to choose a new password.'
    : 'Please confirm your email address to activate your account and access Samsara Wellness.';

  const text = [
    `Hello,`,
    '',
    message,
    '',
    `${isReset ? 'Reset password' : 'Verify email'}: ${actionUrl}`,
    '',
    `If you did not request this, you can safely ignore this email.`,
    '',
    `— ${BRAND.name}`,
  ].join('\n');

  const contentHtml = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${BRAND.text};">${escapeHtml(message)}</p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};word-break:break-all;">
      Or copy this link:<br />
      <a href="${escapeHtml(actionUrl)}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(actionUrl)}</a>
    </p>
  `;

  const html = buildEmailLayout({
    preheader: message,
    title,
    contentHtml,
    ctaLabel: isReset ? 'Reset password' : 'Verify email',
    ctaUrl: actionUrl,
    footerNote: 'This link expires shortly for your security.',
  });

  return { subject, text, html };
}
