# CRM API Quick Reference

Quick reference list of all APIs for CRM integration.

## Authentication (2 APIs)
- `POST /v1/admin/login` - Admin login
- `POST /v1/auth/login` - User login

## User Management (15 APIs)
- `GET /v1/users` - List users
- `POST /v1/users` - Create user
- `GET /v1/users/:userId` - Get user
- `PATCH /v1/users/:userId` - Update user
- `DELETE /v1/users/:userId` - Delete user
- `GET /v1/users/profile` - Get profile
- `PATCH /v1/users/profile` - Update profile
- `PATCH /v1/users/profile/image` - Update profile image
- `GET /v1/users/:userId/profile` - Get user profile
- `GET /v1/users/role/:role` - Get users by role
- `POST /v1/users/stats` - Get user stats
- `POST /v1/users/weekly-stats` - Get weekly stats
- `POST /v1/users/:userId/images` - Upload images
- `GET /v1/users/:userId/images` - Get images
- `DELETE /v1/users/:userId/images/:imageIndex` - Delete image

## Membership Plans (10 APIs)
- `GET /v1/membership-plans` - List plans
- `GET /v1/membership-plans/active` - Get active plans
- `GET /v1/membership-plans/type/:planType` - Get by type
- `GET /v1/membership-plans/:planId` - Get plan
- `GET /v1/membership-plans/:planId/pricing` - Get pricing
- `GET /v1/membership-plans/stats` - Get stats
- `POST /v1/membership-plans` - Create plan (Admin)
- `PATCH /v1/membership-plans/:planId` - Update plan (Admin)
- `DELETE /v1/membership-plans/:planId` - Delete plan (Admin)
- `PATCH /v1/membership-plans/:planId/toggle-status` - Toggle status (Admin)

## User Memberships (9 APIs)
- `GET /v1/memberships/active` - Get active membership
- `GET /v1/memberships/history` - Get history
- `GET /v1/memberships/trial-status` - Check trial status
- `POST /v1/memberships` - Create membership
- `PATCH /v1/memberships/:membershipId` - Update membership
- `PATCH /v1/memberships/:membershipId/cancel` - Cancel membership
- `POST /v1/memberships/assign-trial/:userId` - Assign trial (Admin)
- `POST /v1/memberships/assign-lifetime/:userId` - Assign lifetime (Admin)
- `POST /v1/memberships/assign-with-coupon` - Assign with coupon (Admin)

## Payments (8 APIs)
- `POST /v1/payments/create-order` - Create order
- `POST /v1/payments/verify` - Verify payment
- `GET /v1/payments/transactions` - Get transactions
- `GET /v1/payments/transactions/:transactionId` - Get transaction
- `GET /v1/payments/memberships` - Get memberships
- `GET /v1/payments/memberships/active` - Get active membership
- `POST /v1/payments/memberships/:membershipId/refund` - Request refund
- `POST /v1/payments/memberships/:membershipId/process-refund` - Process refund (Admin)

## Classes (15 APIs)
- `GET /v1/classes` - List classes
- `GET /v1/classes/upcoming` - Get upcoming
- `GET /v1/classes/upcoming/category/:classCategory` - Get by category
- `GET /v1/classes/:classId` - Get class
- `POST /v1/classes` - Create class
- `PUT /v1/classes/:classId` - Update class
- `DELETE /v1/classes/:classId` - Delete class
- `PUT /v1/classes/:classId/assign-teacher/:teacherId` - Assign teacher
- `PUT /v1/classes/:classId/add-student/:studentId` - Add student
- `PUT /v1/classes/:classId/remove-student/:studentId` - Remove student
- `GET /v1/classes/student/:studentId/classes` - Get student classes
- `GET /v1/classes/student/:studentId/classes/upcoming` - Get upcoming
- `GET /v1/classes/teacher/:teacherId` - Get by teacher
- `GET /v1/classes/teachers` - Get all teachers
- `POST /v1/classes/start-meeting/:classId` - Start meeting
- `POST /v1/classes/end_meeting/:classId` - End meeting

