import express from 'express';
import validate from '../../middlewares/validate.js';
import * as adminValidation from '../../validations/admin.validation.js';
import * as adminController from '../../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', validate(adminValidation.login), adminController.login);

export default router;

