import { OTP_EXPIRY_MINUTES, OTP_TTL_MS, getOtpExpiresAt } from '../../../src/config/otp.js';

describe('OTP TTL', () => {
  test('login/registration OTP is valid for 10 minutes, not the 30s resend cooldown', () => {
    expect(OTP_EXPIRY_MINUTES).toBe(10);
    expect(OTP_TTL_MS).toBe(10 * 60 * 1000);
    expect(OTP_TTL_MS).toBeGreaterThan(30 * 1000);
  });

  test('getOtpExpiresAt is 10 minutes after the given clock', () => {
    const now = 1_700_000_000_000;
    expect(getOtpExpiresAt(now).getTime()).toBe(now + OTP_TTL_MS);
  });
});
