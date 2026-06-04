import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import checkPermission from '../../middlewares/checkPermission.js';
import * as validation from '../../validations/platform-account-details.validation.js';
import * as controller from '../../controllers/platform-account-details.controller.js';

const router = express.Router();

router
  .route('/')
  .get(auth(), controller.getAccountDetails)
  .put(
    auth(),
    checkPermission('companyManagement', 'update'),
    validate(validation.updatePlatformAccountDetails),
    controller.updateAccountDetails
  );

export default router;
