import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import checkPermission from '../../middlewares/checkPermission.js';
import * as homeBannerValidation from '../../validations/home-banner.validation.js';
import * as homeBannerController from '../../controllers/home-banner.controller.js';

const router = express.Router();

router.get('/', auth(), validate(homeBannerValidation.listActive), homeBannerController.listActive);

router.get(
  '/admin',
  auth(),
  checkPermission('homeBanners', 'read'),
  validate(homeBannerValidation.listAdmin),
  homeBannerController.listAdmin
);

router.post(
  '/',
  auth(),
  checkPermission('homeBanners', 'create'),
  validate(homeBannerValidation.createBanner),
  homeBannerController.createBanner
);

router.get(
  '/:bannerId',
  auth(),
  checkPermission('homeBanners', 'read'),
  validate(homeBannerValidation.getBanner),
  homeBannerController.getBanner
);

router.patch(
  '/:bannerId',
  auth(),
  checkPermission('homeBanners', 'update'),
  validate(homeBannerValidation.updateBanner),
  homeBannerController.updateBanner
);

router.delete(
  '/:bannerId',
  auth(),
  checkPermission('homeBanners', 'delete'),
  validate(homeBannerValidation.deleteBanner),
  homeBannerController.deleteBanner
);

export default router;
