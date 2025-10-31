import express from 'express';
import { whatsappController } from '../../controllers/whatsapp.controller.js';

const router = express.Router();

/**
 * GET /v1/whatsapp/webhook
 * Webhook verification for WhatsApp
 */
router.get('/webhook', whatsappController.verifyWebhook);

/**
 * POST /v1/whatsapp/webhook
 * Handle incoming WhatsApp messages
 */
router.post('/webhook', whatsappController.handleIncomingMessage);

/**
 * POST /v1/whatsapp/send
 * Send a message to WhatsApp
 */
router.post('/send', whatsappController.sendMessage);

/**
 * GET /v1/whatsapp/conversation/:conversationId
 * Get conversation history
 */
router.get('/conversation/:conversationId', whatsappController.getConversationHistory);

/**
 * GET /v1/whatsapp/conversations
 * Get conversations by phone number
 */
router.get('/conversations', whatsappController.getConversations);

export default router;


