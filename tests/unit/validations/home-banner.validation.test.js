import Joi from 'joi';
import { HOME_BANNER_PLACEMENTS, HOME_BANNER_SCREENS } from '../../../src/constants/homeBannerScreens.js';
import * as validation from '../../../src/validations/home-banner.validation.js';

/**
 * Compile a request-slice schema the same way the validate middleware does.
 * @param {object} schema
 * @param {object} object
 */
const run = (schema, object) =>
  Joi.compile(schema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

describe('home banner screens', () => {
  test('allowlist includes the seeded destinations', () => {
    expect(HOME_BANNER_PLACEMENTS).toEqual(['home_hero', 'home_updates']);
    expect(HOME_BANNER_SCREENS).toEqual(expect.arrayContaining(['GroupClassesAll', 'Guidevideo', 'Events']));
  });
});

describe('home-banner validation', () => {
  const validBody = {
    placement: 'home_hero',
    imageUrl: 'https://cdn.example.com/banner.png',
    title: 'Begin',
    targetScreen: 'GroupClassesAll',
    order: 0,
    isActive: true,
  };

  test('create accepts https image and allowlisted screen', () => {
    const { error, value } = run(validation.createBanner, { body: validBody });
    expect(error).toBeUndefined();
    expect(value.body.targetScreen).toBe('GroupClassesAll');
  });

  test('create defaults missing targetScreen to null', () => {
    const { error, value } = run(validation.createBanner, {
      body: { placement: 'home_updates', imageUrl: validBody.imageUrl },
    });
    expect(error).toBeUndefined();
    expect(value.body.targetScreen).toBeNull();
  });

  test('create rejects unknown targetScreen', () => {
    const { error } = run(validation.createBanner, {
      body: { ...validBody, targetScreen: 'NotAScreen' },
    });
    expect(error).toBeDefined();
  });

  test('create rejects http image URLs', () => {
    const { error } = run(validation.createBanner, {
      body: { ...validBody, imageUrl: 'http://cdn.example.com/banner.png' },
    });
    expect(error).toBeDefined();
  });

  test('app GET requires placement', () => {
    const missing = run(validation.listActive, { query: {} });
    expect(missing.error).toBeDefined();
    const ok = run(validation.listActive, { query: { placement: 'home_hero' } });
    expect(ok.error).toBeUndefined();
  });

  test('patch does not force targetScreen null when omitted', () => {
    const { error, value } = run(validation.updateBanner, {
      params: { bannerId: '507f1f77bcf86cd799439011' },
      body: { isActive: false },
    });
    expect(error).toBeUndefined();
    expect(value.body.targetScreen).toBeUndefined();
  });
});