## Events (12 APIs)
- `GET /v1/events` - List events
- `GET /v1/events/upcoming` - Get upcoming
- `GET /v1/events/:id` - Get event
- `POST /v1/events` - Create event
- `PUT /v1/events/:id` - Update event
- `DELETE /v1/events/:id` - Delete event
- `POST /v1/events/register` - Register user
- `GET /v1/events/enrollment/:eventId/:userId` - Check enrollment
- `GET /v1/events/students/:eventId` - Get students
- `GET /v1/events/user-events/:userId` - Get user events
- `GET /v1/events/user-events/:userId/upcoming` - Get upcoming
- `GET /v1/events/teacher/:teacherId` - Get by teacher
- `POST /v1/events/start_meeting/:eventId` - Start meeting
- `POST /v1/events/end_meeting/:classId` - End meeting

## Custom Sessions (5 APIs)
- `GET /v1/custom-sessions` - List sessions
- `POST /v1/custom-sessions` - Create session
- `GET /v1/custom-sessions/:sessionId` - Get session
- `PUT /v1/custom-sessions/:sessionId` - Update session
- `DELETE /v1/custom-sessions/:sessionId` - Delete session

## Recorded Classes (5 APIs)
- `GET /v1/recorded-classes` - List recorded
- `POST /v1/recorded-classes` - Create recorded
- `GET /v1/recorded-classes/:recordedClassId` - Get recorded
- `PUT /v1/recorded-classes/:recordedClassId` - Update recorded
- `DELETE /v1/recorded-classes/:recordedClassId` - Delete recorded

## Teacher Availability (5 APIs)
- `GET /v1/teacher-availability` - List availability
- `POST /v1/teacher-availability` - Create availability
- `GET /v1/teacher-availability/:availabilityId` - Get availability
- `PUT /v1/teacher-availability/:availabilityId` - Update availability
- `DELETE /v1/teacher-availability/:availabilityId` - Delete availability

## User Analytics (18 APIs)
- `GET /v1/user-analytics/:userId/upcoming/classes` - Upcoming classes
- `GET /v1/user-analytics/:userId/today/classes` - Today's classes
- `GET /v1/user-analytics/:userId/tomorrow/classes` - Tomorrow's classes
- `GET /v1/user-analytics/:userId/past/classes` - Past classes
- `GET /v1/user-analytics/:userId/upcoming/events` - Upcoming events
- `GET /v1/user-analytics/:userId/upcoming/sessions` - Upcoming sessions
- `GET /v1/user-analytics/:userId/booked/classes` - Booked classes
- `GET /v1/user-analytics/:userId/booked/events` - Booked events
- `GET /v1/user-analytics/:userId/booked/sessions` - Booked sessions
- `GET /v1/user-analytics/:userId/attended/classes` - Attended classes
- `GET /v1/user-analytics/:userId/attended/classes/range` - Attended by range
- `GET /v1/user-analytics/:userId/activities/period` - Activities by period
- `GET /v1/user-analytics/:userId/statistics` - Statistics
- `GET /v1/user-analytics/:userId/dashboard` - Dashboard
- `GET /v1/user-analytics/:userId/favorites` - Favorites
- `GET /v1/user-analytics/:userId/recent-activity` - Recent activity
- `GET /v1/user-analytics/:userId/summary/booking` - Booking summary
- `GET /v1/user-analytics/:userId/summary/attendance` - Attendance summary
- `GET /v1/user-analytics/:userId/summary/favorites` - Favorites summary

## Notifications (13 APIs)
- `GET /v1/notifications/my-notifications` - Get notifications
- `GET /v1/notifications/unread-count` - Unread count
- `PATCH /v1/notifications/:notificationId/read` - Mark as read
- `PATCH /v1/notifications/mark-all-read` - Mark all read
- `POST /v1/notifications` - Create (Admin)
- `POST /v1/notifications/bulk` - Create bulk (Admin)
- `GET /v1/notifications` - List all (Admin)
- `GET /v1/notifications/:notificationId` - Get by ID (Admin)
- `PATCH /v1/notifications/:notificationId` - Update (Admin)
- `DELETE /v1/notifications/:notificationId` - Delete (Admin)
- `POST /v1/notifications/:notificationId/send` - Send (Admin)
- `PATCH /v1/notifications/:notificationId/schedule` - Schedule (Admin)
- `GET /v1/notifications/stats/overview` - Stats (Admin)

