import express from 'express';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';
// NOTE: this router is not mounted in routes/v1/index.js. It is kept guarded so
// that mounting it later cannot reintroduce unauthenticated account resets.
import {
  getAccountStats,
  resetAccount,
  resetAllAccounts,
  zoomHealthCheck,
} from '../../controllers/zoomManagement.controller.js';

const router = express.Router();

// Liveness probe stays open for the load balancer; everything else is admin-only.
router.get('/health', zoomHealthCheck);

router.use(auth(), adminOnly());

// Zoom account management routes (admin only)
router.get('/account-stats', getAccountStats);
router.post('/reset-account/:accountId', resetAccount);
router.post('/reset-all-accounts', resetAllAccounts);

export default router;
