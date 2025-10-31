import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const whatsappConversationSchema = new mongoose.Schema(
  {
    whatsappId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    messages: [messageSchema],
    conversationState: {
      type: String,
      enum: ['active', 'waiting_for_agent', 'escalated', 'closed'],
      default: 'active',
    },
    escalatedAt: {
      type: Date,
    },
    escalatedToAgent: {
      type: Boolean,
      default: false,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

whatsappConversationSchema.index({ whatsappId: 1, createdAt: -1 });
whatsappConversationSchema.index({ phoneNumber: 1, isActive: 1 });

whatsappConversationSchema.pre('save', function (next) {
  this.lastActivity = Date.now();
  next();
});

export const WhatsAppConversation = mongoose.model('WhatsAppConversation', whatsappConversationSchema);


