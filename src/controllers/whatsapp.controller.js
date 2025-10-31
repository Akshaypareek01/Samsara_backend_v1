import catchAsync from '../utils/catchAsync.js';
import { whatsappService } from '../services/whatsapp.service.js';
import config from '../config/config.js';

/**
 * Webhook verification for WhatsApp
 * GET /v1/whatsapp/webhook
 */
const verifyWebhook = catchAsync(async (req, res) => {
  // Parse query params - Express's query parser might not handle dots correctly
  // So we parse from the raw URL string
  let mode, token, challenge;
  
  // Try Express parsed query first
  mode = req.query['hub.mode'] || req.query.hub?.mode;
  token = req.query['hub.verify_token'] || req.query.hub?.['verify_token'];
  challenge = req.query['hub.challenge'] || req.query.hub?.challenge;
  
  // If not found in parsed query, parse from raw query string
  if (!mode && req.url) {
    const queryString = req.url.split('?')[1];
    if (queryString) {
      const params = new URLSearchParams(queryString);
      mode = params.get('hub.mode');
      token = params.get('hub.verify_token');
      challenge = params.get('hub.challenge');
    }
  }

  // Debug logging
  console.log('Webhook verification request:', {
    mode,
    token: token ? 'provided' : 'missing',
    expectedToken: config.whatsapp.verifyToken ? 'set' : 'missing',
    challenge: challenge ? 'provided' : 'missing',
  });

  if (mode === 'subscribe' && token && token.trim() === config.whatsapp.verifyToken?.trim()) {
    console.log('✅ Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.log('❌ Webhook verification failed:', {
    modeMatch: mode === 'subscribe',
    tokenMatch: token?.trim() === config.whatsapp.verifyToken?.trim(),
    hasToken: !!token,
    hasConfigToken: !!config.whatsapp.verifyToken,
  });
  return res.status(403).send('Forbidden');
});

/**
 * Handle incoming WhatsApp messages
 * POST /v1/whatsapp/webhook
 */
const handleIncomingMessage = catchAsync(async (req, res) => {
  const body = req.body;

  // Verify the webhook signature if configured
  console.log('Incoming webhook:', JSON.stringify(body, null, 2));

  // Check if this is a valid WhatsApp webhook
  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      console.log('No messages in webhook');
      return res.status(200).json({ status: 'ok' });
    }

    const message = value.messages[0];
    const contacts = value.contacts?.[0];

    if (message?.from && message?.text?.body) {
      const phoneNumber = message.from;
      const whatsappId = message.from;
      const messageText = message.text.body;

      console.log(`Incoming message from ${phoneNumber}: ${messageText}`);

      // Process the incoming message
      try {
        const result = await whatsappService.processIncomingMessage(
          whatsappId,
          phoneNumber,
          messageText
        );

        console.log('Message processed:', result);

        return res.status(200).json({
          status: 'success',
          messageId: message.id,
          result,
        });
      } catch (error) {
        console.error('Error processing message:', error);

        // Send error message to user
        try {
          await whatsappService.sendWhatsAppMessage(
            phoneNumber,
            "Sorry, I'm having trouble processing your message. Please try again later."
          );
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }

        return res.status(500).json({
          status: 'error',
          error: error.message,
        });
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
});

/**
 * Send a message to WhatsApp
 * POST /v1/whatsapp/send
 */
const sendMessage = catchAsync(async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone number and message are required',
    });
  }

  try {
    const result = await whatsappService.sendWhatsAppMessage(phoneNumber, message);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * Get conversation history
 * GET /v1/whatsapp/conversation/:conversationId
 */
const getConversationHistory = catchAsync(async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await whatsappService.getConversationHistory(conversationId);

    res.status(200).json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * Get conversations by phone number
 * GET /v1/whatsapp/conversations
 */
const getConversations = catchAsync(async (req, res) => {
  const { phoneNumber, limit } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone number is required',
    });
  }

  try {
    const conversations = await whatsappService.getConversationsByUser(
      phoneNumber,
      parseInt(limit, 10) || 10
    );

    res.status(200).json({
      status: 'success',
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export const whatsappController = {
  verifyWebhook,
  handleIncomingMessage,
  sendMessage,
  getConversationHistory,
  getConversations,
};


