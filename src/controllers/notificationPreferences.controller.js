import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import NotificationPreferences from '../models/notificationPreferences.model.js';

/**
 * Get user's notification preferences
 */
const getNotificationPreferences = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const preferences = await user.getNotificationPreferences();
  
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notification preferences retrieved successfully',
    data: preferences
  });
});

/**
 * Update user's notification preferences
 */
const updateNotificationPreferences = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const preferences = await user.getNotificationPreferences();
  
  const {
    preferences: notificationPreferences,
    emailNotifications,
    pushNotifications,
    smsNotifications,
    quietHours,
    frequency
  } = req.body;

  // Update individual notification preferences
  if (notificationPreferences) {
    for (const [type, enabled] of Object.entries(notificationPreferences)) {
      if (preferences.preferences[type] !== undefined) {
        preferences.preferences[type] = enabled;
      }
    }
  }

  // Update global notification settings
  if (emailNotifications !== undefined) {
    preferences.emailNotifications = emailNotifications;
  }
  
  if (pushNotifications !== undefined) {
    preferences.pushNotifications = pushNotifications;
  }
  
  if (smsNotifications !== undefined) {
    preferences.smsNotifications = smsNotifications;
  }

  // Update quiet hours
  if (quietHours) {
    if (quietHours.enabled !== undefined) {
      preferences.quietHours.enabled = quietHours.enabled;
    }
    if (quietHours.startTime) {
      preferences.quietHours.startTime = quietHours.startTime;
    }
    if (quietHours.endTime) {
      preferences.quietHours.endTime = quietHours.endTime;
    }
  }

  // Update frequency
  if (frequency) {
    preferences.frequency = frequency;
  }

  await preferences.save();

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: preferences
  });
});

/**
 * Update specific notification preference
 */
const updateSpecificPreference = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { type, enabled } = req.params;
  
  const preferences = await user.getNotificationPreferences();
  
  try {
    await preferences.updatePreference(type, enabled === 'true');
    
    res.status(httpStatus.OK).json({
      success: true,
      message: `${type} notification preference updated successfully`,
      data: {
        type,
        enabled: enabled === 'true'
      }
    });
  } catch (error) {
    // Provide more specific error message for invalid notification types
    if (error.message.includes('Invalid notification type')) {
      const validTypes = [
        'class_update', 'upcoming_class', 'upcoming_event', 'upcoming_appointment',
        'app_update', 'general', 'payment', 'membership', 'assessment',
        'meditation', 'diet', 'period_tracker'
      ];
      throw new ApiError(httpStatus.BAD_REQUEST, `Invalid notification type: ${type}. Valid types are: ${validTypes.join(', ')}`);
    }
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
});

/**
 * Toggle global notification settings
 */
const toggleGlobalSetting = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { setting, enabled } = req.params;
  const preferences = await user.getNotificationPreferences();
  
  const validSettings = ['emailNotifications', 'pushNotifications', 'smsNotifications'];
  
  if (!validSettings.includes(setting)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid setting: ${setting}`);
  }
  
  preferences[setting] = enabled === 'true';
  await preferences.save();
  
  res.status(httpStatus.OK).json({
    success: true,
    message: `${setting} updated successfully`,
    data: {
      setting,
      enabled: enabled === 'true'
    }
  });
});

/**
 * Toggle quiet hours
 */
const toggleQuietHours = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { enabled } = req.params;
  const preferences = await user.getNotificationPreferences();
  
  preferences.quietHours.enabled = enabled === 'true';
  await preferences.save();
  
  res.status(httpStatus.OK).json({
    success: true,
    message: `Quiet hours ${enabled === 'true' ? 'enabled' : 'disabled'} successfully`,
    data: {
      quietHours: preferences.quietHours
    }
  });
});

/**
 * Update quiet hours time
 */
const updateQuietHoursTime = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { startTime, endTime } = req.body;
  const preferences = await user.getNotificationPreferences();
  
  // Validate time format (HH:MM) with better error messages
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (startTime && !timeRegex.test(startTime)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid start time format: "${startTime}". Use HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"`);
  }
  
  if (endTime && !timeRegex.test(endTime)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid end time format: "${endTime}". Use HH:MM format (24-hour). Examples: "22:00", "08:30", "14:15"`);
  }
  
  if (startTime) {
    preferences.quietHours.startTime = startTime;
  }
  
  if (endTime) {
    preferences.quietHours.endTime = endTime;
  }
  
  await preferences.save();
  
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Quiet hours time updated successfully',
    data: {
      quietHours: preferences.quietHours
    }
  });
});

/**
 * Reset notification preferences to default
 */
const resetToDefault = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Delete existing preferences
  if (user.notificationPreferences) {
    await NotificationPreferences.findByIdAndDelete(user.notificationPreferences);
  }
  
  // Create new default preferences
  const newPreferences = await NotificationPreferences.createDefaultPreferences(user._id);
  user.notificationPreferences = newPreferences._id;
  await user.save();
  
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notification preferences reset to default successfully',
    data: newPreferences
  });
});

export {
  getNotificationPreferences,
  updateNotificationPreferences,
  updateSpecificPreference,
  toggleGlobalSetting,
  toggleQuietHours,
  updateQuietHoursTime,
  resetToDefault
};
