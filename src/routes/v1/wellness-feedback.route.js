import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
import * as wellnessFeedbackValidation from '../../validations/wellness-feedback.validation.js';
import {
  serveFeedbackForm,
  serveFeedbackLogo,
  submitWellnessFeedback,
  listWellnessFeedback,
} from '../../controllers/wellness-feedback.controller.js';

const router = express.Router();

router.get('/logo', serveFeedbackLogo);
router.get('/form', serveFeedbackForm);
router.post('/', validate(wellnessFeedbackValidation.submitWellnessFeedback), submitWellnessFeedback);
router.get('/', auth(), adminOnly(), validate(wellnessFeedbackValidation.listWellnessFeedback), listWellnessFeedback);

export default router;
