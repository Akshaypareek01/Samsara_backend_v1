import httpStatus from 'http-status';
import axios from 'axios';
import { Membership, MembershipPlan, Transaction } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';

const RC_API_BASE = 'https://api.revenuecat.com/v1';

/**
 * Build auth headers for RevenueCat REST API
 */
const rcHeaders = () => ({
  Authorization: `Bearer ${config.revenuecat.secretKey}`,
  'Content-Type': 'application/json',
});

/**
 * Fetch subscriber info from RevenueCat REST API
 * @param {string} appUserId - The app_user_id (our MongoDB user._id)
 * @returns {Promise<Object>} RevenueCat subscriber object
 */
const getSubscriberInfo = async (appUserId) => {
  try {
    const { data } = await axios.get(
      `${RC_API_BASE}/subscribers/${appUserId}`,
      { headers: rcHeaders() }
    );
    return data.subscriber;
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    console.error('RevenueCat API error:', err.response?.data || err.message);
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to reach RevenueCat API');
  }
};

/**
 * Resolve a RevenueCat product identifier to our MembershipPlan.
 * Tries appleProductId first, then revenuecatProductId in metadata.
 */
const resolvePlan = async (productId) => {
  let plan = await MembershipPlan.findOne({
    appleProductId: productId,
    isActive: true,
  });

  if (!plan) {
    plan = await MembershipPlan.findOne({
      'metadata.revenuecatProductId': productId,
      isActive: true,
    });
  }

  return plan;
};

/**
 * Sync a user's RevenueCat entitlements to our DB.
 * Called from POST /memberships/sync-revenuecat (client calls after purchase).
 *
 * @param {string} userId - Our MongoDB user ID
 * @returns {Promise<Membership|null>}
 */
