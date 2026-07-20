import path from 'path';
import { fileURLToPath } from 'url';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as wellnessFeedbackService from '../services/wellness-feedback.service.js';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../../public');
const FORM_HTML_PATH = path.join(PUBLIC_DIR, 'samsara_wellness_feedback.html');
const LOGO_HEADER_PATH = path.join(PUBLIC_DIR, 'ios-light-header.png');

/**
 * Serve the public corporate wellness feedback HTML form.
 */
const serveFeedbackForm = catchAsync(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(FORM_HTML_PATH);
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
 * Resolve signed token to prefill context for the public Next.js form.
 */
const getFeedbackContext = catchAsync(async (req, res) => {
  const data = await wellnessFeedbackService.getFeedbackContext(req.query.token);
  res.status(httpStatus.OK).json({ success: true, data });
});

/**
 * Generate a shareable feedback link for a completed booking (company auth).
 */
const createBookingShareLink = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can create feedback share links');
  }
  const data = await wellnessFeedbackService.createBookingShareLink(
    req.user.id,
    req.params.bookingId
  );
  res.status(httpStatus.OK).json({ success: true, data });
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

/**
 * Aggregated wellness feedback analytics for the authenticated company.
 */
const getCompanyFeedbackAnalytics = catchAsync(async (req, res) => {
  if (req.user.role !== 'company') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only companies can view feedback analytics');
  }

  const data = await wellnessFeedbackService.getCompanyFeedbackAnalytics(req.user.id);
  res.status(httpStatus.OK).json({ success: true, data });
});

export {
  serveFeedbackForm,
  serveFeedbackLogo,
  getFeedbackContext,
  createBookingShareLink,
  submitWellnessFeedback,
  listWellnessFeedback,
  getCompanyFeedbackAnalytics,
};
