import express from 'express';
import { revenuecatWebhook } from '../../controllers/revenuecat-webhook.controller.js';

const router = express.Router();

// No auth() middleware — RevenueCat authenticates via Authorization header we validate manually
router.post('/revenuecat', revenuecatWebhook);

export default router;
