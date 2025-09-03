import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import {
  createPaymentOrder,
  verifyPayment,
  getUserTransactions,
  getTransaction,
  getUserMemberships,
  getActiveMembership,
  cancelMembership,
  requestRefund,
  processRefund,
} from '../../controllers/payment.controller.js';
import {
  createPaymentOrder as createPaymentOrderValidation,
  verifyPayment as verifyPaymentValidation,
  getTransaction as getTransactionValidation,
  getUserTransactions as getUserTransactionsValidation,
  getUserMemberships as getUserMembershipsValidation,
  cancelMembership as cancelMembershipValidation,
  requestRefund as requestRefundValidation,
  processRefund as processRefundValidation,
} from '../../validations/payment.validation.js';

const router = express.Router();

// All routes require authentication
router.use(auth());

// Payment routes
router.post('/create-order', validate(createPaymentOrderValidation), createPaymentOrder);
router.post('/verify', validate(verifyPaymentValidation), verifyPayment);

// Transaction routes
router.get('/transactions', validate(getUserTransactionsValidation), getUserTransactions);
router.get('/transactions/:transactionId', validate(getTransactionValidation), getTransaction);

// Membership routes
router.get('/memberships', validate(getUserMembershipsValidation), getUserMemberships);
router.get('/memberships/active', getActiveMembership);
router.patch('/memberships/:membershipId/cancel', validate(cancelMembershipValidation), cancelMembership);
router.post('/memberships/:membershipId/refund', validate(requestRefundValidation), requestRefund);

// Admin routes (require admin role)
router.post('/memberships/:membershipId/process-refund', auth('admin'), validate(processRefundValidation), processRefund);

export default router;
