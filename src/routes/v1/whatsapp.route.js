import express from 'express';
import { whatsappController } from '../../controllers/whatsapp.controller.js';
import auth from '../../middlewares/auth.js';
import adminOnly from '../../middlewares/admin.middleware.js';

const router = express.Router();

/**
 * GET /v1/whatsapp/webhook
 * Webhook verification for WhatsApp (Meta calls this; verified via hub.verify_token)
 */
router.get('/webhook', whatsappController.verifyWebhook);

/**
 * POST /v1/whatsapp/webhook
 * Handle incoming WhatsApp messages.
 * Public by necessity (Meta calls it) — authenticity is enforced inside the
 * controller by verifying the X-Hub-Signature-256 HMAC over the raw body.
 */
router.post('/webhook', whatsappController.handleIncomingMessage);

/**
 * POST /v1/whatsapp/send
 * Send a message to WhatsApp (admin only — sends from the business number)
 */
router.post('/send', auth(), adminOnly(), whatsappController.sendMessage);

/**
 * GET /v1/whatsapp/conversation/:conversationId
 * Get conversation history (admin only — contains user PII)
 */
router.get('/conversation/:conversationId', auth(), adminOnly(), whatsappController.getConversationHistory);

/**
 * GET /v1/whatsapp/conversations
 * Get conversations by phone number (admin only — contains user PII)
 */
router.get('/conversations', auth(), adminOnly(), whatsappController.getConversations);

export default router;
