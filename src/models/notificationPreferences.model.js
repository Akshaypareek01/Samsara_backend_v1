import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const notificationPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      unique: true,
      index: true
    },
    
    // Notification type preferences - all default to true
    preferences: {
      class_update: {
        type: Boolean,
        default: true
      },
      upcoming_class: {
        type: Boolean,
        default: true
      },
      upcoming_event: {
        type: Boolean,
        default: true
      },
      upcoming_appointment: {
        type: Boolean,
        default: true
      },
      app_update: {
        type: Boolean,
        default: true
      },
      general: {
        type: Boolean,
        default: true
      },
      payment: {
        type: Boolean,
        default: true
      },
      membership: {
        type: Boolean,
        default: true
      },
      assessment: {
        type: Boolean,
        default: true
      },
      meditation: {
        type: Boolean,
        default: true
      },
      diet: {
        type: Boolean,
        default: true
      },
      period_tracker: {
        type: Boolean,
        default: true
      }
    },
    
    // Global notification settings
    emailNotifications: {
      type: Boolean,
      default: true
    },
    
    pushNotifications: {
      type: Boolean,
      default: true
    },
    
    smsNotifications: {
      type: Boolean,
      default: false
    },
    
    // Quiet hours settings
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      startTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        default: "22:00"
      },
      endTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        default: "08:00"
      }
    },
    
    // Frequency settings
    frequency: {
      type: String,
      enum: ['immediate', 'daily_digest', 'weekly_digest'],
      default: 'immediate'
    }
  },
  {
    timestamps: true
  }
);

// Apply plugins
notificationPreferencesSchema.plugin(toJSON);
notificationPreferencesSchema.plugin(paginate);

// Index for better query performance
notificationPreferencesSchema.index({ userId: 1 });

// Static method to create default preferences for a user
notificationPreferencesSchema.statics.createDefaultPreferences = function(userId) {
  return this.create({
    userId: userId,
    preferences: {
      class_update: true,
      upcoming_class: true,
      upcoming_event: true,
      upcoming_appointment: true,
      app_update: true,
      general: true,
      payment: true,
      membership: true,
      assessment: true,
      meditation: true,
      diet: true,
      period_tracker: true
    },
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00"
    },
    frequency: 'immediate'
  });
};

// Method to update specific notification preference
notificationPreferencesSchema.methods.updatePreference = function(type, enabled) {
  if (this.preferences[type] !== undefined) {
    this.preferences[type] = enabled;
    return this.save();
  }
  throw new Error(`Invalid notification type: ${type}`);
};

// Method to check if user wants to receive a specific type of notification
notificationPreferencesSchema.methods.canReceiveNotification = function(type) {
  // Check if user has global notifications enabled
  if (!this.pushNotifications) {
    return false;
  }
  
  // Check if specific notification type is enabled
  if (this.preferences[type] !== undefined) {
    return this.preferences[type];
  }
  
  // Default to true for unknown types
  return true;
};

// Method to check if it's currently quiet hours
notificationPreferencesSchema.methods.isQuietHours = function() {
  if (!this.quietHours.enabled) {
    return false;
  }
  
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const startTime = this.quietHours.startTime;
  const endTime = this.quietHours.endTime;
  
  // Handle case where quiet hours span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);

export default NotificationPreferences;
