import rateLimit from 'express-rate-limit';

/**
 * General auth limiter — all environments.
 * Counts all requests (incl. successful OTP sends) so email spray is capped per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: false,
  message: 'Too many auth requests. Please try again in a few minutes.',
});

/**
 * Per-IP cap for OTP / email-send routes (blocks rotating-email spray).
 */
const sendOtpIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: false,
  message: 'Too many OTP requests from this network. Please wait 15 minutes.',
});

/**
 * Per IP+email cap for OTP send (~5 / 15 min).
 */
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `${ip}:${email || 'no-email'}`;
  },
  message: 'Too many OTP requests for this email. Please wait 15 minutes.',
});

export { authLimiter, sendOtpLimiter, sendOtpIpLimiter };
