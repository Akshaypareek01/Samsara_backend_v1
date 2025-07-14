# Samsara Backend API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Class Management APIs](#class-management-apis)
3. [Event Management APIs](#event-management-apis)
4. [Custom Session APIs](#custom-session-apis)
5. [User Analytics APIs](#user-analytics-apis)
6. [Rating System APIs](#rating-system-apis)
7. [Favorites System APIs](#favorites-system-apis)
8. [Teacher Rating APIs](#teacher-rating-apis)
9. [Data Models](#data-models)
10. [Response Formats](#response-formats)

---

## Authentication

All APIs require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Class Management APIs

### Base URL: `/v1/classes`

#### **👨‍🏫 Teacher APIs**

### 1. Create Class
**POST** `/`

**Request Body:**
```json
{
  "title": "Morning Yoga",
  "description": "Start your day with energy",
  "teacher": "teacher123",
  "startTime": "09:00",
  "endTime": "10:00",
  "level": "Beginner",
  "classType": "Yoga",
  "duration": 60,
  "maxCapacity": 20,
  "schedules": [
    {
      "days": ["Mon", "Wed", "Fri"],
      "startTime": "09:00",
      "endTime": "10:00"
    }
  ],
  "perfectFor": ["Beginners", "Stress Relief"],
  "skipIf": ["Injury", "Pregnancy"],
  "whatYoullGain": ["Flexibility", "Strength", "Peace"]
}
```

**Response:**
```json
{
  "_id": "class123",
  "title": "Morning Yoga",
  "description": "Start your day with energy",
  "teacher": "teacher123",
  "status": false,
  "students": [],
  "schedule": "2024-01-15T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00",
  "level": "Beginner",
  "classType": "Yoga",
  "duration": 60,
  "maxCapacity": 20,
  "schedules": [...],
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. Update Class
**PUT** `/:classId`

### 3. Delete Class
**DELETE** `/:classId`

### 4. Get Teacher's Classes
**GET** `/teacher/:teacherId`

**Query Parameters:**
- `status` (optional): `true` for active, `false` for inactive
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `startDate` (optional): Start date range (YYYY-MM-DD)
- `endDate` (optional): End date range (YYYY-MM-DD)
- `search` (optional): Search in title and description
- `sortBy` (optional): `title`, `date`, `students`, `status` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/classes/teacher/teacher123?status=true&level=Beginner&sortBy=students&sortOrder=desc&page=1&limit=15
```

**Response:**
```json
{
  "classes": [
    {
      "_id": "class123",
      "title": "Morning Yoga",
      "description": "Start your day with energy",
      "status": true,
      "students": ["user1", "user2"],
      "schedule": "2024-01-15T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "10:00",
      "level": "Beginner",
      "classType": "Yoga",
      "duration": 60,
      "maxCapacity": 20,
      "schedules": [...],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "totalClasses": 1
}
```

### 5. Activate/Deactivate Class
**PATCH** `/:classId/status`

**Request Body:**
```json
{
  "status": true
}
```

#### **👤 User APIs**

### 6. Get All Available Classes
**GET** `/`

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter (e.g., "Yoga", "Fitness", "Meditation")
- `teacher` (optional): Teacher ID filter
- `date` (optional): Date filter (YYYY-MM-DD)
- `startDate` (optional): Start date range (YYYY-MM-DD)
- `endDate` (optional): End date range (YYYY-MM-DD)
- `status` (optional): `true` for active, `false` for inactive
- `maxCapacity` (optional): Maximum capacity filter
- `duration` (optional): Duration in minutes
- `search` (optional): Search in title and description
- `sortBy` (optional): `title`, `date`, `teacher`, `level`, `duration` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/classes?level=Beginner&classType=Yoga&date=2024-01-15&search=morning&sortBy=date&sortOrder=asc&page=1&limit=20
```

**Response:**
```json
{
  "classes": [
    {
      "_id": "class123",
      "title": "Morning Yoga",
      "description": "Start your day with energy",
      "teacher": {
        "_id": "teacher123",
        "name": "John Doe",
        "teacherCategory": "Yoga Trainer",
        "expertise": ["Hatha Yoga", "Vinyasa"],
        "images": [...]
      },
      "status": true,
      "students": ["user1", "user2"],
      "schedule": "2024-01-15T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "10:00",
      "level": "Beginner",
      "classType": "Yoga",
      "duration": 60,
      "maxCapacity": 20,
      "schedules": [...],
      "isEnrolled": false,
      "availableSpots": 18
    }
  ],
  "totalClasses": 1
}
```

### 7. Get Class Details
**GET** `/:classId`

### 8. Enroll in Class
**POST** `/:classId/enroll`

**Request Body:**
```json
{
  "userId": "user123"
}
```

### 9. Unenroll from Class
**DELETE** `/:classId/enroll`

**Request Body:**
```json
{
  "userId": "user123"
}
```

### 10. Get User's Enrolled Classes
**GET** `/enrolled/:userId`

---

## Event Management APIs

### Base URL: `/v1/events`

#### **👨‍🏫 Teacher APIs**

### 1. Create Event
**POST** `/`

**Request Body:**
```json
{
  "title": "Yoga Workshop",
  "description": "Deep dive into advanced yoga techniques",
  "teacher": "teacher123",
  "startDate": "2024-01-20T10:00:00.000Z",
  "endDate": "2024-01-20T12:00:00.000Z",
  "location": "Studio A",
  "maxCapacity": 30,
  "price": 50,
  "eventType": "Workshop",
  "level": "Advanced",
  "requirements": ["Yoga mat", "Water bottle"],
  "whatYoullGain": ["Advanced techniques", "Deep understanding"]
}
```

**Response:**
```json
{
  "_id": "event123",
  "title": "Yoga Workshop",
  "description": "Deep dive into advanced yoga techniques",
  "teacher": "teacher123",
  "startDate": "2024-01-20T10:00:00.000Z",
  "endDate": "2024-01-20T12:00:00.000Z",
  "location": "Studio A",
  "maxCapacity": 30,
  "price": 50,
  "eventType": "Workshop",
  "level": "Advanced",
  "status": false,
  "students": [],
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. Update Event
**PUT** `/:eventId`

### 3. Delete Event
**DELETE** `/:eventId`

### 4. Get Teacher's Events
**GET** `/teacher/:teacherId`

**Query Parameters:**
- `status` (optional): `true` for active, `false` for inactive
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `eventType` (optional): Event type filter
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `location` (optional): Location filter
- `search` (optional): Search in title and description
- `sortBy` (optional): `title`, `startDate`, `students`, `status` (default: `startDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/events/teacher/teacher123?status=true&eventType=Workshop&sortBy=students&sortOrder=desc&page=1&limit=15
```

### 5. Activate/Deactivate Event
**PATCH** `/:eventId/status`

#### **👤 User APIs**

### 6. Get All Available Events
**GET** `/`

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `eventType` (optional): Event type filter (e.g., "Workshop", "Seminar", "Retreat")
- `teacher` (optional): Teacher ID filter
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `location` (optional): Location filter
- `price` (optional): Maximum price filter
- `status` (optional): `true` for active, `false` for inactive
- `search` (optional): Search in title and description
- `sortBy` (optional): `title`, `startDate`, `price`, `teacher`, `level` (default: `startDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/events?level=Advanced&eventType=Workshop&startDate=2024-01-01&endDate=2024-01-31&price=100&search=yoga&sortBy=price&sortOrder=asc&page=1&limit=15
```

### 7. Get Event Details
**GET** `/:eventId`

### 8. Apply for Event
**POST** `/:eventId/apply`

**Request Body:**
```json
{
  "userId": "user123",
  "message": "I'm interested in this workshop"
}
```

### 9. Cancel Event Application
**DELETE** `/:eventId/apply`

**Request Body:**
```json
{
  "userId": "user123"
}
```

### 10. Get User's Applied Events
**GET** `/applied/:userId`

---

## Custom Session APIs

### Base URL: `/v1/custom-sessions`

#### **👨‍🏫 Teacher APIs**

### 1. Get Teacher's Custom Sessions
**GET** `/teacher/:teacherId`

**Query Parameters:**
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `date` (optional): Specific date filter (YYYY-MM-DD)
- `startDate` (optional): Start date range (YYYY-MM-DD)
- `endDate` (optional): End date range (YYYY-MM-DD)
- `user` (optional): User ID filter
- `sortBy` (optional): `date`, `status`, `user` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/custom-sessions/teacher/teacher123?status=confirmed&startDate=2024-01-01&endDate=2024-01-31&sortBy=date&sortOrder=asc&page=1&limit=20
```

**Response:**
```json
{
  "sessions": [
    {
      "_id": "session123",
      "user": {
        "_id": "user123",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "teacher": "teacher123",
      "date": "2024-01-20",
      "timeSlot": {
        "_id": "slot123",
        "timeRange": "09:00-10:00"
      },
      "status": "confirmed",
      "notes": "Focus on flexibility training",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "totalSessions": 1
}
```

### 2. Update Session Status
**PATCH** `/:sessionId/status`

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Great session, client made good progress"
}
```

### 3. Get Session Details
**GET** `/:sessionId`

#### **👤 User APIs**

### 4. Book Custom Session
**POST** `/`

**Request Body:**
```json
{
  "user": "user123",
  "teacher": "teacher123",
  "date": "2024-01-20",
  "timeSlot": "slot123",
  "notes": "I need help with flexibility training"
}
```

**Response:**
```json
{
  "_id": "session123",
  "user": "user123",
  "teacher": {
    "_id": "teacher123",
    "name": "John Doe",
    "teacherCategory": "Yoga Trainer",
    "expertise": ["Hatha Yoga", "Vinyasa"]
  },
  "date": "2024-01-20",
  "timeSlot": {
    "_id": "slot123",
    "timeRange": "09:00-10:00"
  },
  "status": "pending",
  "notes": "I need help with flexibility training",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### 5. Update Custom Session
**PUT** `/:sessionId`

### 6. Cancel Custom Session
**DELETE** `/:sessionId`

### 7. Get User's Custom Sessions
**GET** `/user/:userId`

**Query Parameters:**
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `date` (optional): Specific date filter (YYYY-MM-DD)
- `startDate` (optional): Start date range (YYYY-MM-DD)
- `endDate` (optional): End date range (YYYY-MM-DD)
- `teacher` (optional): Teacher ID filter
- `sortBy` (optional): `date`, `status`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/custom-sessions/user/user123?status=confirmed&teacher=teacher123&sortBy=date&sortOrder=asc&page=1&limit=15
```

### 8. Get Available Time Slots
**GET** `/teacher/:teacherId/available-slots?date=2024-01-20`

**Response:**
```json
{
  "date": "2024-01-20",
  "availableSlots": [
    {
      "_id": "slot123",
      "timeRange": "09:00-10:00",
      "isAvailable": true
    },
    {
      "_id": "slot124",
      "timeRange": "10:00-11:00",
      "isAvailable": false
    }
  ]
}
```

---

## User Analytics APIs

### Base URL: `/v1/user-analytics`

### 1. Get Today's Classes
**GET** `/:userId/today/classes`

Get all classes scheduled for today based on recurring schedule.

**Response:**
```json
{
  "date": "2024-01-15",
  "classes": [
    {
      "_id": "class123",
      "title": "Morning Yoga",
      "description": "Start your day with energy",
      "actualDate": "2024-01-15T00:00:00.000Z",
      "actualStartTime": "09:00",
      "actualEndTime": "10:00",
      "isRecurring": true,
      "recurringDay": "Mon",
      "teacher": {
        "_id": "teacher123",
        "name": "John Doe",
        "email": "john@example.com",
        "teacherCategory": "Yoga Trainer",
        "expertise": ["Hatha Yoga", "Vinyasa"],
        "images": [...]
      }
    }
  ],
  "totalClasses": 1
}
```

### 2. Get Tomorrow's Classes
**GET** `/:userId/tomorrow/classes`

Get all classes scheduled for tomorrow based on recurring schedule.

**Response:** Same format as today's classes

### 3. Get Past Classes
**GET** `/:userId/past/classes`

Get all past classes (last 30 days).

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `teacher` (optional): Teacher ID filter
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `sortBy` (optional): `date`, `title`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/past/classes?level=Beginner&teacher=teacher123&sortBy=date&sortOrder=desc&page=1&limit=15
```

**Response:**
```json
{
  "classes": [...],
  "totalClasses": 5
}
```

### 4. Get Upcoming Classes
**GET** `/:userId/upcoming/classes`

Get all upcoming classes from now onwards.

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `teacher` (optional): Teacher ID filter
- `limit` (optional): Number of items to return (default: 10)
- `sortBy` (optional): `date`, `title`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)

**Example Request:**
```
GET /v1/user-analytics/user123/upcoming/classes?level=Beginner&limit=5&sortBy=date&sortOrder=asc
```

### 4.1. Get User's Upcoming Events
**GET** `/:userId/upcoming/events`

Get all upcoming events the user has applied for.

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `eventType` (optional): Event type filter
- `teacher` (optional): Teacher ID filter
- `limit` (optional): Number of items to return (default: 10)
- `sortBy` (optional): `startDate`, `title`, `teacher` (default: `startDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)

**Example Request:**
```
GET /v1/user-analytics/user123/upcoming/events?eventType=Workshop&limit=5&sortBy=startDate&sortOrder=asc
```

### 4.2. Get User's Upcoming Custom Sessions
**GET** `/:userId/upcoming/sessions`

Get all upcoming custom sessions for the user.

**Query Parameters:**
- `teacher` (optional): Teacher ID filter
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `limit` (optional): Number of items to return (default: 10)
- `sortBy` (optional): `date`, `status`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)

**Example Request:**
```
GET /v1/user-analytics/user123/upcoming/sessions?status=confirmed&limit=5&sortBy=date&sortOrder=asc
```

### 5. Get Classes by Date Range
**GET** `/:userId/booked/classes?startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `teacher` (optional): Teacher ID filter
- `status` (optional): `true` for active, `false` for inactive
- `sortBy` (optional): `date`, `title`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/booked/classes?startDate=2024-01-01&endDate=2024-01-31&level=Beginner&sortBy=date&sortOrder=asc&page=1&limit=20
```

### 5.1. Get Events by Date Range
**GET** `/:userId/booked/events?startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `eventType` (optional): Event type filter
- `teacher` (optional): Teacher ID filter
- `status` (optional): `true` for active, `false` for inactive
- `sortBy` (optional): `startDate`, `title`, `teacher` (default: `startDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/booked/events?startDate=2024-01-01&endDate=2024-01-31&eventType=Workshop&sortBy=startDate&sortOrder=asc&page=1&limit=20
```

### 5.2. Get Custom Sessions by Date Range
**GET** `/:userId/booked/sessions?startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `teacher` (optional): Teacher ID filter
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `sortBy` (optional): `date`, `status`, `teacher` (default: `date`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/booked/sessions?startDate=2024-01-01&endDate=2024-01-31&status=confirmed&sortBy=date&sortOrder=asc&page=1&limit=20
```

### 6. Get Attended Classes
**GET** `/:userId/attended/classes`

Get all classes the user has attended.

**Query Parameters:**
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `teacher` (optional): Teacher ID filter
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `sortBy` (optional): `joinedAt`, `leftAt`, `durationMinutes`, `kcalBurned` (default: `joinedAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/attended/classes?level=Beginner&teacher=teacher123&sortBy=joinedAt&sortOrder=desc&page=1&limit=15
```

**Response:**
```json
[
  {
    "classId": {
      "_id": "class123",
      "title": "Yoga Class",
      "teacher": {...}
    },
    "joinedAt": "2024-01-15T09:00:00.000Z",
    "leftAt": "2024-01-15T10:00:00.000Z",
    "durationMinutes": 60,
    "kcalBurned": 150
  }
]
```

### 7. Get Attended Classes by Date Range
**GET** `/:userId/attended/classes/range?startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `level` (optional): `Beginner`, `Intermediate`, `Advanced`
- `classType` (optional): Class type filter
- `teacher` (optional): Teacher ID filter
- `sortBy` (optional): `joinedAt`, `leftAt`, `durationMinutes`, `kcalBurned` (default: `joinedAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**
```
GET /v1/user-analytics/user123/attended/classes/range?startDate=2024-01-01&endDate=2024-01-31&level=Beginner&sortBy=durationMinutes&sortOrder=desc&page=1&limit=20
```

### 8. Get Activities by Period
**GET** `/:userId/activities/period?period=week`

**Query Parameters:**
- `period` (optional): `today`, `tomorrow`, `week`, `month` (default: `week`)

**Response:**
```json
{
  "period": "week",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-21T23:59:59.000Z",
  "activities": {
    "classes": [...],
    "events": [...],
    "sessions": [...]
  },
  "summary": {
    "totalClasses": 5,
    "totalEvents": 2,
    "totalSessions": 1,
    "totalActivities": 8
  }
}
```

### 9. Get User Statistics
**GET** `/:userId/statistics`

**Response:**
```json
{
  "upcomingClasses": 3,
  "upcomingEvents": 1,
  "upcomingSessions": 2,
  "totalUpcoming": 6,
  "totalBookedClasses": 15,
  "totalBookedEvents": 5,
  "totalBookedSessions": 8,
  "totalBooked": 28,
  "totalAttendedClasses": 12,
  "totalHours": 18.5,
  "totalKcalBurned": 1850,
  "attendanceRate": 80,
  "pastClasses": 12,
  "pastEvents": 4,
  "pastSessions": 6,
  "favoriteClasses": 5,
  "favoriteEvents": 2,
  "favoriteTeachers": 3,
  "totalReviews": 8,
  "summary": {
    "totalActivities": 28,
    "totalHoursSpent": 18.5,
    "totalCaloriesBurned": 1850,
    "averageAttendanceRate": 80
  }
}
```

### 10. Get User Dashboard
**GET** `/:userId/dashboard`

**Response:**
```json
{
  "statistics": {...},
  "upcomingActivities": {
    "classes": [...],
    "events": [...],
    "sessions": [...]
  },
  "favorites": {
    "classes": [...],
    "events": [...],
    "teachers": [...]
  },
  "recentActivity": [...]
}
```

### 11. Get User Favorites
**GET** `/:userId/favorites`

**Response:**
```json
{
  "classes": [...],
  "events": [...],
  "teachers": [...]
}
```

### 12. Get Recent Activity
**GET** `/:userId/recent-activity`

**Response:**
```json
[
  {
    "classId": {
      "_id": "class123",
      "title": "Yoga Class",
      "teacher": {
        "name": "John Doe",
        "teacherCategory": "Yoga Trainer"
      }
    },
    "joinedAt": "2024-01-15T09:00:00.000Z",
    "leftAt": "2024-01-15T10:00:00.000Z",
    "durationMinutes": 60,
    "kcalBurned": 150
  }
]
```

### 13. Get Booking Summary
**GET** `/:userId/summary/booking`

### 14. Get Attendance Summary
**GET** `/:userId/summary/attendance`

### 15. Get Favorites Summary
**GET** `/:userId/summary/favorites`

---

## Rating System APIs

### Base URL: `/v1/ratings`

### 1. Rate a Class
**POST** `/class`

**Request Body:**
```json
{
  "classId": "class123",
  "userId": "user123",
  "rating": 5,
  "review": "Amazing yoga session!",
  "anonymous": false
}
```

**Response:**
```json
{
  "_id": "rating123",
  "classId": "class123",
  "userId": "user123",
  "rating": 5,
  "review": "Amazing yoga session!",
  "anonymous": false,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. Rate an Event
**POST** `/event`

**Request Body:**
```json
{
  "eventId": "event123",
  "userId": "user123",
  "rating": 4,
  "review": "Great workshop!",
  "anonymous": true
}
```

### 3. Get Class Ratings
**GET** `/class/:classId`

**Response:**
```json
{
  "classId": "class123",
  "ratings": [
    {
      "_id": "rating123",
      "rating": 5,
      "review": "Amazing yoga session!",
      "anonymous": false,
      "user": {
        "name": "John Doe",
        "images": [...]
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "averageRating": 4.5,
  "totalRatings": 10,
  "ratingDistribution": {
    "5": 6,
    "4": 3,
    "3": 1,
    "2": 0,
    "1": 0
  }
}
```

### 4. Get Event Ratings
**GET** `/event/:eventId`

### 5. Update Class Rating
**PUT** `/class/:ratingId`

### 6. Update Event Rating
**PUT** `/event/:ratingId`

### 7. Delete Class Rating
**DELETE** `/class/:ratingId`

### 8. Delete Event Rating
**DELETE** `/event/:ratingId`

---

## Favorites System APIs

### Base URL: `/v1/favorites`

### 1. Add Class to Favorites
**POST** `/class`

**Request Body:**
```json
{
  "userId": "user123",
  "classId": "class123"
}
```

### 2. Add Event to Favorites
**POST** `/event`

**Request Body:**
```json
{
  "userId": "user123",
  "eventId": "event123"
}
```

### 3. Add Teacher to Favorites
**POST** `/teacher`

**Request Body:**
```json
{
  "userId": "user123",
  "teacherId": "teacher123"
}
```

### 4. Remove Class from Favorites
**DELETE** `/class`

**Request Body:**
```json
{
  "userId": "user123",
  "classId": "class123"
}
```

### 5. Remove Event from Favorites
**DELETE** `/event`

### 6. Remove Teacher from Favorites
**DELETE** `/teacher`

### 7. Check if Class is Favorited
**GET** `/class/check?userId=user123&classId=class123`

**Response:**
```json
{
  "isFavorited": true
}
```

### 8. Check if Event is Favorited
**GET** `/event/check?userId=user123&eventId=event123`

### 9. Check if Teacher is Favorited
**GET** `/teacher/check?userId=user123&teacherId=teacher123`

---

## Teacher Rating APIs

### Base URL: `/v1/teacher-ratings`

### 1. Get Teacher Ratings
**GET** `/:teacherId`

**Response:**
```json
{
  "teacherId": "teacher123",
  "teacher": {
    "name": "John Doe",
    "teacherCategory": "Yoga Trainer",
    "expertise": ["Hatha Yoga", "Vinyasa"]
  },
  "classRatings": [
    {
      "classId": "class123",
      "className": "Morning Yoga",
      "rating": 5,
      "review": "Great teacher!",
      "user": {
        "name": "Jane Smith",
        "images": [...]
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "eventRatings": [...],
  "averageRating": 4.7,
  "totalRatings": 25,
  "ratingDistribution": {
    "5": 15,
    "4": 8,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

### 2. Get Teacher Average Rating
**GET** `/:teacherId/average`

**Response:**
```json
{
  "teacherId": "teacher123",
  "averageRating": 4.7,
  "totalRatings": 25
}
```

---

## Data Models

### Class Rating Model
```javascript
{
  classId: ObjectId (ref: 'Class'),
  userId: ObjectId (ref: 'Users'),
  rating: Number (1-5),
  review: String,
  anonymous: Boolean (default: false),
  createdAt: Date
}
```

### Event Rating Model
```javascript
{
  eventId: ObjectId (ref: 'Event'),
  userId: ObjectId (ref: 'Users'),
  rating: Number (1-5),
  review: String,
  anonymous: Boolean (default: false),
  createdAt: Date
}
```

### User Model (Updated)
```javascript
{
  // ... existing fields
  favoriteClasses: [ObjectId (ref: 'Class')],
  favoriteEvents: [ObjectId (ref: 'Event')],
  favoriteTeachers: [ObjectId (ref: 'Users')],
  attendance: [
    {
      classId: ObjectId (ref: 'Class'),
      joinedAt: Date,
      leftAt: Date,
      durationMinutes: Number,
      kcalBurned: Number
    }
  ]
}
```

### Class Model (Updated)
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  teacher: ObjectId (ref: 'Users', required),
  status: Boolean (default: false),
  students: [ObjectId (ref: 'Users')],
  schedule: Date (default: Date.now),
  startTime: String,
  endTime: String,
  level: String (enum: ['Beginner', 'Intermediate', 'Advanced']),
  recordingPath: String,
  image: String,
  classType: String (required),
  duration: Number (required),
  maxCapacity: Number (required),
  schedules: [
    {
      days: [String], // ['Mon', 'Wed', 'Fri']
      startTime: String, // '09:00'
      endTime: String   // '10:00'
    }
  ],
  perfectFor: [String],
  skipIf: [String],
  whatYoullGain: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  teacher: ObjectId (ref: 'Users', required),
  startDate: Date (required),
  endDate: Date (required),
  location: String,
  maxCapacity: Number,
  price: Number,
  eventType: String,
  level: String (enum: ['Beginner', 'Intermediate', 'Advanced']),
  status: Boolean (default: false),
  students: [ObjectId (ref: 'Users')],
  requirements: [String],
  whatYoullGain: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Custom Session Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'Users', required),
  teacher: ObjectId (ref: 'Users', required),
  date: String (required), // YYYY-MM-DD format
  timeSlot: ObjectId (ref: 'TeacherAvailability', required),
  status: String (enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending'),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Application Model
```javascript
{
  _id: ObjectId,
  event: ObjectId (ref: 'Event', required),
  user: ObjectId (ref: 'Users', required),
  message: String,
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Response Formats

### Error Response
```json
{
  "code": 400,
  "message": "Validation error",
  "details": {
    "field": "error message"
  }
}
```

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "results": [...],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

---

## Integration Notes

### Frontend Integration Tips

1. **Recurring Schedule Display:**
   - Use `actualDate`, `actualStartTime`, `actualEndTime` for display
   - Check `isRecurring` flag to show recurring indicator
   - Use `recurringDay` for day labels

2. **Rating System:**
   - Always check if user has already rated before showing rating form
   - Use `anonymous` flag to hide user info in reviews
   - Display rating distribution for better UX

3. **Favorites:**
   - Use check endpoints to determine favorite status
   - Update UI immediately after add/remove operations
   - Cache favorites for better performance

4. **User Analytics:**
   - Use dashboard endpoint for main user page
   - Cache statistics and update periodically
   - Use period endpoints for calendar views

### Example Frontend Usage

```javascript
// ==================== CLASS MANAGEMENT ====================

// Teacher: Create a class
const createClass = async (classData) => {
  const response = await fetch('/v1/classes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(classData)
  });
  return response.json();
};

// Teacher: Get teacher's classes
const getTeacherClasses = async (teacherId) => {
  const response = await fetch(`/v1/classes/teacher/${teacherId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// User: Get all available classes
const getAvailableClasses = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/v1/classes?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// User: Enroll in a class
const enrollInClass = async (classId, userId) => {
  const response = await fetch(`/v1/classes/${classId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
  return response.json();
};

// ==================== EVENT MANAGEMENT ====================

// Teacher: Create an event
const createEvent = async (eventData) => {
  const response = await fetch('/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });
  return response.json();
};

// User: Apply for an event
const applyForEvent = async (eventId, userId, message) => {
  const response = await fetch(`/v1/events/${eventId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, message })
  });
  return response.json();
};

// ==================== CUSTOM SESSIONS ====================

// User: Book a custom session
const bookCustomSession = async (sessionData) => {
  const response = await fetch('/v1/custom-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
  return response.json();
};

// Teacher: Get teacher's custom sessions
const getTeacherSessions = async (teacherId) => {
  const response = await fetch(`/v1/custom-sessions/teacher/${teacherId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// User: Get available time slots
const getAvailableSlots = async (teacherId, date) => {
  const response = await fetch(`/v1/custom-sessions/teacher/${teacherId}/available-slots?date=${date}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// ==================== USER ANALYTICS ====================

// Get today's classes
const getTodaysClasses = async (userId) => {
  const response = await fetch(`/v1/user-analytics/${userId}/today/classes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// ==================== FAVORITES ====================

// Add class to favorites
const addToFavorites = async (userId, classId) => {
  const response = await fetch('/v1/favorites/class', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, classId })
  });
  return response.json();
};

// ==================== RATINGS ====================

// Rate a class
const rateClass = async (classId, userId, rating, review) => {
  const response = await fetch('/v1/ratings/class', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ classId, userId, rating, review })
  });
  return response.json();
};
```

---

## Testing

Use the provided Postman collections for testing:
- `samsara_api_collection.json`
- `user_routes_postman_collection.json`
- `tracker_apis_postman_collection.json`

Or run the test script:
```bash
node test_schedule_logic.js
```

---

## Notes

- All dates are in ISO 8601 format
- Times are in 24-hour format (HH:MM)
- Ratings are integers from 1-5
- User IDs, class IDs, event IDs are MongoDB ObjectIds
- All responses include proper error handling
- Rate limiting is applied to all endpoints
- Authentication is required for all endpoints 