import path from 'path';
import { fileURLToPath } from 'url';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as wellnessFeedbackService from '../services/wellness-feedback.service.js';
import pick from '../utils/pick.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Serve the public corporate wellness feedback HTML form.
 */
const serveFeedbackForm = catchAsync(async (req, res) => {
  const publicPath = path.join(__dirname, '../../public/samsara_wellness_feedback.html');
  res.sendFile(publicPath);
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

export { serveFeedbackForm, submitWellnessFeedback, listWellnessFeedback };
