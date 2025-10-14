import express from 'express';
import { getAccountStats, resetAccount, resetAllAccounts, zoomHealthCheck } from '../controllers/zoomManagement.controller.js';

const router = express.Router();

// Zoom account management routes
router.get('/account-stats', getAccountStats);
router.post('/reset-account/:accountId', resetAccount);
router.post('/reset-all-accounts', resetAllAccounts);
router.get('/health', zoomHealthCheck);

export default router;
