import config from '../config/config.js';

/** Samsara Wellness brand tokens for HTML emails. */
const BRAND = {
  name: 'Samsara Wellness',
  legalName: 'Samsaraa WellTek Pvt Ltd',
  primary: '#ed662e',
  primaryDark: '#c95520',
  primaryLight: '#fff4ef',
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

/** Company portal support inbox shown in company-facing emails. */
export const COMPANY_SUPPORT_EMAIL = 'assist@samsarawellness.in';

/**
 * Plain-text support line for company-facing emails.
 *
 * @returns {string} Support contact line.
 */
export function getCompanySupportEmailLine() {
  return `Need help? Contact us at ${COMPANY_SUPPORT_EMAIL}`;
}

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

/** Brand tokens for consumer app emails (same as CRM portal orange). */
export const APP_EMAIL_BRAND = BRAND;

/**
 * Inline CSS that forces light-mode rendering in dark-mode email clients.
 *
 * @param {typeof BRAND} brand - Brand color tokens.
 * @returns {string} Style block HTML.
 */
function buildLightModeGuardStyles(brand) {
  return `
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    @media (prefers-color-scheme: dark) {
      body, .email-root, .email-card, .email-body, .email-footer, .email-header,
      .email-card td, .email-card p, .email-card h1, .email-card a, .email-card li {
        background-color: ${brand.white} !important;
        color: ${brand.text} !important;
      }
      .email-root { background-color: ${brand.background} !important; }
      .email-card {
        background-color: ${brand.white} !important;
        border: 2px dashed ${brand.primary} !important;
      }
      .email-header {
        background: ${brand.white} !important;
      }
      .email-header p, .email-header .email-brand-name { color: ${brand.text} !important; }
      .email-footer { background-color: ${brand.white} !important; }
      .email-footer p { color: ${brand.muted} !important; }
      .email-footer a { color: ${brand.primary} !important; }
      .email-cta a { background-color: ${brand.primary} !important; color: ${brand.white} !important; }
    }
  </style>`;
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
 * @param {typeof BRAND} [options.brand] - Optional brand color overrides.
 * @param {string|null} [options.tagline] - Header tagline; omit with null to hide.
 * @param {boolean} [options.showPortalLink] - Show CRM portal link in footer.
 * @param {string} [options.supportEmail] - Optional support inbox mailto in footer.
 * @returns {string} Full HTML document.
 */
export function buildEmailLayout({
  preheader,
  title,
  contentHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
  brand = BRAND,
  tagline = 'Corporate wellness, simplified',
  showPortalLink = true,
  supportEmail,
}) {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const logoUrl = getLogoUrl();
  const portalUrl = getFrontendBaseUrl();

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td class="email-cta" style="padding:28px 32px 8px 32px;text-align:center;" bgcolor="${brand.white}">
            <a href="${escapeHtml(ctaUrl)}"
               style="display:inline-block;padding:14px 28px;background:${brand.primary};color:${brand.white};text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.2px;">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>
      `
      : '';

  const footerExtra = footerNote
    ? `<p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:${brand.muted};">${escapeHtml(footerNote)}</p>`
    : '';

  const taglineBlock =
    tagline === null
      ? ''
      : `<p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:${brand.muted};">${escapeHtml(tagline)}</p>`;

  const portalLinkBlock = showPortalLink
    ? `<br /><a href="${portalUrl}" style="color:${brand.primary};text-decoration:none;font-weight:600;">${portalUrl.replace(/^https?:\/\//, '')}</a>`
    : '';

  const supportBlock = supportEmail
    ? `<p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:${brand.muted};text-align:center;">
        Need help? Contact us at
        <a href="mailto:${escapeHtml(supportEmail)}" style="color:${brand.primary};text-decoration:none;font-weight:600;">${escapeHtml(supportEmail)}</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeTitle}</title>
  ${buildLightModeGuardStyles(brand)}
</head>
<body class="email-root" style="margin:0;padding:0;background:${brand.background};font-family:Arial,Helvetica,sans-serif;color:${brand.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table class="email-root" role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${brand.background}" style="background:${brand.background};padding:24px 12px;">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${brand.white}" style="max-width:600px;width:100%;background:${brand.white};border-radius:16px;overflow:hidden;border:2px dashed ${brand.primary};box-shadow:0 8px 24px rgba(237,102,46,0.08);">
          <tr>
            <td class="email-header" bgcolor="${brand.white}" style="padding:32px 32px 16px 32px;background:${brand.white};text-align:center;border-bottom:1px dashed ${brand.primary};">
              <img src="${logoUrl}" alt="${escapeHtml(brand.name)}" width="104" height="104" style="display:block;margin:0 auto 16px auto;border-radius:14px;border:1px solid ${brand.border};" />
              <p class="email-brand-name" style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:${brand.text};letter-spacing:0.2px;font-family:'Times New Roman',Times,serif;">${escapeHtml(brand.name)}</p>
              ${taglineBlock}
            </td>
          </tr>
          <tr>
            <td class="email-body" bgcolor="${brand.white}" style="padding:32px 32px 8px 32px;background:${brand.white};">
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.35;font-weight:700;color:${brand.text};">${safeTitle}</h1>
              ${contentHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td class="email-footer" bgcolor="${brand.white}" style="padding:24px 32px 28px 32px;border-top:1px dashed ${brand.primary};background:${brand.white};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${brand.muted};text-align:center;">
                This is an automated message from ${escapeHtml(brand.name)}. Please do not reply to this email.
              </p>
              ${footerExtra}
              ${supportBlock}
              <p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${brand.muted};text-align:center;">
                &copy; ${new Date().getFullYear()} ${escapeHtml(brand.legalName)}. All rights reserved.${portalLinkBlock}
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

  const isCompanyPortal = portal === 'company';
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
    isCompanyPortal ? '' : null,
    isCompanyPortal ? getCompanySupportEmailLine() : null,
    '',
    `— ${BRAND.name}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

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
    supportEmail: isCompanyPortal ? COMPANY_SUPPORT_EMAIL : undefined,
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
 * @param {string} [params.supportEmail] - Optional support inbox mailto in footer.
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
  supportEmail,
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
    supportEmail ? getCompanySupportEmailLine() : null,
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
    supportEmail,
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

/** Official mobile app store URLs for Samsara Wellness. */
export const APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/in/app/samsara-wellness/id6749355131',
  android: 'https://play.google.com/store/apps/details?id=com.samsarawellnessyogav3.app',
};

/**
 * Build the app launch email asking users to download the new app and re-register.
 *
 * @param {Object} params - Email payload.
 * @param {string} [params.recipientName] - User display name for greeting.
 * @returns {{ subject: string, text: string, html: string }} Email content.
 */
export function buildAppLaunchResetEmailContent({ recipientName = 'there' } = {}) {
  const brand = APP_EMAIL_BRAND;
  const safeName = escapeHtml(recipientName || 'there');
  const title = 'Samsara Wellness is live — create your account again';
  const subject = `${brand.name} is live on App Store & Google Play`;

  const text = [
    `Hi ${recipientName || 'there'},`,
    '',
    'Great news — Samsara Wellness is now officially live on the App Store and Google Play.',
    '',
    'We have refreshed our platform for the public launch. Please download the latest version of the app and sign up again to set up your account properly.',
    '',
    'Download the app:',
    `iPhone / iPad: ${APP_STORE_LINKS.ios}`,
    `Android: ${APP_STORE_LINKS.android}`,
    '',
    'What to do next:',
    '1. Download the updated app from your store.',
    '2. Open the app and create a new account with your email.',
    '3. Complete your profile and explore live yoga, meditation, and wellness features.',
    '',
    `— Team ${brand.name}`,
  ].join('\n');

  const storeButtonsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
      <tr>
        <td align="center" style="padding:0 8px 12px 8px;">
          <a href="${escapeHtml(APP_STORE_LINKS.ios)}"
             style="display:inline-block;min-width:220px;padding:14px 22px;background:${brand.primaryDark};color:${brand.white};text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
            Download on App Store
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0 8px 4px 8px;">
          <a href="${escapeHtml(APP_STORE_LINKS.android)}"
             style="display:inline-block;min-width:220px;padding:14px 22px;background:${brand.primary};color:${brand.white};text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 8px 20px rgba(237,102,46,0.28);">
            Get it on Google Play
          </a>
        </td>
      </tr>
    </table>
  `;

  const contentHtml = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${brand.text};">
      Hi <strong>${safeName}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${brand.text};">
      Great news — <strong>${brand.name}</strong> is now officially live on the
      <strong>App Store</strong> and <strong>Google Play</strong>.
    </p>
    <p style="margin:0 0 16px 0;padding:16px 18px;background:${brand.primaryLight};border-left:4px solid ${brand.primary};border-radius:10px;font-size:14px;line-height:1.7;color:${brand.text};">
      We refreshed our platform for the public launch. Please download the latest app version and
      <strong>create your account again</strong> so your profile, preferences, and membership setup work correctly.
    </p>
    ${storeButtonsHtml}
    <p style="margin:8px 0 12px 0;font-size:15px;line-height:1.7;color:${brand.text};font-weight:700;">
      What to do next
    </p>
    <ol style="margin:0 0 0 0;padding-left:22px;font-size:14px;line-height:1.8;color:${brand.text};">
      <li>Download the updated app from your store.</li>
      <li>Open the app and sign up with your email.</li>
      <li>Complete your profile and explore live yoga, meditation, and wellness features.</li>
    </ol>
  `;

  const html = buildEmailLayout({
    preheader: 'Download the new Samsara Wellness app and create your account again.',
    title,
    contentHtml,
    brand,
    tagline: 'Yoga • Meditation • Wellness',
    showPortalLink: false,
    footerNote: 'Thank you for being part of our wellness journey.',
  });

  return { subject, text, html };
}
