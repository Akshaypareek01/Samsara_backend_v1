import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  createCouponCode,
  getCouponCodes,
  getCouponCode,
  getCouponCodeByCode,
  updateCouponCode,
  deleteCouponCode,
  validateCouponCode,
  getActiveCouponCodes,
  toggleCouponCodeStatus,
  getCouponCodeStats,
  getCouponCodesForPlan,
} from '../../controllers/coupon.controller.js';
import {
  createCouponCode as createCouponCodeValidation,
  getCouponCodes as getCouponCodesValidation,
  getCouponCode as getCouponCodeValidation,
  getCouponCodeByCode as getCouponCodeByCodeValidation,
  updateCouponCode as updateCouponCodeValidation,
  deleteCouponCode as deleteCouponCodeValidation,
  validateCouponCode as validateCouponCodeValidation,
  getCouponCodesForPlan as getCouponCodesForPlanValidation,
  toggleCouponCodeStatus as toggleCouponCodeStatusValidation,
} from '../../validations/coupon.validation.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveCouponCodes);
router.post('/validate', validate(validateCouponCodeValidation), validateCouponCode);
router.get('/plan/:planId', validate(getCouponCodesForPlanValidation), getCouponCodesForPlan);

// Protected routes (require authentication)
router.use(auth());

// User routes
router.get('/', validate(getCouponCodesValidation), getCouponCodes);
router.get('/stats', getCouponCodeStats);
router.get('/code/:code', validate(getCouponCodeByCodeValidation), getCouponCodeByCode);
router.get('/:couponId', validate(getCouponCodeValidation), getCouponCode);

// Admin routes (require admin role)
router.post('/', auth('admin'), validate(createCouponCodeValidation), createCouponCode);
router.patch('/:couponId', auth('admin'), validate(updateCouponCodeValidation), updateCouponCode);
router.delete('/:couponId', auth('admin'), validate(deleteCouponCodeValidation), deleteCouponCode);
router.patch('/:couponId/toggle-status', auth('admin'), validate(toggleCouponCodeStatusValidation), toggleCouponCodeStatus);

export default router;