## Notification Preferences (7 APIs)
- `GET /v1/notification-preferences` - Get preferences
- `PUT /v1/notification-preferences` - Update preferences
- `PATCH /v1/notification-preferences/preference/:type/:enabled` - Toggle preference
- `PATCH /v1/notification-preferences/global/:setting/:enabled` - Toggle global
- `PATCH /v1/notification-preferences/quiet-hours/time` - Update quiet hours
- `PATCH /v1/notification-preferences/quiet-hours/:enabled` - Toggle quiet hours
- `POST /v1/notification-preferences/reset` - Reset to default

## WhatsApp (5 APIs)
- `GET /v1/whatsapp/webhook` - Verify webhook
- `POST /v1/whatsapp/webhook` - Handle webhook
- `POST /v1/whatsapp/send` - Send message
- `GET /v1/whatsapp/conversation/:conversationId` - Get conversation
- `GET /v1/whatsapp/conversations` - List conversations

## Period Tracker (20 APIs)
- `GET /v1/period-tracker/calendar` - Get calendar
- `GET /v1/period-tracker/current` - Get current cycle
- `GET /v1/period-tracker/current-enhanced` - Get enhanced current
- `POST /v1/period-tracker/period/start` - Start period
- `POST /v1/period-tracker/period/stop` - Stop period
- `PUT /v1/period-tracker/logs/:date` - Update log
- `DELETE /v1/period-tracker/logs/:date` - Delete log
- `GET /v1/period-tracker/history` - Get history
- `GET /v1/period-tracker/day/:date` - Get day data
- `GET /v1/period-tracker/settings` - Get settings
- `PUT /v1/period-tracker/settings` - Update settings
- `GET /v1/period-tracker/birth-control` - Get birth control
- `PUT /v1/period-tracker/birth-control` - Update birth control
- `POST /v1/period-tracker/birth-control/pill/take` - Take pill
- `POST /v1/period-tracker/bulk-import` - Bulk import
- `GET /v1/period-tracker/analytics` - Get analytics
- `GET /v1/period-tracker/insights` - Get insights
- `GET /v1/period-tracker/stats` - Get stats
- `DELETE /v1/period-tracker/cycle/:cycleId` - Delete cycle
- `PUT /v1/period-tracker/cycle/:cycleId` - Update cycle

## Period Cycles (10 APIs)
- `POST /v1/period-cycles/start` - Start cycle
- `GET /v1/period-cycles/current` - Get current
- `GET /v1/period-cycles/history` - Get history
- `GET /v1/period-cycles/predictions` - Get predictions
- `GET /v1/period-cycles/analytics` - Get analytics
- `GET /v1/period-cycles/:cycleId` - Get cycle
- `POST /v1/period-cycles/:cycleId/daily-log` - Update daily log
- `PUT /v1/period-cycles/:cycleId/complete` - Complete cycle
- `PUT /v1/period-cycles/:cycleId/notes` - Update notes
- `DELETE /v1/period-cycles/:cycleId` - Delete cycle

## Mood Tracker (5 APIs)
- `GET /v1/moods` - List moods
- `POST /v1/moods` - Create mood
- `GET /v1/moods/:moodId` - Get mood
- `PUT /v1/moods/:moodId` - Update mood
- `DELETE /v1/moods/:moodId` - Delete mood

## Body Tracker (7 APIs)
- `GET /v1/trackers/dashboard` - Get dashboard
- `GET /v1/trackers/status` - Get status
- `GET /v1/trackers/weight/history` - Weight history
- `GET /v1/trackers/weight/:entryId` - Get weight entry
- `GET /v1/trackers/water/history` - Water history
- `GET /v1/trackers/water/today` - Today's water
- `GET /v1/trackers/water/hydration-status` - Hydration status

## Blood Reports (5 APIs)
- `POST /v1/blood-reports` - Create report
- `GET /v1/blood-reports` - List reports
- `GET /v1/blood-reports/:reportId` - Get report
- `PATCH /v1/blood-reports/:reportId` - Update report
- `DELETE /v1/blood-reports/:reportId` - Delete report

## Assessments (5 APIs)
- `GET /v1/assessments` - List assessments
- `POST /v1/assessments` - Create assessment
- `GET /v1/assessments/:assessmentId` - Get assessment
- `PUT /v1/assessments/:assessmentId` - Update assessment
- `DELETE /v1/assessments/:assessmentId` - Delete assessment

