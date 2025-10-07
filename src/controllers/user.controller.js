import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as userService from '../services/user.service.js';
import { User, Class } from '../models/index.js';
import {
  sendWelcomeNotification,
  sendProfileCompletionReminder,
  sendMembershipExpiryWarning,
  sendMembershipExpiredNotification,
  sendMembershipRenewedNotification,
  sendClassRegistrationConfirmation,
  sendClassReminder,
  sendMissedClassNotification,
  sendClassCancellationNotification,
  sendEventRegistrationConfirmation,
  sendEventReminder,
  sendPaymentSuccessNotification,
  sendPaymentFailureNotification,
  sendAssessmentCompletionNotification,
  sendAssessmentReminder,
  sendPeriodTrackerReminder,
  sendMoodTrackingReminder,
  sendAchievementUnlockedNotification,
  sendStreakMilestoneNotification,
  sendAppUpdateNotification,
  sendMaintenanceNotification,
  sendFeatureAnnouncement,
  scheduleClassReminder,
  scheduleEventReminder,
  scheduleMembershipExpiryWarning
} from '../utils/userNotificationHelpers.js';

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  
  // Send welcome notification to new user
  try {
    await sendWelcomeNotification(user._id, {
      name: user.name,
      email: user.email
    });
  } catch (notificationError) {
    console.error('Failed to send welcome notification:', notificationError);
    // Don't fail user creation if notification fails
  }
  
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Update current user's profile
const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.send(user);
});

// Get current user's profile
const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  res.send(user);
});

const updateProfileImage = catchAsync(async (req, res) => {
  const { profileImage } = req.body;
  const userId = req.user.id;

  if (!profileImage) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Profile image URL is required');
  }

  // Validate URL format
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  if (!urlPattern.test(profileImage)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid image URL format');
  }

  const user = await userService.updateUserById(userId, { profileImage });

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Profile image updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    },
  });
});

const markAttendance = catchAsync(async (req, res) => {
  const { userId, classId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { $push: { attendance: { classId, joinedAt: new Date() } } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: { user },
  });
});

const addAchievement = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { achievement } = req.body;

  const user = await User.findByIdAndUpdate(userId, { $push: { achievements: achievement } }, { new: true });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Send achievement unlocked notification
  try {
    await sendAchievementUnlockedNotification(userId, {
      id: achievement.id || new Date().getTime(),
      title: achievement.title,
      description: achievement.description,
      category: achievement.category
    });
  } catch (notificationError) {
    console.error('Failed to send achievement notification:', notificationError);
    // Don't fail achievement addition if notification fails
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: { user },
  });
});

const addAssessment = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { assessmentId } = req.body;

  const user = await User.findByIdAndUpdate(userId, { $push: { assessments: assessmentId } }, { new: true });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: { user },
  });
});

const submitAssessmentForm = catchAsync(async (req, res) => {
  const { userId, classId, formData } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        classFeedback: {
          classId,
          formData,
        },
      },
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: { user },
  });
});

const updateNotificationToken = catchAsync(async (req, res) => {
  const { notificationToken } = req.body;
  const userId = req.user.id; // Get user ID from JWT token

  // Update the notification token using userService
  const user = await userService.updateUserById(userId, { notificationToken });

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Notification token updated successfully',
    data: {
      userId: user._id,
      notificationToken: user.notificationToken,
    },
  });
});

