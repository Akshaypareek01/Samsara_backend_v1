import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import * as adminValidation from '../../validations/admin.validation.js';
import * as adminController from '../../controllers/admin.controller.js';

const router = express.Router();

// Admin login (NO auth)
router.post('/login', validate(adminValidation.login), adminController.login);

// ✅ Admin profile (JWT + ADMIN CHECK)
router.get(
  '/profile',
  auth(),        // ⬅️ attaches req.user
  adminOnly(),   // ⬅️ checks role === admin
  adminController.getProfile
);

export default router;