## Dosha Assessment (7 APIs)
- `POST /v1/dosha/start` - Start assessment
- `GET /v1/dosha/current` - Get current
- `POST /v1/dosha/submit-answer` - Submit answer
- `POST /v1/dosha/complete` - Complete assessment
- `GET /v1/dosha` - Get results
- `GET /v1/dosha/latest` - Get latest
- `GET /v1/dosha/:assessmentId` - Get by ID

## Other Assessments (21 APIs)
- Menopause: start, current, submit-answer, complete, list, latest, by ID (7 APIs)
- PCOS: start, current, submit-answer, complete, list, latest, by ID (7 APIs)
- Thyroid: start, current, submit-answer, complete, list, latest, by ID (7 APIs)

## Diet Generation (5 APIs)
- `POST /v1/diet-generation/generate` - Generate diet
- `GET /v1/diet-generation/plans` - List plans
- `GET /v1/diet-generation/plans/:planId` - Get plan
- `GET /v1/diet-generation/history` - Get history
- `GET /v1/diet-generation/current` - Get current

## Coupons (10 APIs)
- `GET /v1/coupons` - List coupons
- `GET /v1/coupons/active` - Get active
- `GET /v1/coupons/stats` - Get stats
- `GET /v1/coupons/code/:code` - Get by code
- `GET /v1/coupons/:couponId` - Get by ID
- `GET /v1/coupons/plan/:planId` - Get for plan
- `POST /v1/coupons/validate` - Validate coupon
- `POST /v1/coupons` - Create (Admin)
- `PATCH /v1/coupons/:couponId` - Update (Admin)
- `DELETE /v1/coupons/:couponId` - Delete (Admin)
- `PATCH /v1/coupons/:couponId/toggle-status` - Toggle (Admin)

## Company (6 APIs)
- `GET /v1/company/companies` - List companies
- `POST /v1/company/companies` - Create company
- `GET /v1/company/companies/:id` - Get company
- `PUT /v1/company/companies/:id` - Update company
- `DELETE /v1/company/companies/:id` - Delete company
- `GET /v1/company/check-company/:companyId` - Check exists

## Global Config (4 APIs)
- `GET /v1/globalconfig` - Get config
- `POST /v1/globalconfig` - Create/update (Admin)
- `GET /v1/globalconfig/:key` - Get by key
- `PUT /v1/globalconfig/:key` - Update by key (Admin)

## Zoom Management (4 APIs)
- `GET /v1/zoom-management/account-stats` - Account stats (Admin)
- `POST /v1/zoom-management/reset-account/:accountId` - Reset account (Admin)
- `POST /v1/zoom-management/reset-all-accounts` - Reset all (Admin)
- `GET /v1/zoom-management/health` - Health check (Admin)
- `GET /v1/classes/zoom_accounts` - Usage stats

## Ratings (5 APIs)
- `GET /v1/ratings` - List ratings
- `POST /v1/ratings` - Create rating
- `GET /v1/ratings/:ratingId` - Get rating
- `PUT /v1/ratings/:ratingId` - Update rating
- `DELETE /v1/ratings/:ratingId` - Delete rating

## Teacher Ratings (5 APIs)
- `GET /v1/teacher-ratings` - List ratings
- `POST /v1/teacher-ratings` - Create rating
- `GET /v1/teacher-ratings/:ratingId` - Get rating
- `PUT /v1/teacher-ratings/:ratingId` - Update rating
- `DELETE /v1/teacher-ratings/:ratingId` - Delete rating

## In-App Purchases (2 APIs)
- `POST /v1/iap/verify` - Verify purchase
- `GET /v1/iap/transactions` - Get transactions

## File Upload (1 API)
- `POST /v1/upload` - Upload file

## Data Notifications (11 APIs)
- Period start, end, ovulation, fertile window, reminders
- Class, event, session reminders
- Medication, water, assessment reminders
- Update notification

---

## Total API Count: ~280+ APIs

### By Category:
- **Authentication**: 2
- **User Management**: 15
- **Membership & Subscriptions**: 19
- **Payments**: 8
- **Content Management**: 52
- **Analytics**: 18
- **Communication**: 25
- **Health & Wellness**: 100+
- **Admin & Configuration**: 40+

---

**Note**: This is a quick reference. See `CRM_API_INTEGRATION.md` for detailed documentation.










