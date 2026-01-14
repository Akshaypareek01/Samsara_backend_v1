import express from 'express';
import validate from '../../middlewares/validate.js';
import * as trainerAuthValidation from '../../validations/trainerAuth.validation.js';
import * as trainerAuthController from '../../controllers/trainerAuth.controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', validate(trainerAuthValidation.register), trainerAuthController.register);
router.post('/send-login-otp', validate(trainerAuthValidation.sendLoginOTP), trainerAuthController.sendLoginOTPController);
router.post('/login', validate(trainerAuthValidation.login), trainerAuthController.login);
router.post('/logout', validate(trainerAuthValidation.logout), trainerAuthController.logout);
router.post('/refresh-tokens', validate(trainerAuthValidation.refreshTokens), trainerAuthController.refreshTokens);
router.post('/reset-password', validate(trainerAuthValidation.resetPassword), trainerAuthController.resetPassword);

// Protected routes - trainer must be authenticated
router.get('/me', auth(), trainerAuthController.getMe);
router.patch('/me', auth(), validate(trainerAuthValidation.updateProfile), trainerAuthController.updateMe);

export default router;
