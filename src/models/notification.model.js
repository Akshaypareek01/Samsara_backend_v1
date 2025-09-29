import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Target users - if null, notification is for all users
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    
    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    
    // Notification type for categorization
    type: {
      type: String,
      required: true,
      enum: [
        'class_update',
        'upcoming_class',
        'upcoming_event',
        'upcoming_appointment',
        'app_update',
        'general',
        'payment',
        'membership',
        'assessment',
        'meditation',
        'diet',
        'period_tracker'
      ],
      default: 'general'
    },
    
    // Priority level
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    
    // Additional data for the notification
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Notification status
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending'
    },
    
    // Read status for individual users
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Scheduled delivery time
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    
    // Expiry time for the notification
    expiresAt: {
      type: Date,
      default: null
    },
    
    // Action URL if notification is clickable
    actionUrl: {
      type: String,
      default: null
    },
    
    // Action button text
    actionText: {
      type: String,
      default: null
    },
    
    // Image URL for rich notifications
    imageUrl: {
      type: String,
      default: null
    },
    
    // Tags for filtering and categorization
    tags: [{
      type: String,
      trim: true
    }],
    
    // Source of the notification
    source: {
      type: String,
      enum: ['system', 'admin', 'automated', 'user'],
      default: 'system'
    },
    
    // Created by (admin/system)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if notification is scheduled for future
notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledAt > new Date();
});

// Method to mark notification as read by a user
notificationSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if notification is read by a user
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Static method to get notifications for a user
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const query = {
    $or: [
      { userId: userId },
      { userId: null } // Global notifications
    ],
    status: { $in: ['sent', 'delivered'] },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.unreadOnly) {
    query['readBy.user'] = { $ne: userId };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .populate('createdBy', 'name email');
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(notifications) {
  return this.insertMany(notifications);
};

// Pre-save middleware to validate scheduled time
notificationSchema.pre('save', function(next) {
  if (this.scheduledAt && this.scheduledAt < new Date()) {
    this.status = 'sent';
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
