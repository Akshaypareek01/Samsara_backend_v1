import express from 'express';
import { getGlobalConfig } from '../../controllers/globalConfig.controller.js';

const router = express.Router();

router.route('/').get(getGlobalConfig);

export default router;
