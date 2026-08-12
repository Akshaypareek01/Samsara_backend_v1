import rateLimit from 'express-rate-limit';
import RedisRateLimitStore from './redisRateLimitStore.js';

/** Shared 15-minute window used by every limiter below. */
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Redis-backed store so counters survive deploys and are shared across
 * instances. Each limiter gets its own key prefix.
 * @param {string} prefix
 */
const store = (prefix) => new RedisRateLimitStore({ windowMs: WINDOW_MS, prefix });

/**
 * General auth limiter — all environments.
 * Counts all requests (incl. successful OTP sends) so email spray is capped per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  store: store('rl:auth:'),
  max: 60,
  skipSuccessfulRequests: false,
  message: 'Too many auth requests. Please try again in a few minutes.',
});

/**
 * Per-IP cap for OTP / email-send routes (blocks rotating-email spray).
 */
const sendOtpIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  store: store('rl:otp-ip:'),
  max: 15,
  skipSuccessfulRequests: false,
  message: 'Too many OTP requests from this network. Please wait 15 minutes.',
});

/**
 * Per IP+email cap for OTP send (~5 / 15 min).
 */
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  store: store('rl:otp:'),
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

/**
 * Per-IP cap for OTP verification (blocks 4-digit OTP brute force).
 * Paired with the per-OTP attempt counter in otp.service.js.
 */
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  store: store('rl:otp-verify:'),
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `${ip}:${email || 'no-email'}`;
  },
  message: 'Too many verification attempts. Please request a new code.',
});

/**
 * Per-IP cap for file uploads (memory-bound endpoint).
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  store: store('rl:upload:'),
  max: 30,
  skipSuccessfulRequests: false,
  message: 'Too many uploads. Please try again in a few minutes.',
});

export { authLimiter, sendOtpLimiter, sendOtpIpLimiter, verifyOtpLimiter, uploadLimiter };
