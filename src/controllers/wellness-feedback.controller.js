import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as wellnessFeedbackService from '../services/wellness-feedback.service.js';
import pick from '../utils/pick.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../../public');
const FORM_HTML_PATH = path.join(PUBLIC_DIR, 'samsara_wellness_feedback.html');
const LOGO_HEADER_PATH = path.join(PUBLIC_DIR, 'ios-light-header.png');

let cachedFormHtml = null;

/**
 * Build form HTML with the logo embedded inline (avoids separate image request / cache issues).
 * @returns {string}
 */
const getFormHtmlWithInlineLogo = () => {
  if (cachedFormHtml) {
    return cachedFormHtml;
  }

  const logoBase64 = fs.readFileSync(LOGO_HEADER_PATH).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;
  let html = fs.readFileSync(FORM_HTML_PATH, 'utf8');

  html = html.replace(
    /src="\/v1\/wellness-feedback\/logo[^"]*"/,
    `src="${logoDataUri}"`
  );

  cachedFormHtml = html;
  return cachedFormHtml;
};

/**
 * Serve the public corporate wellness feedback HTML form.
 */
const serveFeedbackForm = catchAsync(async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(getFormHtmlWithInlineLogo());
});

/**
 * Serve the header logo image for the feedback form.
 */
const serveFeedbackLogo = catchAsync(async (req, res) => {
  res.type('image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(LOGO_HEADER_PATH);
});

/**
 * Accept and store a wellness feedback form submission (public).
 */
const submitWellnessFeedback = catchAsync(async (req, res) => {
  const meta = {
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  const feedback = await wellnessFeedbackService.createWellnessFeedback(req.body, meta);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Thank you! Your feedback has been submitted.',
    data: { id: feedback.id },
  });
});

/**
 * List stored wellness feedback submissions (admin only).
 */
const listWellnessFeedback = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['companyName']);
  if (filter.companyName) {
    filter.companyName = new RegExp(filter.companyName, 'i');
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }

  const result = await wellnessFeedbackService.queryWellnessFeedback(filter, options);
  res.status(httpStatus.OK).json(result);
});

export { serveFeedbackForm, serveFeedbackLogo, submitWellnessFeedback, listWellnessFeedback };