const joinClass = catchAsync(async (req, res) => {
  const { userId, classId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const yogaClass = await Class.findById(classId);
  if (!yogaClass) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  // Check if user already joined the class
  const existingAttendance = user.attendance.find((att) => att.classId.toString() === classId);

  if (existingAttendance) {
    return res.status(httpStatus.OK).json({
      message: 'Attendance already taken for this class',
      joinedAt: existingAttendance.joinedAt,
    });
  }

  // Add new attendance entry
  const joinedAt = new Date();
  user.attendance.push({ classId, joinedAt });

  await user.save();

  // Send class registration confirmation notification
  try {
    await sendClassRegistrationConfirmation(userId, {
      id: yogaClass._id,
      title: yogaClass.title,
      instructor: yogaClass.instructor,
      schedule: yogaClass.schedule,
      duration: yogaClass.duration,
      classType: yogaClass.classType
    });

    // Schedule class reminder (1 hour before)
    await scheduleClassReminder(userId, {
      id: yogaClass._id,
      title: yogaClass.title,
      instructor: yogaClass.instructor,
      schedule: yogaClass.schedule
    });
  } catch (notificationError) {
    console.error('Failed to send class notifications:', notificationError);
    // Don't fail class joining if notification fails
  }

  res.status(httpStatus.OK).json({ message: 'User joined the class', joinedAt });
});

const leaveClass = catchAsync(async (req, res) => {
  const { userId, classId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const attendedClass = user.attendance.find((att) => att.classId.toString() === classId);
  if (!attendedClass) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User did not join this class');
  }

  const leftAt = new Date();

  // If user rejoins and leaves multiple times, update leave time instead of adding new entries
  const durationMinutes = Math.round((leftAt - attendedClass.joinedAt) / 60000); // Convert ms to minutes
  const kcalBurned = durationMinutes * 5; // Assuming avg 5 kcal per min

  attendedClass.leftAt = leftAt;
  attendedClass.durationMinutes = durationMinutes;
  attendedClass.kcalBurned = kcalBurned;

  await user.save();
  res.status(httpStatus.OK).json({
    message: 'User left the class',
    durationMinutes,
    kcalBurned,
  });
});

const getUserStats = catchAsync(async (req, res) => {
  const { userId, days } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const filteredAttendance = user.attendance.filter((att) => new Date(att.joinedAt) >= startDate);

  const totalClasses = filteredAttendance.length;
  const totalMinutes = filteredAttendance.reduce((sum, att) => sum + (att.durationMinutes || 0), 0);
  const totalKcalBurned = filteredAttendance.reduce((sum, att) => sum + (att.kcalBurned || 0), 0);

  res.status(httpStatus.OK).json({ totalClasses, totalMinutes, totalKcalBurned });
});

const getWeeklyStats = catchAsync(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 6); // Get last 7 days

  const weeklyData = {};
  const daysMap = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']; // Updated correct mapping

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const label = daysMap[date.getDay()];

    // Default values set to 5 instead of 0
    weeklyData[label] = { label, totalMinutes: 5, totalKcalBurned: 5 };
  }

  user.attendance.forEach((att) => {
    const attDate = new Date(att.joinedAt);
    if (attDate >= startDate && attDate <= today) {
      const label = daysMap[attDate.getDay()];
      if (weeklyData[label]) {
        weeklyData[label].totalMinutes =
          (att.durationMinutes || 0) + (weeklyData[label].totalMinutes !== 5 ? weeklyData[label].totalMinutes : 0);
        weeklyData[label].totalKcalBurned =
          (att.kcalBurned || 0) + (weeklyData[label].totalKcalBurned !== 5 ? weeklyData[label].totalKcalBurned : 0);
      }
    }
  });

  const result = Object.values(weeklyData);
  res.status(httpStatus.OK).json(result);
});

const getUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  const user = await User.findById(userId).populate('company_name').select('-password');

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: { user },
  });
});

const uploadUserImage = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { filename, path, key } = req.body;

  if (!filename || !path || !key) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image filename, path, and key are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Add new image to user's images array
  user.images.push({ filename, path, key });
  await user.save();

  res.status(httpStatus.CREATED).json({
    status: 'success',
    message: 'Image uploaded successfully',
    data: {
      image: { filename, path, key },
      totalImages: user.images.length,
    },
  });
});

const getUserImages = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('images');
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: 'success',
    data: {
      images: user.images,
      totalImages: user.images.length,
    },
  });
});

const deleteUserImage = catchAsync(async (req, res) => {
  const { userId, imageIndex } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const index = parseInt(imageIndex);
  if (isNaN(index) || index < 0 || index >= user.images.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid image index');
  }

  // Remove the image at the specified index
  const deletedImage = user.images.splice(index, 1)[0];
  await user.save();

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Image deleted successfully',
    data: {
      deletedImage,
      totalImages: user.images.length,
    },
  });
});

const deleteUserImageByKey = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { key } = req.body;

  if (!key) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image key is required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find and remove image by key
  const imageIndex = user.images.findIndex((img) => img.key === key);
  if (imageIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
  }

  const deletedImage = user.images.splice(imageIndex, 1)[0];
  await user.save();

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Image deleted successfully',
    data: {
      deletedImage,
      totalImages: user.images.length,
    },
  });
});

const deleteUserImageByFilename = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { filename } = req.body;

  if (!filename) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image filename is required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find and remove image by filename
  const imageIndex = user.images.findIndex((img) => img.filename === filename);
  if (imageIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
  }

  const deletedImage = user.images.splice(imageIndex, 1)[0];
  await user.save();

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Image deleted successfully',
    data: {
      deletedImage,
      totalImages: user.images.length,
    },
  });
});

