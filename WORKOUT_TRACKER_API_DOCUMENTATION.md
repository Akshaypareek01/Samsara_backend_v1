# Workout Tracker API Documentation

## Overview

The Workout Tracker API provides comprehensive functionality for tracking various types of workouts including Running, Yoga, Swimming, Cycling, and Gym activities. The API supports detailed tracking of distance, duration, calories burned, and provides weekly summaries with charts and statistics.

## Base URL

```
https://your-api-domain.com/v1/trackers
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Workout Types

The API supports the following workout types:
- **Running**: Track running activities with distance and pace
- **Yoga**: Track yoga sessions with duration and mindfulness metrics
- **Swimming**: Track swimming activities with distance and laps
- **Cycling**: Track cycling activities with distance and speed
- **Gym**: Track gym workouts with duration and strength training

## Intensity Levels

Each workout can be categorized by intensity:
- **Low**: Light activities, stretching, gentle yoga
- **Medium**: Moderate cardio, regular workouts
- **High**: Intense training, HIIT, heavy lifting

## API Endpoints

### 1. Add Workout Entry

**POST** `/workout`

Add a new workout entry to the user's tracker.

#### Request Body

```json
{
  "workoutType": "Running",
  "intensity": "High",
  "distance": {
    "value": 5.2,
    "unit": "km"
  },
  "duration": {
    "value": 2.5,
    "unit": "h"
  },
  "calories": 485,
  "notes": "Morning run in the park"
}
```

#### Response (201 Created)

```json
{
  "id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "date": "2024-01-15T00:00:00.000Z",
  "workoutEntries": [
    {
      "workoutType": "Running",
      "intensity": "High",
      "distance": {
        "value": 5.2,
        "unit": "km"
      },
      "duration": {
        "value": 2.5,
        "unit": "h"
      },
      "calories": 485,
      "date": "2024-01-15T08:30:00.000Z",
      "notes": "Morning run in the park"
    }
  ],
  "totalWorkoutTime": 2.5,
  "totalCaloriesBurned": 485,
  "weeklySummary": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "totalTime": 2.5,
      "totalCalories": 485,
      "workoutCount": 1
    }
  ],
  "workoutTypeSummary": [
    {
      "workoutType": "Running",
      "totalTime": 2.5,
      "totalCalories": 485,
      "workoutCount": 1,
      "averageTime": 2.5,
      "averageCalories": 485
    }
  ],
  "totalWeeklyTime": 2.5,
  "totalWeeklyCalories": 485,
  "dailyAverage": 2.5,
  "bestDay": 485,
  "streak": 1,
  "createdAt": "2024-01-15T08:30:00.000Z",
  "updatedAt": "2024-01-15T08:30:00.000Z"
}
```

### 2. Get Workout History

**GET** `/workout/history?days=30`

Retrieve workout history for the specified number of days.

#### Query Parameters

- `days` (optional): Number of days to retrieve (default: 30, max: 365)

#### Response (200 OK)

```json
[
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2024-01-15T00:00:00.000Z",
    "workoutEntries": [
      {
        "workoutType": "Running",
        "intensity": "High",
        "distance": {
          "value": 5.2,
          "unit": "km"
        },
        "duration": {
          "value": 2.5,
          "unit": "h"
        },
        "calories": 485,
        "date": "2024-01-15T08:30:00.000Z",
        "notes": "Morning run in the park"
      }
    ],
    "totalWorkoutTime": 2.5,
    "totalCaloriesBurned": 485
  }
]
```

### 3. Get Workout by Type

**GET** `/workout/by-type?workoutType=Running&days=30`

Retrieve workouts filtered by specific workout type.

#### Query Parameters

- `workoutType` (optional): Filter by workout type (Running, Yoga, Swimming, Cycling, Gym)
- `days` (optional): Number of days to retrieve (default: 30, max: 365)

#### Response (200 OK)

```json
[
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2024-01-15T00:00:00.000Z",
    "workoutEntries": [
      {
        "workoutType": "Running",
        "intensity": "High",
        "distance": {
          "value": 5.2,
          "unit": "km"
        },
        "duration": {
          "value": 2.5,
          "unit": "h"
        },
        "calories": 485,
        "date": "2024-01-15T08:30:00.000Z",
        "notes": "Morning run in the park"
      }
    ],
    "totalWorkoutTime": 2.5,
    "totalCaloriesBurned": 485
  }
]
```

### 4. Get Workout Summary

**GET** `/workout/summary?period=weekly&days=7`

Get comprehensive workout summary with statistics and chart data.

#### Query Parameters

- `period` (optional): Summary period (daily, weekly, monthly, 6months, yearly) - default: weekly
- `days` (optional): Number of days to include (default: 7, max: 365)

#### Response (200 OK)

```json
{
  "period": "2024-01-09 - 2024-01-15",
  "totalWorkoutTime": 16.5,
  "totalCaloriesBurned": 2325,
  "totalWorkouts": 8,
  "dailyAverage": 2.36,
  "workoutTypeBreakdown": {
    "Running": {
      "totalTime": 2.5,
      "totalCalories": 485,
      "workoutCount": 1
    },
    "Yoga": {
      "totalTime": 3.0,
      "totalCalories": 210,
      "workoutCount": 2
    },
    "Swimming": {
      "totalTime": 1.5,
      "totalCalories": 350,
      "workoutCount": 1
    },
    "Cycling": {
      "totalTime": 4.0,
      "totalCalories": 560,
      "workoutCount": 2
    },
    "Gym": {
      "totalTime": 5.5,
      "totalCalories": 720,
      "workoutCount": 2
    }
  },
  "chartData": [
    {
      "date": "2024-01-09",
      "totalTime": 2.5,
      "totalCalories": 485,
      "workoutCount": 1
    },
    {
      "date": "2024-01-10",
      "totalTime": 1.5,
      "totalCalories": 210,
      "workoutCount": 1
    },
    {
      "date": "2024-01-11",
      "totalTime": 3.2,
      "totalCalories": 560,
      "workoutCount": 2
    },
    {
      "date": "2024-01-12",
      "totalTime": 2.0,
      "totalCalories": 350,
      "workoutCount": 1
    },
    {
      "date": "2024-01-13",
      "totalTime": 2.8,
      "totalCalories": 420,
      "workoutCount": 1
    },
    {
      "date": "2024-01-14",
      "totalTime": 3.0,
      "totalCalories": 180,
      "workoutCount": 1
    },
    {
      "date": "2024-01-15",
      "totalTime": 1.5,
      "totalCalories": 120,
      "workoutCount": 1
    }
  ],
  "summary": {
    "totalTime": 16.5,
    "totalCalories": 2325,
    "averagePerDay": 2.36
  }
}
```

### 5. Update Workout Entry

**PUT** `/workout/:entryId`

Update an existing workout entry.

#### Path Parameters

- `entryId`: ID of the workout entry to update

#### Request Body

```json
{
  "calories": 520,
  "notes": "Updated notes for the workout"
}
```

#### Response (200 OK)

```json
{
  "id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "date": "2024-01-15T00:00:00.000Z",
  "workoutEntries": [
    {
      "workoutType": "Running",
      "intensity": "High",
      "distance": {
        "value": 5.2,
        "unit": "km"
      },
      "duration": {
        "value": 2.5,
        "unit": "h"
      },
      "calories": 520,
      "date": "2024-01-15T08:30:00.000Z",
      "notes": "Updated notes for the workout"
    }
  ],
  "totalWorkoutTime": 2.5,
  "totalCaloriesBurned": 520
}
```

### 6. Delete Workout Entry

**DELETE** `/workout/:entryId`

Delete a specific workout entry.

#### Path Parameters

- `entryId`: ID of the workout entry to delete

#### Response (204 No Content)

No response body.

## Workout Type Examples

### Running Workout

```json
{
  "workoutType": "Running",
  "intensity": "High",
  "distance": {
    "value": 5.2,
    "unit": "km"
  },
  "duration": {
    "value": 2.5,
    "unit": "h"
  },
  "calories": 485,
  "notes": "Morning run in the park"
}
```

### Yoga Session

```json
{
  "workoutType": "Yoga",
  "intensity": "Low",
  "duration": {
    "value": 1.5,
    "unit": "h"
  },
  "calories": 210,
  "notes": "Vinyasa flow session"
}
```

### Swimming Workout

```json
{
  "workoutType": "Swimming",
  "intensity": "Medium",
  "distance": {
    "value": 2.4,
    "unit": "km"
  },
  "duration": {
    "value": 1.5,
    "unit": "h"
  },
  "calories": 350,
  "notes": "Freestyle laps"
}
```

### Cycling Session

```json
{
  "workoutType": "Cycling",
  "intensity": "Medium",
  "distance": {
    "value": 85.6,
    "unit": "km"
  },
  "duration": {
    "value": 4.0,
    "unit": "h"
  },
  "calories": 560,
  "notes": "Road cycling"
}
```

### Gym Workout

```json
{
  "workoutType": "Gym",
  "intensity": "High",
  "duration": {
    "value": 5.5,
    "unit": "h"
  },
  "calories": 720,
  "notes": "Strength training and cardio"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "code": 400,
  "message": "Validation Error",
  "details": [
    {
      "field": "workoutType",
      "message": "\"workoutType\" must be one of [Running, Yoga, Swimming, Cycling, Gym]"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### 404 Not Found

```json
{
  "code": 404,
  "message": "Workout entry not found"
}
```

### 500 Internal Server Error

```json
{
  "code": 500,
  "message": "Internal server error"
}
```

## Data Models

### Workout Entry Schema

```json
{
  "workoutType": "string (enum: Running, Yoga, Swimming, Cycling, Gym)",
  "intensity": "string (enum: Low, Medium, High)",
  "distance": {
    "value": "number (optional)",
    "unit": "string (enum: km, mi, default: km)"
  },
  "duration": {
    "value": "number (optional, in hours)",
    "unit": "string (default: h)"
  },
  "calories": "number (required, min: 0)",
  "date": "date (auto-generated)",
  "notes": "string (optional, max: 500 characters)"
}
```

### Weekly Summary Schema

```json
{
  "date": "date",
  "totalTime": "number (in hours)",
  "totalCalories": "number",
  "workoutCount": "number"
}
```

### Workout Type Summary Schema

```json
{
  "workoutType": "string",
  "totalTime": "number (in hours)",
  "totalCalories": "number",
  "workoutCount": "number",
  "averageTime": "number (in hours)",
  "averageCalories": "number"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Add a new workout entry
const addWorkout = async (workoutData) => {
  const response = await fetch('/v1/trackers/workout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(workoutData)
  });
  return response.json();
};

// Get workout summary for charts
const getWorkoutSummary = async (period = 'weekly') => {
  const response = await fetch(`/v1/trackers/workout/summary?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Get specific workout type data
const getRunningWorkouts = async () => {
  const response = await fetch('/v1/trackers/workout/by-type?workoutType=Running', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Mobile App Integration

```javascript
// Quick add workout entry
const quickAddWorkout = async (type, intensity, calories) => {
  const workoutData = {
    workoutType: type,
    intensity: intensity,
    calories: calories,
    duration: {
      value: 1.0,
      unit: 'h'
    }
  };
  
  return await addWorkout(workoutData);
};

// Get weekly summary for dashboard
const getWeeklySummary = async () => {
  const summary = await getWorkoutSummary('weekly');
  
  // Format for chart display
  const chartData = summary.chartData.map(day => ({
    date: day.date,
    value: day.totalCalories,
    label: `${day.totalTime}h`
  }));
  
  return {
    totalTime: summary.totalWorkoutTime,
    totalCalories: summary.totalCaloriesBurned,
    chartData: chartData,
    breakdown: summary.workoutTypeBreakdown
  };
};
```

## Best Practices

1. **Consistent Data**: Always provide both duration and calories for accurate tracking
2. **Realistic Values**: Use realistic calorie burn estimates based on activity type and intensity
3. **Regular Updates**: Update workout entries promptly for accurate weekly summaries
4. **Chart Optimization**: Use the summary endpoint for chart data to reduce API calls
5. **Error Handling**: Implement proper error handling for network issues and validation errors

## Rate Limiting

- **POST requests**: 100 requests per hour per user
- **GET requests**: 1000 requests per hour per user
- **PUT/DELETE requests**: 50 requests per hour per user

## Versioning

This API is versioned. The current version is v1. Future versions will maintain backward compatibility where possible.

## Support

For API support and questions, please contact the development team or refer to the main API documentation. 