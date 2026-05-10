import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as referralValidation from '../../validations/referral.validation.js';
import * as referralController from '../../controllers/referral.controller.js';

const router = express.Router();

router.get('/me', auth(), referralController.getMyReferrals);
router.get(
  '/leaderboard',
  auth(),
  validate(referralValidation.leaderboardQuery),
  referralController.getLeaderboard
);

export default router;