const getUsersByRole = catchAsync(async (req, res) => {
  const { role } = req.params;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (!role || !['user', 'teacher'].includes(role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid role (user or teacher) is required');
  }

  const result = await userService.getUsersByRole(role, options);
  res.status(httpStatus.OK).json({
    status: 'success',
    data: result,
  });
});

// NEW NOTIFICATION FUNCTIONS

/**
 * Send membership expiry warning to user
 */
const sendMembershipExpiryWarningToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { membershipData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendMembershipExpiryWarning(userId, membershipData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Membership expiry warning sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send membership expiry warning');
  }
});

/**
 * Send membership expired notification to user
 */
const sendMembershipExpiredToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { membershipData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendMembershipExpiredNotification(userId, membershipData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Membership expired notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send membership expired notification');
  }
});

/**
 * Send missed class notification to user
 */
const sendMissedClassToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { classData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendMissedClassNotification(userId, classData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Missed class notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send missed class notification');
  }
});

/**
 * Send class cancellation notification to user
 */
const sendClassCancellationToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { classData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendClassCancellationNotification(userId, classData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Class cancellation notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send class cancellation notification');
  }
});

/**
 * Send event registration confirmation to user
 */
const sendEventRegistrationToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { eventData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendEventRegistrationConfirmation(userId, eventData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Event registration confirmation sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send event registration confirmation');
  }
});

/**
 * Send payment success notification to user
 */
const sendPaymentSuccessToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { paymentData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendPaymentSuccessNotification(userId, paymentData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Payment success notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send payment success notification');
  }
});

/**
 * Send payment failure notification to user
 */
const sendPaymentFailureToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { paymentData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendPaymentFailureNotification(userId, paymentData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Payment failure notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send payment failure notification');
  }
});

/**
 * Send assessment completion notification to user
 */
const sendAssessmentCompletionToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { assessmentData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendAssessmentCompletionNotification(userId, assessmentData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Assessment completion notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send assessment completion notification');
  }
});

/**
 * Send streak milestone notification to user
 */
const sendStreakMilestoneToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { streakData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendStreakMilestoneNotification(userId, streakData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Streak milestone notification sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send streak milestone notification');
  }
});

/**
 * Send mood tracking reminder to user
 */
const sendMoodTrackingReminderToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendMoodTrackingReminder(userId);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Mood tracking reminder sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send mood tracking reminder');
  }
});

/**
 * Send period tracker reminder to user
 */
const sendPeriodTrackerReminderToUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { trackerData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await sendPeriodTrackerReminder(userId, trackerData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Period tracker reminder sent successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send period tracker reminder');
  }
});

/**
 * Send app update notification to all users
 */
const sendAppUpdateToAllUsers = catchAsync(async (req, res) => {
  const { updateData } = req.body;

  try {
    await sendAppUpdateNotification(updateData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'App update notification sent to all users successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send app update notification');
  }
});

/**
 * Send maintenance notification to all users
 */
const sendMaintenanceToAllUsers = catchAsync(async (req, res) => {
  const { maintenanceData } = req.body;

  try {
    await sendMaintenanceNotification(maintenanceData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Maintenance notification sent to all users successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send maintenance notification');
  }
});

/**
 * Send feature announcement to all users
 */
const sendFeatureAnnouncementToAllUsers = catchAsync(async (req, res) => {
  const { featureData } = req.body;

  try {
    await sendFeatureAnnouncement(featureData);
    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Feature announcement sent to all users successfully'
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send feature announcement');
  }
});

export {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
  getProfile,
  updateProfileImage,
  markAttendance,
  addAchievement,
  addAssessment,
  submitAssessmentForm,
  updateNotificationToken,
  joinClass,
  leaveClass,
  getUserStats,
  getWeeklyStats,
  getUserProfile,
  uploadUserImage,
  getUserImages,
  deleteUserImage,
  deleteUserImageByKey,
  deleteUserImageByFilename,
  getUsersByRole,
  // New notification functions
  sendMembershipExpiryWarningToUser,
  sendMembershipExpiredToUser,
  sendMissedClassToUser,
  sendClassCancellationToUser,
  sendEventRegistrationToUser,
  sendPaymentSuccessToUser,
  sendPaymentFailureToUser,
  sendAssessmentCompletionToUser,
  sendStreakMilestoneToUser,
  sendMoodTrackingReminderToUser,
  sendPeriodTrackerReminderToUser,
  sendAppUpdateToAllUsers,
  sendMaintenanceToAllUsers,
  sendFeatureAnnouncementToAllUsers,
};