const syncSubscription = async (userId) => {
  const subscriber = await getSubscriberInfo(userId);
  if (!subscriber) {
    return null;
  }

  const entitlements = subscriber.entitlements;
  if (!entitlements || Object.keys(entitlements).length === 0) {
    return null;
  }

  const [entitlementId, entitlement] = Object.entries(entitlements).find(
    ([, e]) => e.expires_date && new Date(e.expires_date) > new Date()
  ) || [];

  if (!entitlement) {
    return null;
  }

  const productId = entitlement.product_identifier;
  const plan = await resolvePlan(productId);
  if (!plan) {
    console.warn(`RevenueCat sync: no plan found for product ${productId}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `No plan mapped for product: ${productId}`);
  }

  const startDate = new Date(entitlement.purchase_date);
  const endDate = new Date(entitlement.expires_date);

  const membership = await Membership.findOneAndUpdate(
    { userId, paymentProvider: 'revenuecat', revenuecatEntitlementId: entitlementId },
    {
      userId,
      planId: plan._id,
      planName: plan.name,
      validityDays: plan.validityDays,
      platform: entitlement.store === 'app_store' ? 'ios' : 'android',
      paymentProvider: 'revenuecat',
      revenuecatAppUserId: userId,
      revenuecatEntitlementId: entitlementId,
      revenuecatProductId: productId,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.basePrice,
      originalAmount: plan.basePrice,
      currency: plan.currency,
      autoRenewal: !entitlement.unsubscribe_detected_at,
      metadata: {
        revenuecatStore: entitlement.store,
        revenuecatIsSandbox: entitlement.is_sandbox,
        syncedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  console.info(`RevenueCat sync: membership upserted for user ${userId}, entitlement=${entitlementId}`);
  return membership;
};

/**
 * Validate the RevenueCat webhook authorization header.
 * RevenueCat sends: Authorization: Bearer <your_webhook_auth_key>
 */
const validateWebhookAuth = (authHeader) => {
  if (!config.revenuecat.webhookSecret) {
    console.warn('REVENUECAT_WEBHOOK_SECRET not set — skipping webhook auth');
    return true;
  }

  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === config.revenuecat.webhookSecret;
};

/**
 * Handle a RevenueCat webhook event.
 * @param {Object} event - The webhook event payload (event.type + event body)
 */
const handleWebhookEvent = async (event) => {
  const { type, app_user_id: appUserId, product_id: productId } = event;

  console.info(`RevenueCat webhook: type=${type}, user=${appUserId}, product=${productId}`);

  if (!appUserId) {
    console.warn('RevenueCat webhook: missing app_user_id, skipping');
    return;
  }

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'NON_RENEWING_PURCHASE':
      await handleInitialPurchase(event);
      break;

    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
      await handleRenewal(event);
      break;

    case 'CANCELLATION':
      await handleCancellation(event);
      break;

    case 'EXPIRATION':
      await handleExpiration(event);
      break;

    case 'BILLING_ISSUE':
      await handleBillingIssue(event);
      break;

    case 'SUBSCRIBER_ALIAS':
    case 'TRANSFER':
      console.info(`RevenueCat webhook: ${type} — no-op`);
      break;

    default:
      console.info(`RevenueCat webhook: unhandled type ${type}`);
  }
};

/**
 * INITIAL_PURCHASE — create membership record
 */
const handleInitialPurchase = async (event) => {
  const {
    app_user_id: userId,
    product_id: productId,
    entitlement_ids: entitlementIds,
    purchased_at_ms: purchasedAtMs,
    expiration_at_ms: expirationAtMs,
    store,
    is_sandbox: isSandbox,
    original_transaction_id: originalTxnId,
  } = event;

  const plan = await resolvePlan(productId);
  if (!plan) {
    console.warn(`RevenueCat webhook INITIAL_PURCHASE: unknown product ${productId}`);
    return;
  }

  const entitlementId = entitlementIds?.[0] || 'premium';
  const startDate = new Date(purchasedAtMs);
  const endDate = expirationAtMs ? new Date(expirationAtMs) : plan.getMembershipEndDate(startDate);
  const platform = store === 'APP_STORE' ? 'ios' : 'android';

  const membership = await Membership.findOneAndUpdate(
    { userId, paymentProvider: 'revenuecat', revenuecatProductId: productId },
    {
      userId,
      planId: plan._id,
      planName: plan.name,
      validityDays: plan.validityDays,
      platform,
      paymentProvider: 'revenuecat',
      revenuecatAppUserId: userId,
      revenuecatEntitlementId: entitlementId,
      revenuecatProductId: productId,
      transactionId: originalTxnId,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.basePrice,
      originalAmount: plan.basePrice,
      currency: plan.currency,
      autoRenewal: true,
      metadata: {
        revenuecatStore: store,
        revenuecatIsSandbox: isSandbox,
        source: 'revenuecat_webhook',
        webhookType: 'INITIAL_PURCHASE',
      },
    },
    { upsert: true, new: true }
  );

  await createTransactionRecord(userId, plan, originalTxnId, platform, 'completed');

  console.info(`RevenueCat INITIAL_PURCHASE processed: membership ${membership._id}`);
};

/**
 * RENEWAL — extend the membership end date
 */
const handleRenewal = async (event) => {
  const {
    app_user_id: userId,
    product_id: productId,
    expiration_at_ms: expirationAtMs,
    original_transaction_id: originalTxnId,
    store,
  } = event;

  const endDate = expirationAtMs ? new Date(expirationAtMs) : null;

  const membership = await Membership.findOne({
    userId,
    paymentProvider: 'revenuecat',
    revenuecatProductId: productId,
  });

  if (!membership) {
    console.warn(`RevenueCat RENEWAL: no membership found for user=${userId} product=${productId}, treating as new purchase`);
    await handleInitialPurchase(event);
    return;
  }

  if (endDate) membership.endDate = endDate;
  membership.status = 'active';
  membership.autoRenewal = true;
  membership.metadata = {
    ...membership.metadata,
    lastRenewedAt: new Date(),
    webhookType: 'RENEWAL',
  };
  await membership.save();

  const plan = await MembershipPlan.findById(membership.planId);
  if (plan) {
    await createTransactionRecord(userId, plan, originalTxnId, store === 'APP_STORE' ? 'ios' : 'android', 'completed');
  }

  console.info(`RevenueCat RENEWAL processed: membership ${membership._id}, new endDate=${endDate}`);
};

/**
 * CANCELLATION — user turned off auto-renew; membership still active until expiry
 */
const handleCancellation = async (event) => {
  const { app_user_id: userId, product_id: productId } = event;

  const membership = await Membership.findOne({
    userId,
    paymentProvider: 'revenuecat',
    revenuecatProductId: productId,
  });

  if (!membership) {
    console.warn(`RevenueCat CANCELLATION: no membership found for user=${userId}`);
    return;
  }

  membership.autoRenewal = false;
  membership.cancelledAt = new Date();
  membership.cancellationReason = 'User cancelled via store (RevenueCat)';
  membership.metadata = {
    ...membership.metadata,
    webhookType: 'CANCELLATION',
    cancelledAt: new Date(),
  };
  await membership.save();

  console.info(`RevenueCat CANCELLATION processed: membership ${membership._id}`);
};

/**
 * EXPIRATION — subscription actually expired
 */
const handleExpiration = async (event) => {
  const { app_user_id: userId, product_id: productId } = event;

  const membership = await Membership.findOne({
    userId,
    paymentProvider: 'revenuecat',
    revenuecatProductId: productId,
  });

  if (!membership) {
    console.warn(`RevenueCat EXPIRATION: no membership found for user=${userId}`);
    return;
  }

  membership.status = 'expired';
  membership.autoRenewal = false;
  membership.metadata = {
    ...membership.metadata,
    webhookType: 'EXPIRATION',
    expiredAt: new Date(),
  };
  await membership.save();

  console.info(`RevenueCat EXPIRATION processed: membership ${membership._id}`);
};

/**
 * BILLING_ISSUE — mark potential churn
 */
const handleBillingIssue = async (event) => {
  const { app_user_id: userId, product_id: productId } = event;

  const membership = await Membership.findOne({
    userId,
    paymentProvider: 'revenuecat',
    revenuecatProductId: productId,
  });

  if (!membership) return;

  membership.metadata = {
    ...membership.metadata,
    billingIssue: true,
    billingIssueDetectedAt: new Date(),
    webhookType: 'BILLING_ISSUE',
  };
  await membership.save();

  console.info(`RevenueCat BILLING_ISSUE flagged: membership ${membership._id}`);
};

/**
 * Helper to record a transaction
 */
const createTransactionRecord = async (userId, plan, txnId, platform, status) => {
  if (!txnId) return;

  const existing = await Transaction.findOne({ transactionId: txnId });
  if (existing) return;

  await Transaction.create({
    userId,
    planId: plan._id,
    planName: plan.name,
    transactionId: txnId,
    orderId: txnId,
    amount: plan.basePrice,
    currency: plan.currency,
    status,
    paymentMethod: 'apple',
    platform,
    metadata: { source: 'revenuecat_webhook' },
  });
};

export {
  getSubscriberInfo,
  syncSubscription,
  validateWebhookAuth,
  handleWebhookEvent,
};
