import axios from 'axios';
import OpenAI from 'openai';
import config from '../config/config.js';
import { WhatsAppConversation } from '../models/whatsapp-conversation.model.js';
import ApiError from '../utils/ApiError.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Send a WhatsApp message
 */
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw new ApiError(500, 'Failed to send WhatsApp message');
  }
};

/**
 * Get or create a conversation
 */
const getOrCreateConversation = async (whatsappId, phoneNumber, userId = null) => {
  let conversation = await WhatsAppConversation.findOne({
    whatsappId,
    isActive: true,
  }).sort({ createdAt: -1 });

  if (!conversation) {
    conversation = new WhatsAppConversation({
      whatsappId,
      phoneNumber,
      userId,
      messages: [],
      conversationState: 'active',
    });
    await conversation.save();
  }

  return conversation;
};

/**
 * Add a message to the conversation
 */
const addMessageToConversation = async (conversationId, role, content) => {
  const conversation = await WhatsAppConversation.findById(conversationId);
  
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  conversation.messages.push({
    role,
    content,
    timestamp: new Date(),
  });

  await conversation.save();
  return conversation;
};

/**
 * Get AI response from OpenAI
 */
const getAIResponse = async (conversation, userMessage) => {
  try {
    // Prepare conversation history for OpenAI
    const messages = conversation.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add the user's current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Call OpenAI API
    const thread = await openai.beta.threads.create();
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: config.openai.assistantId,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      const threadMessages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = threadMessages.data[0];
      
      if (lastMessage && lastMessage.content[0]) {
        return lastMessage.content[0].text.value;
      }
    }

    throw new Error('OpenAI assistant did not return a valid response');
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new ApiError(500, 'Failed to get AI response');
  }
};

/**
 * Check if user needs human support based on message sentiment
 */
const checkIfNeedsHumanSupport = async (userMessage, conversation) => {
  const message = userMessage.toLowerCase();
  
  // Keywords that indicate user needs human support
  const escalationKeywords = [
    'need human',
    'need agent',
    'need support',
    'talk to person',
    'speak to agent',
    'want agent',
    'human support',
    'not satisfied',
    'not happy',
    'complaint',
    'disappointed',
    'wrong answer',
    'incorrect',
    'not working',
    "i'm frustrated",
    'very frustrated',
  ];

  // Check if message contains escalation keywords
  for (const keyword of escalationKeywords) {
    if (message.includes(keyword)) {
      return true;
    }
  }

  return false;
};

/**
 * Process incoming WhatsApp message
 */
const processIncomingMessage = async (whatsappId, phoneNumber, message, userId = null) => {
  try {
    // Get or create conversation
    const conversation = await getOrCreateConversation(whatsappId, phoneNumber, userId);
    
    // Add user message to conversation
    await addMessageToConversation(conversation._id, 'user', message);

    // Check if user is asking for human support
    const needsHumanSupport = await checkIfNeedsHumanSupport(message, conversation);

    if (conversation.conversationState === 'waiting_for_agent') {
      // User is already waiting for an agent
      await sendWhatsAppMessage(
        phoneNumber,
        'Thank you for your patience. Our support team will contact you shortly. Your reference number is #' + conversation._id
      );
      return {
        status: 'escalated',
        conversationId: conversation._id,
      };
    }

    if (needsHumanSupport) {
      // Update conversation state
      conversation.conversationState = 'waiting_for_agent';
      conversation.escalatedAt = new Date();
      conversation.escalatedToAgent = true;
      await conversation.save();

      // Send escalation message
      const escalationMessage = 
        "I understand you'd like to speak with a human agent. Our support team will contact you shortly. Is that okay? (Reply 'yes' to confirm)";
      
      await sendWhatsAppMessage(phoneNumber, escalationMessage);
      
      return {
        status: 'escalated',
        conversationId: conversation._id,
      };
    }

    // Check if user is confirming escalation
    if (message.toLowerCase() === 'yes' && conversation.conversationState === 'waiting_for_agent') {
      conversation.conversationState = 'escalated';
      await conversation.save();

      await sendWhatsAppMessage(
        phoneNumber,
        'Thank you! Our support team will contact you shortly. Your reference number is #' + conversation._id
      );
      
      return {
        status: 'escalated_confirmed',
        conversationId: conversation._id,
      };
    }

    // Get AI response
    const aiResponse = await getAIResponse(conversation, message);
    
    // Add AI response to conversation
    await addMessageToConversation(conversation._id, 'assistant', aiResponse);
    
    // Send AI response to user
    await sendWhatsAppMessage(phoneNumber, aiResponse);

    // Check if AI response seems incomplete or unhelpful - offer human support
    if (aiResponse.length < 20 || aiResponse.toLowerCase().includes("i don't know")) {
      const offerHumanSupport = 
        "I want to make sure I'm helping you properly. Would you like to speak with a human agent? (Reply 'yes' or 'no')";
      
      await sendWhatsAppMessage(phoneNumber, offerHumanSupport);
      
      conversation.conversationState = 'waiting_for_agent';
      await conversation.save();
      
      return {
        status: 'human_support_offered',
        conversationId: conversation._id,
      };
    }

    return {
      status: 'success',
      conversationId: conversation._id,
      response: aiResponse,
    };
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
};

/**
 * Get conversation history
 */
const getConversationHistory = async (conversationId) => {
  const conversation = await WhatsAppConversation.findById(conversationId);
  
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  return conversation;
};

/**
 * Get conversations by user
 */
const getConversationsByUser = async (phoneNumber, limit = 10) => {
  const conversations = await WhatsAppConversation.find({ phoneNumber })
    .sort({ createdAt: -1 })
    .limit(limit);

  return conversations;
};

export const whatsappService = {
  sendWhatsAppMessage,
  getOrCreateConversation,
  addMessageToConversation,
  getAIResponse,
  checkIfNeedsHumanSupport,
  processIncomingMessage,
  getConversationHistory,
  getConversationsByUser,
};


