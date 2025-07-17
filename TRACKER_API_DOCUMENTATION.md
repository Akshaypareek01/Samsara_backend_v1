# Tracker API Documentation

This document provides comprehensive documentation for all tracker-related APIs in the Samsara backend.

## Table of Contents

1. [Authentication](#authentication)
2. [Water Tracker](#water-tracker)
3. [Weight Tracker](#weight-tracker)
4. [Mood Tracker](#mood-tracker)
5. [Temperature Tracker](#temperature-tracker)
6. [Fat Tracker](#fat-tracker)
7. [BMI Tracker](#bmi-tracker)
8. [Body Status Tracker](#body-status-tracker)
9. [Step Tracker](#step-tracker)
10. [Sleep Tracker](#sleep-tracker)
11. [Workout Tracker](#workout-tracker)
12. [General Tracker Operations](#general-tracker-operations)

## Authentication

All tracker endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Water Tracker

### 1. Add Water Intake Entry

**Endpoint:** `POST /v1/trackers/water`

**Description:** Add a new water intake entry for today. If no water tracker exists for today, one will be created automatically.

**Request Body:**
```json
{
  "amountMl": 250
}
```

**Response:**
```json
{
  "id": "68792aa74f8f79006289f5c9",
  "userId": "686e7dc1553ea000624618f2",
  "date": "2025-07-17T00:00:00.000Z",
  "targetGlasses": 8,
  "targetMl": 2000,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "totalIntake": 250,
  "status": "Dehydrated",
  "weeklySummary": [
    {
      "date": "2025-07-17T00:00:00.000Z",
      "totalMl": 250
    }
  ],
  "dailyAverage": 250,
  "bestDay": 250,
  "streak": 1
}
```

### 2. Get Hydration Status

**Endpoint:** `GET /v1/trackers/water/hydration-status`

**Description:** Get current hydration status based on intake vs target. Automatically calculates and updates status based on three ranges:
- **Dehydrated**: 0-74% of target
- **Mildly dehydrated**: 75-99% of target
- **Hydrated**: 100%+ of target

**Response:**
```json
{
  "currentIntake": 250,
  "targetMl": 2000,
  "targetGlasses": 8,
  "percentage": 12.5,
  "status": "Dehydrated",
  "remainingMl": 1750,
  "remainingGlasses": 7,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "date": "2025-07-17T00:00:00.000Z"
}
```

**Status Calculation:**
- If percentage >= 100%: "Hydrated"
- If percentage >= 75%: "Mildly dehydrated"  
- If percentage < 75%: "Dehydrated"

### 3. Get Today's Water Data

**Endpoint:** `GET /v1/trackers/water/today`

**Description:** Get today's water tracker data. Creates a new tracker if none exists for today.

**Response:**
```json
{
  "id": "68792aa74f8f79006289f5c9",
  "userId": "686e7dc1553ea000624618f2",
  "date": "2025-07-17T00:00:00.000Z",
  "targetGlasses": 8,
  "targetMl": 2000,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "totalIntake": 250,
  "status": "Dehydrated",
  "weeklySummary": [
    {
      "date": "2025-07-17T00:00:00.000Z",
      "totalMl": 250
    }
  ],
  "dailyAverage": 250,
  "bestDay": 250,
  "streak": 1
}
```

### 4. Update Water Target

**Endpoint:** `PUT /v1/trackers/water/target`

**Description:** Update the daily water intake target. This will also recalculate the current hydration status.

**Request Body:**
```json
{
  "targetMl": 2500,
  "targetGlasses": 10
}
```

**Response:**
```json
{
  "id": "68792aa74f8f79006289f5c9",
  "userId": "686e7dc1553ea000624618f2",
  "date": "2025-07-17T00:00:00.000Z",
  "targetGlasses": 10,
  "targetMl": 2500,
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "totalIntake": 250,
  "status": "Dehydrated",
  "weeklySummary": [
    {
      "date": "2025-07-17T00:00:00.000Z",
      "totalMl": 250
    }
  ],
  "dailyAverage": 250,
  "bestDay": 250,
  "streak": 1
}
```

### 5. Get Weekly Water Summary

**Endpoint:** `GET /v1/trackers/water/weekly-summary?days=7`

**Description:** Get weekly water consumption summary with statistics.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 7)

**Response:**
```json
{
  "period": "2025-07-11 - 2025-07-17",
  "totalDays": 7,
  "dailyAverage": 1428,
  "bestDay": 2250,
  "streak": 5,
  "chartData": [
    {
      "date": "2025-07-11",
      "totalMl": 1200,
      "targetMl": 2000,
      "status": "Dehydrated"
    },
    {
      "date": "2025-07-12",
      "totalMl": 1800,
      "targetMl": 2000,
      "status": "Mildly dehydrated"
    }
  ],
  "summary": {
    "totalIntake": 10000,
    "averagePerDay": 1428,
    "bestDay": 2250,
    "currentStreak": 5
  }
}
```

### 6. Get Water History

**Endpoint:** `GET /v1/trackers/water/history?days=30`

**Description:** Get water tracker history for the specified number of days.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

**Response:**
```json
[
  {
    "id": "68792aa74f8f79006289f5c9",
    "userId": "686e7dc1553ea000624618f2",
    "date": "2025-07-17T00:00:00.000Z",
    "targetGlasses": 8,
    "targetMl": 2000,
    "totalIntake": 250,
    "status": "Dehydrated",
    "intakeTimeline": [
      {
        "amountMl": 250,
        "time": "4:54 PM"
      }
    ],
    "weeklySummary": [
      {
        "date": "2025-07-17T00:00:00.000Z",
        "totalMl": 250
      }
    ],
    "bestDay": 250,
    "dailyAverage": 250,
    "streak": 1
  }
]
```

### 7. Delete Water Intake Entry

**Endpoint:** `DELETE /v1/trackers/water/intake/:trackerId`

**Description:** Remove a specific water intake entry from today's tracker.

**Request Body:**
```json
{
  "amountMl": 250
}
```

**Response:**
```json
{
  "id": "68792aa74f8f79006289f5c9",
  "userId": "686e7dc1553ea000624618f2",
  "date": "2025-07-17T00:00:00.000Z",
  "targetGlasses": 8,
  "targetMl": 2000,
  "intakeTimeline": [],
  "totalIntake": 0,
  "status": "Dehydrated",
  "weeklySummary": [
    {
      "date": "2025-07-17T00:00:00.000Z",
      "totalMl": 0
    }
  ],
  "dailyAverage": 0,
  "bestDay": 0,
  "streak": 0
}
```

### 8. Get Water Entry by ID

**Endpoint:** `GET /v1/trackers/water/:entryId`

**Description:** Get a specific water tracker entry by its ID.

**Response:**
```json
{
  "id": "68792aa74f8f79006289f5c9",
  "userId": "686e7dc1553ea000624618f2",
  "date": "2025-07-17T00:00:00.000Z",
  "targetGlasses": 8,
  "targetMl": 2000,
  "totalIntake": 250,
  "status": "Dehydrated",
  "intakeTimeline": [
    {
      "amountMl": 250,
      "time": "4:54 PM"
    }
  ],
  "weeklySummary": [
    {
      "date": "2025-07-17T00:00:00.000Z",
      "totalMl": 250
    }
  ],
  "bestDay": 250,
  "dailyAverage": 250,
  "streak": 1
}
``` 