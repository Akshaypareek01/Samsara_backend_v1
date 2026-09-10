import Joi from 'joi';
import { objectId } from './custom.validation.js';
import { HOME_BANNER_PLACEMENTS, HOME_BANNER_SCREENS } from '../constants/homeBannerScreens.js';

const httpsUrl = Joi.string()
  .uri({ scheme: ['https'] })
  .trim();

const targetScreen = Joi.string()
  .valid(...HOME_BANNER_SCREENS)
  .allow(null)
  .empty('');

const bannerBody = {
  placement: Joi.string()
    .valid(...HOME_BANNER_PLACEMENTS)
    .required(),
  imageUrl: httpsUrl.required(),
  title: Joi.string().trim().allow('').max(120),
  subtitle: Joi.string().trim().allow('').max(240),
  ctaText: Joi.string().trim().allow('').max(80),
  targetScreen,
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

const listActive = {
  query: Joi.object().keys({
    placement: Joi.string()
      .valid(...HOME_BANNER_PLACEMENTS)
      .required(),
  }),
};

const listAdmin = {
  query: Joi.object().keys({
    placement: Joi.string().valid(...HOME_BANNER_PLACEMENTS),
  }),
};

const getBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().custom(objectId),
  }),
};

const createBanner = {
  body: Joi.object().keys({
    ...bannerBody,
    targetScreen: targetScreen.default(null),
  }),
};

const updateBanner = {
  params: Joi.object().keys({
    bannerId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      placement: Joi.string().valid(...HOME_BANNER_PLACEMENTS),
      imageUrl: httpsUrl,
      title: Joi.string().trim().allow('').max(120),
      subtitle: Joi.string().trim().allow('').max(240),
      ctaText: Joi.string().trim().allow('').max(80),
      targetScreen,
      order: Joi.number().integer().min(0),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().custom(objectId),
  }),
};

export { listActive, listAdmin, getBanner, createBanner, updateBanner, deleteBanner };
