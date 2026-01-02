# CRM API Integration Documentation

This document outlines all APIs that need to be integrated into the CRM (Customer Relationship Management) system for the Samsara Backend.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [User Management](#user-management)
3. [Membership & Subscriptions](#membership--subscriptions)
4. [Payment & Transactions](#payment--transactions)
5. [Content Management](#content-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [Communication](#communication)
8. [Health & Wellness Tracking](#health--wellness-tracking)
9. [Admin & Configuration](#admin--configuration)

---

## Authentication & Authorization

### Admin Authentication
- **POST** `/v1/admin/login`
  - **Purpose**: Admin login for CRM access
  - **Auth**: None (public endpoint)
  - **Body**: `{ email, password }`
  - **Response**: `{ admin, tokens }`
  - **Priority**: 🔴 Critical

### User Authentication
- **POST** `/v1/auth/register`
- **POST** `/v1/auth/login`
- **POST** `/v1/auth/refresh-tokens`
- **POST** `/v1/auth/forgot-password`
- **POST** `/v1/auth/reset-password`
- **POST** `/v1/auth/send-verification-email`
- **POST** `/v1/auth/verify-email`
- **Priority**: 🔴 Critical

---

## User Management

### User CRUD Operations
- **GET** `/v1/users`
  - **Purpose**: Get all users with pagination, filtering, sorting
  - **Auth**: Required
  - **Query Params**: `name`, `role`, `sortBy`, `limit`, `page`
  - **Priority**: 🔴 Critical

- **POST** `/v1/users`
  - **Purpose**: Create new user
  - **Auth**: Required (Admin)
  - **Body**: `{ name, email, password, role }`
  - **Priority**: 🔴 Critical

- **GET** `/v1/users/:userId`
  - **Purpose**: Get user by ID
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **PATCH** `/v1/users/:userId`
  - **Purpose**: Update user information
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **DELETE** `/v1/users/:userId`
  - **Purpose**: Delete user
  - **Auth**: Required (Admin)
  - **Priority**: 🔴 Critical

### User Profile Management
- **GET** `/v1/users/profile`
  - **Purpose**: Get current user profile
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/users/profile`
  - **Purpose**: Update current user profile
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/users/profile/image`
  - **Purpose**: Update profile image
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/users/:userId/profile`
  - **Purpose**: Get user public profile
  - **Auth**: Optional
  - **Priority**: 🟡 High

### User by Role
- **GET** `/v1/users/role/:role`
  - **Purpose**: Get users filtered by role (user, teacher, admin)
  - **Auth**: Required
  - **Priority**: 🟡 High

### User Statistics
- **POST** `/v1/users/stats`
  - **Purpose**: Get user statistics
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/users/weekly-stats`
  - **Purpose**: Get weekly user statistics
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### User Images
- **POST** `/v1/users/:userId/images`
  - **Purpose**: Upload user images
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/users/:userId/images`
  - **Purpose**: Get user images
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/users/:userId/images/:imageIndex`
  - **Purpose**: Delete user image by index
  - **Auth**: Required
  - **Priority**: 🟢 Medium

---

## Membership & Subscriptions

### Membership Plans
- **GET** `/v1/membership-plans`
  - **Purpose**: Get all membership plans with filters
  - **Auth**: Required
  - **Query Params**: `status`, `planType`, `sortBy`, `limit`, `page`
  - **Priority**: 🔴 Critical

- **GET** `/v1/membership-plans/active`
  - **Purpose**: Get active membership plans
  - **Auth**: Optional (public)
  - **Priority**: 🔴 Critical

- **GET** `/v1/membership-plans/type/:planType`
  - **Purpose**: Get plans by type (monthly, yearly, lifetime, trial)
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/membership-plans/:planId`
  - **Purpose**: Get specific membership plan details
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **GET** `/v1/membership-plans/:planId/pricing`
  - **Purpose**: Get pricing breakdown for a plan
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/membership-plans/stats`
  - **Purpose**: Get membership plan statistics
  - **Auth**: Required
  - **Priority**: 🟡 High

### Admin - Membership Plan Management
- **POST** `/v1/membership-plans`
  - **Purpose**: Create new membership plan
  - **Auth**: Required (Admin)
  - **Priority**: 🔴 Critical

- **PATCH** `/v1/membership-plans/:planId`
  - **Purpose**: Update membership plan
  - **Auth**: Required (Admin)
  - **Priority**: 🔴 Critical

- **DELETE** `/v1/membership-plans/:planId`
  - **Purpose**: Delete membership plan
  - **Auth**: Required (Admin)
  - **Priority**: 🔴 Critical

- **PATCH** `/v1/membership-plans/:planId/toggle-status`
  - **Purpose**: Activate/deactivate membership plan
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

### User Memberships
- **GET** `/v1/memberships/active`
  - **Purpose**: Get user's active membership
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **GET** `/v1/memberships/history`
  - **Purpose**: Get user's membership history
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/memberships/trial-status`
  - **Purpose**: Check if user has used trial plan
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/memberships`
  - **Purpose**: Create new membership for user
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **PATCH** `/v1/memberships/:membershipId`
  - **Purpose**: Update membership
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/memberships/:membershipId/cancel`
  - **Purpose**: Cancel membership
  - **Auth**: Required
  - **Priority**: 🟡 High

### Admin - Membership Assignment
- **POST** `/v1/memberships/assign-trial/:userId`
  - **Purpose**: Manually assign trial plan to user
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **POST** `/v1/memberships/assign-lifetime/:userId`
  - **Purpose**: Manually assign lifetime plan to teacher
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **POST** `/v1/memberships/assign-with-coupon`
  - **Purpose**: Assign membership with 100% off coupon
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

---

## Payment & Transactions

### Payment Processing
- **POST** `/v1/payments/create-order`
  - **Purpose**: Create payment order
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **POST** `/v1/payments/verify`
  - **Purpose**: Verify payment
  - **Auth**: Required
  - **Priority**: 🔴 Critical

### Transactions
- **GET** `/v1/payments/transactions`
  - **Purpose**: Get user transactions with filters
  - **Auth**: Required
  - **Query Params**: `status`, `startDate`, `endDate`, `limit`, `page`
  - **Priority**: 🔴 Critical

- **GET** `/v1/payments/transactions/:transactionId`
  - **Purpose**: Get specific transaction details
  - **Auth**: Required
  - **Priority**: 🟡 High

### Membership via Payments
- **GET** `/v1/payments/memberships`
  - **Purpose**: Get user memberships
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/payments/memberships/active`
  - **Purpose**: Get active membership
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/payments/memberships/:membershipId/cancel`
  - **Purpose**: Cancel membership
  - **Auth**: Required
  - **Priority**: 🟡 High

### Refunds
- **POST** `/v1/payments/memberships/:membershipId/refund`
  - **Purpose**: Request refund
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/payments/memberships/:membershipId/process-refund`
  - **Purpose**: Process refund (Admin only)
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

---

## Content Management

### Classes
- **GET** `/v1/classes`
  - **Purpose**: Get all classes with filters
  - **Auth**: Optional
  - **Query Params**: `category`, `teacherId`, `status`, `limit`, `page`
  - **Priority**: 🔴 Critical

- **GET** `/v1/classes/upcoming`
  - **Purpose**: Get upcoming classes
  - **Auth**: Optional
  - **Priority**: 🔴 Critical

- **GET** `/v1/classes/upcoming/category/:classCategory`
  - **Purpose**: Get upcoming classes by category
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/classes/:classId`
  - **Purpose**: Get class by ID
  - **Auth**: Optional
  - **Priority**: 🔴 Critical

- **POST** `/v1/classes`
  - **Purpose**: Create new class
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **PUT** `/v1/classes/:classId`
  - **Purpose**: Update class
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **DELETE** `/v1/classes/:classId`
  - **Purpose**: Delete class
  - **Auth**: Required
  - **Priority**: 🔴 Critical

### Class Management
- **PUT** `/v1/classes/:classId/assign-teacher/:teacherId`
  - **Purpose**: Assign teacher to class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/classes/:classId/add-student/:studentId`
  - **Purpose**: Add student to class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/classes/:classId/remove-student/:studentId`
  - **Purpose**: Remove student from class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/classes/student/:studentId/classes`
  - **Purpose**: Get student's classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/classes/student/:studentId/classes/upcoming`
  - **Purpose**: Get student's upcoming classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/classes/teacher/:teacherId`
  - **Purpose**: Get classes by teacher
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/classes/teachers`
  - **Purpose**: Get all teachers
  - **Auth**: Optional
  - **Priority**: 🟡 High

### Class Meetings
- **POST** `/v1/classes/start-meeting/:classId`
  - **Purpose**: Start Zoom meeting for class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/classes/end_meeting/:classId`
  - **Purpose**: End class meeting
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/classes/end_all_meetings`
  - **Purpose**: End all active meetings
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Events
- **GET** `/v1/events`
  - **Purpose**: Get all events
  - **Auth**: Optional
  - **Priority**: 🔴 Critical

- **GET** `/v1/events/upcoming`
  - **Purpose**: Get upcoming events
  - **Auth**: Optional
  - **Priority**: 🔴 Critical

- **GET** `/v1/events/:id`
  - **Purpose**: Get event by ID
  - **Auth**: Optional
  - **Priority**: 🔴 Critical

- **POST** `/v1/events`
  - **Purpose**: Create new event
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **PUT** `/v1/events/:id`
  - **Purpose**: Update event
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **DELETE** `/v1/events/:id`
  - **Purpose**: Delete event
  - **Auth**: Required
  - **Priority**: 🔴 Critical

### Event Management
- **POST** `/v1/events/register`
  - **Purpose**: Register user to event
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/events/enrollment/:eventId/:userId`
  - **Purpose**: Check if user is enrolled in event
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/events/students/:eventId`
  - **Purpose**: Get all students for an event
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/events/user-events/:userId`
  - **Purpose**: Get all events user is registered in
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/events/user-events/:userId/upcoming`
  - **Purpose**: Get user's upcoming events
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **GET** `/v1/events/teacher/:teacherId`
  - **Purpose**: Get events by teacher
  - **Auth**: Optional
  - **Priority**: 🟡 High

### Event Meetings
- **POST** `/v1/events/start_meeting/:eventId`
  - **Purpose**: Start event meeting
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/events/end_meeting/:classId`
  - **Purpose**: End event meeting
  - **Auth**: Required
  - **Priority**: 🟡 High

### Custom Sessions
- **GET** `/v1/custom-sessions`
  - **Purpose**: Get all custom sessions
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/custom-sessions`
  - **Purpose**: Create custom session
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/custom-sessions/:sessionId`
  - **Purpose**: Get custom session by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/custom-sessions/:sessionId`
  - **Purpose**: Update custom session
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/custom-sessions/:sessionId`
  - **Purpose**: Delete custom session
  - **Auth**: Required
  - **Priority**: 🟡 High

### Recorded Classes
- **GET** `/v1/recorded-classes`
  - **Purpose**: Get all recorded classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/recorded-classes`
  - **Purpose**: Create recorded class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/recorded-classes/:recordedClassId`
  - **Purpose**: Get recorded class by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/recorded-classes/:recordedClassId`
  - **Purpose**: Update recorded class
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/recorded-classes/:recordedClassId`
  - **Purpose**: Delete recorded class
  - **Auth**: Required
  - **Priority**: 🟡 High

### Teacher Availability
- **GET** `/v1/teacher-availability`
  - **Purpose**: Get teacher availability
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/teacher-availability`
  - **Purpose**: Create teacher availability
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/teacher-availability/:availabilityId`
  - **Purpose**: Get availability by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/teacher-availability/:availabilityId`
  - **Purpose**: Update teacher availability
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/teacher-availability/:availabilityId`
  - **Purpose**: Delete teacher availability
  - **Auth**: Required
  - **Priority**: 🟡 High

---

## Analytics & Reporting

### User Analytics
- **GET** `/v1/user-analytics/:userId/upcoming/classes`
  - **Purpose**: Get user's upcoming classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/today/classes`
  - **Purpose**: Get user's today's classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/tomorrow/classes`
  - **Purpose**: Get user's tomorrow's classes
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/user-analytics/:userId/past/classes`
  - **Purpose**: Get user's past classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/upcoming/events`
  - **Purpose**: Get user's upcoming events
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/upcoming/sessions`
  - **Purpose**: Get user's upcoming custom sessions
  - **Auth**: Required
  - **Priority**: 🟡 High

### Booked Activities by Date Range
- **GET** `/v1/user-analytics/:userId/booked/classes`
  - **Purpose**: Get booked classes by date range
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/booked/events`
  - **Purpose**: Get booked events by date range
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/booked/sessions`
  - **Purpose**: Get booked sessions by date range
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`
  - **Priority**: 🟡 High

### Attended Activities
- **GET** `/v1/user-analytics/:userId/attended/classes`
  - **Purpose**: Get attended classes
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/attended/classes/range`
  - **Purpose**: Get attended classes by date range
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`
  - **Priority**: 🟡 High

### Comprehensive Statistics
- **GET** `/v1/user-analytics/:userId/statistics`
  - **Purpose**: Get comprehensive user statistics
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **GET** `/v1/user-analytics/:userId/dashboard`
  - **Purpose**: Get user dashboard data
  - **Auth**: Required
  - **Priority**: 🔴 Critical

- **GET** `/v1/user-analytics/:userId/activities/period`
  - **Purpose**: Get user activities by period
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`, `period`
  - **Priority**: 🟡 High

### Summary Endpoints
- **GET** `/v1/user-analytics/:userId/summary/booking`
  - **Purpose**: Get booking summary
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/summary/attendance`
  - **Purpose**: Get attendance summary
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/user-analytics/:userId/summary/favorites`
  - **Purpose**: Get favorites summary
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/user-analytics/:userId/favorites`
  - **Purpose**: Get user favorites
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/user-analytics/:userId/recent-activity`
  - **Purpose**: Get recent activity
  - **Auth**: Required
  - **Priority**: 🟡 High

---

## Communication

### Notifications
- **GET** `/v1/notifications/my-notifications`
  - **Purpose**: Get user's notifications
  - **Auth**: Required
  - **Query Params**: `read`, `type`, `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/notifications/unread-count`
  - **Purpose**: Get unread notification count
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/notifications/:notificationId/read`
  - **Purpose**: Mark notification as read
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/notifications/mark-all-read`
  - **Purpose**: Mark all notifications as read
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Admin - Notification Management
- **POST** `/v1/notifications`
  - **Purpose**: Create notification
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **POST** `/v1/notifications/bulk`
  - **Purpose**: Create bulk notifications
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **GET** `/v1/notifications`
  - **Purpose**: Get all notifications
  - **Auth**: Required (Admin)
  - **Query Params**: `userId`, `type`, `status`, `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/notifications/:notificationId`
  - **Purpose**: Get notification by ID
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **PATCH** `/v1/notifications/:notificationId`
  - **Purpose**: Update notification
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/notifications/:notificationId`
  - **Purpose**: Delete notification
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **POST** `/v1/notifications/:notificationId/send`
  - **Purpose**: Send notification immediately
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **PATCH** `/v1/notifications/:notificationId/schedule`
  - **Purpose**: Schedule notification
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **GET** `/v1/notifications/stats/overview`
  - **Purpose**: Get notification statistics
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

### Notification Preferences
- **GET** `/v1/notification-preferences`
  - **Purpose**: Get user notification preferences
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/notification-preferences`
  - **Purpose**: Update notification preferences
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PATCH** `/v1/notification-preferences/preference/:type/:enabled`
  - **Purpose**: Toggle specific preference
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PATCH** `/v1/notification-preferences/global/:setting/:enabled`
  - **Purpose**: Toggle global setting
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PATCH** `/v1/notification-preferences/quiet-hours/time`
  - **Purpose**: Update quiet hours time
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PATCH** `/v1/notification-preferences/quiet-hours/:enabled`
  - **Purpose**: Toggle quiet hours
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **POST** `/v1/notification-preferences/reset`
  - **Purpose**: Reset to default preferences
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### WhatsApp Integration
- **GET** `/v1/whatsapp/webhook`
  - **Purpose**: Verify WhatsApp webhook
  - **Auth**: None (webhook verification)
  - **Priority**: 🟡 High

- **POST** `/v1/whatsapp/webhook`
  - **Purpose**: Handle incoming WhatsApp messages
  - **Auth**: None (webhook)
  - **Priority**: 🟡 High

- **POST** `/v1/whatsapp/send`
  - **Purpose**: Send WhatsApp message
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/whatsapp/conversation/:conversationId`
  - **Purpose**: Get conversation history
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/whatsapp/conversations`
  - **Purpose**: Get all conversations
  - **Auth**: Required
  - **Query Params**: `userId`, `limit`, `page`
  - **Priority**: 🟢 Medium

---

## Health & Wellness Tracking

### Period Tracker
- **GET** `/v1/period-tracker/calendar`
  - **Purpose**: Get period calendar
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/current`
  - **Purpose**: Get current period cycle
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/current-enhanced`
  - **Purpose**: Get enhanced current cycle data
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **POST** `/v1/period-tracker/period/start`
  - **Purpose**: Start period
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/period-tracker/period/stop`
  - **Purpose**: Stop period
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/period-tracker/logs/:date`
  - **Purpose**: Create/update daily log
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/period-tracker/logs/:date`
  - **Purpose**: Delete daily log
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/period-tracker/history`
  - **Purpose**: Get period history
  - **Auth**: Required
  - **Query Params**: `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/day/:date`
  - **Purpose**: Get day-specific data
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/settings`
  - **Purpose**: Get period tracker settings
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/period-tracker/settings`
  - **Purpose**: Update period tracker settings
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/period-tracker/birth-control`
  - **Purpose**: Get birth control information
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/period-tracker/birth-control`
  - **Purpose**: Update birth control information
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **POST** `/v1/period-tracker/birth-control/pill/take`
  - **Purpose**: Log pill taken
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **POST** `/v1/period-tracker/bulk-import`
  - **Purpose**: Bulk import historical cycles
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/period-tracker/analytics`
  - **Purpose**: Get period analytics
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/insights`
  - **Purpose**: Get period insights
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-tracker/stats`
  - **Purpose**: Get period statistics
  - **Auth**: Required
  - **Priority**: 🟡 High

### Period Cycles
- **POST** `/v1/period-cycles/start`
  - **Purpose**: Start new cycle
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-cycles/current`
  - **Purpose**: Get current cycle
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-cycles/history`
  - **Purpose**: Get cycle history
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-cycles/predictions`
  - **Purpose**: Get cycle predictions
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-cycles/analytics`
  - **Purpose**: Get cycle analytics
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/period-cycles/:cycleId`
  - **Purpose**: Get cycle by ID
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **POST** `/v1/period-cycles/:cycleId/daily-log`
  - **Purpose**: Update daily log
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/period-cycles/:cycleId/complete`
  - **Purpose**: Complete cycle
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/period-cycles/:cycleId/notes`
  - **Purpose**: Update cycle notes
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/period-cycles/:cycleId`
  - **Purpose**: Delete cycle
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Mood Tracker
- **GET** `/v1/moods`
  - **Purpose**: Get mood entries
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`, `limit`, `page`
  - **Priority**: 🟡 High

- **POST** `/v1/moods`
  - **Purpose**: Create mood entry
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/moods/:moodId`
  - **Purpose**: Get mood entry by ID
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **PUT** `/v1/moods/:moodId`
  - **Purpose**: Update mood entry
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/moods/:moodId`
  - **Purpose**: Delete mood entry
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Body Status Tracker
- **GET** `/v1/trackers/dashboard`
  - **Purpose**: Get tracker dashboard data
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/trackers/status`
  - **Purpose**: Get tracker status
  - **Auth**: Required
  - **Priority**: 🟡 High

### Weight Tracker
- **GET** `/v1/trackers/weight/history`
  - **Purpose**: Get weight history
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`, `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/trackers/weight/:entryId`
  - **Purpose**: Get weight entry by ID
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Water Tracker
- **GET** `/v1/trackers/water/history`
  - **Purpose**: Get water intake history
  - **Auth**: Required
  - **Query Params**: `startDate`, `endDate`, `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/trackers/water/today`
  - **Purpose**: Get today's water data
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/trackers/water/hydration-status`
  - **Purpose**: Get hydration status
  - **Auth**: Required
  - **Priority**: 🟡 High

### Blood Reports
- **POST** `/v1/blood-reports`
  - **Purpose**: Create blood report
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/blood-reports`
  - **Purpose**: Get all blood reports
  - **Auth**: Required
  - **Query Params**: `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/blood-reports/:reportId`
  - **Purpose**: Get blood report by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PATCH** `/v1/blood-reports/:reportId`
  - **Purpose**: Update blood report
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/blood-reports/:reportId`
  - **Purpose**: Delete blood report
  - **Auth**: Required
  - **Priority**: 🟡 High

### Assessments
- **GET** `/v1/assessments`
  - **Purpose**: Get all assessments
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/assessments`
  - **Purpose**: Create assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/assessments/:assessmentId`
  - **Purpose**: Get assessment by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **PUT** `/v1/assessments/:assessmentId`
  - **Purpose**: Update assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/assessments/:assessmentId`
  - **Purpose**: Delete assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

### Dosha Assessment
- **POST** `/v1/dosha/start`
  - **Purpose**: Start dosha assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/dosha/current`
  - **Purpose**: Get current dosha assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/dosha/submit-answer`
  - **Purpose**: Submit assessment answer
  - **Auth**: Required
  - **Priority**: 🟡 High

- **POST** `/v1/dosha/complete`
  - **Purpose**: Complete dosha assessment
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/dosha`
  - **Purpose**: Get assessment results
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/dosha/latest`
  - **Purpose**: Get latest assessment results
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/dosha/:assessmentId`
  - **Purpose**: Get assessment by ID
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Other Assessments
- **POST** `/v1/menopause-assessment/start`
- **GET** `/v1/menopause-assessment/current`
- **POST** `/v1/menopause-assessment/submit-answer`
- **POST** `/v1/menopause-assessment/complete`
- **GET** `/v1/menopause-assessment`
- **GET** `/v1/menopause-assessment/latest`
- **GET** `/v1/menopause-assessment/:assessmentId`

- **POST** `/v1/pcos-assessment/start`
- **GET** `/v1/pcos-assessment/current`
- **POST** `/v1/pcos-assessment/submit-answer`
- **POST** `/v1/pcos-assessment/complete`
- **GET** `/v1/pcos-assessment`
- **GET** `/v1/pcos-assessment/latest`
- **GET** `/v1/pcos-assessment/:assessmentId`

- **POST** `/v1/thyroid-assessment/start`
- **GET** `/v1/thyroid-assessment/current`
- **POST** `/v1/thyroid-assessment/submit-answer`
- **POST** `/v1/thyroid-assessment/complete`
- **GET** `/v1/thyroid-assessment`
- **GET** `/v1/thyroid-assessment/latest`
- **GET** `/v1/thyroid-assessment/:assessmentId`

### Diet Generation
- **POST** `/v1/diet-generation/generate`
  - **Purpose**: Generate diet plan
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/diet-generation/plans`
  - **Purpose**: Get diet plans
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/diet-generation/plans/:planId`
  - **Purpose**: Get diet plan by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/diet-generation/history`
  - **Purpose**: Get diet generation history
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **GET** `/v1/diet-generation/current`
  - **Purpose**: Get current diet plan
  - **Auth**: Required
  - **Priority**: 🟡 High

---

## Admin & Configuration

### Coupon Management
- **GET** `/v1/coupons`
  - **Purpose**: Get all coupon codes
  - **Auth**: Required
  - **Query Params**: `status`, `planId`, `limit`, `page`
  - **Priority**: 🟡 High

- **GET** `/v1/coupons/active`
  - **Purpose**: Get active coupon codes
  - **Auth**: Optional (public)
  - **Priority**: 🟡 High

- **GET** `/v1/coupons/stats`
  - **Purpose**: Get coupon statistics
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/coupons/code/:code`
  - **Purpose**: Get coupon by code
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/coupons/:couponId`
  - **Purpose**: Get coupon by ID
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/coupons/plan/:planId`
  - **Purpose**: Get coupons for specific plan
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **POST** `/v1/coupons/validate`
  - **Purpose**: Validate coupon code
  - **Auth**: Optional
  - **Priority**: 🟡 High

### Admin - Coupon Management
- **POST** `/v1/coupons`
  - **Purpose**: Create coupon code
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **PATCH** `/v1/coupons/:couponId`
  - **Purpose**: Update coupon code
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **DELETE** `/v1/coupons/:couponId`
  - **Purpose**: Delete coupon code
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **PATCH** `/v1/coupons/:couponId/toggle-status`
  - **Purpose**: Toggle coupon status
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

### Company Management
- **GET** `/v1/company/companies`
  - **Purpose**: Get all companies
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **POST** `/v1/company/companies`
  - **Purpose**: Create company
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/company/companies/:id`
  - **Purpose**: Get company by ID
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **PUT** `/v1/company/companies/:id`
  - **Purpose**: Update company
  - **Auth**: Required
  - **Priority**: 🟡 High

- **DELETE** `/v1/company/companies/:id`
  - **Purpose**: Delete company
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/company/check-company/:companyId`
  - **Purpose**: Check if company exists
  - **Auth**: Optional
  - **Priority**: 🟢 Medium

### Global Configuration
- **GET** `/v1/globalconfig`
  - **Purpose**: Get global configuration
  - **Auth**: Optional
  - **Priority**: 🟡 High

- **POST** `/v1/globalconfig`
  - **Purpose**: Create/update global configuration
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **GET** `/v1/globalconfig/:key`
  - **Purpose**: Get specific config by key
  - **Auth**: Optional
  - **Priority**: 🟢 Medium

- **PUT** `/v1/globalconfig/:key`
  - **Purpose**: Update specific config
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

### Zoom Management
- **GET** `/v1/zoom-management/account-stats`
  - **Purpose**: Get Zoom account statistics
  - **Auth**: Required (Admin)
  - **Priority**: 🟡 High

- **POST** `/v1/zoom-management/reset-account/:accountId`
  - **Purpose**: Reset Zoom account
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **POST** `/v1/zoom-management/reset-all-accounts`
  - **Purpose**: Reset all Zoom accounts
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **GET** `/v1/zoom-management/health`
  - **Purpose**: Zoom health check
  - **Auth**: Required (Admin)
  - **Priority**: 🟢 Medium

- **GET** `/v1/classes/zoom_accounts`
  - **Purpose**: Get Zoom account usage stats
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Ratings & Reviews
- **GET** `/v1/ratings`
  - **Purpose**: Get all ratings
  - **Auth**: Optional
  - **Query Params**: `classId`, `eventId`, `userId`, `limit`, `page`
  - **Priority**: 🟡 High

- **POST** `/v1/ratings`
  - **Purpose**: Create rating
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/ratings/:ratingId`
  - **Purpose**: Get rating by ID
  - **Auth**: Optional
  - **Priority**: 🟢 Medium

- **PUT** `/v1/ratings/:ratingId`
  - **Purpose**: Update rating
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/ratings/:ratingId`
  - **Purpose**: Delete rating
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### Teacher Ratings
- **GET** `/v1/teacher-ratings`
  - **Purpose**: Get teacher ratings
  - **Auth**: Optional
  - **Query Params**: `teacherId`, `limit`, `page`
  - **Priority**: 🟡 High

- **POST** `/v1/teacher-ratings`
  - **Purpose**: Create teacher rating
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/teacher-ratings/:ratingId`
  - **Purpose**: Get teacher rating by ID
  - **Auth**: Optional
  - **Priority**: 🟢 Medium

- **PUT** `/v1/teacher-ratings/:ratingId`
  - **Purpose**: Update teacher rating
  - **Auth**: Required
  - **Priority**: 🟢 Medium

- **DELETE** `/v1/teacher-ratings/:ratingId`
  - **Purpose**: Delete teacher rating
  - **Auth**: Required
  - **Priority**: 🟢 Medium

### In-App Purchases (iAP)
- **POST** `/v1/iap/verify`
  - **Purpose**: Verify in-app purchase
  - **Auth**: Required
  - **Priority**: 🟡 High

- **GET** `/v1/iap/transactions`
  - **Purpose**: Get iAP transactions
  - **Auth**: Required
  - **Priority**: 🟡 High

### File Upload
- **POST** `/v1/upload`
  - **Purpose**: Upload file
  - **Auth**: Required
  - **Body**: Form data with `file` field
  - **Priority**: 🟡 High

### Data Notifications
- **POST** `/v1/data-notifications/period-start`
- **POST** `/v1/data-notifications/period-end`
- **POST** `/v1/data-notifications/ovulation`
- **POST** `/v1/data-notifications/fertile-window`
- **POST** `/v1/data-notifications/period-reminder`
- **POST** `/v1/data-notifications/class-reminder`
- **POST** `/v1/data-notifications/event-reminder`
- **POST** `/v1/data-notifications/session-reminder`
- **POST** `/v1/data-notifications/medication-reminder`
- **POST** `/v1/data-notifications/water-reminder`
- **POST** `/v1/data-notifications/assessment-reminder`
- **PATCH** `/v1/data-notifications/:notificationId`

---

## Priority Legend

- 🔴 **Critical**: Essential for CRM core functionality
- 🟡 **High**: Important for comprehensive CRM features
- 🟢 **Medium**: Nice to have for enhanced CRM capabilities

---

## Integration Notes

### Authentication
- All endpoints (except public ones) require JWT token in `Authorization: Bearer <token>` header
- Admin endpoints require `role: 'admin'` in token
- Token can be obtained via `/v1/admin/login` or `/v1/auth/login`

### Base URL
- Development: `http://localhost:<port>/v1`
- Production: `https://api.yourdomain.com/v1`

### Response Format
- Success: `{ success: true, data: {...}, message: "..." }`
- Error: `{ success: false, error: "...", statusCode: 400 }`

### Pagination
- Most list endpoints support pagination with `limit` and `page` query params
- Response includes: `results`, `page`, `limit`, `totalPages`, `totalResults`

### Filtering & Sorting
- Many endpoints support filtering via query params
- Sorting via `sortBy` param: `field:asc` or `field:desc`

### Rate Limiting
- Auth endpoints have rate limiting in production
- Other endpoints may have rate limiting based on configuration

---

## CRM Dashboard Requirements

Based on the APIs above, the CRM should include:

1. **User Management Dashboard**
   - User list with filters (role, status, date range)
   - User profile view/edit
   - User statistics and analytics
   - User activity timeline

2. **Membership & Revenue Dashboard**
   - Active memberships overview
   - Revenue analytics
   - Payment transactions
   - Refund management
   - Membership plan management
   - Coupon code management

3. **Content Management Dashboard**
   - Classes management
   - Events management
   - Custom sessions management
   - Recorded classes management
   - Teacher availability management

4. **Analytics Dashboard**
   - User engagement metrics
   - Class/Event attendance rates
   - Revenue trends
   - User growth metrics
   - Health tracking insights

5. **Communication Dashboard**
   - Notification management
   - WhatsApp conversation management
   - Bulk messaging tools

6. **Health & Wellness Dashboard**
   - Period tracker analytics
   - Assessment results overview
   - Mood tracking trends
   - Blood report management

7. **Admin Tools**
   - System configuration
   - Zoom account management
   - Company management
   - Global settings

---

## Next Steps

1. **Phase 1 (Critical APIs)**: Implement authentication, user management, membership, and payment APIs
2. **Phase 2 (High Priority)**: Add content management, analytics, and communication APIs
3. **Phase 3 (Medium Priority)**: Integrate health tracking and additional features

---

**Last Updated**: 2024
**Version**: 1.0













