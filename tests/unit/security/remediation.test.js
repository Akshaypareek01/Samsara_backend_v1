import { jest } from '@jest/globals';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';

import { selfOrAdmin } from '../../../src/middlewares/ownership.js';
import isAdminUser from '../../../src/utils/isAdminUser.js';
import { resolveSafeContentType, validateUploadFile } from '../../../src/utils/uploadImageUtils.js';
import { eventValidation, classValidation } from '../../../src/validations/eventClass.validation.js';
import { User } from '../../../src/models/user.model.js';

/**
 * Regression tests for the audit remediation.
 *
 * These cover behaviour that was verified statically but never executed —
 * every case here maps to a specific finding in PRODUCTION_AUDIT.md.
 */

describe('SAM-C-02 — ownership middleware (selfOrAdmin)', () => {
  const run = (user, params) => {
    const req = httpMocks.createRequest({ params });
    req.user = user;
    const next = jest.fn();
    selfOrAdmin()(req, httpMocks.createResponse(), next);
    return next.mock.calls[0]?.[0];
  };

  test('allows a user to reach their own record', () => {
    expect(run({ id: 'abc123' }, { userId: 'abc123' })).toBeUndefined();
  });

  test("blocks a user reaching someone else's record", () => {
    const err = run({ id: 'abc123' }, { userId: 'other999' });
    expect(err?.statusCode).toBe(httpStatus.FORBIDDEN);
  });

  test('allows an admin through regardless of target', () => {
    expect(run({ role: 'admin' }, { userId: 'anyone' })).toBeUndefined();
  });

  test('allows an admin carrying a populated RBAC role object', () => {
    expect(run({ role: { name: 'Super Admin', permissions: {} } }, { userId: 'anyone' })).toBeUndefined();
  });

  test('rejects an unauthenticated request', () => {
    const req = httpMocks.createRequest({ params: { userId: 'x' } });
    const next = jest.fn();
    selfOrAdmin()(req, httpMocks.createResponse(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
  });

  test('blocks when the route param is missing entirely', () => {
    expect(run({ id: 'abc123' }, {})?.statusCode).toBe(httpStatus.FORBIDDEN);
  });

  test('company and trainer actors are not treated as admins', () => {
    expect(isAdminUser({ role: 'company' })).toBe(false);
    expect(isAdminUser({ role: 'trainer' })).toBe(false);
  });
});

describe('SAM-C-06 — upload content type is derived, never trusted', () => {
  test('resolves the stored type from the extension', () => {
    expect(resolveSafeContentType('a.jpg')).toBe('image/jpeg');
    expect(resolveSafeContentType('a.PNG')).toBe('image/png');
    expect(resolveSafeContentType('report.pdf')).toBe('application/pdf');
  });

  test('an HTML payload disguised as .jpg cannot be stored as text/html', () => {
    // The client claims text/html; the stored type comes from the extension.
    expect(resolveSafeContentType('payload.jpg')).toBe('image/jpeg');
  });

  test('refuses extensions outside the allowlist', () => {
    expect(resolveSafeContentType('evil.html')).toBeNull();
    expect(resolveSafeContentType('evil.svg')).toBeNull();
    expect(resolveSafeContentType('noextension')).toBeNull();
  });

  test('rejects HEIC with a helpful message', () => {
    expect(validateUploadFile('image/heic', 'photo.heic')).toMatch(/JPG, PNG, or WebP/);
  });
});

describe('SAM-C-11 — event validation matches the real client payloads', () => {
  const validate = (body) => eventValidation.createEvent.body.validate(body, { abortEarly: false }).error;

  test('accepts the exact payload the app sends, including MM/DD/YYYY dates', () => {
    expect(
      validate({
        eventName: 'Morning Flow',
        details: 'A gentle start',
        level: 'Beginner',
        type: 'free',
        startDate: '08/13/2026', // NOT ISO — Joi.date().iso() would reject this
        startTime: '07:30',
        availableseats: '25',
        teacher: '507f1f77bcf86cd799439011',
        eventmode: 'online',
        status: false,
      })
    ).toBeUndefined();
  });

  test('accepts ISO dates too', () => {
    expect(validate({ eventName: 'Web Event', startDate: '2026-08-13T07:30:00.000Z' })).toBeUndefined();
  });

  test('accepts seats as number or string', () => {
    expect(validate({ eventName: 'Seats', availableseats: 30 })).toBeUndefined();
    expect(validate({ eventName: 'Seats', availableseats: '30' })).toBeUndefined();
  });

  test('rejects a missing name and an impossible time', () => {
    expect(validate({ details: 'x' })).toBeDefined();
    expect(validate({ eventName: 'Valid Name', startTime: '25:00' })).toBeDefined();
  });

  test('forbids mass-assigning server-owned Zoom fields and the roster', () => {
    expect(validate({ eventName: 'Valid Name', meeting_number: '123456789' })).toBeDefined();
    expect(validate({ eventName: 'Valid Name', password: 'hunter2' })).toBeDefined();
    expect(validate({ eventName: 'Valid Name', zoomAccountUsed: 'account_2' })).toBeDefined();
    expect(validate({ eventName: 'Valid Name', students: ['507f1f77bcf86cd799439011'] })).toBeDefined();
  });
});

describe('SAM-C-11 — class validation tolerates both schedule shapes', () => {
  const validate = (body) => classValidation.createClass.body.validate(body, { abortEarly: false }).error;
  const base = { title: 'Hatha Basics', teacher: '507f1f77bcf86cd799439011', classType: 'online' };

  test('accepts schedules[] with no schedule (what the app sends)', () => {
    expect(
      validate({
        ...base,
        schedules: [{ date: '08/20/2026', days: ['Mon', 'Wed'], startTime: '07:00', endTime: '08:00' }],
      })
    ).toBeUndefined();
  });

  test('accepts a singular schedule (what the CRM sends)', () => {
    expect(validate({ ...base, schedule: '2026-09-01T10:00:00.000Z' })).toBeUndefined();
  });

  test('requires at least one of the two', () => {
    expect(validate(base)).toBeDefined();
  });

  test('rejects an out-of-range duration and a bad weekday', () => {
    expect(validate({ ...base, schedule: '2026-09-01', duration: 999 })).toBeDefined();
    expect(validate({ ...base, schedules: [{ days: ['Funday'] }] })).toBeDefined();
  });
});

describe('SAM-H-06 / password handling on the User model', () => {
  test('email is lowercased and trimmed so casing cannot split accounts', () => {
    const u = new User({ name: 'A', email: '  MiXeD@Example.COM ', role: 'user', userCategory: 'Personal' });
    expect(u.email).toBe('mixed@example.com');
  });

  test('the bcrypt hash is never serialised', () => {
    const u = new User({
      name: 'A',
      email: 'a@x.com',
      password: 'password1',
      role: 'user',
      userCategory: 'Personal',
    });
    const json = u.toJSON();
    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('passwordResetToken');
    // …but the document itself still has it, so login keeps working.
    expect(u.password).toBe('password1');
  });

  test('accounts with no password (OTP-only) still validate', async () => {
    const u = new User({ name: 'A', email: 'otp@x.com', role: 'user', userCategory: 'Personal' });
    await expect(u.validate()).resolves.toBeUndefined();
  });
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
});
