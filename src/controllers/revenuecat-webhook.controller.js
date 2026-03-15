import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { validateWebhookAuth, handleWebhookEvent } from '../services/revenuecat.service.js';

/**
 * POST /webhooks/revenuecat
 * Receives webhook events from RevenueCat.
 * RevenueCat sends: Authorization: Bearer <webhook_auth_key>
 */
const revenuecatWebhook = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!validateWebhookAuth(authHeader)) {
    console.warn('RevenueCat webhook: invalid auth header');
    return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Invalid authorization' });
  }

  const { event } = req.body;

  if (!event) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: 'Missing event payload' });
  }

  // Respond 200 immediately so RevenueCat doesn't retry, then process
  res.status(httpStatus.OK).json({ received: true });

  try {
    await handleWebhookEvent(event);
  } catch (err) {
    console.error('RevenueCat webhook processing error:', err);
  }
});

export { revenuecatWebhook };
