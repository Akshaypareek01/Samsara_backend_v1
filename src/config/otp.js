/** Email OTP validity. Independent of the client resend cooldown (~30s). */
export const OTP_EXPIRY_MINUTES = 10;

/** OTP document TTL used by createOTP. */
export const OTP_TTL_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

/**
 * Compute the OTP expiry timestamp.
 * @param {number} [nowMs=Date.now()] - Clock to measure from.
 * @returns {Date}
 */
export function getOtpExpiresAt(nowMs = Date.now()) {
  return new Date(nowMs + OTP_TTL_MS);
}
